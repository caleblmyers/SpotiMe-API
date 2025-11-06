import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  spotifyId?: string;
  spotifyAccessToken?: string;
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

