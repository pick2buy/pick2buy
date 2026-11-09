ALTER TABLE "users" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN "referredById" TEXT;
ALTER TABLE "users" ADD COLUMN "referralRewarded" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
ALTER TABLE "categories" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "maxPerCustomer" INTEGER NOT NULL DEFAULT 99;
ALTER TABLE "orders" ADD COLUMN "operationLock" TEXT;
ALTER TABLE "order_items" ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "order_items" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "order_items" ADD COLUMN "mrp" DOUBLE PRECISION;
ALTER TABLE "coupons" ADD COLUMN "restrictedUserId" TEXT;
CREATE TABLE "offers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "offers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "offers_percentage_check" CHECK ("percentage" > 0 AND "percentage" <= 100),
  CONSTRAINT "offers_dates_check" CHECK ("endDate" > "startDate")
);
CREATE INDEX "offers_scope_targetId_idx" ON "offers"("scope", "targetId");
