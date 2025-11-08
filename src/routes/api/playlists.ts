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
import { SPOTIFY_LIMIT_MIN, SPOTIFY_LIMIT_MAX, SPOTIFY_OFFSET_MIN, SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX } from "../../constants/spotify";

const router = Router();

// Get user's playlists
router.get(
  "/playlists",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      // Validate and parse query parameters
      const limitNum =
        req.query.limit !== undefined
          ? parseInt(req.query.limit as string, 10)
          : 50;
      const offsetNum =
        req.query.offset !== undefined
          ? parseInt(req.query.offset as string, 10)
          : 0;

      if (
        isNaN(limitNum) ||
        limitNum < SPOTIFY_LIMIT_MIN ||
        limitNum > SPOTIFY_LIMIT_MAX
      ) {
        return res.status(400).json({
          error: `Invalid limit. Must be between ${SPOTIFY_LIMIT_MIN} and ${SPOTIFY_LIMIT_MAX}`,
        });
      }

      if (isNaN(offsetNum) || offsetNum < SPOTIFY_OFFSET_MIN) {
        return res.status(400).json({
          error: `Invalid offset. Must be ${SPOTIFY_OFFSET_MIN} or greater`,
        });
      }

      // Fetch user's playlists with automatic token refresh
      const playlistsResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getUserPlaylists(token, limitNum, offsetNum)
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
      const limitNum =
        req.query.limit !== undefined
          ? parseInt(req.query.limit as string, 10)
          : 100;
      const offsetNum =
        req.query.offset !== undefined
          ? parseInt(req.query.offset as string, 10)
          : 0;

      if (
        isNaN(limitNum) ||
        limitNum < SPOTIFY_LIMIT_MIN ||
        limitNum > SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX
      ) {
        return res.status(400).json({
          error: `Invalid limit. Must be between ${SPOTIFY_LIMIT_MIN} and ${SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX}`,
        });
      }

      if (isNaN(offsetNum) || offsetNum < SPOTIFY_OFFSET_MIN) {
        return res.status(400).json({
          error: `Invalid offset. Must be ${SPOTIFY_OFFSET_MIN} or greater`,
        });
      }

      // Fetch playlist tracks with automatic token refresh
      const tracksResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getPlaylistTracks(token, playlistId, limitNum, offsetNum)
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

