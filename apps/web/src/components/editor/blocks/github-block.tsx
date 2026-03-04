import { createReactBlockSpec } from "@blocknote/react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Star, GitPullRequest, CircleDot, ExternalLink } from "lucide-react";

interface GitHubData {
  type: "repo" | "issue" | "pr";
  name?: string;
  title?: string;
  number?: number;
  description?: string;
  stars?: number;
  language?: string;
  state?: string;
  user?: string;
  repo?: string;
  url: string;
}

export const createGitHubBlock = createReactBlockSpec(
  {
    type: "github" as const,
    propSchema: {
      url: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const [data, setData] = useState<GitHubData | null>(null);
      const [loading, setLoading] = useState(false);
      const [inputUrl, setInputUrl] = useState(block.props.url);

      useEffect(() => {
        if (!block.props.url) return;
        setLoading(true);
        api<GitHubData>(`/api/embeds/github?url=${encodeURIComponent(block.props.url)}`)
          .then(setData)
          .catch(() => {})
          .finally(() => setLoading(false));
      }, [block.props.url]);

      if (!block.props.url) {
        return (
          <div className="flex gap-2 rounded-lg border border-border p-3">
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Paste a GitHub URL..."
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

      if (!data) {
        return (
          <a href={block.props.url} target="_blank" rel="noopener noreferrer"
            className="block rounded-lg border border-border p-3 text-sm text-muted-foreground hover:bg-accent">
            {block.props.url}
          </a>
        );
      }

      return (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-accent transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {data.type === "pr" && <GitPullRequest className="h-4 w-4 text-green-500" />}
              {data.type === "issue" && <CircleDot className="h-4 w-4 text-blue-500" />}
              <span className="font-medium text-sm truncate">
                {data.type === "repo" ? data.name : `${data.repo}#${data.number}`}
              </span>
              {data.state && (
                <Badge variant={data.state === "open" ? "default" : "secondary"} className="text-xs">
                  {data.state}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {data.type === "repo" ? data.description : data.title}
            </p>
            {data.type === "repo" && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {data.language && <span>{data.language}</span>}
                {data.stars !== undefined && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> {data.stars}
                  </span>
                )}
              </div>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        </a>
      );
    },
  }
);
