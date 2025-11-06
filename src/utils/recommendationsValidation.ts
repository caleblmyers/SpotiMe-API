import {
  RECOMMENDATIONS_LIMIT_MIN,
  RECOMMENDATIONS_LIMIT_MAX,
  RECOMMENDATIONS_SEED_MAX,
} from "../constants/spotify";

export interface RecommendationsParams {
  seed_artists?: string[];
  seed_genres?: string[];
  seed_tracks?: string[];
  limit?: number;
  market?: string;
  // Tuneable track attributes
  min_acousticness?: number;
  max_acousticness?: number;
  target_acousticness?: number;
  min_danceability?: number;
  max_danceability?: number;
  target_danceability?: number;
  min_duration_ms?: number;
  max_duration_ms?: number;
  target_duration_ms?: number;
  min_energy?: number;
  max_energy?: number;
  target_energy?: number;
  min_instrumentalness?: number;
  max_instrumentalness?: number;
  target_instrumentalness?: number;
  min_key?: number;
  max_key?: number;
  target_key?: number;
  min_liveness?: number;
  max_liveness?: number;
  target_liveness?: number;
  min_loudness?: number;
  max_loudness?: number;
  target_loudness?: number;
  min_mode?: number;
  max_mode?: number;
  target_mode?: number;
  min_popularity?: number;
  max_popularity?: number;
  target_popularity?: number;
  min_speechiness?: number;
  max_speechiness?: number;
  target_speechiness?: number;
  min_tempo?: number;
  max_tempo?: number;
  target_tempo?: number;
  min_time_signature?: number;
  max_time_signature?: number;
  target_time_signature?: number;
  min_valence?: number;
  max_valence?: number;
  target_valence?: number;
}

export interface RecommendationsValidationResult {
  valid: boolean;
  error?: string;
  params?: RecommendationsParams;
}

/**
 * Parse comma-separated seed values
 */
function parseSeedIds(seedString: string | undefined): string[] | undefined {
  if (!seedString) return undefined;
  return seedString
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Validate and parse recommendations query parameters
 * At least one seed parameter (seed_artists, seed_genres, or seed_tracks) is required
 */
export function validateRecommendationsParams(
  query: Record<string, unknown>
): RecommendationsValidationResult {
  const params: RecommendationsParams = {};

  // Parse seed parameters
  const seedArtists = parseSeedIds(query.seed_artists as string | undefined);
  const seedGenres = parseSeedIds(query.seed_genres as string | undefined);
  const seedTracks = parseSeedIds(query.seed_tracks as string | undefined);

  // At least one seed is required
  if (!seedArtists && !seedGenres && !seedTracks) {
    return {
      valid: false,
      error:
        "At least one seed parameter is required: seed_artists, seed_genres, or seed_tracks",
    };
  }

  // Validate seed counts
  if (seedArtists && seedArtists.length > RECOMMENDATIONS_SEED_MAX) {
    return {
      valid: false,
      error: `Maximum ${RECOMMENDATIONS_SEED_MAX} seed artists allowed`,
    };
  }
  if (seedGenres && seedGenres.length > RECOMMENDATIONS_SEED_MAX) {
    return {
      valid: false,
      error: `Maximum ${RECOMMENDATIONS_SEED_MAX} seed genres allowed`,
    };
  }
  if (seedTracks && seedTracks.length > RECOMMENDATIONS_SEED_MAX) {
    return {
      valid: false,
      error: `Maximum ${RECOMMENDATIONS_SEED_MAX} seed tracks allowed`,
    };
  }

  // Total seeds cannot exceed 5
  const totalSeeds =
    (seedArtists?.length || 0) +
    (seedGenres?.length || 0) +
    (seedTracks?.length || 0);
  if (totalSeeds > RECOMMENDATIONS_SEED_MAX) {
    return {
      valid: false,
      error: `Total number of seeds cannot exceed ${RECOMMENDATIONS_SEED_MAX}`,
    };
  }

  if (seedArtists) params.seed_artists = seedArtists;
  if (seedGenres) params.seed_genres = seedGenres;
  if (seedTracks) params.seed_tracks = seedTracks;

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
      limitNum < RECOMMENDATIONS_LIMIT_MIN ||
      limitNum > RECOMMENDATIONS_LIMIT_MAX
    ) {
      return {
        valid: false,
        error: `Invalid limit. Must be between ${RECOMMENDATIONS_LIMIT_MIN} and ${RECOMMENDATIONS_LIMIT_MAX}`,
      };
    }
    params.limit = limitNum;
  }

  // Validate market (ISO 3166-1 alpha-2 country code)
  if (query.market !== undefined) {
    if (typeof query.market !== "string" || query.market.length !== 2) {
      return {
        valid: false,
        error: "Invalid market. Must be a 2-letter ISO 3166-1 alpha-2 country code",
      };
    }
    params.market = query.market.toUpperCase();
  }

  // Validate tuneable attributes (0.0 to 1.0 for most, except specific ranges)
  const tuneableAttributes = [
    "acousticness",
    "danceability",
    "energy",
    "instrumentalness",
    "liveness",
    "speechiness",
    "valence",
  ];

  for (const attr of tuneableAttributes) {
    for (const prefix of ["min_", "max_", "target_"]) {
      const key = `${prefix}${attr}` as keyof typeof query;
      if (query[key] !== undefined) {
        const value =
          typeof query[key] === "string"
            ? parseFloat(query[key] as string)
            : typeof query[key] === "number"
            ? query[key]
            : null;
        if (value === null || isNaN(value) || value < 0 || value > 1) {
          return {
            valid: false,
            error: `Invalid ${key}. Must be a number between 0.0 and 1.0`,
          };
        }
        (params as Record<string, number>)[key] = value;
      }
    }
  }

  // Validate duration_ms (in milliseconds)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}duration_ms` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseInt(query[key] as string, 10)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < 0) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a positive number (milliseconds)`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate key (0-11, representing musical keys)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}key` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseInt(query[key] as string, 10)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < 0 || value > 11) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a number between 0 and 11`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate loudness (typically -60 to 0 dB)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}loudness` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseFloat(query[key] as string)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < -60 || value > 0) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a number between -60 and 0`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate mode (0 or 1)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}mode` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseInt(query[key] as string, 10)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || (value !== 0 && value !== 1)) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be 0 or 1`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate popularity (0-100)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}popularity` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseInt(query[key] as string, 10)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < 0 || value > 100) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a number between 0 and 100`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate tempo (BPM, typically 0-300)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}tempo` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseFloat(query[key] as string)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < 0) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a positive number (BPM)`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  // Validate time_signature (typically 3-7)
  for (const prefix of ["min_", "max_", "target_"]) {
    const key = `${prefix}time_signature` as keyof typeof query;
    if (query[key] !== undefined) {
      const value =
        typeof query[key] === "string"
          ? parseInt(query[key] as string, 10)
          : typeof query[key] === "number"
          ? query[key]
          : null;
      if (value === null || isNaN(value) || value < 3 || value > 7) {
        return {
          valid: false,
          error: `Invalid ${key}. Must be a number between 3 and 7`,
        };
      }
      (params as Record<string, number>)[key] = value;
    }
  }

  return {
    valid: true,
    params,
  };
}

