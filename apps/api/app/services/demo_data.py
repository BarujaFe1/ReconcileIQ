from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
SEED = ROOT / "data" / "seed"


def _read(name: str) -> pd.DataFrame:
    path = SEED / name
    if not path.exists():
        raise FileNotFoundError(f"Demo seed missing: {path}")
    return pd.read_csv(path)


def load_orders() -> pd.DataFrame:
    return _read("orders_demo.csv")


def load_payments() -> pd.DataFrame:
    return _read("payments_demo.csv")


def load_fees() -> pd.DataFrame:
    return _read("fees_demo.csv")


def load_demo_summary() -> dict:
    orders = load_orders()
    payments = load_payments()
    fees = load_fees()
    return {
        "orders": int(len(orders)),
        "payments": int(len(payments)),
        "fees": int(len(fees)),
        "matched": 0,
        "exceptions": 0,
        "leakage_total": 0.0,
        "currency": "BRL",
        "notice": (
            "Synthetic marketplace demo: orders, payments and fees with intentional "
            "exact matches, fuzzy matches, fee anomalies and unmatched exceptions."
        ),
    }
