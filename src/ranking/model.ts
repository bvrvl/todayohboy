import type { Song } from '../data/songs';
import { compareFamiliarity } from '../data/familiarity';
import { fitRatings, type Observation } from './fitRatings';

export type Strength = 'slight' | 'better' | 'much';
export type Pair = [string, string];
export interface Comparison {
  id: string;
  winnerId: string;
  loserId: string;
  strength: Strength;
}
export interface Rating {
  song: Song;
  rating: number;
  comparisonCount: number;
  uncertainty: number;
}
export const modelConfig = {
  targets: { slight: 0.65, better: 0.8, much: 0.95 },
  maxIterations: 30,
  gradientTolerance: 1e-8,
  regularization: 0.025,
};
export const pairKey = (pair: Pair): string => [...pair].sort().join(':');

export function calculateRatings(catalog: Song[], history: Comparison[]): Rating[] {
  const indices = new Map(catalog.map((song, index) => [song.id, index]));
  const counts = new Uint32Array(catalog.length);
  const observations: Observation[] = [];
  for (const c of history) {
    const winner = indices.get(c.winnerId);
    const loser = indices.get(c.loserId);
    if (winner === undefined || loser === undefined || winner === loser) continue;
    counts[winner]++;
    counts[loser]++;
    observations.push({ winner, loser, target: modelConfig.targets[c.strength] });
  }
  const values = fitRatings(catalog.length, observations, modelConfig);
  const mean = catalog.length ? values.reduce((a, b) => a + b, 0) / catalog.length : 0;
  return catalog.map((song, index) => ({
    song,
    rating: values[index] - mean,
    comparisonCount: counts[index],
    uncertainty: 1 / Math.sqrt(1 + counts[index]),
  })).sort((a, b) => Math.abs(a.rating - b.rating) > 1e-10 ? b.rating - a.rating : a.song.title.localeCompare(b.song.title));
}

export function selectPair(catalog: Song[], history: Comparison[], skipped: string[] = [], random = Math.random): Pair | null {
  const excluded = new Set([...history.map((c) => pairKey([c.winnerId, c.loserId])), ...skipped]);
  const ratings = calculateRatings(catalog, history).sort((a, b) => compareFamiliarity(a.song, b.song));
  const unseen = ratings.some((r) => r.comparisonCount === 0);
  const introductionIds = new Set(ratings.filter((r) => r.comparisonCount === 0).slice(0, 5).map((r) => r.song.id));
  const comparedIds = new Set(ratings.filter((r) => r.comparisonCount > 0).map((r) => r.song.id));
  const candidates: { pair: Pair; score: number }[] = [];
  for (let a = 0; a < ratings.length; a++) {
    for (let b = a + 1; b < ratings.length; b++) {
      const left = ratings[a];
      const right = ratings[b];
      const pair: Pair = [left.song.id, right.song.id];
      if (excluded.has(pairKey(pair))) continue;
      const joinsGraph = (left.comparisonCount === 0) !== (right.comparisonCount === 0);
      const score = (unseen && joinsGraph ? 20 : 0)
        + 2 * Math.exp(-Math.abs(left.rating - right.rating))
        + 2 * (left.uncertainty + right.uncertainty)
        + 1 / (1 + left.comparisonCount + right.comparisonCount);
      candidates.push({ pair, score });
    }
  }
  if (!candidates.length) return null;
  // Introduce the next handful of familiar songs, linking them to existing
  // evidence. If skips exhaust this pool, fall back to all eligible pairs.
  const introduction = unseen ? candidates.filter(({ pair }) => pair.some((id) => introductionIds.has(id))
    && pair.every((id) => comparedIds.has(id) || introductionIds.has(id))) : [];
  const connectsToCompared = ({ pair }: { pair: Pair }): boolean => unseen && comparedIds.has(pair[0]) !== comparedIds.has(pair[1]);
  const connectedIntroduction = introduction.filter(connectsToCompared);
  const connectedCandidates = candidates.filter(connectsToCompared);
  const eligible = connectedIntroduction.length ? connectedIntroduction : connectedCandidates.length ? connectedCandidates : introduction.length ? introduction : candidates;
  eligible.sort((a, b) => b.score - a.score);
  const top = eligible.filter((c) => c.score >= eligible[0].score - 0.4).slice(0, 8);
  const pair = top[Math.min(top.length - 1, Math.floor(random() * top.length))].pair;
  return random() < 0.5 ? pair : [pair[1], pair[0]];
}
