import { getSpotifyData } from "../utils/getSpotifyData";
import {
  TimeRange,
  SpotifyUserResponse,
  SpotifyTrackResponse,
  SpotifyArtistResponse,
  SpotifyAlbumsResponse,
  SpotifyArtistsResponse,
  SpotifyTracksResponse,
  SpotifyGenresResponse,
  SpotifyRecentlyPlayedResponse,
} from "../types/spotify";
import { RecentlyPlayedParams } from "../utils/recentlyPlayedValidation";

interface SpotifyTopTracksResponse {
  items: SpotifyTrackResponse[];
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtistResponse[];
}

export async function getUserProfile(
  accessToken: string
): Promise<SpotifyUserResponse> {
  return getSpotifyData<SpotifyUserResponse>(
    accessToken,
    "https://api.spotify.com/v1/me"
  );
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = "short_term",
  limit = 20,
  offset = 0
): Promise<SpotifyTrackResponse[]> {
  const response = await getSpotifyData<SpotifyTopTracksResponse>(
    accessToken,
    "https://api.spotify.com/v1/me/top/tracks",
    { limit, time_range: timeRange, offset }
  );
  return response.items;
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = "short_term",
  limit = 20,
  offset = 0
): Promise<SpotifyArtistResponse[]> {
  const response = await getSpotifyData<SpotifyTopArtistsResponse>(
    accessToken,
    "https://api.spotify.com/v1/me/top/artists",
    { limit, time_range: timeRange, offset }
  );
  return response.items;
}

export async function getAlbums(
  accessToken: string,
  ids: string[]
): Promise<SpotifyAlbumsResponse> {
  return getSpotifyData<SpotifyAlbumsResponse>(
    accessToken,
    "https://api.spotify.com/v1/albums",
    { ids: ids.join(",") }
  );
}

export async function getArtists(
  accessToken: string,
  ids: string[]
): Promise<SpotifyArtistsResponse> {
  return getSpotifyData<SpotifyArtistsResponse>(
    accessToken,
    "https://api.spotify.com/v1/artists",
    { ids: ids.join(",") }
  );
}

export async function getTracks(
  accessToken: string,
  ids: string[]
): Promise<SpotifyTracksResponse> {
  return getSpotifyData<SpotifyTracksResponse>(
    accessToken,
    "https://api.spotify.com/v1/tracks",
    { ids: ids.join(",") }
  );
}

export async function getGenres(
  accessToken: string
): Promise<SpotifyGenresResponse> {
  return getSpotifyData<SpotifyGenresResponse>(
    accessToken,
    "https://api.spotify.com/v1/recommendations/available-genre-seeds"
  );
}

export async function getRecentlyPlayed(
  accessToken: string,
  params?: RecentlyPlayedParams
): Promise<SpotifyRecentlyPlayedResponse> {
  const queryParams: Record<string, string | number> = {};

  if (params?.limit !== undefined) {
    queryParams.limit = params.limit;
  }
  if (params?.after !== undefined) {
    queryParams.after = params.after;
  }
  if (params?.before !== undefined) {
    queryParams.before = params.before;
  }

  return getSpotifyData<SpotifyRecentlyPlayedResponse>(
    accessToken,
    "https://api.spotify.com/v1/me/player/recently-played",
    Object.keys(queryParams).length > 0 ? queryParams : undefined
  );
}

