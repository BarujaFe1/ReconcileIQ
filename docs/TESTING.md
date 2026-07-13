# Testing — ReconcileIQ

## Backend (`apps/api`)

```bash
cd apps/api
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
ruff check app tests
```

Coverage focus:
- health/demo/reconcile endpoints;
- exception prioritization;
- resolve preserves status across reruns;
- Unicode normalization;
- presence of exact, fuzzy, orphan signals on demo seed.

## Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run lint
npm run build
```

Vitest covers:
- normalize/diacritics;
- confidence/severity helpers;
- demo reconciliation signals;
- exception priority order;
- audit dedupe for `exception_opened`;
- resolve status preservation.

## Manual demo checklist

1. Open workbench → KPIs populate.
2. Filter Exact / Fuzzy / Exceptions.
3. Select a fuzzy pair → diff viewer shows both sides.
4. Resolve an exception → status + audit update.
5. Download CSVs → three files download.
6. Confirm OpsLedger contrast copy is visible.
