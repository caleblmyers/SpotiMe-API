import {
  SPOTIFY_LIMIT_MIN,
  SPOTIFY_LIMIT_MAX,
  SPOTIFY_OFFSET_MIN,
  SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX,
} from "../constants/spotify";

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationValidationResult {
  valid: boolean;
  error?: string;
  params?: PaginationParams;
}

/**
 * Parse a numeric query parameter
 */
function parseNumericParam(
  value: unknown,
  defaultValue: number
): number | null {
  if (value === undefined) return defaultValue;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Validate and parse pagination query parameters (limit and offset)
 */
export function validatePaginationParams(
  limit: unknown,
  offset: unknown,
  defaultLimit: number,
  maxLimit: number = SPOTIFY_LIMIT_MAX
): PaginationValidationResult {
  const limitNum = parseNumericParam(limit, defaultLimit);
  if (
    limitNum === null ||
    limitNum < SPOTIFY_LIMIT_MIN ||
    limitNum > maxLimit
  ) {
    return {
      valid: false,
      error: `Invalid limit. Must be between ${SPOTIFY_LIMIT_MIN} and ${maxLimit}`,
    };
  }

  const offsetNum = parseNumericParam(offset, 0);
  if (offsetNum === null || offsetNum < SPOTIFY_OFFSET_MIN) {
    return {
      valid: false,
      error: `Invalid offset. Must be ${SPOTIFY_OFFSET_MIN} or greater`,
    };
  }

  return {
    valid: true,
    params: {
      limit: limitNum,
      offset: offsetNum,
    },
  };
}

/**
 * Validate pagination params specifically for playlist tracks (supports up to 100)
 */
export function validatePlaylistTracksPaginationParams(
  limit: unknown,
  offset: unknown,
  defaultLimit: number = 100
): PaginationValidationResult {
  return validatePaginationParams(limit, offset, defaultLimit, SPOTIFY_PLAYLIST_TRACKS_LIMIT_MAX);
}

