import { getPlaylistTracks, getUserPlaylists } from "../lib/spotifyClient";
import { handleTokenRefresh } from "./tokenRefresh";
import { transformPlaylist } from "./transformers";
import {
  SpotifyPlaylist,
  SpotifyPlaylistTrackItem,
} from "../types/spotify";
import { SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX } from "../constants/spotify";

/**
 * Fetch all playlists for a user (handles pagination)
 */
export async function fetchAllUserPlaylists(
  accessToken: string,
  spotifyId: string | null
): Promise<SpotifyPlaylist[]> {
  const allPlaylists: SpotifyPlaylist[] = [];
  let next: string | null = null;
  let offset = 0;
  const limit = 50;

  do {
    const playlistsResponse = await handleTokenRefresh(
      spotifyId,
      accessToken,
      (token) => getUserPlaylists(token, limit, offset)
    );

    allPlaylists.push(...playlistsResponse.items.map(transformPlaylist));
    next = playlistsResponse.next;
    offset += limit;
  } while (next);

  return allPlaylists;
}

/**
 * Fetch all tracks from a playlist (handles pagination)
 */
export async function fetchAllPlaylistTracks(
  accessToken: string,
  spotifyId: string | null,
  playlistId: string
): Promise<SpotifyPlaylistTrackItem[]> {
  const allTracks: SpotifyPlaylistTrackItem[] = [];
  let next: string | null = null;
  let offset = 0;
  const limit = SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX;

  do {
    const tracksResponse = await handleTokenRefresh(
      spotifyId,
      accessToken,
      (token) => getPlaylistTracks(token, playlistId, limit, offset)
    );

    allTracks.push(...tracksResponse.items.filter((item) => item.track !== null));
    next = tracksResponse.next;
    offset += limit;
  } while (next);

  return allTracks;
}

/**
 * Check if a playlist contains a specific track
 */
export function playlistContainsTrack(
  playlistTracks: SpotifyPlaylistTrackItem[],
  trackId: string
): boolean {
  return playlistTracks.some((item) => item.track?.id === trackId);
}

/**
 * Check if a playlist contains tracks by a specific artist
 */
export function playlistContainsArtist(
  playlistTracks: SpotifyPlaylistTrackItem[],
  artistId: string
): boolean {
  return playlistTracks.some((item) =>
    item.track?.artists?.some((artist) => artist.id === artistId)
  );
}

/**
 * Count top tracks and artists in a playlist
 * Optimized to use Set lookups and reduce iterations
 */
export function countTopTracksAndArtists(
  playlistTracks: SpotifyPlaylistTrackItem[],
  topTrackIds: Set<string>,
  topArtistIds: Set<string>
): {
  topTracksCount: number;
  topArtistsCount: number;
  topTracksPercentage: number;
  topArtistsPercentage: number;
} {
  if (playlistTracks.length === 0) {
    return {
      topTracksCount: 0,
      topArtistsCount: 0,
      topTracksPercentage: 0,
      topArtistsPercentage: 0,
    };
  }

  let topTracksCount = 0;
  const foundArtists = new Set<string>(); // Track unique artists found

  // Single pass through tracks
  for (const item of playlistTracks) {
    const track = item.track;
    if (!track) continue;

    // Check if track is in top tracks
    if (track.id && topTrackIds.has(track.id)) {
      topTracksCount++;
    }

    // Check if any artist is in top artists (only count once per artist)
    if (track.artists) {
      for (const artist of track.artists) {
        if (artist.id && topArtistIds.has(artist.id) && !foundArtists.has(artist.id)) {
          foundArtists.add(artist.id);
        }
      }
    }
  }

  const topArtistsCount = foundArtists.size;
  const totalTracks = playlistTracks.length;

  return {
    topTracksCount,
    topArtistsCount,
    topTracksPercentage: Math.round((topTracksCount / totalTracks) * 10000) / 100,
    topArtistsPercentage: Math.round((topArtistsCount / totalTracks) * 10000) / 100,
  };
}

