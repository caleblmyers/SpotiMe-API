import { TimeRange } from "../types/spotify";
import { VALID_TIME_RANGES } from "../constants/spotify";
import {
  fetchAllPlaylistTracks,
  playlistContainsTrack,
  playlistContainsArtist,
  countTopTracksAndArtists,
} from "./playlistHelpers";
import { SpotifyPlaylist, SpotifyPlaylistTrackItem } from "../types/spotify";

/**
 * Batch size for parallel playlist track fetching to avoid rate limits
 */
const PLAYLIST_FETCH_BATCH_SIZE = 5;

/**
 * Validate and parse time_range query parameter
 */
export function validateTimeRange(
  timeRange: unknown
): TimeRange {
  if (
    typeof timeRange === "string" &&
    VALID_TIME_RANGES.includes(timeRange as TimeRange)
  ) {
    return timeRange as TimeRange;
  }
  return "medium_term"; // Default
}

/**
 * Search playlists for a specific track or artist
 * Fetches tracks in parallel batches to improve performance
 */
export async function searchPlaylistsForTrackOrArtist(
  playlists: SpotifyPlaylist[],
  accessToken: string,
  spotifyId: string | null,
  trackId?: string,
  artistId?: string
): Promise<SpotifyPlaylist[]> {
  const matchingPlaylists: SpotifyPlaylist[] = [];

  // Process playlists in batches to avoid overwhelming the API
  for (let i = 0; i < playlists.length; i += PLAYLIST_FETCH_BATCH_SIZE) {
    const batch = playlists.slice(i, i + PLAYLIST_FETCH_BATCH_SIZE);

    // Fetch all tracks for this batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (playlist) => {
        const playlistTracks = await fetchAllPlaylistTracks(
          accessToken,
          spotifyId,
          playlist.id
        );

        const contains = trackId
          ? playlistContainsTrack(playlistTracks, trackId)
          : playlistContainsArtist(playlistTracks, artistId!);

        return { playlist, contains };
      })
    );

    // Collect matching playlists from this batch
    for (const { playlist, contains } of batchResults) {
      if (contains) {
        matchingPlaylists.push(playlist);
      }
    }
  }

  return matchingPlaylists;
}

/**
 * Analyze all playlists for top tracks/artists
 * Fetches tracks in parallel batches to improve performance
 */
export async function analyzePlaylistsForTopContent(
  playlists: SpotifyPlaylist[],
  accessToken: string,
  spotifyId: string | null,
  topTrackIds: Set<string>,
  topArtistIds: Set<string>
): Promise<
  Array<{
    playlist: SpotifyPlaylist;
    topTracksCount: number;
    topArtistsCount: number;
    topTracksPercentage: number;
    topArtistsPercentage: number;
  }>
> {
  const playlistAnalytics: Array<{
    playlist: SpotifyPlaylist;
    topTracksCount: number;
    topArtistsCount: number;
    topTracksPercentage: number;
    topArtistsPercentage: number;
  }> = [];

  // Process playlists in batches to avoid overwhelming the API
  for (let i = 0; i < playlists.length; i += PLAYLIST_FETCH_BATCH_SIZE) {
    const batch = playlists.slice(i, i + PLAYLIST_FETCH_BATCH_SIZE);

    // Fetch all tracks for this batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (playlist) => {
        const playlistTracks = await fetchAllPlaylistTracks(
          accessToken,
          spotifyId,
          playlist.id
        );

        const counts = countTopTracksAndArtists(
          playlistTracks,
          topTrackIds,
          topArtistIds
        );

        return { playlist, ...counts };
      })
    );

    // Add results from this batch
    playlistAnalytics.push(...batchResults);
  }

  // Sort by top tracks count (descending)
  playlistAnalytics.sort((a, b) => b.topTracksCount - a.topTracksCount);

  return playlistAnalytics;
}

