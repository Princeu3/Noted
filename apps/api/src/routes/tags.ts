import { Hono } from "hono";
import { db } from "@noted/db";
import { tags, pageTags, pages } from "@noted/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generatePublicId } from "@noted/shared";
import { authMiddleware } from "../middleware/auth-middleware";

export const tagsRouter = new Hono();

tagsRouter.use("*", authMiddleware);

// List tags for workspace
tagsRouter.get("/workspaces/:workspaceId/tags", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));

  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.workspaceId, workspaceId));

  return c.json(result);
});

// Create tag
tagsRouter.post("/workspaces/:workspaceId/tags", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));
  const body = await c.req.json<{ name: string; color: string }>();

  const [tag] = await db
    .insert(tags)
    .values({
      publicId: generatePublicId(),
      workspaceId,
      name: body.name,
      color: body.color,
    })
    .returning();

  return c.json(tag, 201);
});

// Delete tag
tagsRouter.delete("/tags/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.publicId, publicId));

  if (!tag) return c.json({ error: "Tag not found" }, 404);

  await db.delete(tags).where(eq(tags.id, tag.id));
  return c.json({ success: true });
});

// Get tags for a page
tagsRouter.get("/pages/:publicId/tags", async (c) => {
  const publicId = c.req.param("publicId");

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.publicId, publicId));

  if (!page) return c.json({ error: "Page not found" }, 404);

  const result = await db
    .select({ tag: tags })
    .from(pageTags)
    .innerJoin(tags, eq(pageTags.tagId, tags.id))
    .where(eq(pageTags.pageId, page.id));

  return c.json(result.map((r) => r.tag));
});

// Set tags for a page
tagsRouter.put("/pages/:publicId/tags", async (c) => {
  const publicId = c.req.param("publicId");
  const body = await c.req.json<{ tagIds: number[] }>();

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.publicId, publicId));

  if (!page) return c.json({ error: "Page not found" }, 404);

  // Clear existing tags
  await db.delete(pageTags).where(eq(pageTags.pageId, page.id));

  // Insert new tags
  if (body.tagIds.length > 0) {
    await db.insert(pageTags).values(
      body.tagIds.map((tagId) => ({
        pageId: page.id,
        tagId,
      }))
    );
  }

  return c.json({ success: true });
});
