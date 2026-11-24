-- Existing flags get the same 7 day deadline as new ones.
ALTER TABLE "flags" ADD COLUMN "due_at" TIMESTAMP(3);
UPDATE "flags" SET "due_at" = "created_at" + INTERVAL '7 days';
ALTER TABLE "flags" ALTER COLUMN "due_at" SET NOT NULL;
