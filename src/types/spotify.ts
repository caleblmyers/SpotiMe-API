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

export interface SpotifyGenresResponse {
  genres: string[];
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

