import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albums, songs, songById, type Album } from '../data/songs';
import { calculateRatings, type Rating, type Comparison } from './model';
import { calculateAlbumRatings } from './albumRatings';

const a = 'here-comes-sun';
const b = 'let-it-be';
const c = 'something';
const fixtureAlbum = (id: string, songIds: string[]): Album => ({
  ...albums[0], id, tracks: songIds.map((songId, index) => ({ position: index + 1, title: songId, songId, kind: 'song', version: '' })),
});
const rows = (values: [string, number, number][]): Rating[] => values.map(([id, rating, comparisonCount]) => ({ song: songById.get(id)!, rating, comparisonCount, uncertainty: 1 }));

test('album scores average chart positions and exclude untested tracks', () => {
  const result = calculateAlbumRatings([fixtureAlbum('first', [a, c]), fixtureAlbum('second', [b])], rows([[a, 2, 1], [b, 1, 1], [c, 0, 0]]));
  assert.equal(result[0].score, 100);
  assert.equal(result[0].comparedSongs, 1);
  assert.equal(result[0].totalSongs, 2);
  assert.equal(result[1].score, 0);
});

test('each song contributes once regardless of repeated tracks or vote counts', () => {
  const result = calculateAlbumRatings([fixtureAlbum('first', [a, b, b]), fixtureAlbum('second', [c])], rows([[a, 2, 10], [b, 0, 1], [c, 1, 3]]));
  assert.equal(result.find((row) => row.album.id === 'first')!.score, 50);
  assert.equal(result.find((row) => row.album.id === 'first')!.totalSongs, 2);
});

test('tied songs contribute equal positions', () => {
  const result = calculateAlbumRatings([fixtureAlbum('first', [a]), fixtureAlbum('second', [b]), fixtureAlbum('third', [c])], rows([[a, 2, 1], [b, 2, 1], [c, 0, 1]]));
  assert.equal(result[0].score, 75);
  assert.equal(result[1].score, 75);
  assert.equal(result[2].score, 0);
});

test('empty albums stay unranked and score tracks are excluded', () => {
  const album = fixtureAlbum('first', [a, b]);
  album.tracks[0].kind = 'score';
  const result = calculateAlbumRatings([album], rows([[a, 0, 0], [b, 0, 0]]));
  assert.equal(result[0].score, null);
  assert.equal(result[0].comparedSongs, 0);
  assert.equal(result[0].totalSongs, 1);
});

test('album scores update after voting and undo and replay exactly', () => {
  const core = albums.filter((album) => album.scope === 'core');
  const history: Comparison[] = [{ id: '1', winnerId: a, loserId: b, strength: 'much' }];
  const score = (history: Comparison[], id: string): number | null => calculateAlbumRatings(core, calculateRatings(songs, history)).find((row) => row.album.id === id)!.score;
  assert.equal(score([], 'abbey-road'), null);
  assert.equal(score(history, 'abbey-road'), 100);
  assert.equal(score(history, 'let-it-be'), 0);
  assert.equal(score(JSON.parse(JSON.stringify(history)), 'abbey-road'), 100);
  assert.equal(score(history.slice(0, -1), 'abbey-road'), null);
});
