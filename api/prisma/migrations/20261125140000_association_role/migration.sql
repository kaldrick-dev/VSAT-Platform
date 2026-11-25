-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'association';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organisation" TEXT;
