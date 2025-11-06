import {
  SpotifyUserResponse,
  SpotifyTrackResponse,
  SpotifyArtistResponse,
  SpotifyAlbumResponse,
  SpotifyUser,
  SpotifyTrack,
  SpotifyArtist,
  SpotifyAlbum,
} from "../types/spotify";

/**
 * Transform Spotify user response to clean user object
 */
export function transformUser(profile: SpotifyUserResponse): SpotifyUser {
  return {
    id: profile.id,
    display_name: profile.display_name || "",
    email: profile.email || "",
    external_urls: profile.external_urls || { spotify: "" },
    followers: profile.followers || { total: 0 },
    images: profile.images || [],
  };
}

/**
 * Transform Spotify track response to clean track object
 */
export function transformTrack(track: SpotifyTrackResponse): SpotifyTrack {
  return {
    album: track.album,
    artists: track.artists,
    duration_ms: track.duration_ms,
    external_urls: track.external_urls,
    id: track.id,
    name: track.name,
    popularity: track.popularity,
    track_number: track.track_number,
  };
}

/**
 * Transform Spotify artist response to clean artist object
 */
export function transformArtist(artist: SpotifyArtistResponse): SpotifyArtist {
  return {
    external_urls: artist.external_urls,
    genres: artist.genres,
    id: artist.id,
    images: artist.images,
    name: artist.name,
    popularity: artist.popularity,
    followers: artist.followers,
  };
}

/**
 * Transform Spotify album response to clean album object
 */
export function transformAlbum(album: SpotifyAlbumResponse): SpotifyAlbum {
  return {
    album_type: album.album_type,
    total_tracks: album.total_tracks,
    external_urls: album.external_urls,
    id: album.id,
    images: album.images,
    name: album.name,
    release_date: album.release_date,
    artists: album.artists,
    tracks: album.tracks,
    genres: album.genres,
    label: album.label,
    popularity: album.popularity,
  };
}

