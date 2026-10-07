import type { Album } from '../data/songs';
import type { Rating } from './model';

export interface AlbumRating {
  album: Album;
  score: number | null;
  comparedSongs: number;
  totalSongs: number;
}

export function calculateAlbumRatings(albums: Album[], ratings: Rating[]): AlbumRating[] {
  const compared = ratings.filter((rating) => rating.comparisonCount > 0).sort((a, b) => b.rating - a.rating);
  const songIds = new Set(ratings.map((rating) => rating.song.id));
  const positions = new Map<string, number>();
  // Equal model scores share an average position; alphabetical tie-breaking
  // must never make one album score higher than another.
  for (let start = 0; start < compared.length;) {
    let end = start + 1;
    while (end < compared.length && Math.abs(compared[end].rating - compared[start].rating) < 1e-10) end++;
    const score = compared.length === 1 ? 50 : 100 * (1 - ((start + end - 1) / 2) / (compared.length - 1));
    for (let i = start; i < end; i++) positions.set(compared[i].song.id, score);
    start = end;
  }
  return albums.map((album) => {
    const tracks = [...new Set(album.tracks.flatMap((track) => track.songId && track.kind === 'song' && songIds.has(track.songId) ? [track.songId] : []))];
    const scores = tracks.flatMap((id) => positions.has(id) ? [positions.get(id)!] : []);
    return {
      album,
      score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
      comparedSongs: scores.length,
      totalSongs: tracks.length,
    };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.album.year - b.album.year || a.album.id.localeCompare(b.album.id));
}
