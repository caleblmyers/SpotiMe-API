import { Router, Request, Response } from "express";
import { getUserPlaylists, getPlaylistTracks } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformPlaylist, transformPlaylistTrack } from "../../utils/transformers";
import { SpotifyPlaylist, SpotifyPlaylistTrack } from "../../types/spotify";
import {
  validatePaginationParams,
  validatePlaylistTracksPaginationParams,
} from "../../utils/paginationValidation";

const router = Router();

// Get user's playlists
router.get(
  "/playlists",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      // Validate and parse query parameters
      const validation = validatePaginationParams(
        req.query.limit,
        req.query.offset,
        50
      );

      if (!validation.valid || !validation.params) {
        return res.status(400).json({ error: validation.error });
      }

      const { limit, offset } = validation.params;

      // Fetch user's playlists with automatic token refresh
      const playlistsResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getUserPlaylists(token, limit, offset)
      );

      // Transform playlists
      const transformedPlaylists: SpotifyPlaylist[] =
        playlistsResponse.items.map(transformPlaylist);

      res.json({
        items: transformedPlaylists,
        next: playlistsResponse.next,
        previous: playlistsResponse.previous,
        total: playlistsResponse.total,
        limit: playlistsResponse.limit,
        offset: playlistsResponse.offset,
      });
    } catch (err) {
      handleRouteError(res, err, "/api/playlists");
    }
  }
);

// Get tracks from a specific playlist
router.get(
  "/playlists/:id/tracks",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;
      const playlistId = req.params.id;

      if (!playlistId) {
        return res.status(400).json({ error: "Playlist ID is required" });
      }

      // Validate and parse query parameters
      const validation = validatePlaylistTracksPaginationParams(
        req.query.limit,
        req.query.offset
      );

      if (!validation.valid || !validation.params) {
        return res.status(400).json({ error: validation.error });
      }

      const { limit, offset } = validation.params;

      // Fetch playlist tracks with automatic token refresh
      const tracksResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getPlaylistTracks(token, playlistId, limit, offset)
      );

      // Transform playlist tracks
      const transformedTracks: SpotifyPlaylistTrack[] =
        tracksResponse.items.map(transformPlaylistTrack);

      res.json({
        items: transformedTracks,
        next: tracksResponse.next,
        previous: tracksResponse.previous,
        total: tracksResponse.total,
        limit: tracksResponse.limit,
        offset: tracksResponse.offset,
      });
    } catch (err) {
      handleRouteError(res, err, "/api/playlists/:id/tracks");
    }
  }
);

export default router;

