import { TimeRange } from "../types/spotify";

export const VALID_TIME_RANGES: TimeRange[] = [
  "short_term",
  "medium_term",
  "long_term",
];

export const SPOTIFY_LIMIT_MIN = 1;
export const SPOTIFY_LIMIT_MAX = 50;
export const SPOTIFY_OFFSET_MIN = 0;

export const SPOTIFY_TOKEN_EXPIRY_MS = 3600 * 1000; // 1 hour

