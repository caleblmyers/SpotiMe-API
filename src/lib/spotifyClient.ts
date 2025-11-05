import axios from "axios";
import { TimeRange, SpotifyTrack, SpotifyArtist } from "../types/spotify";

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = "short_term",
  limit = 20,
  offset = 0
): Promise<SpotifyTrack[]> {
  const res = await axios.get<SpotifyTopTracksResponse>(
    "https://api.spotify.com/v1/me/top/tracks",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit, time_range: timeRange, offset },
    }
  );
  return res.data.items;
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = "short_term",
  limit = 20,
  offset = 0
): Promise<SpotifyArtist[]> {
  const res = await axios.get<SpotifyTopArtistsResponse>(
    "https://api.spotify.com/v1/me/top/artists",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit, time_range: timeRange, offset },
    }
  );
  return res.data.items;
}

export async function getUserProfile(accessToken: string) {
  const res = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

