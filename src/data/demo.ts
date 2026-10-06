import type { Comparison } from '../ranking/model';

const evidence: [string, string, Comparison['strength']][] = [
  ['day-in-life', 'hey-jude', 'much'],
  ['day-in-life', 'come-together', 'much'],
  ['day-in-life', 'lucy', 'better'],
  ['day-in-life', 'let-it-be', 'much'],
  ['strawberry', 'hey-jude', 'better'],
  ['strawberry', 'yesterday', 'much'],
  ['strawberry', 'penny-lane', 'better'],
  ['here-comes-sun', 'let-it-be', 'better'],
  ['here-comes-sun', 'come-together', 'better'],
  ['something', 'yesterday', 'better'],
  ['in-my-life', 'blackbird', 'better'],
  ['while-guitar', 'eleanor', 'slight'],
];
export const demoHistory: Comparison[] = evidence.map(([winnerId, loserId, strength], i) => ({
  id: `demo-${i}`, winnerId, loserId, strength,
}));
