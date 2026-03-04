import { createReactBlockSpec } from "@blocknote/react";
import { useState, useRef, useEffect } from "react";
import { renderAsync } from "docx-preview";
import { useEditorContext } from "../editor-context";
import { FileText, Download } from "lucide-react";

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
      const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (!block.props.url || !containerRef.current) return;
        setLoading(true);
        fetch(block.props.url)
          .then((res) => res.arrayBuffer())
          .then((buffer) => renderAsync(buffer, containerRef.current!))
          .catch(() => {})
          .finally(() => setLoading(false));
      }, [block.props.url]);

      if (!block.props.url) {
        return (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              {uploading ? "Uploading..." : "Click to upload a Word document"}
              <input
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
            </label>
          </div>
        );
      }

      return (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="truncate">{block.props.name || "Document"}</span>
            <a
              href={block.props.url}
              download={block.props.name}
              className="p-1 hover:bg-accent rounded"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
          {loading && (
            <div className="p-4">
              <div className="animate-pulse h-4 w-48 rounded bg-muted" />
            </div>
          )}
          <div
            ref={containerRef}
            className="overflow-y-auto max-h-[500px] p-4"
          />
        </div>
      );
    },
  },
);
