import axios from "axios";

export async function refreshSpotifyToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await axios.post<{ access_token: string }>(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res.data.access_token;
}