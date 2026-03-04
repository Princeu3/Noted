import { Hono } from "hono";
import { db } from "@noted/db";
import { tasks } from "@noted/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth-middleware";

export const tasksRouter = new Hono();

tasksRouter.use("*", authMiddleware);

// Get tasks for a date
tasksRouter.get("/workspaces/:workspaceId/tasks", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));
  const date = c.req.query("date");

  if (!date) {
    return c.json({ error: "date query param is required" }, 400);
  }

  const result = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.date, date)))
    .orderBy(asc(tasks.position));

  return c.json(result);
});

// Create task
tasksRouter.post("/workspaces/:workspaceId/tasks", async (c) => {
  const workspaceId = parseInt(c.req.param("workspaceId"));
  const user = c.get("user" as never) as unknown as { id: string };
  const body = await c.req.json<{ text: string; date: string }>();

  // Get next position
  const existing = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.date, body.date)));

  const [task] = await db
    .insert(tasks)
    .values({
      workspaceId,
      date: body.date,
      text: body.text,
      createdBy: user.id,
      position: existing.length,
    })
    .returning();

  return c.json(task, 201);
});

// Update task (toggle complete, edit text)
tasksRouter.patch("/tasks/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<{ text?: string; isCompleted?: boolean }>();

  const updates: Record<string, unknown> = {};
  if (body.text !== undefined) updates.text = body.text;
  if (body.isCompleted !== undefined) updates.isCompleted = body.isCompleted;

  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning();

  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json(task);
});

// Delete task
tasksRouter.delete("/tasks/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await db.delete(tasks).where(eq(tasks.id, id));
  return c.json({ success: true });
});
