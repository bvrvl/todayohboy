const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDemo, parseProgress, saveProgress, loadProgress, STORAGE_KEY } = require('../.test-build/storage/progress.js');
const { calculateRatings } = require('../.test-build/ranking/model.js');
const { songs } = require('../.test-build/data/songs.js');
const { mock } = require('node:test');

test('history roundtrip preserves the exact ranking and active pair', () => {
  const original = createDemo();
  const restored = parseProgress(JSON.stringify(original));
  assert.deepEqual(calculateRatings(songs, original.history), calculateRatings(songs, restored.history));
  assert.deepEqual(restored.activePair, original.activePair);
});
test('rejects unsupported schemas, bad ids, strengths, and duplicate history', () => {
  const bad = [
    { ...createDemo(), version: 9 },
    { ...createDemo(), history: [{ id: 'x', winnerId: 'unknown', loserId: songs[0].id, strength: 'better' }] },
    { ...createDemo(), history: [{ id: 'x', winnerId: songs[0].id, loserId: songs[1].id, strength: 'invalid' }] },
    { ...createDemo(), history: [createDemo().history[0], { ...createDemo().history[0], id: 'new' }] },
    { ...createDemo(), history: [createDemo().history[0], { ...createDemo().history[1], id: 'demo-0' }] },
  ];
  for (const state of bad) assert.throws(() => parseProgress(JSON.stringify(state)));
});
test('rejects invalid or already-answered active pairs', () => {
  for (const activePair of [['bad', songs[0].id], [songs[0].id, songs[0].id], ['day-in-life', 'hey-jude'], []]) {
    assert.throws(() => parseProgress(JSON.stringify({ ...createDemo(), activePair })));
  }
});
test('supports a fresh session and a completed session', () => {
  const fresh = { version: 1, history: [], activePair: null, demo: false };
  assert.deepEqual(parseProgress(JSON.stringify(fresh)), fresh);
});
test('save and reload preserve votes', () => {
  const data = new Map();
  global.localStorage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  saveProgress(createDemo());
  assert.ok(data.has(STORAGE_KEY));
  assert.deepEqual(loadProgress(), { progress: createDemo(), error: null });
});
test('bad saved data stays untouched and reports an error', () => {
  const setItem = mock.fn();
  global.localStorage = { getItem: () => '{broken', setItem };
  assert.ok(loadProgress().error);
  assert.equal(setItem.mock.callCount(), 0);
});
test('storage access failures are reported and save failures propagate', () => {
  global.localStorage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
  assert.ok(loadProgress().error);
  assert.throws(() => saveProgress(createDemo()), /quota/);
});
