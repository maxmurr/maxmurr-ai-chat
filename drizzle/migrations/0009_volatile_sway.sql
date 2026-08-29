ALTER TABLE "chat" DROP CONSTRAINT "chat_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;