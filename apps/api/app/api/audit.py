from fastapi import APIRouter

from app.services.matching import get_audit_trail

router = APIRouter(tags=["audit"])


@router.get("/audit")
async def audit_trail():
    """Return append-only audit events for reconciliation actions."""
    return {"events": get_audit_trail()}
