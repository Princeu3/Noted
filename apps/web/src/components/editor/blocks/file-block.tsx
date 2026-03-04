import { createReactBlockSpec } from "@blocknote/react";
import { FileText, ExternalLink } from "lucide-react";

export const createFileEmbedBlock = createReactBlockSpec(
  {
    type: "fileEmbed" as const,
    propSchema: {
      url: { default: "" },
      name: { default: "" },
      mimeType: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const { url, name, mimeType } = block.props;

      if (!url) {
        return (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            No file attached
          </div>
        );
      }

      const isImage = mimeType.startsWith("image/");

      if (isImage) {
        return (
          <div className="rounded-lg border border-border overflow-hidden">
            <img src={url} alt={name} className="max-w-full max-h-96 object-contain" />
            <div className="px-3 py-2 text-xs text-muted-foreground">{name}</div>
          </div>
        );
      }

      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
        >
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{name || "File"}</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      );
    },
  }
);
