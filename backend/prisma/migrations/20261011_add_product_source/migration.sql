ALTER TABLE "products" ADD COLUMN "sourcePlatform" TEXT NOT NULL DEFAULT 'OWN';
ALTER TABLE "products" ADD COLUMN "sourceProductCode" TEXT;
ALTER TABLE "products" ADD COLUMN "sourceUrl" TEXT;
