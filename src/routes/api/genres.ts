import { Router, Request, Response } from "express";
import { getGenres } from "../../lib/spotifyClient";
import { requireSpotifyAuth, SpotifyAuthRequest } from "../../middleware/spotifyAuth";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";

const router = Router();

// Get available genres
router.get("/genres", requireSpotifyAuth, async (req: Request, res: Response) => {
  try {
    const { accessToken, spotifyId } = req as SpotifyAuthRequest;

    // Fetch genres with automatic token refresh
    const genresResponse = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getGenres(token)
    );

    res.json(genresResponse.genres);
  } catch (err) {
    handleRouteError(res, err, "/api/genres");
  }
});

export default router;

