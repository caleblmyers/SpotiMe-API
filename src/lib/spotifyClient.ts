import axios from "axios";

export async function getTopTracks(
  accessToken: string,
  timeRange = "short_term",
  limit = 20
) {
  const res = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit, time_range: timeRange },
  });
  return res.data.items;
}

export async function getTopArtists(
  accessToken: string,
  timeRange = "short_term",
  limit = 20
) {
  const res = await axios.get("https://api.spotify.com/v1/me/top/artists", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit, time_range: timeRange },
  });
  return res.data.items;
}

export async function getUserProfile(accessToken: string) {
  const res = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

