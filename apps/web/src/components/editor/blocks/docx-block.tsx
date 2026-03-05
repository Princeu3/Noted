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

      const fileInputRef = useRef<HTMLInputElement>(null);

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
