import { createReactBlockSpec } from "@blocknote/react";
import { useState, useRef } from "react";
import { useEditorContext } from "../editor-context";
import { ImageIcon, Trash2 } from "lucide-react";

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
      const imgRef = useRef<HTMLImageElement>(null);
      const [hovered, setHovered] = useState(false);

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
          <label
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
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        );
      }

      return (
        <div
          className="relative group -mx-1"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            ref={imgRef}
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
          {hovered && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => {
                  editor.updateBlock(block, {
                    props: { url: "", name: "" },
                  });
                }}
                className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-destructive transition-colors shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
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
