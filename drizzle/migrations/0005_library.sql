CREATE TABLE "library_file" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"folder_id" text,
	"name" text NOT NULL,
	"media_type" text NOT NULL,
	"size" integer NOT NULL,
	"bytes" "bytea" NOT NULL,
	"provenance_chat_id" text,
	"provenance_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_folder" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_file" ADD CONSTRAINT "library_file_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_file" ADD CONSTRAINT "library_file_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_file" ADD CONSTRAINT "library_file_folder_id_library_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."library_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_folder" ADD CONSTRAINT "library_folder_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_folder" ADD CONSTRAINT "library_folder_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "libraryFile_organizationId_ownerId_folderId_idx" ON "library_file" USING btree ("organization_id","owner_id","folder_id");--> statement-breakpoint
CREATE INDEX "libraryFile_provenanceChatId_idx" ON "library_file" USING btree ("provenance_chat_id");--> statement-breakpoint
CREATE INDEX "libraryFolder_organizationId_ownerId_idx" ON "library_folder" USING btree ("organization_id","owner_id");