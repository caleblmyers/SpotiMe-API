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

export interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string | null;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  owner: {
    id: string;
    display_name: string | null;
    external_urls: {
      spotify: string;
    };
  };
  public: boolean;
  collaborative: boolean;
  tracks: {
    href: string;
    total: number;
  };
  followers: {
    total: number;
  };
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylistResponse[];
  next: string | null;
  previous: string | null;
  total: number;
  limit: number;
  offset: number;
}

export interface SpotifyPlaylistTrackItem {
  added_at: string;
  added_by: {
    id: string | null;
    external_urls: {
      spotify: string;
    } | null;
  } | null;
  track: SpotifyTrackResponse | null;
  is_local: boolean;
}

export interface SpotifyPlaylistTracksResponse {
  items: SpotifyPlaylistTrackItem[];
  next: string | null;
  previous: string | null;
  total: number;
  limit: number;
  offset: number;
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

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  owner: {
    id: string;
    display_name: string | null;
    external_urls: {
      spotify: string;
    };
  };
  public: boolean;
  collaborative: boolean;
  tracks: {
    href: string;
    total: number;
  };
  followers: {
    total: number;
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  added_by: {
    id: string | null;
    external_urls: {
      spotify: string;
    } | null;
  } | null;
  track: SpotifyTrack | null;
  is_local: boolean;
}

