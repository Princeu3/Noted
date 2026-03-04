import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Page } from "@noted/shared";

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

function buildTree(pages: Page[]): PageTreeNode[] {
  const map = new Map<number, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }

  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function usePageTree(workspaceId: number | undefined) {
  const [pages, setPages] = useState<PageTreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await api<Page[]>(`/api/workspaces/${workspaceId}/pages`);
      setPages(buildTree(data));
    } catch {
      // silently fail — workspace might not exist yet
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pages, loading, refresh };
}
