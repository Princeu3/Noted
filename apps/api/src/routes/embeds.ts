import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth-middleware";

export const embedsRouter = new Hono();

embedsRouter.use("*", authMiddleware);

// Simple in-memory cache (5min TTL)
const cache = new Map<string, { data: unknown; expires: number }>();
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}
function setCache(key: string, data: unknown, ttlMs = 5 * 60 * 1000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// GitHub embed
embedsRouter.get("/embeds/github", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "url is required" }, 400);

  const cached = getCached<object>(`gh:${url}`);
  if (cached) return c.json(cached);

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") {
      return c.json({ error: "Not a GitHub URL" }, 400);
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return c.json({ error: "Invalid GitHub URL" }, 400);

    const [owner, repo] = parts;
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Check if it's an issue or PR
    if (parts.length >= 4 && (parts[2] === "issues" || parts[2] === "pull")) {
      const number = parts[3];
      const endpoint = parts[2] === "pull" ? "pulls" : "issues";
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/${endpoint}/${number}`, { headers });
      if (!res.ok) return c.json({ error: "GitHub API error" }, res.status);
      const data = await res.json();

      const result = {
        type: parts[2] === "pull" ? "pr" : "issue",
        title: data.title,
        number: data.number,
        state: data.state,
        user: data.user?.login,
        url,
        repo: `${owner}/${repo}`,
      };
      setCache(`gh:${url}`, result);
      return c.json(result);
    }

    // Default: repo info
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!res.ok) return c.json({ error: "GitHub API error" }, res.status);
    const data = await res.json();

    const result = {
      type: "repo",
      name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      language: data.language,
      url,
    };
    setCache(`gh:${url}`, result);
    return c.json(result);
  } catch {
    return c.json({ error: "Failed to fetch GitHub data" }, 500);
  }
});

// OpenGraph embed (SharePoint + generic links)
embedsRouter.get("/embeds/opengraph", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "url is required" }, 400);

  const cached = getCached<object>(`og:${url}`);
  if (cached) return c.json(cached);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Noted/1.0 (OpenGraph Fetcher)" },
      redirect: "follow",
    });

    const html = await res.text();

    function getMetaContent(property: string): string | null {
      const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
      const altRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i");
      return regex.exec(html)?.[1] || altRegex.exec(html)?.[1] || null;
    }

    const titleTag = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];

    const result = {
      title: getMetaContent("og:title") || titleTag || url,
      description: getMetaContent("og:description") || getMetaContent("description") || "",
      image: getMetaContent("og:image") || null,
      siteName: getMetaContent("og:site_name") || new URL(url).hostname,
      url,
    };
    setCache(`og:${url}`, result);
    return c.json(result);
  } catch {
    // Graceful degradation — return URL-only card
    const result = { title: url, description: "", image: null, siteName: new URL(url).hostname, url };
    return c.json(result);
  }
});
