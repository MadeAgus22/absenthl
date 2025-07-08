/*
  Warnings:

  - You are about to drop the column `content` on the `LogbookEntry` table. All the data in the column will be lost.
  - Added the required column `activity` to the `LogbookEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `division` to the `LogbookEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `LogbookEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personAssisted` to the `LogbookEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LogbookEntry" DROP COLUMN "content",
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "division" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "personAssisted" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "activity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;