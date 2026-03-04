import { useEffect, useState, useCallback } from "react";
import { useParams, useOutletContext } from "react-router";
import { Editor } from "@/components/editor/editor";
import { TagManager } from "@/components/tags/tag-manager";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { WorkspaceOutletContext } from "@/pages/workspace/layout";

interface PageData {
  id: number;
  publicId: string;
  workspaceId: number;
  title: string;
  icon: string | null;
}

export function Component() {
  const { pageId } = useParams<{ pageId: string }>();
  const { data: session } = useSession();
  const { refreshPages } = useOutletContext<WorkspaceOutletContext>();
  const [page, setPage] = useState<PageData | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset and load page when URL changes
  useEffect(() => {
    if (!pageId) return;
    setPage(null);
    setTitle("");
    setError(null);
    api<PageData>(`/api/pages/${pageId}`)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
      })
      .catch(() => setError("Failed to load page"));
  }, [pageId]);

  const updateTitle = useCallback(
    async (newTitle: string) => {
      if (!pageId) return;
      setTitle(newTitle);
      await api(`/api/pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle || "Untitled" }),
      });
      refreshPages();
    },
    [pageId, refreshPages]
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!page || !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mx-auto max-w-4xl w-full px-4 pt-12">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) => updateTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="Untitled"
          className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground/50"
        />
        <div className="mt-3">
          <TagManager pagePublicId={page.publicId} workspaceId={page.workspaceId} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {/* key forces full remount when switching pages */}
        <Editor
          key={page.id}
          pageId={page.id}
          userName={session.user.name}
        />
      </div>
    </div>
  );
}
