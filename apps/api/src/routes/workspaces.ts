import { Hono } from "hono";
import { db } from "@noted/db";
import { workspaces, member } from "@noted/db/schema";
import { eq, and } from "drizzle-orm";
import { generatePublicId } from "@noted/shared";
import { authMiddleware } from "../middleware/auth-middleware";

export const workspacesRouter = new Hono();

workspacesRouter.use("*", authMiddleware);

async function verifyOrgMembership(userId: string, orgId: string) {
  const [m] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
    .limit(1);
  return !!m;
}

// List all spaces for an organization
workspacesRouter.get("/workspaces", async (c) => {
  const orgId = c.req.query("orgId");
  const userId = c.get("user").id;

  if (!orgId) {
    return c.json({ error: "orgId is required" }, 400);
  }

  if (!(await verifyOrgMembership(userId, orgId))) {
    return c.json({ error: "Not a member of this organization" }, 403);
  }

  const result = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.orgId, orgId));

  return c.json(result);
});

// Create space
workspacesRouter.post("/workspaces", async (c) => {
  const body = await c.req.json<{ name: string; orgId: string }>();
  const userId = c.get("user").id;

  if (!(await verifyOrgMembership(userId, body.orgId))) {
    return c.json({ error: "Not a member of this organization" }, 403);
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      publicId: generatePublicId(),
      name: body.name,
      orgId: body.orgId,
    })
    .returning();

  return c.json(workspace, 201);
});

// Get space by public ID
workspacesRouter.get("/workspaces/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.publicId, publicId));

  if (!workspace) {
    return c.json({ error: "Space not found" }, 404);
  }

  return c.json(workspace);
});

// Rename space
workspacesRouter.patch("/workspaces/:publicId", async (c) => {
  const publicId = c.req.param("publicId");
  const userId = c.get("user").id;
  const body = await c.req.json<{ name: string }>();

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.publicId, publicId));

  if (!workspace) {
    return c.json({ error: "Space not found" }, 404);
  }

  if (!(await verifyOrgMembership(userId, workspace.orgId))) {
    return c.json({ error: "Not a member of this organization" }, 403);
  }

  const [updated] = await db
    .update(workspaces)
    .set({ name: body.name, updatedAt: new Date() })
    .where(eq(workspaces.publicId, publicId))
    .returning();

  return c.json(updated);
});

// Delete space (cascades to pages, tasks, tags)
workspacesRouter.delete("/workspaces/:publicId", async (c) => {
  const publicId = c.req.param("publicId");
  const userId = c.get("user").id;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.publicId, publicId));

  if (!workspace) {
    return c.json({ error: "Space not found" }, 404);
  }

  if (!(await verifyOrgMembership(userId, workspace.orgId))) {
    return c.json({ error: "Not a member of this organization" }, 403);
  }

  await db.delete(workspaces).where(eq(workspaces.publicId, publicId));

  return c.json({ success: true });
});
