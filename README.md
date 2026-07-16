<div align="center">
  <img src="./assets/icon.png" alt="ReconcileIQ Logo" width="120" height="120" />

  <h1>ReconcileIQ</h1>

  <p><strong>Motor de matching para pedidos, pagamentos e taxas — exact/fuzzy, confiança e inbox de exceções.</strong></p>
  <p><strong>Matching engine for orders, payments and fees — exact/fuzzy, confidence and exception inbox.</strong></p>

  <p>
    <a href="#pt-br">PT-BR</a> ·
    <a href="#en">English</a> ·
    <a href="#live-demo">Live Demo</a> ·
    <a href="#stack--tecnologias">Stack</a> ·
    <a href="#arquitetura--architecture">Architecture</a> ·
    <a href="#quick-start--início-rápido">Quick Start</a> ·
    <a href="#autor--author">Author</a>
  </p>

  <p>
    <a href="https://reconcile-iq-eight.vercel.app"><img alt="Live Demo" src="https://img.shields.io/badge/Live%20Demo-reconcile--iq--eight.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" /></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-React-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Python" src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img alt="Lab Demo" src="https://img.shields.io/badge/Status-Lab%20demo-2563EB?style=for-the-badge" />
    <img alt="MIT" src="https://img.shields.io/badge/License-MIT-111827?style=for-the-badge" />
  </p>

  <p>
    <a href="https://reconcile-iq-eight.vercel.app"><strong>Live Demo</strong></a> ·
    <a href="https://github.com/BarujaFe1/ReconcileIQ"><strong>Repositório</strong></a> ·
    <a href="https://barujafe.vercel.app/"><strong>Portfólio</strong></a> ·
    <a href="https://www.linkedin.com/in/barujafe/"><strong>LinkedIn</strong></a>
  </p>
</div>

<p align="center">
  <img src="./assets/hero-cover.png" alt="ReconcileIQ overview" width="100%" />
</p>

---

<a id="pt-br"></a>

## PT-BR

## Visão geral

**ReconcileIQ** cruza pedidos, pagamentos e fees com matching exact/fuzzy, scores de confiança e uma inbox priorizada de exceções. Complementar ao OpsLedger.

> **Aviso de lab:** demo de portfólio com dados sintéticos/amostra. Não é produto em produção com SLA, integrações reais de clientes ou garantia operacional.

---

## Problema

Exports de marketplace, gateway e planilhas raramente batem 1:1. Sem scores e priorização, a conciliação vira caça manual.

---

## Para quem

- Operações de e-commerce e finops leve
- Analistas de conciliação
- Quem já viu o OpsLedger e quer o motor de matching

---

## Funcionalidades

- Matching exact e fuzzy (RapidFuzz)
- Scores de confiança
- Inbox de exceções priorizada
- Seed sintético
- Posicionamento documentado vs OpsLedger

---

## Escopo e limites

- **É:** lab de matching e exceções.
- **Não é:** ERP, conciliação bancária completa, clone de marketplace, substituto do OpsLedger.

---

<a id="en"></a>

## English

## Overview

**ReconcileIQ** matches orders, payments and fees with exact/fuzzy linkage, confidence scores and a prioritized exception inbox. Complementary to OpsLedger.

> **Lab notice:** portfolio demo with synthetic/sample data. Not a production product with SLA, real customer integrations, or operational guarantees.

---

## Problem

Marketplace, gateway and spreadsheet exports rarely match 1:1. Without scores and prioritization, reconciliation becomes manual hunting.

---

## Who it is for

- E-commerce ops and light finops
- Reconciliation analysts
- Anyone who saw OpsLedger and wants the matching engine

---

## Features

- Exact and fuzzy matching (RapidFuzz)
- Confidence scores
- Prioritized exception inbox
- Synthetic seed
- Documented positioning vs OpsLedger

---

## Scope and limits

- **Is:** matching and exceptions lab.
- **Is not:** ERP, full bank reconciliation, marketplace clone, OpsLedger replacement.

---

<a id="live-demo"></a>

## Live Demo

**URL:** [https://reconcile-iq-eight.vercel.app](https://reconcile-iq-eight.vercel.app)

Demo hospedada para avaliação de portfólio / Hosted for portfolio review.

> Lab demo — synthetic / sample data unless noted. Not a production SLA product.

---

<a id="stack--tecnologias"></a>

## Stack / Tecnologias

| Tecnologia | Uso no projeto |
|---|---|
| Next.js 15 / React 19 / TypeScript | UI |
| Recharts / Lucide | Visualização |
| FastAPI / Pandas / NumPy | API de matching |
| RapidFuzz | Fuzzy linkage |
| Pytest / Ruff | Testes |

---

<a id="arquitetura--architecture"></a>

## Arquitetura / Architecture

Monorepo pps/api + pps/web, seeds em data/, docs de metodologia e comparação com OpsLedger.

`	xt
ReconcileIQ/
├── apps/
│   ├── api/
│   └── web/
├── assets/
├── data/seed/
├── docs/
│   └── opsledger_vs_reconcileiq.md
├── scripts/
├── start.bat
└── vercel.json
`

---

<a id="quick-start--início-rápido"></a>

## Quick Start / Início rápido

### Pré-requisitos / Requirements

- Node.js 20+
- Python 3.12+
- npm

### Clonar / Clone

`ash
git clone https://github.com/BarujaFe1/ReconcileIQ.git
cd ReconcileIQ
`

### Windows (atalho)

`at
start.bat
`

Sobe API em :8000 e web em :3000.

### Manual

`ash
# API
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
`

`ash
# Web (outro terminal)
cd apps/web
npm install
npm run dev
`

Abra http://localhost:3000

Copie .env.example se precisar de NEXT_PUBLIC_API_URL.


---

## Technical decisions / Decisões técnicas

- **RapidFuzz** para fuzzy transparente e testável.
- **Inbox por confiança** em vez de só lista de erros.
- **Complementar ao OpsLedger**, não duplicar o fechamento executivo.

---

## Roadmap

### Implementado
- Exact/fuzzy match, scores, inbox, demo Vercel

### Planejado
- Mais regras de fee
- Feedback de matches manuais
- Export de exceções

---

<a id="autor--author"></a>

## Autor / Author

Developed by **Felipe Alirio Baruja**.

- **Portfolio:** [https://barujafe.vercel.app/](https://barujafe.vercel.app/)
- **GitHub:** [github.com/BarujaFe1](https://github.com/BarujaFe1)
- **LinkedIn:** [linkedin.com/in/barujafe](https://www.linkedin.com/in/barujafe/)
- **Repository:** [github.com/BarujaFe1/ReconcileIQ](https://github.com/BarujaFe1/ReconcileIQ)

---

## License / Licença

MIT License.

See [LICENSE](./LICENSE) for details.

---

<div align="center">
  <p><strong>ReconcileIQ</strong></p>
  <p>Matching com confiança e exceções priorizadas.</p>
  <p><em>Matching with confidence and prioritized exceptions.</em></p>
</div>
