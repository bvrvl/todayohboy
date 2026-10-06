const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateRatings, selectPair, pairKey } = require('../.test-build/ranking/model.js');
const { songs } = require('../.test-build/data/songs.js');
const catalog = songs.slice(0, 3);
const [a, b, c] = catalog.map((song) => song.id);
const vote = (winnerId, loserId, strength = 'better', id = 'one') => ({ id, winnerId, loserId, strength });
const rating = (history, id) => calculateRatings(catalog, history).find((r) => r.song.id === id).rating;

test('one win places the winner above the loser', () => {
  assert.ok(rating([vote(a, b)], a) > rating([vote(a, b)], b));
});
test('much better creates a larger fitted gap than slightly better', () => {
  const gap = (strength) => rating([vote(a, b, strength)], a) - rating([vote(a, b, strength)], b);
  assert.ok(gap('much') > gap('slight') * 2);
  assert.ok(gap('better') > gap('slight'));
});
test('transitive evidence ranks A above B above C', () => {
  const history = [vote(a, b), vote(b, c, 'better', 'two')];
  assert.ok(rating(history, a) > rating(history, b));
  assert.ok(rating(history, b) > rating(history, c));
});
test('pair keys are independent of orientation', () => assert.equal(pairKey([a, b]), pairKey([b, a])));
test('answered pairs are excluded in both orientations', () => {
  for (const comparison of [vote(a, b), vote(b, a)]) {
    for (let i = 0; i < 10; i++) assert.notEqual(pairKey(selectPair(catalog, [comparison], [], () => i / 10)), pairKey([a, b]));
  }
});
test('undo changes ratings and makes the removed pair eligible', () => {
  const history = [vote(a, b)];
  const small = catalog.slice(0, 2);
  assert.equal(selectPair(small, history), null);
  assert.notDeepEqual(calculateRatings(small, history), calculateRatings(small, []));
  assert.equal(pairKey(selectPair(small, [], [], () => 0)), pairKey([a, b]));
});
test('introduces unseen songs with an existing anchor', () => {
  const pair = selectPair(catalog, [vote(a, b)], [], () => 0);
  assert.ok(pair.includes(c));
  assert.ok(pair.includes(a) || pair.includes(b));
});
test('fitting is deterministic, finite, and centered', () => {
  const history = [vote(a, b), vote(b, c, 'much', 'two')];
  const first = calculateRatings(catalog, history);
  assert.deepEqual(first, calculateRatings(catalog, history));
  assert.ok(first.every((r) => Number.isFinite(r.rating)));
  assert.ok(Math.abs(first.reduce((sum, r) => sum + r.rating, 0)) < 1e-10);
});
test('uncertainty decreases when comparison count increases', () => {
  const rows = calculateRatings(catalog, [vote(a, b)]);
  assert.ok(rows.find((r) => r.song.id === a).uncertainty < rows.find((r) => r.song.id === c).uncertainty);
});
test('skip excludes pairs without changing history', () => {
  const history = [];
  const pair = selectPair(catalog, history, [pairKey([a, b])], () => 0);
  assert.notEqual(pairKey(pair), pairKey([a, b]));
  assert.deepEqual(history, []);
});
test('exhaustion and single-song catalogs return null', () => {
  assert.equal(selectPair(catalog, [vote(a, b), vote(a, c, 'better', 'two'), vote(b, c, 'better', 'three')]), null);
  assert.equal(selectPair([catalog[0]], []), null);
  assert.equal(selectPair([], []), null);
});
test('nearby uncertain songs are favored after introduction', () => {
  const history = [vote(a, c, 'much'), vote(b, c, 'much', 'two')];
  assert.equal(pairKey(selectPair(catalog, history, [], () => 0)), pairKey([a, b]));
});
test('an entire catalog can be compared without repeating pairs', () => {
  const history = [];
  const seen = new Set();
  const sample = songs.slice(0, 6);
  let pair;
  while ((pair = selectPair(sample, history, [], () => 0.3))) {
    assert.ok(!seen.has(pairKey(pair)));
    seen.add(pairKey(pair));
    history.push(vote(pair[0], pair[1], 'better', String(history.length)));
  }
  assert.equal(seen.size, 15);
});

test('dense expanded-catalog evidence remains stable and preserves a clear ordering', () => {
  const sample = songs.slice(0, 40);
  const history = [];
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) history.push(vote(sample[i].id, sample[j].id, 'better', `${i}-${j}`));
  }
  const fitted = calculateRatings(sample, history);
  assert.ok(fitted.every((r) => Number.isFinite(r.rating) && Math.abs(r.rating) < 10));
  assert.deepEqual(fitted.map((r) => r.song.id), sample.map((s) => s.id));
});
