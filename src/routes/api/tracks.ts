import { Router, Request, Response } from "express";
import {
  getTopTracks,
  getTracks,
  getAudioFeatures,
  getAudioFeaturesMultiple,
} from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateSpotifyQueryParams } from "../../utils/validation";
import { validateIds } from "../../utils/idValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import {
  transformTrack,
  transformAudioFeatures,
} from "../../utils/transformers";
import { SpotifyTrack, SpotifyAudioFeatures } from "../../types/spotify";

const router = Router();

// Get top tracks
router.get(
  "/top-tracks",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

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

      // Fetch top tracks with automatic token refresh
      const tracks = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getTopTracks(token, timeRange, limit, offset)
      );

      // Fetch audio features for all tracks
      const trackIds = tracks.map((track) => track.id);
      let audioFeaturesMap: Map<string, SpotifyAudioFeatures> = new Map();

      if (trackIds.length > 0) {
        try {
          const audioFeaturesResponse = await handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getAudioFeaturesMultiple(token, trackIds)
          );

          audioFeaturesResponse.audio_features.forEach((features) => {
            if (features) {
              audioFeaturesMap.set(
                features.id,
                transformAudioFeatures(features)
              );
            }
          });
        } catch (err) {
          // If audio features fetch fails, continue without them
          console.error("Error fetching audio features:", err);
        }
      }

      // Return only specified fields with audio features
      const transformedTracks: SpotifyTrack[] = tracks.map((track) =>
        transformTrack(track, audioFeaturesMap.get(track.id))
      );

      res.json(transformedTracks);
    } catch (err) {
      handleRouteError(res, err, "/api/top-tracks");
    }
  }
);

// Get tracks by IDs
router.get(
  "/tracks",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      const validation = validateIds(req.query.ids as string, 50, "track");

      if (!validation.valid || !validation.ids) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch tracks with automatic token refresh
      const tracksResponse = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getTracks(token, validation.ids!)
      );

      // Fetch audio features for all tracks
      const trackIds = tracksResponse.tracks.map((track) => track.id);
      let audioFeaturesMap: Map<string, SpotifyAudioFeatures> = new Map();

      if (trackIds.length > 0) {
        try {
          const audioFeaturesResponse = await handleTokenRefresh(
            spotifyId || null,
            accessToken,
            (token) => getAudioFeaturesMultiple(token, trackIds)
          );

          audioFeaturesResponse.audio_features.forEach((features) => {
            if (features) {
              audioFeaturesMap.set(
                features.id,
                transformAudioFeatures(features)
              );
            }
          });
        } catch (err) {
          // If audio features fetch fails, continue without them
          console.error("Error fetching audio features:", err);
        }
      }

      // Return only specified fields for each track with audio features
      const transformedTracks: SpotifyTrack[] = tracksResponse.tracks.map(
        (track) => transformTrack(track, audioFeaturesMap.get(track.id))
      );

      res.json(transformedTracks);
    } catch (err) {
      handleRouteError(res, err, "/api/tracks");
    }
  }
);

// Get audio features for a track by ID
router.get(
  "/audio-features/:id",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;
      const trackId = req.params.id;

      if (!trackId) {
        return res.status(400).json({ error: "Track ID is required" });
      }

      // Fetch audio features with automatic token refresh
      const audioFeatures = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getAudioFeatures(token, trackId)
      );

      // Return only specified fields
      const transformedFeatures = transformAudioFeatures(audioFeatures);

      res.json(transformedFeatures);
    } catch (err) {
      handleRouteError(res, err, "/api/audio-features/:id");
    }
  }
);

export default router;

