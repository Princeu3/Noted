import { createReactBlockSpec } from "@blocknote/react";
import { useRef, useState } from "react";
import { useEditorContext } from "../editor-context";
import { ImageIcon } from "lucide-react";

export const createImageBlock = createReactBlockSpec(
  {
    type: "image" as const,
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      caption: { default: "" },
      previewWidth: { default: undefined as number | undefined, type: "number" },
      showPreview: { default: true as boolean },
      textAlignment: {
        default: "left" as const,
        values: ["left", "center", "right", "justify"] as const,
      },
      backgroundColor: { default: "default" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { upload } = useEditorContext();
      const [uploading, setUploading] = useState(false);
      const [dragOver, setDragOver] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setUploading(true);
        try {
          const url = await upload(file);
          editor.updateBlock(block, {
            props: { url, name: file.name },
          });
        } finally {
          setUploading(false);
        }
      };

      if (!block.props.url) {
        return (
          <div
            role="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-2 cursor-pointer text-sm transition-colors ${
              dragOver
                ? "border-foreground/30 bg-muted/50 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            {uploading ? "Uploading..." : "Add image"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        );
      }

      return (
        <div className="-mx-1">
          <img
            src={block.props.url}
            alt={block.props.name || ""}
            className="rounded-md max-w-full h-auto"
            style={{
              width: block.props.previewWidth
                ? `${block.props.previewWidth}px`
                : "100%",
            }}
            draggable={false}
          />
          {block.props.caption && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {block.props.caption}
            </p>
          )}
        </div>
      );
    },
  },
);
