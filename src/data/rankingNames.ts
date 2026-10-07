export const RANKING_NAME_LIMIT = 60;
export const rankingNames: readonly string[] = [
  'Your personal hit parade',
  'All you need is favourites',
  'The long and winding list',
  'A little help from my favourites',
  'Here comes your number one',
  'My magical mystery chart',
  'Twist and chart',
  'Across my Beatleverse',
  'Eight days of favourites',
  'My own Abbey Road',
];

export function chooseRankingName(random: () => number = Math.random): string {
  return rankingNames[Math.min(rankingNames.length - 1, Math.max(0, Math.floor(random() * rankingNames.length)))];
}

export function validateRankingName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > RANKING_NAME_LIMIT) {
    throw new Error(`Choose a ranking name between 1 and ${RANKING_NAME_LIMIT} characters.`);
  }
  return value.trim();
}
