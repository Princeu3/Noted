import { createReactBlockSpec } from "@blocknote/react";
import { useState, useRef, useEffect } from "react";
import { renderAsync } from "docx-preview";
import { useEditorContext } from "../editor-context";
import { FileText, Download, ChevronUp } from "lucide-react";

export const createDocxBlock = createReactBlockSpec(
  {
    type: "docx" as const,
    propSchema: {
      url: { default: "" },
      name: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { upload } = useEditorContext();
      const [uploading, setUploading] = useState(false);
      const [loading, setLoading] = useState(false);
      const [expanded, setExpanded] = useState(false);
      const containerRef = useRef<HTMLDivElement>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);
      const renderedRef = useRef(false);

      useEffect(() => {
        if (!block.props.url || !containerRef.current || renderedRef.current) return;
        setLoading(true);
        renderedRef.current = true;
        fetch(block.props.url)
          .then((res) => res.arrayBuffer())
          .then((buffer) => renderAsync(buffer, containerRef.current!))
          .catch(() => {})
          .finally(() => setLoading(false));
      }, [block.props.url, expanded]);

      if (!block.props.url) {
        return (
          <div
            role="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <FileText className="h-4 w-4 shrink-0" />
            {uploading ? "Uploading..." : "Upload Word document"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await upload(file);
                  editor.updateBlock(block, {
                    props: { url, name: file.name },
                  });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </div>
        );
      }

      return (
        <div className="rounded-md border border-border overflow-hidden -mx-1">
          <div
            role="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 w-full px-2 py-1 text-xs cursor-pointer select-none hover:bg-muted/50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500/80 shrink-0" />
            <span className="truncate text-sm text-foreground">
              {block.props.name || "Document"}
            </span>
            <span className="ml-auto flex items-center gap-0.5">
              <span
                role="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const res = await fetch(block.props.url);
                    if (!res.ok) throw new Error();
                    const blob = await res.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = block.props.name || "document.docx";
                    a.click();
                    URL.revokeObjectURL(a.href);
                  } catch {
                    alert("File not available. It may need to be re-uploaded.");
                  }
                }}
                className="p-0.5 rounded-sm hover:bg-accent text-muted-foreground"
              >
                <Download className="h-2.5 w-2.5" />
              </span>
              <ChevronUp
                className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "" : "rotate-180"}`}
              />
            </span>
          </div>

          {expanded && (
            <>
              {loading && (
                <div className="border-t border-border p-4">
                  <div className="animate-pulse h-4 w-48 rounded bg-muted" />
                </div>
              )}
              <div
                ref={containerRef}
                className="overflow-y-auto max-h-[500px] border-t border-border"
              />
            </>
          )}
        </div>
      );
    },
  },
);
