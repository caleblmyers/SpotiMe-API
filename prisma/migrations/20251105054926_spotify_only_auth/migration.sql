/*
  Warnings:

  - You are about to drop the column `jwtAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `jwtRefreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `jwtTokenExpiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Made the column `spotifyId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "jwtAccessToken",
DROP COLUMN "jwtRefreshToken",
DROP COLUMN "jwtTokenExpiresAt",
DROP COLUMN "password",
ALTER COLUMN "spotifyId" SET NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
