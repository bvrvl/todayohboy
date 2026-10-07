import { test } from 'node:test';
import assert from 'node:assert/strict';
import { familiarSongIds } from '../data/familiarity';
import { songs, songById } from '../data/songs';
import { calculateRatings, pairKey, selectPair, type Comparison } from './model';

test('the researched introduction list has 50 distinct catalog songs', () => {
  assert.equal(familiarSongIds.length, 50);
  assert.equal(new Set(familiarSongIds).size, 50);
  assert.ok(familiarSongIds.every((id) => songById.has(id)));
});

test('opening pairs use recognizable songs regardless of catalog order', () => {
  const opening = new Set(familiarSongIds.slice(0, 5));
  for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
    const pair = selectPair([...songs].reverse(), [], [], () => random)!;
    assert.ok(pair.every((id) => opening.has(id)));
    assert.notEqual(pair[0], pair[1]);
  }
  assert.ok(calculateRatings(songs, []).every((rating) => rating.rating === 0));
});

test('early votes keep introducing familiar songs with compared anchors', () => {
  const history: Comparison[] = [];
  const compared = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const pair = selectPair(songs, history, [], () => 0.7)!;
    assert.ok(pair.every((id) => familiarSongIds.includes(id)));
    if (i > 0) {
      assert.ok(pair.some((id) => compared.has(id)));
      assert.ok(pair.some((id) => !compared.has(id)));
    }
    pair.forEach((id) => compared.add(id));
    history.push({ id: String(i), winnerId: pair[0], loserId: pair[1], strength: 'better' });
  }
  assert.equal(compared.size, 21);
});

test('skipping every introductory pair still offers other eligible songs', () => {
  const ids = familiarSongIds.slice(0, 5);
  const skipped = ids.flatMap((a, index) => ids.slice(index + 1).map((b) => pairKey([a, b])));
  const pair = selectPair(songs, [], skipped, () => 0)!;
  assert.ok(pair);
  assert.ok(!skipped.includes(pairKey(pair)));
});

test('deeper cuts become eligible when familiar songs have all been seen', () => {
  const history: Comparison[] = familiarSongIds.slice(1).map((id, index) => ({
    id: String(index), winnerId: familiarSongIds[0], loserId: id, strength: 'better',
  }));
  assert.ok(selectPair(songs, history, [], () => 0)!.some((id) => !familiarSongIds.includes(id)));
});
