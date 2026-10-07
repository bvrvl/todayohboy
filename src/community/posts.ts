import { songs, songById, totalPairs } from '../data/songs';
import type { Rating } from '../ranking/model';
import { validateRankingName } from '../data/rankingNames';

export const NAME_LIMIT = 40;
export const NOTE_LIMIT = 500;

export interface RankingSnapshot {
  name?: string;
  songIds: string[];
  comparisonCount: number;
  totalSongs: number;
}

export interface RankingPost {
  version: 1;
  id: string;
  author: string;
  note: string;
  createdAt: string;
  ranking: RankingSnapshot;
}

export interface PublishRankingInput {
  author: string;
  note: string;
  ranking: RankingSnapshot;
}

// Capture only compared songs, in the same order as the live chart. A post is
// a point-in-time copy; later votes, undo, and reset do not change it.
export function createRankingSnapshot(ratings: Rating[], comparisonCount: number, name?: string): RankingSnapshot {
  return {
    ...(name === undefined ? {} : { name: validateRankingName(name) }),
    songIds: ratings.filter((rating) => rating.comparisonCount > 0).map((rating) => rating.song.id),
    comparisonCount,
    totalSongs: ratings.length,
  };
}

export function parseRankingPost(value: unknown): RankingPost {
  if (!value || typeof value !== 'object') throw new Error('Invalid ranking post.');
  const post = value as Record<string, unknown>;
  if (post.version !== 1 || typeof post.id !== 'string' || !/^[\w-]{1,80}$/.test(post.id)
    || typeof post.author !== 'string' || !post.author.trim() || post.author.length > NAME_LIMIT
    || typeof post.note !== 'string' || post.note.length > NOTE_LIMIT
    || typeof post.createdAt !== 'string' || post.createdAt.length > 30 || !Number.isFinite(Date.parse(post.createdAt))
    || !post.ranking || typeof post.ranking !== 'object') throw new Error('Invalid ranking post.');
  const ranking = post.ranking as Record<string, unknown>;
  const name = ranking.name === undefined ? undefined : validateRankingName(ranking.name);
  if (!Array.isArray(ranking.songIds) || ranking.songIds.length < 2 || ranking.songIds.length > songs.length
    || !ranking.songIds.every((id) => typeof id === 'string' && songById.has(id))
    || new Set(ranking.songIds).size !== ranking.songIds.length
    || !Number.isInteger(ranking.totalSongs) || (ranking.totalSongs as number) < ranking.songIds.length
    || (ranking.totalSongs as number) > 1000
    || !Number.isInteger(ranking.comparisonCount) || (ranking.comparisonCount as number) < Math.ceil(ranking.songIds.length / 2)
    || (ranking.comparisonCount as number) > Math.min(totalPairs, ranking.songIds.length * (ranking.songIds.length - 1) / 2)) {
    throw new Error('Invalid ranking snapshot.');
  }
  // Return only known fields and fresh arrays, including for untrusted links.
  return {
    version: 1,
    id: post.id,
    author: post.author.trim(),
    note: post.note.trim(),
    createdAt: post.createdAt,
    ranking: { ...(name === undefined ? {} : { name }), songIds: [...ranking.songIds], comparisonCount: ranking.comparisonCount as number, totalSongs: ranking.totalSongs as number },
  };
}
