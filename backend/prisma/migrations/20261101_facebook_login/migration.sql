ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "facebookSub" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_facebookSub_key" ON "users"("facebookSub");
