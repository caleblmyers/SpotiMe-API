import { Router, Request, Response } from "express";
import { getAlbums } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateIds } from "../../utils/idValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformAlbum } from "../../utils/transformers";
import { SpotifyAlbum } from "../../types/spotify";

const router = Router();

// Get albums by IDs
router.get(
  "/albums",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      const validation = validateIds(req.query.ids as string, 20, "album");

      if (!validation.valid || !validation.ids) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch albums with automatic token refresh
      const albumsResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getAlbums(token, validation.ids!)
      );

      // Return only specified fields for each album
      const transformedAlbums: SpotifyAlbum[] =
        albumsResponse.albums.map(transformAlbum);

      res.json(transformedAlbums);
    } catch (err) {
      handleRouteError(res, err, "/api/albums");
    }
  }
);

export default router;

