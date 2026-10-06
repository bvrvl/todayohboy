import { parseRankingPost, type RankingPost } from './posts';

const SHARE_PREFIX = '#ranking=';
const MAX_PAYLOAD_LENGTH = 20000;

export function createShareUrl(post: RankingPost, baseUrl: string): string {
  const bytes = new TextEncoder().encode(JSON.stringify(parseRankingPost(post)));
  const payload = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(baseUrl);
  url.hash = `${SHARE_PREFIX.slice(1)}${payload}`;
  return url.toString();
}

export function readSharedRanking(hash: string): { post: RankingPost | null; error: string | null } {
  if (!hash.startsWith(SHARE_PREFIX)) return { post: null, error: null };
  try {
    const payload = hash.slice(SHARE_PREFIX.length);
    if (!payload || payload.length > MAX_PAYLOAD_LENGTH || !/^[A-Za-z0-9_-]+$/.test(payload)) throw new Error('Invalid share link.');
    const bytes = Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0));
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { post: parseRankingPost(JSON.parse(raw)), error: null };
  } catch {
    return { post: null, error: 'This ranking link is incomplete or unsupported. Ask the sender for a new link.' };
  }
}
