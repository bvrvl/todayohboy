import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseRankingName, rankingNames } from '../data/rankingNames';
import { createDemo, parseProgress } from './progress';

test('ten distinct default names can be selected with injected randomness', () => {
  assert.equal(rankingNames.length, 10);
  assert.equal(new Set(rankingNames).size, 10);
  rankingNames.forEach((name, index) => assert.equal(chooseRankingName(() => (index + 0.5) / 10), name));
});

test('custom names survive reload with the exact votes and pair', () => {
  const original = { ...createDemo(), rankingName: 'My favourites 🎸' };
  assert.deepEqual(parseProgress(JSON.stringify(original)), original);
});

test('old progress gets a name while preserving all evidence', () => {
  const { rankingName: _name, ...old } = createDemo();
  const restored = parseProgress(JSON.stringify(old));
  assert.ok(rankingNames.includes(restored.rankingName));
  assert.deepEqual(restored.history, old.history);
  assert.deepEqual(restored.activePair, old.activePair);
});

test('invalid ranking names are rejected and whitespace is trimmed', () => {
  for (const rankingName of [null, 1, '', '   ', 'x'.repeat(61)]) {
    assert.throws(() => parseProgress(JSON.stringify({ ...createDemo(), rankingName })));
  }
  assert.equal(parseProgress(JSON.stringify({ ...createDemo(), rankingName: '  My chart  ' })).rankingName, 'My chart');
});
