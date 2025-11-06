import { SPOTIFY_LIMIT_MIN, SPOTIFY_LIMIT_MAX } from "../constants/spotify";

export interface RecentlyPlayedParams {
  limit?: number;
  after?: number; // Unix timestamp in milliseconds
  before?: number; // Unix timestamp in milliseconds
}

export interface RecentlyPlayedValidationResult {
  valid: boolean;
  error?: string;
  params?: RecentlyPlayedParams;
}

/**
 * Validate and parse recently played query parameters
 */
export function validateRecentlyPlayedParams(
  query: Record<string, unknown>
): RecentlyPlayedValidationResult {
  const params: RecentlyPlayedParams = {};

  // Validate limit
  if (query.limit !== undefined) {
    const limitNum =
      typeof query.limit === "string"
        ? parseInt(query.limit, 10)
        : typeof query.limit === "number"
        ? query.limit
        : null;
    if (
      limitNum === null ||
      isNaN(limitNum) ||
      limitNum < SPOTIFY_LIMIT_MIN ||
      limitNum > SPOTIFY_LIMIT_MAX
    ) {
      return {
        valid: false,
        error: `Invalid limit. Must be between ${SPOTIFY_LIMIT_MIN} and ${SPOTIFY_LIMIT_MAX}`,
      };
    }
    params.limit = limitNum;
  }

  // Validate after (Unix timestamp in milliseconds)
  if (query.after !== undefined) {
    const afterNum =
      typeof query.after === "string"
        ? parseInt(query.after, 10)
        : typeof query.after === "number"
        ? query.after
        : null;
    if (afterNum === null || isNaN(afterNum) || afterNum < 0) {
      return {
        valid: false,
        error: "Invalid after. Must be a valid Unix timestamp in milliseconds",
      };
    }
    params.after = afterNum;
  }

  // Validate before (Unix timestamp in milliseconds)
  if (query.before !== undefined) {
    const beforeNum =
      typeof query.before === "string"
        ? parseInt(query.before, 10)
        : typeof query.before === "number"
        ? query.before
        : null;
    if (beforeNum === null || isNaN(beforeNum) || beforeNum < 0) {
      return {
        valid: false,
        error: "Invalid before. Must be a valid Unix timestamp in milliseconds",
      };
    }
    params.before = beforeNum;
  }

  // after and before are mutually exclusive
  if (params.after !== undefined && params.before !== undefined) {
    return {
      valid: false,
      error: "after and before parameters cannot be used together",
    };
  }

  return {
    valid: true,
    params,
  };
}

