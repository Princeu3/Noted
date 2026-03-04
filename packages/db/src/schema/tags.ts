import { pgTable, serial, text, integer, varchar, primaryKey, unique } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { pages } from "./pages";

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 12 }).notNull().unique(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
  },
  (t) => [unique("tags_workspace_name").on(t.workspaceId, t.name)]
);

export const pageTags = pgTable(
  "page_tags",
  {
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.pageId, t.tagId] })]
);
