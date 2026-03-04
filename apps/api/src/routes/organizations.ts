import { Hono } from "hono";
import { db } from "@noted/db";
import { organization as orgTable, member, workspaces } from "@noted/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth-middleware";

export const organizationsRouter = new Hono();

organizationsRouter.use("*", authMiddleware);

// Delete a shared organization (reject if personal)
organizationsRouter.delete("/organizations/:orgId", async (c) => {
  const orgId = c.req.param("orgId");
  const userId = c.get("user").id;

  // Verify org exists
  const [org] = await db
    .select()
    .from(orgTable)
    .where(eq(orgTable.id, orgId));

  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  // Check if personal org
  try {
    const metadata = org.metadata ? JSON.parse(org.metadata) : {};
    if (metadata.type === "personal") {
      return c.json({ error: "Cannot delete personal organization" }, 403);
    }
  } catch {
    // metadata not JSON, treat as shared
  }

  // Verify user is owner (role === "owner")
  const [m] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
    .limit(1);

  if (!m || m.role !== "owner") {
    return c.json({ error: "Only the organization owner can delete it" }, 403);
  }

  // Delete all spaces in this org (cascades to pages, tasks, tags)
  await db.delete(workspaces).where(eq(workspaces.orgId, orgId));

  // Delete the organization itself (cascades to members, invitations)
  await db.delete(orgTable).where(eq(orgTable.id, orgId));

  return c.json({ success: true });
});
