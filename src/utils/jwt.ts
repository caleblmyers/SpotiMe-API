import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set");
}

export interface TokenPayload {
  userId: string;
}

export function createAccessToken(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { userId },
    JWT_SECRET as Secret,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );
}

export function createRefreshToken(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    { userId },
    JWT_SECRET as Secret,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions
  );
}

export function verifyToken(token: string): TokenPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, JWT_SECRET as Secret) as TokenPayload;
}
