import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ExternalLink, Globe } from "lucide-react";

interface OGData {
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  url: string;
}

export const createSharePointBlock = createReactBlockSpec(
  {
    type: "sharepoint" as const,
    propSchema: {
      url: { default: "" },
      label: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const [data, setData] = useState<OGData | null>(null);
      const [loading, setLoading] = useState(false);
      const [inputUrl, setInputUrl] = useState(block.props.url);

      useEffect(() => {
        if (!block.props.url) return;
        setLoading(true);
        api<OGData>(`/api/embeds/opengraph?url=${encodeURIComponent(block.props.url)}`)
          .then(setData)
          .catch(() => {})
          .finally(() => setLoading(false));
      }, [block.props.url]);

      if (!block.props.url) {
        return (
          <div className="flex gap-2 rounded-lg border border-border p-3">
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Paste a SharePoint or link URL..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  editor.updateBlock(block, { props: { url: inputUrl } });
                }
              }}
            />
          </div>
        );
      }

      if (loading) {
        return (
          <div className="animate-pulse rounded-lg border border-border p-4">
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
        );
      }

      const title = data?.title || block.props.label || block.props.url;
      const description = data?.description || "";

      return (
        <a
          href={block.props.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
        >
          <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">{data?.siteName || new URL(block.props.url).hostname}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        </a>
      );
    },
  }
);
