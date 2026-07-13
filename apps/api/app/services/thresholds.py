"""Shared reconciliation thresholds and scoring helpers."""

from __future__ import annotations

import unicodedata
from typing import Any

AMOUNT_TOLERANCE = 0.5
FUZZY_AMOUNT_TOLERANCE = 1.0
FUZZY_CANDIDATE_THRESHOLD = 70.0
FUZZY_MATCH_CONFIDENCE = 75.0

SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def normalize_text(value: Any) -> str:
    """Lowercase, trim and strip diacritics for cross-source matching."""
    if value is None:
        return ""
    text = str(value).strip().lower()
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def severity_from_impact(impact: float) -> str:
    abs_impact = abs(impact)
    if abs_impact >= 150:
        return "critical"
    if abs_impact >= 60:
        return "high"
    if abs_impact >= 20:
        return "medium"
    return "low"


def confidence_exact(amount_delta: float, fee_delta: float) -> float:
    score = 98.0
    score -= min(25.0, abs(amount_delta) * 0.4)
    score -= min(15.0, abs(fee_delta) * 0.5)
    return round(max(70.0, score), 1)


def confidence_fuzzy(name_score: float, ref_score: float, amount_delta: float) -> float:
    base = 0.55 * name_score + 0.35 * ref_score
    base -= min(30.0, abs(amount_delta) * 0.5)
    return round(max(40.0, min(92.0, base)), 1)


def sort_exceptions(exceptions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        exceptions,
        key=lambda item: (
            SEVERITY_RANK.get(str(item.get("severity", "low")), 99),
            -float(item.get("financial_impact", 0.0)),
        ),
    )
