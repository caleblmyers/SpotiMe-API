import { Router, Request, Response } from "express";
import { getRecentlyPlayed } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateRecentlyPlayedParams } from "../../utils/recentlyPlayedValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformTrack } from "../../utils/transformers";
import { SpotifyPlayHistory } from "../../types/spotify";

const router = Router();

// Get recently played tracks
router.get(
  "/recently-played",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      // Validate query parameters
      const validation = validateRecentlyPlayedParams(req.query);

      if (!validation.valid || !validation.params) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch recently played tracks with automatic token refresh
      const recentlyPlayed = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getRecentlyPlayed(token, validation.params)
      );

      // Transform play history items
      const transformedItems: SpotifyPlayHistory[] = recentlyPlayed.items.map(
        (item) => ({
          track: transformTrack(item.track),
          played_at: item.played_at,
          context: item.context,
        })
      );

      res.json({
        items: transformedItems,
        next: recentlyPlayed.next,
        cursors: recentlyPlayed.cursors,
      });
    } catch (err) {
      handleRouteError(res, err, "/api/recently-played");
    }
  }
);

export default router;

