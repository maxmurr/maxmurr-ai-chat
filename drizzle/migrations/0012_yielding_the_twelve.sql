ALTER TABLE "chat" ADD COLUMN "active_stream_id" text;--> statement-breakpoint
ALTER TABLE "chat" ADD COLUMN "has_unread_response" boolean DEFAULT false NOT NULL;