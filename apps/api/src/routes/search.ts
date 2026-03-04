import { Hono } from "hono";
import { db } from "@noted/db";
import { pages, workspaces } from "@noted/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth-middleware";

export const searchRouter = new Hono();

searchRouter.use("*", authMiddleware);

searchRouter.get("/workspaces/:workspaceId/search", async (c) => {
  const param = c.req.param("workspaceId");
  const q = c.req.query("q")?.trim();

  // Resolve workspace — param can be numeric ID or publicId string
  let workspaceId = parseInt(param);
  if (isNaN(workspaceId)) {
    const [ws] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.publicId, param));
    if (!ws) return c.json({ error: "Workspace not found" }, 404);
    workspaceId = ws.id;
  }

  if (!q) {
    const recent = await db
      .select({
        publicId: pages.publicId,
        title: pages.title,
        icon: pages.icon,
      })
      .from(pages)
      .where(and(eq(pages.workspaceId, workspaceId), eq(pages.isArchived, false)))
      .orderBy(pages.updatedAt)
      .limit(10);

    return c.json({ results: recent });
  }

  const results = await db
    .select({
      publicId: pages.publicId,
      title: pages.title,
      icon: pages.icon,
    })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        eq(pages.isArchived, false),
        ilike(pages.title, `%${q}%`)
      )
    )
    .orderBy(pages.updatedAt)
    .limit(20);

  return c.json({ results });
});
