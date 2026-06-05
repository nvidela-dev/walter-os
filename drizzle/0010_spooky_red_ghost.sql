CREATE TABLE "usuarios_autorizados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_autorizados_email_unique" UNIQUE("email")
);
--> statement-breakpoint
-- Seed the initial allowlist (previously hardcoded in src/lib/auth/allowlist.ts).
INSERT INTO "usuarios_autorizados" ("email") VALUES
	('videla.jn@gmail.com'),
	('edithgilda@gmail.com')
ON CONFLICT ("email") DO NOTHING;
