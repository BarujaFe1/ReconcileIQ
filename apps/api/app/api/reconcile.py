from fastapi import APIRouter, HTTPException

from app.models.schemas import ResolveRequest
from app.services.matching import resolve_exception, run_reconciliation

router = APIRouter(tags=["reconcile"])


@router.post("/reconcile")
@router.get("/reconcile")
async def reconcile():
    """Run exact + fuzzy reconciliation over demo seed files."""
    return run_reconciliation()


@router.post("/exceptions/resolve")
async def resolve(body: ResolveRequest):
    try:
        return resolve_exception(body.exception_id, body.action, body.note, body.actor)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
