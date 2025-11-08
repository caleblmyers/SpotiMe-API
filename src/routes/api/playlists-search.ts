import { Router, Request, Response } from "express";
import { getTopTracks, getTopArtists } from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformTrack, transformArtist } from "../../utils/transformers";
import {
  fetchAllUserPlaylists,
} from "../../utils/playlistHelpers";
import {
  validateTimeRange,
  searchPlaylistsForTrackOrArtist,
  analyzePlaylistsForTopContent,
} from "../../utils/playlistSearchHelpers";
import { SPOTIFY_LIMIT_MAX } from "../../constants/spotify";

const router = Router();

/**
 * Search playlists for tracks/artists and provide analytics
 * Query params:
 * - track_id: Find playlists containing this track
 * - artist_id: Find playlists containing tracks by this artist
 * - analyze_top: If true, analyze how many top tracks/artists are in each playlist
 * - time_range: For analyze_top, which time range to use (short_term, medium_term, long_term)
 */
router.get(
  "/playlists/search",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;
      const { track_id, artist_id, analyze_top, time_range } = req.query;

      // Validate that at least one search parameter is provided
      if (!track_id && !artist_id && analyze_top !== "true") {
        return res.status(400).json({
          error:
            "At least one of the following query parameters is required: track_id, artist_id, analyze_top",
        });
      }

      // Fetch all user playlists
      const allPlaylists = await fetchAllUserPlaylists(
        accessToken,
        spotifyId || null
      );

      // If searching for a specific track or artist
      if (track_id || artist_id) {
        const matchingPlaylists = await searchPlaylistsForTrackOrArtist(
          allPlaylists,
          accessToken,
          spotifyId || null,
          track_id as string | undefined,
          artist_id as string | undefined
        );

        return res.json({
          playlists: matchingPlaylists,
          total: matchingPlaylists.length,
        });
      }

      // If analyzing top tracks/artists in playlists
      if (analyze_top === "true") {
        const timeRange = validateTimeRange(time_range);

        // Fetch user's top tracks and artists in parallel
        const [topTracks, topArtists] = await Promise.all([
          handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getTopTracks(token, timeRange, SPOTIFY_LIMIT_MAX, 0)
          ),
          handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getTopArtists(token, timeRange, SPOTIFY_LIMIT_MAX, 0)
          ),
        ]);

        // Transform and create lookup sets
        const topTrackIds = new Set(
          topTracks.map((t) => transformTrack(t).id)
        );
        const topArtistIds = new Set(
          topArtists.map((a) => transformArtist(a).id)
        );

        // Analyze all playlists in parallel batches
        const playlistAnalytics = await analyzePlaylistsForTopContent(
          allPlaylists,
          accessToken,
          spotifyId || null,
          topTrackIds,
          topArtistIds
        );

        return res.json({
          time_range: timeRange,
          playlists: playlistAnalytics,
          total: playlistAnalytics.length,
        });
      }

      res.status(400).json({
        error: "Invalid query parameters",
      });
    } catch (err) {
      handleRouteError(res, err, "/api/playlists/search");
    }
  }
);

export default router;

