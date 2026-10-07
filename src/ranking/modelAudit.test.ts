import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songs, type Song } from '../data/songs';
import { calculateRatings, modelConfig, pairKey, selectPair, type Comparison } from './model';
import { familiarSongIds } from '../data/familiarity';

function residual(catalog: Song[], history: Comparison[]): number {
  const fitted = calculateRatings(catalog, history);
  const ratings = new Map(fitted.map((row) => [row.song.id, row.rating]));
  const gradients = new Map(fitted.map((row) => [row.song.id, modelConfig.regularization * row.rating]));
  for (const comparison of history) {
    const gap = ratings.get(comparison.winnerId)! - ratings.get(comparison.loserId)!;
    const error = 1 / (1 + Math.exp(-gap)) - modelConfig.targets[comparison.strength];
    gradients.set(comparison.winnerId, gradients.get(comparison.winnerId)! + error);
    gradients.set(comparison.loserId, gradients.get(comparison.loserId)! - error);
  }
  return Math.max(...[...gradients.values()].map(Math.abs));
}

test('single comparison fits the independent scalar optimum for every strength', () => {
  const catalog = songs.slice(0, 2);
  for (const strength of ['slight', 'better', 'much'] as const) {
    let low = 0;
    let high = 10;
    for (let i = 0; i < 100; i++) {
      const gap = (low + high) / 2;
      // At the optimum, the symmetric two-song scores are +gap/2, -gap/2.
      if (1 / (1 + Math.exp(-gap)) + modelConfig.regularization * gap / 2 > modelConfig.targets[strength]) high = gap;
      else low = gap;
    }
    const fitted = calculateRatings(catalog, [{ id: '1', winnerId: catalog[0].id, loserId: catalog[1].id, strength }]);
    assert.ok(Math.abs(fitted[0].rating - fitted[1].rating - (low + high) / 2) < 1e-7);
  }
});

test('a full-catalog anchor graph converges instead of compressing leaf scores', () => {
  const history: Comparison[] = songs.slice(1).map((song, index) => ({
    id: String(index), winnerId: song.id, loserId: songs[0].id, strength: index % 3 === 0 ? 'much' : index % 3 === 1 ? 'better' : 'slight',
  }));
  assert.ok(residual(songs, history) < 1e-7);
  const byId = new Map(calculateRatings(songs, history).map((row) => [row.song.id, row.rating]));
  assert.ok(byId.get(songs[1].id)! > byId.get(songs[2].id)!);
  assert.ok(byId.get(songs[2].id)! > byId.get(songs[3].id)!);
});

test('all 22,578 pairs fit finitely, converge, and preserve consistent preferences', () => {
  const history: Comparison[] = songs.flatMap((winner, index) => songs.slice(index + 1).map((loser) => ({
    id: `${winner.id}:${loser.id}`, winnerId: winner.id, loserId: loser.id, strength: 'better',
  })));
  assert.ok(residual(songs, history) < 1e-7);
  const fitted = calculateRatings(songs, history);
  assert.ok(fitted.every((row) => Number.isFinite(row.rating)));
  assert.deepEqual(fitted.map((row) => row.song.id), songs.map((song) => song.id));
});

test('balanced contradictory cycles settle at a tie rather than diverging', () => {
  const catalog = songs.slice(0, 3);
  const history: Comparison[] = catalog.map((song, index) => ({ id: String(index), winnerId: song.id, loserId: catalog[(index + 1) % 3].id, strength: 'much' }));
  assert.ok(calculateRatings(catalog, history).every((row) => Math.abs(row.rating) < 1e-8));
});

test('history order and catalog order do not change fitted preferences', () => {
  const catalog = songs.slice(0, 20);
  const history: Comparison[] = catalog.slice(1).map((song, index) => ({ id: String(index), winnerId: song.id, loserId: catalog[0].id, strength: index % 2 ? 'much' : 'slight' }));
  const original = new Map(calculateRatings(catalog, history).map((row) => [row.song.id, row.rating]));
  for (const row of calculateRatings([...catalog].reverse(), [...history].reverse())) {
    assert.ok(Math.abs(row.rating - original.get(row.song.id)!) < 1e-7);
  }
});

test('votes outside a requested catalog do not falsely count its songs as compared', () => {
  const catalog = songs.slice(0, 2);
  const history: Comparison[] = [{ id: 'other', winnerId: catalog[0].id, loserId: songs[2].id, strength: 'much' }];
  assert.ok(calculateRatings(catalog, history).every((row) => row.comparisonCount === 0 && row.rating === 0));
});

test('skipping all nearby anchor pairs still connects new songs to existing evidence', () => {
  const [a, b] = familiarSongIds;
  const history: Comparison[] = [{ id: '1', winnerId: a, loserId: b, strength: 'better' }];
  const next = familiarSongIds.slice(2, 7);
  const skipped = next.flatMap((id) => [pairKey([id, a]), pairKey([id, b])]);
  const pair = selectPair(songs, history, skipped, () => 0)!;
  assert.ok(pair.includes(a) || pair.includes(b));
  assert.ok(pair.some((id) => !next.includes(id) && id !== a && id !== b));
  assert.ok(!skipped.includes(pairKey(pair)));
});
