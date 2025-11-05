import { Request } from "express";
import { getUserProfile } from "../lib/spotifyClient";

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

/**
 * Extract Spotify ID from access token
 * This makes an API call to Spotify, so use sparingly
 */
export async function extractSpotifyId(accessToken: string): Promise<string | null> {
  try {
    const profile = await getUserProfile(accessToken);
    return profile.id;
  } catch {
    return null;
  }
}

/**
 * Extract user ID from request headers (optional - for backward compatibility)
 * Since we're using Spotify-only auth, this might not be needed
 */
export function extractUserId(req: Request): string | null {
  const userIdHeader = req.headers["x-user-id"] as string;
  if (userIdHeader) {
    return userIdHeader;
  }
  return null;
}

