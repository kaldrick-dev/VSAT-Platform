-- AlterTable
ALTER TABLE "allocations" ADD COLUMN     "out_of_order" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "queue_position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reason_category" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "waiting_count" INTEGER NOT NULL DEFAULT 0;
