-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "size" INTEGER,
ALTER COLUMN "url" DROP NOT NULL;
