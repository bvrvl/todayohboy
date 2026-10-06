import { songs } from '../data/songs';
import { demoHistory } from '../data/demo';
import { pairKey, type Comparison, type Pair } from '../ranking/model';

export const STORAGE_KEY = 'beatles-ranker-progress-v1';
export interface Progress {
  version: 1;
  history: Comparison[];
  activePair: Pair | null;
  demo: boolean;
}
export const createDemo = (): Progress => ({ version: 1, history: [...demoHistory], activePair: ['day-in-life', 'strawberry'], demo: true });

export function parseProgress(raw: string): Progress {
  const value = JSON.parse(raw);
  const ids = new Set(songs.map((s) => s.id));
  if (!value || value.version !== 1 || !Array.isArray(value.history) || typeof value.demo !== 'boolean') throw new Error('Unsupported saved progress.');
  const keys = new Set<string>();
  const comparisonIds = new Set<string>();
  for (const c of value.history) {
    if (!c || typeof c.id !== 'string' || comparisonIds.has(c.id) || !ids.has(c.winnerId) || !ids.has(c.loserId)
      || c.winnerId === c.loserId || !['slight', 'better', 'much'].includes(c.strength)) throw new Error('Invalid comparison history.');
    const key = pairKey([c.winnerId, c.loserId]);
    if (keys.has(key)) throw new Error('Duplicate comparison.');
    keys.add(key);
    comparisonIds.add(c.id);
  }
  if (value.activePair !== null && (!Array.isArray(value.activePair) || value.activePair.length !== 2
    || !value.activePair.every((id: string) => ids.has(id)) || value.activePair[0] === value.activePair[1]
    || keys.has(pairKey(value.activePair)))) throw new Error('Invalid active comparison.');
  return value as Progress;
}
export function loadProgress(): { progress: Progress; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { progress: raw ? parseProgress(raw) : createDemo(), error: null };
  } catch {
    return { progress: createDemo(), error: 'Saved progress could not be read. Your original save is untouched. Reset to start a new save.' };
  }
}
export function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
