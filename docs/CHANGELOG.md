# Changelog — portfolio elevation

## 2026-07-13 — Persist audit + parity + real screenshots

### Added
- Durable API audit store (`data/audit/*.jsonl` + exception state JSON)
- Browser localStorage persistence for audit/exception state
- Golden corpus `data/golden/demo_fingerprint.json` + TS/Python parity tests
- Playwright screenshot capture script (`apps/web/scripts/capture_screenshots.cjs`)
- Real UI screenshots / hero / social preview from local demo
- `docs/DEMO_SCRIPT.md`, `docs/PORTFOLIO_HANDOFF.md`, `docs/CHANGELOG.md`

### Changed
- Matching engines export stable fingerprints (status/method/severity)
- README claims tightened to honest MVP language
- KPI label contrast improved

### Fixed
- Audit no longer lost on API process restart (local disk)
- Exception resolution status survives reload (API disk + browser storage)
- Fingerprint sort parity between TS and Python
