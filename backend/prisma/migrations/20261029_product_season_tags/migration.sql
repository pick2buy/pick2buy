CREATE TABLE "product_season_tags" (
  "productId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "product_season_tags_pkey" PRIMARY KEY ("productId", "categoryId")
);

CREATE INDEX "product_season_tags_categoryId_idx" ON "product_season_tags"("categoryId");

ALTER TABLE "product_season_tags"
  ADD CONSTRAINT "product_season_tags_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_season_tags"
  ADD CONSTRAINT "product_season_tags_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
