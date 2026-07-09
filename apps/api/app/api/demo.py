from fastapi import APIRouter

from app.services.demo_data import load_demo_summary
from app.services.matching import run_reconciliation

router = APIRouter(tags=["demo"])


@router.get("/demo")
async def demo_dataset():
    """Return summary of the synthetic orders/payments/fees demo datasets."""
    summary = load_demo_summary()
    result = run_reconciliation()
    summary["matched"] = result["summary"]["matched_count"] + result["summary"]["fuzzy_count"]
    summary["exceptions"] = result["summary"]["exception_count"]
    summary["leakage_total"] = result["summary"]["leakage_total"]
    return summary
