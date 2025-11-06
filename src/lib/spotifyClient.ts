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
  SpotifyAudioFeaturesResponse,
  SpotifyAudioFeaturesResponseArray,
  SpotifyRecommendationsResponse,
  SpotifyRecentlyPlayedResponse,
} from "../types/spotify";
import { RecommendationsParams } from "../utils/recommendationsValidation";
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

export async function getAudioFeatures(
  accessToken: string,
  trackId: string
): Promise<SpotifyAudioFeaturesResponse> {
  return getSpotifyData<SpotifyAudioFeaturesResponse>(
    accessToken,
    `https://api.spotify.com/v1/audio-features/${trackId}`
  );
}

export async function getAudioFeaturesMultiple(
  accessToken: string,
  trackIds: string[]
): Promise<SpotifyAudioFeaturesResponseArray> {
  return getSpotifyData<SpotifyAudioFeaturesResponseArray>(
    accessToken,
    "https://api.spotify.com/v1/audio-features",
    { ids: trackIds.join(",") }
  );
}

export async function getRecommendations(
  accessToken: string,
  params: RecommendationsParams
): Promise<SpotifyRecommendationsResponse> {
  // Build query parameters
  const queryParams: Record<string, string | number> = {};

  if (params.seed_artists) {
    queryParams.seed_artists = params.seed_artists.join(",");
  }
  if (params.seed_genres) {
    queryParams.seed_genres = params.seed_genres.join(",");
  }
  if (params.seed_tracks) {
    queryParams.seed_tracks = params.seed_tracks.join(",");
  }
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }
  if (params.market) {
    queryParams.market = params.market;
  }

  // Add all tuneable attributes
  const tuneableKeys = [
    "min_acousticness",
    "max_acousticness",
    "target_acousticness",
    "min_danceability",
    "max_danceability",
    "target_danceability",
    "min_duration_ms",
    "max_duration_ms",
    "target_duration_ms",
    "min_energy",
    "max_energy",
    "target_energy",
    "min_instrumentalness",
    "max_instrumentalness",
    "target_instrumentalness",
    "min_key",
    "max_key",
    "target_key",
    "min_liveness",
    "max_liveness",
    "target_liveness",
    "min_loudness",
    "max_loudness",
    "target_loudness",
    "min_mode",
    "max_mode",
    "target_mode",
    "min_popularity",
    "max_popularity",
    "target_popularity",
    "min_speechiness",
    "max_speechiness",
    "target_speechiness",
    "min_tempo",
    "max_tempo",
    "target_tempo",
    "min_time_signature",
    "max_time_signature",
    "target_time_signature",
    "min_valence",
    "max_valence",
    "target_valence",
  ];

  for (const key of tuneableKeys) {
    const value = (params as Record<string, number | undefined>)[key];
    if (value !== undefined) {
      queryParams[key] = value;
    }
  }

  return getSpotifyData<SpotifyRecommendationsResponse>(
    accessToken,
    "https://api.spotify.com/v1/recommendations",
    queryParams
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

