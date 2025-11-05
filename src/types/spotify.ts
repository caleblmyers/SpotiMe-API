// Spotify API response types
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  genres: string[];
  popularity: number;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

