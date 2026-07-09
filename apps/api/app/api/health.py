from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "reconcileiq-api",
        "version": "0.1.0",
        "notice": "Matching includes exact refs, RapidFuzz candidates and human exception resolution.",
    }
