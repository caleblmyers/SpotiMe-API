/*
  Warnings:

  - You are about to drop the column `accessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken",
DROP COLUMN "tokenExpiresAt",
ADD COLUMN     "jwtAccessToken" TEXT,
ADD COLUMN     "jwtRefreshToken" TEXT,
ADD COLUMN     "jwtTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "spotifyAccessToken" TEXT,
ADD COLUMN     "spotifyRefreshToken" TEXT,
ADD COLUMN     "spotifyTokenExpiresAt" TIMESTAMP(3),
ALTER COLUMN "password" DROP NOT NULL;
