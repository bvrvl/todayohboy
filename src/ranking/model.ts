import type { Song } from '../data/songs';
import { compareFamiliarity } from '../data/familiarity';

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
  passes: 240,
  learningRate: 0.15,
  regularization: 0.025,
};
export const pairKey = (pair: Pair): string => [...pair].sort().join(':');

export function calculateRatings(catalog: Song[], history: Comparison[]): Rating[] {
  const values = new Map(catalog.map((s) => [s.id, 0]));
  const counts = new Map(catalog.map((s) => [s.id, 0]));
  for (const c of history) {
    counts.set(c.winnerId, (counts.get(c.winnerId) ?? 0) + 1);
    counts.set(c.loserId, (counts.get(c.loserId) ?? 0) + 1);
  }
  // Large catalogs can have hundreds of observations per song. Bound the step
  // by degree so dense histories do not make the gradient updates oscillate.
  const maxCount = Math.max(1, ...counts.values());
  const learningRate = Math.min(modelConfig.learningRate, 1 / maxCount);
  for (let pass = 0; pass < modelConfig.passes; pass++) {
    const gradients = new Map(catalog.map((s) => [s.id, -modelConfig.regularization * values.get(s.id)!]));
    for (const c of history) {
      if (!values.has(c.winnerId) || !values.has(c.loserId)) continue;
      const gap = values.get(c.winnerId)! - values.get(c.loserId)!;
      const error = modelConfig.targets[c.strength] - 1 / (1 + Math.exp(-gap));
      gradients.set(c.winnerId, gradients.get(c.winnerId)! + error);
      gradients.set(c.loserId, gradients.get(c.loserId)! - error);
    }
    for (const song of catalog) values.set(song.id, values.get(song.id)! + learningRate * gradients.get(song.id)!);
  }
  const mean = catalog.length ? [...values.values()].reduce((a, b) => a + b, 0) / catalog.length : 0;
  return catalog.map((song) => ({
    song,
    rating: values.get(song.id)! - mean,
    comparisonCount: counts.get(song.id)!,
    uncertainty: 1 / Math.sqrt(1 + counts.get(song.id)!),
  })).sort((a, b) => b.rating - a.rating || a.song.title.localeCompare(b.song.title));
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
  const eligible = introduction.length ? introduction : candidates;
  eligible.sort((a, b) => b.score - a.score);
  const top = eligible.filter((c) => c.score >= eligible[0].score - 0.4).slice(0, 8);
  const pair = top[Math.min(top.length - 1, Math.floor(random() * top.length))].pair;
  return random() < 0.5 ? pair : [pair[1], pair[0]];
}
