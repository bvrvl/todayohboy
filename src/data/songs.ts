import database from './catalog.json';

export type ArtStyle = 'pepper' | 'strawberry' | 'sun' | 'road' | 'rubber' | 'revolver';
export interface CatalogSong {
  id: string;
  title: string;
  kind: 'song' | 'score';
  primaryAlbumId: string;
  year: number;
  sourceUrl: string;
  writers: string | null;
  releaseText: string | null;
  producer: string | null;
  recordingDatesExcerpt: string | null;
  videoId: string | null;
  embedSourceUrl: string | null;
  sourceEmbedUrl: string | null;
  mediaStatus: 'sourced' | 'not-retrieved';
  retrievedAt: string;
}
export interface AlbumTrack {
  position: number;
  title: string;
  songId: string | null;
  kind: 'song' | 'score' | 'archive';
  version: string;
}
export interface Album {
  id: string;
  title: string;
  year: number;
  releaseText: string;
  sourceUrl: string;
  scope: 'core' | 'archive';
  art: ArtStyle;
  cover: { url: string; originalUrl?: string; srcSet?: string; alt: string; sourceUrl: string; credit: string };
  edition: string;
  note: string;
  tracks: AlbumTrack[];
}
export interface Song extends CatalogSong {
  album: string;
  art: ArtStyle;
}
interface MasterCatalog {
  schemaVersion: number;
  retrievedAt: string;
  scope: string;
  sources: { catalog: string; videos: string; requestedPlaylist: string; playlistImported: boolean };
  songs: CatalogSong[];
  albums: Album[];
}

// The checked-in snapshot is validated by catalog.test.cjs before delivery.
export const masterCatalog = database as MasterCatalog;
export const albums = masterCatalog.albums;
export const albumById = new Map(albums.map((album) => [album.id, album]));
export const catalogSongs: Song[] = masterCatalog.songs.map((song) => {
  const album = albumById.get(song.primaryAlbumId)!;
  return { ...song, album: album.title, art: album.art };
});
export const catalogSongById = new Map(catalogSongs.map((song) => [song.id, song]));
export const songs = catalogSongs.filter((s) => s.kind === 'song');
export const songById = new Map(songs.map((song) => [song.id, song]));
export const totalPairs = songs.length * (songs.length - 1) / 2;
