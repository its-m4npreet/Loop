-- AlterTable: add import metadata columns safely for existing rows
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "featureArea" TEXT;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "importedById" TEXT;

-- Add updatedAt with default for existing rows, then keep it required
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Feedback" SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_importedById_idx" ON "Feedback"("importedById");

-- AddForeignKey (idempotent-ish: drop if partially applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Feedback_importedById_fkey'
  ) THEN
    ALTER TABLE "Feedback"
      ADD CONSTRAINT "Feedback_importedById_fkey"
      FOREIGN KEY ("importedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
