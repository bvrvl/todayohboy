import { test } from 'node:test';
import assert from 'node:assert/strict';
import { albums, catalogSongs, songById } from './songs';

test('every primary designation contains the song and matches its displayed album', () => {
  const core = albums.filter((album) => album.scope === 'core');
  for (const song of catalogSongs) {
    const primary = core.find((album) => album.id === song.primaryAlbumId);
    assert.ok(primary, song.id);
    assert.ok(primary.tracks.some((track) => track.songId === song.id && track.kind === song.kind), song.id);
    assert.equal(song.album, primary.title);
    const earliestCore = core.find((album) => album.tracks.some((track) => track.songId === song.id));
    assert.equal(song.primaryAlbumId, earliestCore!.id, song.id);
  }
});

test('singles and overlapping releases retain the correct canonical core record', () => {
  const expected = {
    'yesterday': 'help', 'twist': 'please-please-me', 'yellow-submarine': 'revolver',
    'all-you-need': 'magical-mystery-tour', 'strawberry': 'magical-mystery-tour', 'penny-lane': 'magical-mystery-tour',
    'hey-jude': 'past-masters', 'revolution': 'past-masters', 'dont-let-me-down': 'past-masters',
    'get-back': 'let-it-be', 'across': 'let-it-be', 'let-it-be': 'let-it-be',
    'while-guitar': 'the-beatles-white-album', 'day-in-life': 'sgt-peppers-lonely-hearts-club-band',
  };
  for (const [id, primary] of Object.entries(expected)) assert.equal(songById.get(id)!.primaryAlbumId, primary, id);
  assert.equal(songById.get('hey-jude')!.year, 1968);
  assert.equal(songById.get('love-me-do')!.year, 1962);
  assert.equal(songById.get('bad-boy')!.year, 1965);
});
