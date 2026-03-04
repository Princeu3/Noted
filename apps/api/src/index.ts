import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { hocuspocus } from "./hocuspocus";
import { workspacesRouter } from "./routes/workspaces";
import { pagesRouter } from "./routes/pages";
import { filesRouter } from "./routes/files";
import { tagsRouter } from "./routes/tags";
import { searchRouter } from "./routes/search";
import { embedsRouter } from "./routes/embeds";
import { tasksRouter } from "./routes/tasks";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Invitation lookup (public, no auth required)
app.get("/api/invitations/:id", async (c) => {
  const { db } = await import("@noted/db");
  const { invitation, user, organization: orgTable } = await import("@noted/db/schema");
  const { eq } = await import("drizzle-orm");

  const id = c.req.param("id");
  const [inv] = await db.select({
    email: invitation.email,
    status: invitation.status,
    orgId: invitation.organizationId,
    orgName: orgTable.name,
  })
    .from(invitation)
    .innerJoin(orgTable, eq(orgTable.id, invitation.organizationId))
    .where(eq(invitation.id, id))
    .limit(1);

  if (!inv) return c.json({ error: "Invitation not found" }, 404);

  const [existing] = await db.select({ id: user.id })
    .from(user)
    .where(eq(user.email, inv.email))
    .limit(1);

  return c.json({
    email: inv.email,
    status: inv.status,
    orgId: inv.orgId,
    organizationName: inv.orgName,
    accountExists: !!existing,
  });
});

// API routes
app.route("/api", workspacesRouter);
app.route("/api", pagesRouter);
app.route("/api", filesRouter);
app.route("/api", tagsRouter);
app.route("/api", searchRouter);
app.route("/api", embedsRouter);
app.route("/api", tasksRouter);

// Start Hocuspocus WebSocket server
hocuspocus.listen().then(() => {
  console.log(`Hocuspocus WebSocket server running on port ${hocuspocus.address?.port || process.env.HOCUSPOCUS_PORT || 3002}`);
}).catch((e: any) => {
  console.error("Hocuspocus listen failed:", e);
});

const port = parseInt(process.env.PORT || "3001");

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`API server running on http://localhost:${server.port}`);
