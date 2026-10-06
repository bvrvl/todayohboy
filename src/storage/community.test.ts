import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songs } from '../data/songs';
import { COMMUNITY_STORAGE_KEY, localCommunityRepository, parseCommunityPosts } from './community';

const input = { author: '  Test fan  ', note: ' A note. ', ranking: { songIds: [songs[0].id, songs[1].id], comparisonCount: 1, totalSongs: songs.length } };

function mockStorage(): Map<string, string> {
  const saved = new Map<string, string>();
  globalThis.localStorage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => { saved.set(key, value); } } as Storage;
  return saved;
}

test('publishing and reload preserve note, order, counts, and newest-first posts', async () => {
  const saved = mockStorage();
  assert.deepEqual(await localCommunityRepository.list(), []);
  const first = await localCommunityRepository.publish(input);
  const second = await localCommunityRepository.publish({ ...input, author: '' });
  assert.equal(first.author, 'Test fan');
  assert.equal(first.note, 'A note.');
  assert.equal(second.author, 'A Beatles fan');
  assert.deepEqual(await localCommunityRepository.list(), [second, first]);
  assert.deepEqual(parseCommunityPosts(saved.get(COMMUNITY_STORAGE_KEY)!), [second, first]);
  input.ranking.songIds.reverse();
  assert.notDeepEqual(input.ranking.songIds, first.ranking.songIds);
  assert.deepEqual(await localCommunityRepository.list(), [second, first]);
  input.ranking.songIds.reverse();
});

test('a corrupt existing save blocks publication and remains untouched', async () => {
  const saved = mockStorage();
  saved.set(COMMUNITY_STORAGE_KEY, '{broken');
  await assert.rejects(localCommunityRepository.list());
  await assert.rejects(localCommunityRepository.publish(input));
  assert.equal(saved.get(COMMUNITY_STORAGE_KEY), '{broken');
});

test('storage write failures reject publication instead of claiming success', async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } } as unknown as Storage;
  await assert.rejects(localCommunityRepository.publish(input), /quota/);
});

test('unsupported schemas and duplicate saved post IDs are rejected', async () => {
  mockStorage();
  const post = await localCommunityRepository.publish(input);
  assert.throws(() => parseCommunityPosts(JSON.stringify({ version: 2, posts: [] })));
  assert.throws(() => parseCommunityPosts(JSON.stringify({ version: 1, posts: [post, post] })));
});
