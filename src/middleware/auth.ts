import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  spotifyAccessToken?: string;
}

/**
 * Extract user ID from request headers (x-user-id or x-jwt-token)
 */
export function extractUserId(req: Request): string | null {
  const userIdHeader = req.headers["x-user-id"] as string;
  if (userIdHeader) {
    return userIdHeader;
  }

  const jwtHeader = req.headers["x-jwt-token"] as string;
  if (jwtHeader) {
    try {
      const decoded = verifyToken(jwtHeader);
      return decoded.userId;
    } catch {
      // JWT token invalid, return null
      return null;
    }
  }

  return null;
}

/**
 * Extract Spotify access token from Authorization header
 */
export function extractSpotifyToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

