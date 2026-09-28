import {
  pgTable,
  text,
  integer,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const boards = pgTable("boards", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull().default("Untitled board"),
  updatedAt: integer("updated_at").notNull(),
});

export const objects = pgTable(
  "objects",
  {
    id: uuid("id").notNull(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id),
    type: text("type").notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    content: text("content").notNull().default(""),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.boardId, table.id] }),
  }),
);

export const boardRelations = relations(boards, ({ many }) => ({
  objects: many(objects),
}));

export const objectRelations = relations(objects, ({ one }) => ({
  board: one(boards, {
    fields: [objects.boardId],
    references: [boards.id],
  }),
}));
