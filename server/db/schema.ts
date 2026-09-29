import {
  pgTable,
  text,
  integer,
  timestamp,
  bigint,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const boards = pgTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("Untitled board"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const objects = pgTable(
  "objects",
  {
    id: text("id").notNull(),
    boardId: text("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<"card" | "text" | "rect">(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    content: text("content").notNull().default(""),
    color: text("color"),
    fontSize: integer("font_size"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.boardId, table.id] }),
    uniqueIndex("objects_board_id_idx").on(table.boardId),
  ],
);

export type BoardRow = typeof boards.$inferSelect;
export type ObjectRow = typeof objects.$inferSelect;
export type NewObjectRow = typeof objects.$inferInsert;
