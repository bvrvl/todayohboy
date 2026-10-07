import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songs } from '../data/songs';
import { calculateRatings } from '../ranking/model';
import { createDemo } from '../storage/progress';
import { createRankingSnapshot, parseRankingPost } from './posts';
import { createShareUrl, readSharedRanking } from './sharing';

const progress = createDemo();
const ranking = createRankingSnapshot(calculateRatings(songs, progress.history), progress.history.length);
const post = { version: 1, id: 'test-post', author: 'Zoë 🎸', note: 'Something is climbing.\n今日もビートルズ！', createdAt: '2026-10-06T18:00:00.000Z', ranking };

test('snapshots preserve the visible ranking and exclude untested songs', () => {
  const ratings = calculateRatings(songs, progress.history);
  const snapshot = createRankingSnapshot(ratings, progress.history.length);
  assert.deepEqual(snapshot.songIds, ratings.filter((rating) => rating.comparisonCount > 0).map((rating) => rating.song.id));
  assert.equal(snapshot.totalSongs, songs.length);
  const originalIds = [...snapshot.songIds];
  ratings.reverse();
  calculateRatings(songs, progress.history.slice(0, -1));
  assert.deepEqual(snapshot.songIds, originalIds);
  assert.equal(snapshot.comparisonCount, progress.history.length);
});

test('share links roundtrip the complete snapshot, Unicode, and line breaks', () => {
  const validPost = parseRankingPost(post);
  const url = createShareUrl(validPost, 'https://example.com/beatles/#old');
  assert.equal(new URL(url).pathname, '/beatles/');
  assert.deepEqual(readSharedRanking(new URL(url).hash), { post: validPost, error: null });
});

test('custom chart names survive published snapshots and share links', () => {
  const named = parseRankingPost({ ...post, ranking: { ...ranking, name: 'My favourites 🎸' } });
  const url = createShareUrl(named, 'https://example.com/');
  assert.equal(readSharedRanking(new URL(url).hash).post?.ranking.name, 'My favourites 🎸');
  for (const name of ['', 123, 'x'.repeat(61)]) assert.throws(() => parseRankingPost({ ...post, ranking: { ...ranking, name } }));
});

test('the full catalog fits in a validated share link', () => {
  const fullPost = parseRankingPost({ ...post, note: '🎸'.repeat(250), ranking: { songIds: songs.map((song) => song.id), comparisonCount: 213, totalSongs: songs.length } });
  const url = createShareUrl(fullPost, 'https://example.com/');
  assert.deepEqual(readSharedRanking(new URL(url).hash).post, fullPost);
});

test('ordinary hashes are ignored and broken links fail without throwing', () => {
  assert.deepEqual(readSharedRanking('#compare'), { post: null, error: null });
  for (const hash of ['#ranking=', '#ranking=broken!', '#ranking=e30', `#ranking=${'a'.repeat(20001)}`]) {
    assert.equal(readSharedRanking(hash).post, null);
    assert.ok(readSharedRanking(hash).error);
  }
  const invalidPayload = Buffer.from(JSON.stringify({ ...post, ranking: { ...ranking, songIds: ['unknown', songs[0].id] } }), 'utf8').toString('base64url');
  assert.ok(readSharedRanking(`#ranking=${invalidPayload.replace(/=+$/, '')}`).error);
});

test('rejects unsupported posts, invalid counts, unknown or duplicate songs, and oversized notes', () => {
  for (const invalid of [
    { ...post, version: 2 }, { ...post, author: '' }, { ...post, note: 'x'.repeat(501) },
    { ...post, createdAt: 'yesterday' }, { ...post, ranking: { ...ranking, songIds: [] } },
    { ...post, ranking: { ...ranking, songIds: [songs[0].id, songs[0].id] } },
    { ...post, ranking: { ...ranking, songIds: [songs[0].id, 'missing'] } },
    { ...post, ranking: { ...ranking, comparisonCount: -1 } },
    { ...post, ranking: { ...ranking, comparisonCount: 1.5 } },
    { ...post, ranking: { ...ranking, totalSongs: 1 } },
  ]) assert.throws(() => parseRankingPost(invalid));
});
