const { test } = require('node:test');
const assert = require('node:assert/strict');
const { masterCatalog, songs, albums, songById, totalPairs } = require('../.test-build/data/songs.js');
const { parseProgress } = require('../.test-build/storage/progress.js');
const { youtubeEmbedUrl, youtubeWatchUrl } = require('../.test-build/media/youtube.js');

test('complete core collection has unique stable song IDs and sourced videos', () => {
  assert.equal(songs.length, 213);
  assert.equal(masterCatalog.songs.length, 220);
  assert.equal(new Set(masterCatalog.songs.map((s) => s.id)).size, 220);
  assert.ok(masterCatalog.songs.every((s) => s.videoId && s.mediaStatus === 'sourced'));
  assert.equal(new Set(songs.map((s) => s.title.toLowerCase())).size, 213);
  assert.equal(totalPairs, 22578);
  for (const song of songs) {
    assert.match(song.videoId, /^[A-Za-z0-9_-]{11}$/);
    assert.equal(song.mediaStatus, 'sourced');
    assert.equal(song.embedSourceUrl, song.sourceUrl);
    assert.match(song.sourceEmbedUrl, new RegExp(`/embed/${song.videoId}(?:\\?|$)`));
    assert.ok(song.writers && song.releaseText);
    assert.equal(new URL(song.sourceUrl).hostname, 'www.beatlesbible.com');
  }
});

test('all album appearances retain ordering, valid joins, and image provenance', () => {
  assert.equal(albums.length, 35);
  const core = albums.filter((a) => a.scope === 'core');
  assert.equal(core.length, 14);
  assert.deepEqual(core.map((a) => a.tracks.length), [14, 14, 13, 14, 14, 14, 14, 13, 11, 30, 13, 17, 12, 33]);
  const ids = new Set(masterCatalog.songs.map((s) => s.id));
  for (const album of albums) {
    assert.ok(album.tracks.length > 0, album.id);
    assert.match(album.cover.url, /^https:\/\/www\.beatlesbible\.com\/wp\/media\//);
    assert.ok(album.cover.sourceUrl && album.cover.credit);
    assert.ok(album.year >= 1963 && album.year <= 2026);
    album.tracks.forEach((t, i) => {
      assert.equal(t.position, i + 1);
      assert.ok(t.title);
      if (t.songId) assert.ok(ids.has(t.songId), `${album.id}: ${t.songId}`);
      if (album.scope === 'core') assert.ok(t.songId);
    });
  }
});

test('score pieces and archive recordings do not become duplicate ranked songs', () => {
  const score = masterCatalog.songs.filter((s) => s.kind === 'score');
  assert.equal(score.length, 7);
  score.forEach((s) => assert.equal(songById.has(s.id), false));
  const occurrences = albums.filter((a) => a.scope === 'core').flatMap((a) => a.tracks).filter((t) => t.songId === 'get-back');
  assert.equal(occurrences.length, 2);
  assert.ok(occurrences.every((t) => t.version));
});

test('legacy saved votes and pair IDs survive the catalog expansion', () => {
  const ids = ['day-in-life', 'strawberry', 'here-comes-sun', 'something', 'in-my-life', 'while-guitar', 'hey-jude', 'yesterday', 'come-together', 'let-it-be', 'eleanor', 'blackbird', 'penny-lane', 'lucy', 'help', 'all-you-need', 'norwegian', 'tomorrow', 'ticket', 'across', 'oh-darling', 'all-my-loving', 'twist', 'hard-days-night', 'get-back'];
  ids.forEach((id) => assert.ok(songById.has(id), id));
  const state = { version: 1, demo: false, history: [{ id: 'old-vote', winnerId: 'hey-jude', loserId: 'yesterday', strength: 'much' }], activePair: ['norwegian', 'get-back'] };
  const { rankingName, ...restored } = parseProgress(JSON.stringify(state));
  assert.ok(rankingName);
  assert.deepEqual(restored, state);
});

test('YouTube URLs retain native controls and never autoplay', () => {
  const url = new URL(youtubeEmbedUrl('usNsCeOV4GM'));
  assert.equal(url.hostname, 'www.youtube.com');
  assert.equal(url.pathname, '/embed/usNsCeOV4GM');
  assert.equal(url.searchParams.get('autoplay'), '0');
  assert.equal(url.searchParams.get('controls'), '1');
  assert.equal(url.searchParams.get('playsinline'), '1');
  assert.equal(new URL(youtubeWatchUrl('usNsCeOV4GM')).searchParams.get('v'), 'usNsCeOV4GM');
  for (const id of ['', 'http://example.org', 'abcdefghijk?autoplay=1', 'abc']) assert.throws(() => youtubeEmbedUrl(id));
});
