import { Hono } from "hono";
import { db } from "@noted/db";
import { files } from "@noted/db/schema";
import { eq } from "drizzle-orm";
import { generatePublicId } from "@noted/shared";
import { authMiddleware } from "../middleware/auth-middleware";
import { join } from "path";
import { mkdir } from "fs/promises";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export const filesRouter = new Hono();

// Serve file (public — protected by unguessable publicId, like S3 signed URLs)
filesRouter.get("/files/serve/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.publicId, publicId));

  if (!file) {
    return c.json({ error: "File not found" }, 404);
  }

  const bunFile = Bun.file(file.storagePath);
  const exists = await bunFile.exists();
  if (!exists) {
    return c.json({ error: "File not found on disk" }, 404);
  }

  const encodedName = encodeURIComponent(file.name);
  return new Response(bunFile.stream(), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(file.sizeBytes),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// All routes below require auth
filesRouter.use("*", authMiddleware);

// Upload file
filesRouter.post("/files/upload", async (c) => {
  const user = c.get("user");
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const pageId = formData.get("pageId") as string;

  if (!file || !pageId) {
    return c.json({ error: "file and pageId are required" }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: "File too large (max 50MB)" }, 413);
  }

  const publicId = generatePublicId();
  const dir = join(UPLOAD_DIR, pageId, publicId);
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, file.name);
  const buffer = await file.arrayBuffer();
  await Bun.write(filePath, buffer);

  const [record] = await db
    .insert(files)
    .values({
      publicId,
      pageId: parseInt(pageId),
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storagePath: filePath,
      uploadedBy: user.id,
    })
    .returning();

  return c.json(record, 201);
});

// Get file metadata
filesRouter.get("/files/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.publicId, publicId));

  if (!file) {
    return c.json({ error: "File not found" }, 404);
  }

  return c.json(file);
});

// Delete file
filesRouter.delete("/files/:publicId", async (c) => {
  const publicId = c.req.param("publicId");

  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.publicId, publicId));

  if (!file) {
    return c.json({ error: "File not found" }, 404);
  }

  // Delete from disk
  try {
    const { unlink } = await import("fs/promises");
    await unlink(file.storagePath);
  } catch {
    // File may already be deleted
  }

  await db.delete(files).where(eq(files.publicId, publicId));

  return c.json({ success: true });
});
