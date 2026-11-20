ALTER TABLE "banners"
ADD COLUMN "placement" TEXT NOT NULL DEFAULT 'ESSENTIALS';

CREATE INDEX "banners_placement_isActive_displayOrder_idx"
ON "banners"("placement", "isActive", "displayOrder");
