import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  publicId: varchar("public_id", { length: 12 }).notNull().unique(),
  name: text("name").notNull(),
  orgId: text("org_id").notNull(),
  type: text("type").notNull().default("shared"),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
