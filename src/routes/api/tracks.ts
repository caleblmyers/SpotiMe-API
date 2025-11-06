import { Router, Request, Response } from "express";
import { getTopTracks, getTracks } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateSpotifyQueryParams } from "../../utils/validation";
import { validateIds } from "../../utils/idValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformTrack } from "../../utils/transformers";
import { SpotifyTrack } from "../../types/spotify";

const router = Router();

// Get top tracks
router.get(
  "/top-tracks",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      // Validate query parameters
      const validation = validateSpotifyQueryParams(
        req.query.time_range || "short_term",
        req.query.limit || 20,
        req.query.offset || 0
      );

      if (!validation.valid || !validation.params) {
        return res.status(400).json({ error: validation.error });
      }

      const { timeRange, limit, offset } = validation.params;

      // Fetch top tracks with automatic token refresh
      const tracks = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getTopTracks(token, timeRange, limit, offset)
      );

      // Return only specified fields
      const transformedTracks: SpotifyTrack[] = tracks.map(transformTrack);

      res.json(transformedTracks);
    } catch (err) {
      handleRouteError(res, err, "/api/top-tracks");
    }
  }
);

// Get tracks by IDs
router.get(
  "/tracks",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      const validation = validateIds(req.query.ids as string, 50, "track");

      if (!validation.valid || !validation.ids) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch tracks with automatic token refresh
      const tracksResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getTracks(token, validation.ids!)
      );

      // Return only specified fields for each track
      const transformedTracks: SpotifyTrack[] =
        tracksResponse.tracks.map(transformTrack);

      res.json(transformedTracks);
    } catch (err) {
      handleRouteError(res, err, "/api/tracks");
    }
  }
);

export default router;

