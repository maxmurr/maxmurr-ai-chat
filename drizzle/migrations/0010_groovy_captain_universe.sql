CREATE TABLE "project_source" (
	"project_id" text NOT NULL,
	"file_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "project_source_project_id_file_id_pk" PRIMARY KEY("project_id","file_id")
);
--> statement-breakpoint
ALTER TABLE "project_source" ADD CONSTRAINT "project_source_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_source" ADD CONSTRAINT "project_source_file_id_library_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."library_file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "project_source" ("project_id", "file_id")
SELECT "project"."id", "library_file"."id"
FROM "project"
INNER JOIN "library_file" ON "library_file"."folder_id" = "project"."folder_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint
CREATE INDEX "projectSource_fileId_idx" ON "project_source" USING btree ("file_id");