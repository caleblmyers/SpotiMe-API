import { TimeRange } from "../types/spotify";
import { VALID_TIME_RANGES, SPOTIFY_LIMIT_MIN, SPOTIFY_LIMIT_MAX, SPOTIFY_OFFSET_MIN } from "../constants/spotify";

export interface QueryParams {
  timeRange: TimeRange;
  limit: number;
  offset: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  params?: QueryParams;
}

/**
 * Validate and parse Spotify API query parameters
 */
export function validateSpotifyQueryParams(
  timeRange: unknown,
  limit: unknown,
  offset: unknown
): ValidationResult {
  // Validate time_range
  if (typeof timeRange !== "string" || !VALID_TIME_RANGES.includes(timeRange as TimeRange)) {
    return {
      valid: false,
      error: "Invalid time_range. Must be one of: short_term, medium_term, long_term",
    };
  }

  // Validate limit
  const limitNum = typeof limit === "string" ? parseInt(limit, 10) : typeof limit === "number" ? limit : null;
  if (limitNum === null || isNaN(limitNum) || limitNum < SPOTIFY_LIMIT_MIN || limitNum > SPOTIFY_LIMIT_MAX) {
    return {
      valid: false,
      error: `Invalid limit. Must be between ${SPOTIFY_LIMIT_MIN} and ${SPOTIFY_LIMIT_MAX}`,
    };
  }

  // Validate offset
  const offsetNum = typeof offset === "string" ? parseInt(offset, 10) : typeof offset === "number" ? offset : null;
  if (offsetNum === null || isNaN(offsetNum) || offsetNum < SPOTIFY_OFFSET_MIN) {
    return {
      valid: false,
      error: `Invalid offset. Must be ${SPOTIFY_OFFSET_MIN} or greater`,
    };
  }

  return {
    valid: true,
    params: {
      timeRange: timeRange as TimeRange,
      limit: limitNum,
      offset: offsetNum,
    },
  };
}

