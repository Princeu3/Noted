import { Hono } from "hono";
import { db } from "@noted/db";
import { workspaces, member } from "@noted/db/schema";
import { eq, and, or } from "drizzle-orm";
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

// List workspaces for user's active organization
// Returns: shared workspaces + only the current user's personal workspace
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
    .where(
      and(
        eq(workspaces.orgId, orgId),
        or(
          eq(workspaces.type, "shared"),
          and(eq(workspaces.type, "personal"), eq(workspaces.ownerId, userId))
        )
      )
    );

  return c.json(result);
});

// Create workspace
workspacesRouter.post("/workspaces", async (c) => {
  const body = await c.req.json<{ name: string; orgId: string; type?: string }>();
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
      type: body.type || "shared",
      ownerId: body.type === "personal" ? userId : null,
    })
    .returning();

  return c.json(workspace, 201);
});

// Get workspace by public ID
workspacesRouter.get("/workspaces/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.publicId, publicId));

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  return c.json(workspace);
});
