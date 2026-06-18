/**
 * Levenshtein distance and fuzzy search utilities.
 *
 * This module provides a compact and well-documented implementation of the
 * Levenshtein distance and a helper to find closest matches from a list of
 * candidate strings. It is intentionally self-contained and has no runtime
 * dependencies so it can be integrated anywhere in the app.
 *
 * Note: This file only adds the utility functions and exports them for
 * future integration. It is NOT wired into any UI components by design.
 */

/**
 * Compute the Levenshtein distance between two strings.
 * Uses a dynamic programming approach with O(m * n) time and O(min(m, n)) space.
 *
 * @param a - first string
 * @param b - second string
 * @returns the edit distance (integer >= 0)
 */
export function levenshteinDistance(a: string, b: string): number {
  const sa = a ?? "";
  const sb = b ?? "";

  // Shortcut for identical strings
  if (sa === sb) return 0;

  const m = sa.length;
  const n = sb.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Ensure we iterate on the shorter string for space efficiency
  if (m > n) {
    // swap to ensure m <= n
    return levenshteinDistance(b, a);
  }

  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ai = sa.charAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === sb.charAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    // swap prev and curr
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

/**
 * Compute a normalized similarity score between 0 and 1 based on Levenshtein
 * distance. 1 means identical, 0 means completely different.
 *
 * @param a - first string
 * @param b - second string
 * @returns similarity score in [0, 1]
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const sa = (a ?? "").trim();
  const sb = (b ?? "").trim();
  if (sa.length === 0 && sb.length === 0) return 1;
  if (sa.length === 0 || sb.length === 0) return 0;
  const dist = levenshteinDistance(sa, sb);
  const maxLen = Math.max(sa.length, sb.length);
  return 1 - dist / maxLen;
}

export type MatchResult = {
  candidate: string;
  distance: number;
  similarity: number; // 0..1
};

export interface FindClosestOptions {
  /** Maximum number of matches to return (default: 5) */
  limit?: number;
  /** Minimum similarity (0..1) to include a match (default: 0.6) */
  minSimilarity?: number;
  /** If set, also return matches with distance <= this absolute number */
  maxDistance?: number;
}

/**
 * Find the closest matches for `query` from an array of candidate strings.
 * Returns matches sorted by ascending distance (or descending similarity).
 *
 * Example:
 *   findClosestMatches('dinner', ['dinner', 'diner', 'dinning'], { limit: 3 })
 *
 * @param query - user-entered string to match
 * @param candidates - array of candidate strings to search
 * @param opts - optional search options
 * @returns array of MatchResult sorted by best matches first
 */
export function findClosestMatches(
  query: string,
  candidates: string[],
  opts: FindClosestOptions = {},
): MatchResult[] {
  const { limit = 5, minSimilarity = 0.6, maxDistance } = opts;
  const q = (query ?? "").trim();
  if (q.length === 0) return [];

  const normalizedCandidates = candidates || [];

  const results: MatchResult[] = normalizedCandidates
    .map((c) => {
      const cNorm = (c ?? "").trim();
      const distance = levenshteinDistance(
        q.toLowerCase(),
        cNorm.toLowerCase(),
      );
      const similarity = levenshteinSimilarity(q, cNorm);
      return { candidate: cNorm, distance, similarity };
    })
    .filter((r) => {
      if (typeof maxDistance === "number") {
        if (r.distance <= maxDistance) return true;
      }
      return r.similarity >= (minSimilarity ?? 0);
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return results;
}

const levenshteinUtils = {
  levenshteinDistance,
  levenshteinSimilarity,
  findClosestMatches,
};

export default levenshteinUtils;
