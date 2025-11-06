import { Response } from "express";

/**
 * Handle common route errors for Spotify API routes
 */
export function handleRouteError(
  res: Response,
  err: unknown,
  endpointName: string
): void {
  if (
    err instanceof Error &&
    err.message === "Spotify access token expired and refresh failed"
  ) {
    res.status(401).json({
      error: err.message,
      message: "Please reconnect your Spotify account",
    });
    return;
  }

  if (err instanceof Error && err.message.includes("Unauthorized")) {
    res.status(401).json({ error: "Invalid or expired Spotify token" });
    return;
  }

  console.error(`Error in ${endpointName} endpoint:`, err);
  res.status(500).json({ error: `Failed to fetch ${endpointName.replace("/api/", "")}` });
}

