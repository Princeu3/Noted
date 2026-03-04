import { pgTable, integer, customType, timestamp } from "drizzle-orm/pg-core";
import { pages } from "./pages";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const documents = pgTable("documents", {
  pageId: integer("page_id")
    .primaryKey()
    .references(() => pages.id, { onDelete: "cascade" }),
  data: bytea("data"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
