import { Router, Request, Response } from "express";
import {
  getRecentlyPlayed,
  getAudioFeaturesMultiple,
} from "../../lib/spotifyClient";
import {
  requireSpotifyAuth,
  SpotifyAuthRequest,
} from "../../middleware/spotifyAuth";
import { validateRecentlyPlayedParams } from "../../utils/recentlyPlayedValidation";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import {
  transformTrack,
  transformAudioFeatures,
} from "../../utils/transformers";
import {
  SpotifyPlayHistory,
  SpotifyAudioFeatures,
} from "../../types/spotify";

const router = Router();

// Get recently played tracks
router.get(
  "/recently-played",
  requireSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, spotifyId } = req as SpotifyAuthRequest;

      // Validate query parameters
      const validation = validateRecentlyPlayedParams(req.query);

      if (!validation.valid || !validation.params) {
        return res.status(400).json({ error: validation.error });
      }

      // Fetch recently played tracks with automatic token refresh
      const recentlyPlayed = await handleTokenRefresh(
        spotifyId || null,
        accessToken,
        (token) => getRecentlyPlayed(token, validation.params)
      );

      // Fetch audio features for all tracks
      const trackIds = recentlyPlayed.items.map((item) => item.track.id);
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

      // Transform play history items with audio features
      const transformedItems: SpotifyPlayHistory[] = recentlyPlayed.items.map(
        (item) => ({
          track: transformTrack(
            item.track,
            audioFeaturesMap.get(item.track.id)
          ),
          played_at: item.played_at,
          context: item.context,
        })
      );

      res.json({
        items: transformedItems,
        next: recentlyPlayed.next,
        cursors: recentlyPlayed.cursors,
      });
    } catch (err) {
      handleRouteError(res, err, "/api/recently-played");
    }
  }
);

export default router;

