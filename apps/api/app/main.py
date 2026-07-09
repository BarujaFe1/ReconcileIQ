from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import audit, demo, health, reconcile

app = FastAPI(
    title="ReconcileIQ API",
    description=(
        "Reconciliation intelligence: exact/fuzzy matching across orders, payments "
        "and fees with confidence scores, exception inbox and append-only audit trail."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(demo.router, prefix="/api")
app.include_router(reconcile.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
