import { Router } from "express";
import axios from "axios";
import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, verifyToken } from "../utils/jwt";

const router = Router();

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

router.get("/me", async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token and extract userId
    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err: any) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Error in /me endpoint:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Check if user exists and has password (not Spotify-only)
  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  console.log("Login successful");
  res.json({ accessToken, refreshToken, user });
});

router.post("/signup", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      password: hashedPassword,
      displayName: req.body.email,
    },
  });

  console.log("Signup successful");
  res.json(user);
});

// Step 1: get Spotify auth URL (frontend will navigate to it)
router.get("/login-spotify", async (req, res) => {
  const userId = req.query.id as string;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scope = "user-top-read";
    const url =
      "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope,
        redirect_uri: redirectUri,
        state: userId, // Pass userId through state parameter
      });
    
    // Return URL as JSON instead of redirecting
    // Frontend should navigate to this URL: window.location.href = response.url\
    console.log('navigating to spotify auth url')
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Step 2: handle callback
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string; // userId from state parameter
  const error = req.query.error as string;

  // Handle Spotify OAuth errors
  if (error) {
    console.error("Spotify OAuth error:", error);
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard?spotify_error=${error}`
    );
  }

  if (!code || !state) {
    return res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard?spotify_error=missing_code_or_state`
    );
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: state },
    });

    if (!user) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/dashboard?spotify_error=user_not_found`
      );
    }

    // Exchange code for tokens
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            clientId + ":" + clientSecret
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Get Spotify user info
    const meRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const spotifyId = meRes.data.id;
    const displayName = meRes.data.display_name;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // Update existing user with Spotify token info
    await prisma.user.update({
      where: { id: state },
      data: {
        spotifyId,
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        spotifyTokenExpiresAt: tokenExpiresAt,
        displayName: displayName || user.displayName,
        profileImageUrl: meRes.data.images?.[0]?.url || user.profileImageUrl,
      },
    });
    // Redirect to frontend with success
    console.log("Spotify connected successfully");
    res.json({ message: "Spotify connected successfully" });
  } catch (err: any) {
    console.error("Error in Spotify callback:", err);
    const errorMessage = err.response?.data?.error || "unknown_error";
    res.redirect(
      `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard?spotify_error=${errorMessage}`
    );
  }
});

export default router;
