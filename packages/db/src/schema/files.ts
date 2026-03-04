import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { pages } from "./pages";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  publicId: varchar("public_id", { length: 12 }).notNull().unique(),
  pageId: integer("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
