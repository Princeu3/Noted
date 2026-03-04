import { pgTable, serial, text, integer, real, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  publicId: varchar("public_id", { length: 12 }).notNull().unique(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  title: text("title").notNull().default("Untitled"),
  icon: text("icon"),
  position: real("position").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
