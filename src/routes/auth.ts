import { Router } from "express";
import axios from "axios";
import prisma from "../utils/prisma";
import { getUserProfile } from "../lib/spotifyClient";

const router = Router();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error("Missing required Spotify environment variables");
}

/**
 * Get current user profile from Spotify token
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No Spotify access token provided" });
    }

    const accessToken = authHeader.substring(7);

    // Get user profile from Spotify
    const spotifyProfile = await getUserProfile(accessToken);

    // Find or get user from database
    const user = await prisma.user.findUnique({
      where: { spotifyId: spotifyProfile.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found. Please connect your Spotify account first." });
    }

    res.json({
      id: user.id,
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      email: user.email,
      country: user.country,
    });
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number } };
    if (axiosError.response?.status === 401) {
      return res.status(401).json({ error: "Invalid or expired Spotify token" });
    }
    console.error("Error in /me endpoint:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get Spotify OAuth authorization URL
 */
router.get("/login-spotify", async (req, res) => {
  try {
    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "Spotify OAuth not configured" });
    }

    const scope = "user-top-read user-read-recently-played playlist-read-private playlist-read-collaborative";
    const url =
      "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope,
        redirect_uri: redirectUri,
      });

    res.json({ url });
  } catch (err) {
    console.error("Error in login-spotify endpoint:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle Spotify OAuth callback
 * Creates or updates user based on Spotify profile
 * Returns tokens for frontend to store in localStorage
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  // Handle Spotify OAuth errors
  if (error) {
    console.error("Spotify OAuth error:", error);
    return res.redirect(
      `${process.env.BASE_APP_URL || "http://localhost:5173"}/login?error=${error}`
    );
  }

  if (!code) {
    return res.redirect(
      `${process.env.BASE_APP_URL || "http://localhost:5173"}/login?error=missing_code`
    );
  }

  try {
    if (!clientId || !clientSecret || !redirectUri) {
      return res.redirect(
        `${process.env.BASE_APP_URL || "http://localhost:5173"}/login?error=oauth_not_configured`
      );
    }

    // Exchange code for tokens
    const tokenRes = await axios.post<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
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

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Get Spotify user info
    const spotifyProfile = await getUserProfile(access_token);

    const spotifyId = spotifyProfile.id;
    const displayName = spotifyProfile.display_name;
    const email = spotifyProfile.email;
    const profileImageUrl = spotifyProfile.images?.[0]?.url;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // Find or create user based on Spotify ID
    const user = await prisma.user.upsert({
      where: { spotifyId },
      update: {
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        spotifyTokenExpiresAt: tokenExpiresAt,
        displayName: displayName || undefined,
        profileImageUrl: profileImageUrl || undefined,
        email: email || undefined,
      },
      create: {
        spotifyId,
        email: email || undefined,
        displayName: displayName || undefined,
        profileImageUrl: profileImageUrl || undefined,
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        spotifyTokenExpiresAt: tokenExpiresAt,
      },
    });

    console.log("Spotify authentication successful");

    // Redirect to frontend with tokens in URL hash (for localStorage)
    // Frontend will extract these and store in localStorage, then redirect to dashboard
    const baseAppUrl = process.env.BASE_APP_URL || "http://localhost:5173";
    const tokens = {
      access_token,
      refresh_token,
      expires_in,
      user: {
        id: user.id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
      },
    };

    // Encode tokens as base64 for URL (or use query params)
    const tokensParam = Buffer.from(JSON.stringify(tokens)).toString("base64");
    res.redirect(`${baseAppUrl}/auth/callback?tokens=${encodeURIComponent(tokensParam)}`);
  } catch (err: unknown) {
    console.error("Error in Spotify callback:", err);
    const axiosError = err as { response?: { data?: { error?: string } } };
    const errorMessage = axiosError.response?.data?.error || "unknown_error";
    res.redirect(
      `${process.env.BASE_APP_URL || "http://localhost:5173"}/login?error=${errorMessage}`
    );
  }
});

/**
 * Refresh Spotify access token
 * Frontend can call this with refresh_token from localStorage
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Spotify OAuth not configured" });
    }

    const tokenRes = await axios.post<{
      access_token: string;
      expires_in: number;
    }>(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
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

    const { access_token, expires_in } = tokenRes.data;

    // Update user's token in database if we can find them
    try {
      const spotifyProfile = await getUserProfile(access_token);
      await prisma.user.updateMany({
        where: { spotifyId: spotifyProfile.id },
        data: {
          spotifyAccessToken: access_token,
          spotifyTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      });
    } catch {
      // If user lookup fails, still return the token (frontend has it)
    }

    res.json({
      access_token,
      expires_in,
    });
  } catch (err: unknown) {
    console.error("Error refreshing token:", err);
    const axiosError = err as { response?: { status?: number; data?: { error?: string } } };
    if (axiosError.response?.status === 400) {
      return res.status(401).json({
        error: "Invalid refresh token",
        message: "Please reconnect your Spotify account",
      });
    }
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

export default router;
