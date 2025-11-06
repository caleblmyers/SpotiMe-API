import { Request, Response, NextFunction } from "express";
import { extractSpotifyToken } from "./auth";

export interface SpotifyAuthRequest extends Request {
  accessToken: string;
  spotifyId?: string;
}

/**
 * Middleware to extract and validate Spotify access token
 * Adds accessToken and spotifyId to request object
 */
export function requireSpotifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const accessToken = extractSpotifyToken(req);

  if (!accessToken) {
    res.status(401).json({ error: "No Spotify access token provided" });
    return;
  }

  (req as SpotifyAuthRequest).accessToken = accessToken;
  (req as SpotifyAuthRequest).spotifyId = req.headers["x-spotify-id"] as string | undefined;
  next();
}

