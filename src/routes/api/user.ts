import { Router, Request, Response } from "express";
import { getUserProfile } from "../../lib/spotifyClient";
import { requireSpotifyAuth, SpotifyAuthRequest } from "../../middleware/spotifyAuth";
import { handleTokenRefresh } from "../../utils/tokenRefresh";
import { handleRouteError } from "../../utils/routeErrorHandler";
import { transformUser } from "../../utils/transformers";
import { SpotifyUser } from "../../types/spotify";
import prisma from "../../utils/prisma";

const router = Router();

// Get current user profile from Spotify
router.get("/me", requireSpotifyAuth, async (req: Request, res: Response) => {
  try {
    const { accessToken, spotifyId } = req as SpotifyAuthRequest;

    // Fetch user profile from Spotify with automatic token refresh
    const spotifyProfile = await handleTokenRefresh(
      spotifyId || null,
      accessToken,
      (token) => getUserProfile(token)
    );

    // Return only specified fields
    const user: SpotifyUser = transformUser(spotifyProfile);

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

export default router;

