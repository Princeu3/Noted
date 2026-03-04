import { Hono } from "hono";
import { db } from "@noted/db";
import { pages } from "@noted/db/schema";
import { eq, and } from "drizzle-orm";
import { generatePublicId } from "@noted/shared";
import { authMiddleware } from "../middleware/auth-middleware";

export const pagesRouter = new Hono();

pagesRouter.use("*", authMiddleware);

// Get page tree for a workspace
pagesRouter.get("/workspaces/:workspaceId/pages", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));

  const result = await db
    .select()
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), eq(pages.isArchived, false)))
    .orderBy(pages.position);

  return c.json(result);
});

// Create page
pagesRouter.post("/workspaces/:workspaceId/pages", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));
  const user = c.get("user");
  const body = await c.req.json<{
    title?: string;
    parentId?: number | null;
    icon?: string;
    position?: number;
  }>();

  const [page] = await db
    .insert(pages)
    .values({
      publicId: generatePublicId(),
      workspaceId,
      parentId: body.parentId ?? null,
      title: body.title ?? "Untitled",
      icon: body.icon ?? null,
      position: body.position ?? Date.now(),
      createdBy: user.id,
    })
    .returning();

  return c.json(page, 201);
});

// Get single page
pagesRouter.get("/pages/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.publicId, publicId));

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json(page);
});

// Update page
pagesRouter.patch("/pages/:publicId", async (c) => {
  const publicId = c.req.param("publicId");
  const body = await c.req.json<{
    title?: string;
    icon?: string;
    parentId?: number | null;
    position?: number;
    isArchived?: boolean;
  }>();

  const [page] = await db
    .update(pages)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(pages.publicId, publicId))
    .returning();

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json(page);
});

// Delete page (soft delete — archive)
pagesRouter.delete("/pages/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [page] = await db
    .update(pages)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(pages.publicId, publicId))
    .returning();

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json({ success: true });
});
