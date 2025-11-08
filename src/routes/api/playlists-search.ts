import { Router, Request, Response } from "express";
import {
  getUserPlaylists,
  getPlaylistTracks,
  getTopTracks,
  getTopArtists,
} from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformPlaylist, transformTrack, transformArtist } from "../../utils/transformers";
import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from "../../types/spotify";

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
      let allPlaylists: SpotifyPlaylist[] = [];
      let next: string | null = null;
      let offset = 0;
      const limit = 50;

      do {
        const playlistsResponse = await handleTokenRefresh(
          spotifyId || null,
          accessToken,
          (token) => getUserPlaylists(token, limit, offset)
        );

        allPlaylists = allPlaylists.concat(
          playlistsResponse.items.map(transformPlaylist)
        );
        next = playlistsResponse.next;
        offset += limit;
      } while (next);

      // If searching for a specific track or artist
      if (track_id || artist_id) {
        const searchResults: Array<{
          playlist: SpotifyPlaylist;
          contains: boolean;
        }> = [];

        // Check each playlist for the track/artist
        for (const playlist of allPlaylists) {
          let playlistTracks: any[] = [];
          let tracksNext: string | null = null;
          let tracksOffset = 0;
          const tracksLimit = 100;

          // Fetch all tracks from this playlist
          do {
            const tracksResponse = await handleTokenRefresh(
              spotifyId || null,
              accessToken,
              (token) =>
                getPlaylistTracks(token, playlist.id, tracksLimit, tracksOffset)
            );

            playlistTracks = playlistTracks.concat(
              tracksResponse.items.filter((item) => item.track !== null)
            );
            tracksNext = tracksResponse.next;
            tracksOffset += tracksLimit;
          } while (tracksNext);

          // Check if playlist contains the track or artist
          let contains = false;
          if (track_id) {
            contains = playlistTracks.some(
              (item) => item.track?.id === track_id
            );
          } else if (artist_id) {
            contains = playlistTracks.some((item) =>
              item.track?.artists?.some((artist: any) => artist.id === artist_id)
            );
          }

          searchResults.push({
            playlist,
            contains,
          });
        }

        // Filter to only playlists that contain the track/artist
        const matchingPlaylists = searchResults
          .filter((result) => result.contains)
          .map((result) => result.playlist);

        return res.json({
          playlists: matchingPlaylists,
          total: matchingPlaylists.length,
        });
      }

      // If analyzing top tracks/artists in playlists
      if (analyze_top === "true") {
        const timeRange =
          (time_range as "short_term" | "medium_term" | "long_term") ||
          "medium_term";

        // Fetch user's top tracks and artists
        const [topTracks, topArtists] = await Promise.all([
          handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getTopTracks(token, timeRange, 50, 0)
          ),
          handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getTopArtists(token, timeRange, 50, 0)
          ),
        ]);

        const transformedTopTracks = topTracks.map(transformTrack);
        const transformedTopArtists = topArtists.map(transformArtist);

        // Create sets for quick lookup
        const topTrackIds = new Set(transformedTopTracks.map((t) => t.id));
        const topArtistIds = new Set(transformedTopArtists.map((a) => a.id));

        // Analyze each playlist
        const playlistAnalytics: Array<{
          playlist: SpotifyPlaylist;
          topTracksCount: number;
          topArtistsCount: number;
          topTracksPercentage: number;
          topArtistsPercentage: number;
        }> = [];

        for (const playlist of allPlaylists) {
          let playlistTracks: any[] = [];
          let tracksNext: string | null = null;
          let tracksOffset = 0;
          const tracksLimit = 100;

          // Fetch all tracks from this playlist
          do {
            const tracksResponse = await handleTokenRefresh(
              spotifyId || null,
              accessToken,
              (token) =>
                getPlaylistTracks(token, playlist.id, tracksLimit, tracksOffset)
            );

            playlistTracks = playlistTracks.concat(
              tracksResponse.items.filter((item) => item.track !== null)
            );
            tracksNext = tracksResponse.next;
            tracksOffset += tracksLimit;
          } while (tracksNext);

          // Count top tracks and artists in this playlist
          let topTracksCount = 0;
          let topArtistsCount = 0;

          for (const item of playlistTracks) {
            if (item.track?.id && topTrackIds.has(item.track.id)) {
              topTracksCount++;
            }
            if (item.track?.artists) {
              for (const artist of item.track.artists) {
                if (artist.id && topArtistIds.has(artist.id)) {
                  topArtistsCount++;
                  break; // Count each artist only once per track
                }
              }
            }
          }

          const totalTracks = playlistTracks.length;
          const topTracksPercentage =
            totalTracks > 0 ? (topTracksCount / totalTracks) * 100 : 0;
          const topArtistsPercentage =
            totalTracks > 0 ? (topArtistsCount / totalTracks) * 100 : 0;

          playlistAnalytics.push({
            playlist,
            topTracksCount,
            topArtistsCount,
            topTracksPercentage: Math.round(topTracksPercentage * 100) / 100,
            topArtistsPercentage: Math.round(topArtistsPercentage * 100) / 100,
          });
        }

        // Sort by top tracks count (descending)
        playlistAnalytics.sort(
          (a, b) => b.topTracksCount - a.topTracksCount
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

