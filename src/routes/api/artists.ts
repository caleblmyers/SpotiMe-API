import { Router, Request, Response } from "express";
import { getTopArtists, getArtists } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateSpotifyQueryParams } from "../../utils/validation";
import { validateIds } from "../../utils/idValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformArtist } from "../../utils/transformers";
import { SpotifyArtist } from "../../types/spotify";

const router = Router();

// Get top artists
router.get(
  "/top-artists",
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

      // Fetch top artists with automatic token refresh
      const artists = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getTopArtists(token, timeRange, limit, offset)
      );

      // Return only specified fields
      const transformedArtists: SpotifyArtist[] = artists.map(transformArtist);

      res.json(transformedArtists);
    } catch (err) {
      handleRouteError(res, err, "/api/top-artists");
    }
  }
);

// Get artists by IDs
router.get(
  "/artists",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      const validation = validateIds(req.query.ids as string, 50, "artist");

      if (!validation.valid || !validation.ids) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch artists with automatic token refresh
      const artistsResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getArtists(token, validation.ids!)
      );

      // Return only specified fields for each artist
      const transformedArtists: SpotifyArtist[] =
        artistsResponse.artists.map(transformArtist);

      res.json(transformedArtists);
    } catch (err) {
      handleRouteError(res, err, "/api/artists");
    }
  }
);

export default router;

