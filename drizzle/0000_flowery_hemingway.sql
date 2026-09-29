CREATE TABLE "boards" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Untitled board' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objects" (
	"id" text NOT NULL,
	"board_id" text NOT NULL,
	"type" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"color" text,
	"font_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "objects_board_id_id_pk" PRIMARY KEY("board_id","id")
);
--> statement-breakpoint
ALTER TABLE "objects" ADD CONSTRAINT "objects_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "objects_board_id_idx" ON "objects" USING btree ("board_id");