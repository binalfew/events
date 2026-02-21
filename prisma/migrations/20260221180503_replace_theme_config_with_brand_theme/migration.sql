/*
  Warnings:

  - You are about to drop the column `themeConfig` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "themeConfig",
ADD COLUMN     "brandTheme" TEXT;
