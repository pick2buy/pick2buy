CREATE TABLE "whatsapp_identities" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_identities_userId_key" ON "whatsapp_identities"("userId");
CREATE UNIQUE INDEX "whatsapp_identities_phoneE164_key" ON "whatsapp_identities"("phoneE164");
ALTER TABLE "whatsapp_identities" ADD CONSTRAINT "whatsapp_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "whatsapp_challenges" (
  "id" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSentAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "resendCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "whatsapp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_challenges_phoneE164_key" ON "whatsapp_challenges"("phoneE164");
