import jwt, { Secret, sign, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN!;

export function createAccessToken(userId: string) {
  return sign(
    { userId },
    JWT_SECRET as Secret,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );
}

export function createRefreshToken(userId: string) {
  return sign(
    { userId },
    JWT_SECRET as Secret,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET as Secret) as { userId: string };
}
