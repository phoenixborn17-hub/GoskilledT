-- GPS-M5 §2.4 Notifications: additive nullable User.emailOptOut (non-breaking; User already RLS) +
-- EmailLog idempotent send-log. Golden Rule 15: EmailLog ships RLS-ENABLED (deny-all). Idempotent.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailOptOut" BOOLEAN;

CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "kind"      TEXT NOT NULL,
  "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailLog_dedupeKey_key" ON "EmailLog" ("dedupeKey");
CREATE INDEX IF NOT EXISTS "EmailLog_userId_idx" ON "EmailLog" ("userId");
DO $$ BEGIN
  ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Golden Rule 15.
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;
