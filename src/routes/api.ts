import { Router } from "express";
import {
  getUserProfile,
  getTopTracks,
  getTopArtists,
  getAlbums,
  getGenres,
} from "../lib/spotifyClient";
import { extractSpotifyToken } from "../middleware/auth";
import { validateSpotifyQueryParams } from "../utils/validation";
import { handleTokenRefresh } from "../utils/tokenRefresh";
import { handleRouteError } from "../utils/routeErrorHandler";
import {
  SpotifyUser,
  SpotifyTrack,
  SpotifyArtist,
  SpotifyAlbum,
} from "../types/spotify";
import prisma from "../utils/prisma";

const router = Router();

// Get current user profile from Spotify
router.get("/me", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "No Spotify access token provided" });
    }

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch user profile from Spotify with automatic token refresh
    const spotifyProfile = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getUserProfile(token)
    );

    // Return only specified fields
    const user: SpotifyUser = {
      id: spotifyProfile.id,
      display_name: spotifyProfile.display_name || "",
      email: spotifyProfile.email || "",
      external_urls: spotifyProfile.external_urls || { spotify: "" },
      followers: spotifyProfile.followers || { total: 0 },
      images: spotifyProfile.images || [],
    };

    // Update database if user exists
    try {
      if (spotifyProfile.id) {
        await prisma.user.upsert({
          where: { spotifyId: spotifyProfile.id },
          update: {
            displayName: user.display_name || undefined,
            email: user.email || undefined,
            profileImageUrl: user.images?.[0]?.url || undefined,
          },
          create: {
            spotifyId: spotifyProfile.id,
            displayName: user.display_name || undefined,
            email: user.email || undefined,
            profileImageUrl: user.images?.[0]?.url || undefined,
          },
        });
      }
    } catch (dbError) {
      // Log but don't fail the request if DB update fails
      console.error("Error updating user in database:", dbError);
    }

    res.json(user);
  } catch (err) {
    handleRouteError(res, err, "/api/me");
  }
});

// Get top tracks
router.get("/top-tracks", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "No Spotify access token provided" });
    }

    // Validate query parameters
    const validation = validateSpotifyQueryParams(
      req.query.time_range || "short_term",
      req.query.limit || 20,
      req.query.offset || 0
    );

    if (!validation.valid || !validation.params) {
      return res.status(400).json({ error: validation.error });
    }

    const { timeRange, limit, offset } = validation.params;

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch top tracks with automatic token refresh
    const tracks = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getTopTracks(token, timeRange, limit, offset)
    );

    // Return only specified fields
    const transformedTracks: SpotifyTrack[] = tracks.map((track) => ({
      album: track.album,
      artists: track.artists,
      duration_ms: track.duration_ms,
      external_urls: track.external_urls,
      id: track.id,
      name: track.name,
      popularity: track.popularity,
      track_number: track.track_number,
    }));

    res.json(transformedTracks);
  } catch (err) {
    handleRouteError(res, err, "/api/top-tracks");
  }
});

// Get top artists
router.get("/top-artists", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "No Spotify access token provided" });
    }

    // Validate query parameters
    const validation = validateSpotifyQueryParams(
      req.query.time_range || "short_term",
      req.query.limit || 20,
      req.query.offset || 0
    );

    if (!validation.valid || !validation.params) {
      return res.status(400).json({ error: validation.error });
    }

    const { timeRange, limit, offset } = validation.params;

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch top artists with automatic token refresh
    const artists = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getTopArtists(token, timeRange, limit, offset)
    );

    // Return only specified fields
    const transformedArtists: SpotifyArtist[] = artists.map((artist) => ({
      external_urls: artist.external_urls,
      genres: artist.genres,
      id: artist.id,
      images: artist.images,
      name: artist.name,
      popularity: artist.popularity,
      followers: artist.followers,
    }));

    res.json(transformedArtists);
  } catch (err) {
    handleRouteError(res, err, "/api/top-artists");
  }
});

// Get albums by IDs
router.get("/albums", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "No Spotify access token provided" });
    }

    const ids = req.query.ids as string;

    if (!ids) {
      return res.status(400).json({ error: "ids query parameter is required" });
    }

    // Split comma-separated IDs and validate
    const albumIds = ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (albumIds.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one album ID is required" });
    }

    if (albumIds.length > 20) {
      return res.status(400).json({ error: "Maximum 20 album IDs allowed" });
    }

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch albums with automatic token refresh
    const albumsResponse = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getAlbums(token, albumIds)
    );

    // Return only specified fields for each album
    const transformedAlbums: SpotifyAlbum[] = albumsResponse.albums.map(
      (album) => ({
        album_type: album.album_type,
        total_tracks: album.total_tracks,
        external_urls: album.external_urls,
        id: album.id,
        images: album.images,
        name: album.name,
        release_date: album.release_date,
        artists: album.artists,
        tracks: album.tracks,
        genres: album.genres,
        label: album.label,
        popularity: album.popularity,
      })
    );

    res.json(transformedAlbums);
  } catch (err) {
    handleRouteError(res, err, "/api/albums");
  }
});

// Get available genres
router.get("/genres", async (req, res) => {
  try {
    const accessToken = extractSpotifyToken(req);

    if (!accessToken) {
      return res
        .status(401)
        .json({ error: "No Spotify access token provided" });
    }

    // Optional spotifyId from header (for token refresh)
    const spotifyId = req.headers["x-spotify-id"] as string | undefined;

    // Fetch genres with automatic token refresh
    const genresResponse = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getGenres(token)
    );

    res.json(genresResponse.genres);
  } catch (err) {
    handleRouteError(res, err, "/api/genres");
  }
});

export default router;
