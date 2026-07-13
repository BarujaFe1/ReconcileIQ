/** Shared matching thresholds (keep aligned with apps/api/app/services/thresholds.py). */

export const AMOUNT_TOLERANCE = 0.5;
export const FUZZY_AMOUNT_TOLERANCE = 1.0;
export const FUZZY_CANDIDATE_THRESHOLD = 70;
export const FUZZY_MATCH_CONFIDENCE = 75;

export const SEVERITY_RANK = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;
