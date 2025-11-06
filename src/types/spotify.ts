// Spotify API response types

export type TimeRange = "short_term" | "medium_term" | "long_term";

// Full Spotify API response types (what we get from API)
export interface SpotifyUserResponse {
  id: string;
  display_name: string;
  email: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export interface SpotifyTrackResponse {
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  id: string;
  name: string;
  popularity: number;
  track_number: number;
}

export interface SpotifyArtistResponse {
  external_urls: {
    spotify: string;
  };
  genres: string[];
  id: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  name: string;
  popularity: number;
  followers: {
    total: number;
  };
}

export interface SpotifyAlbumResponse {
  album_type: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  id: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  name: string;
  release_date: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  tracks: {
    items: Array<{
      id: string;
      name: string;
    }>;
  };
  genres: string[];
  label: string;
  popularity: number;
}

export interface SpotifyAlbumsResponse {
  albums: SpotifyAlbumResponse[];
}

export interface SpotifyArtistsResponse {
  artists: SpotifyArtistResponse[];
}

export interface SpotifyTracksResponse {
  tracks: SpotifyTrackResponse[];
}

export interface SpotifyGenresResponse {
  genres: string[];
}

export interface SpotifyAudioFeaturesResponse {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
  id: string;
  type: string;
  uri: string;
  track_href: string;
  analysis_url: string;
  duration_ms: number;
  key: number;
}

export interface SpotifyAudioFeaturesResponseArray {
  audio_features: (SpotifyAudioFeaturesResponse | null)[];
}

export interface SpotifyRecommendationsSeed {
  afterFilteringSize: number;
  afterRelinkingSize: number;
  href: string | null;
  id: string;
  initialPoolSize: number;
  type: "artist" | "track" | "genre";
}

export interface SpotifyRecommendationsResponse {
  seeds: SpotifyRecommendationsSeed[];
  tracks: SpotifyTrackResponse[];
}

export interface SpotifyPlayHistoryItem {
  track: SpotifyTrackResponse;
  played_at: string; // ISO 8601 timestamp
  context: {
    type: string;
    href: string | null;
    external_urls: {
      spotify: string;
    } | null;
    uri: string;
  } | null;
}

export interface SpotifyRecentlyPlayedResponse {
  items: SpotifyPlayHistoryItem[];
  next: string | null;
  cursors: {
    after: string | null;
    before: string | null;
  } | null;
}

// Clean response types (what we return to client)
export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  external_urls: {
    spotify: string;
  };
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export interface SpotifyAudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
}

export interface SpotifyTrack {
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  id: string;
  name: string;
  popularity: number;
  track_number: number;
  audioFeatures?: SpotifyAudioFeatures;
}

export interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  genres: string[];
  id: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  name: string;
  popularity: number;
  followers: {
    total: number;
  };
}

export interface SpotifyAlbum {
  album_type: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  id: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  name: string;
  release_date: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  tracks: {
    items: Array<{
      id: string;
      name: string;
    }>;
  };
  genres: string[];
  label: string;
  popularity: number;
}

export interface SpotifyPlayHistory {
  track: SpotifyTrack;
  played_at: string;
  context: {
    type: string;
    href: string | null;
    external_urls: {
      spotify: string;
    } | null;
    uri: string;
  } | null;
}

