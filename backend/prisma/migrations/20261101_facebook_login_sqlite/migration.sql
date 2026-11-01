ALTER TABLE "users" ADD COLUMN "facebookSub" TEXT;
CREATE UNIQUE INDEX "users_facebookSub_key" ON "users"("facebookSub");
