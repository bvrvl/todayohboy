import type { Song } from './songs';

// Curated introduction order, researched 2026-10-07. UK streaming leaders
// supply the first 40; ten additional Spotify favourites broaden the pool.
// Popularity guides discovery only: it never supplies preference evidence.
export const familiaritySources = {
  officialCharts: 'https://www.officialcharts.com/chart-news/the-official-top-40-most-streamed-the-beatles-songs-in-the-uk-revealed/',
  spotifyStreams: 'https://kworb.net/spotify/artist/3WrFJ7ztbogyGnTHbHJFl2_songs.html',
};
export const familiarSongIds: readonly string[] = [
  'here-comes-sun', 'let-it-be', 'come-together', 'hey-jude', 'twist',
  'yesterday', 'in-my-life', 'eleanor', 'help', 'blackbird',
  'something', 'i-want-to-hold-your-hand', 'while-guitar', 'yellow-submarine', 'strawberry',
  'penny-lane', 'lucy', 'all-you-need', 'love-me-do', 'norwegian',
  'ob-la-di-ob-la-da', 'sgt-peppers-lonely-hearts-club-band', 'hard-days-night', 'get-back', 'day-in-life',
  'with-a-little-help-from-my-friends', 'ticket', 'i-saw-her-standing-there', 'day-tripper', 'back-in-the-ussr',
  'cant-buy-me-love', 'she-loves-you', 'eight-days-a-week', 'the-long-and-winding-road', 'and-i-love-her',
  'hello-goodbye', 'we-can-work-it-out', 'across', 'i-feel-fine', 'golden-slumbers',
  'dont-let-me-down', 'all-my-loving', 'oh-darling', 'michelle', 'i-will',
  'youve-got-to-hide-your-love-away', 'here-there-and-everywhere', 'drive-my-car', 'octopuss-garden', 'revolution',
];
const familiarity = new Map(familiarSongIds.map((id, index) => [id, index]));

export function compareFamiliarity(a: Song, b: Song): number {
  return (familiarity.get(a.id) ?? familiarSongIds.length) - (familiarity.get(b.id) ?? familiarSongIds.length)
    || a.id.localeCompare(b.id);
}
