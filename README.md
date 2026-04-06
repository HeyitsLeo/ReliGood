# ZamGo MVP — Local Skeleton (Mock Mode)

A runnable skeleton of the ZamGo WhatsApp cross-border commerce platform for Zambia.
All external services (OpenAI, WATI, Shopify, 1688) are stubbed with mock adapters,
so you can demo the full "message → AI route → quote → reply" loop without any API keys.

See `MVP.md` for the full PRD + architecture spec.

## Stack

- **Backend**: Fastify 4 + tRPC 11 + BullMQ 5 + Drizzle + Postgres (pgvector) + Redis
- **Admin**: Next.js 15 (App Router) + Tailwind + tRPC React client
- **Shared**: pnpm workspaces · TypeScript 5 · ESM
- **Tests**: Vitest + supertest

## Quick Start (4 steps)

```bash
# 0. prerequisites: Node 20+, pnpm 9+, Docker

# 1. start Postgres (with pgvector) + Redis
docker compose up -d

# 2. install deps
pnpm install

# 3. initialize the database
cp .env.example .env
pnpm db:migrate
pnpm db:seed   # seeds 20 SKUs, 9 config rows, 10 category weights

# 4. run backend + worker + admin in parallel
pnpm dev
```

Open the admin at [http://localhost:3000](http://localhost:3000).
Backend runs on [http://localhost:3001](http://localhost:3001).

## Try it

```bash
# Send one simulated WhatsApp message
pnpm sim --phone +260971234567 --name Mary --text "how much for a robot vacuum cleaner?"

# Or send the 10 sample messages at once
pnpm sim --batch

# Check health
pnpm health
```

Watch:

- the **backend terminal** — see router → matcher → quote pipeline logs
- `logs/outbound.jsonl` — all "sent" WhatsApp replies (mock)
- [http://localhost:3000/requests](http://localhost:3000/requests) — Kanban with new cards
- [http://localhost:3000/inbox](http://localhost:3000/inbox) — recent messages

## Tests

```bash
pnpm test   # runs quote + router + matcher + signature + webhook e2e
```

Tests include:
- `quote.test.ts` — 10 cases for `computeQuote()` formula
- `router.test.ts` — 28 cases for rule-based intent classification
- `matcher.test.ts` — deterministic embedding properties
- `signature.test.ts` — HMAC verification
- `webhook.e2e.test.ts` — full POST flow (requires DB; auto-skips if unavailable)

## Project Layout

```
whatsapp-commerce-mvp/
├── apps/
│   ├── backend/      # Fastify + tRPC + BullMQ worker
│   └── admin/        # Next.js 15 admin panel
├── packages/
│   ├── shared/       # zod schemas, types, constants
│   └── db/           # drizzle schema, migrations, seed
├── scripts/
│   ├── wati-simulator.ts   # CLI: signed POST to webhook
│   └── health-check.ts
├── fixtures/         # 20 SKUs, 10 sample messages, 1688 catalog, FAQ
├── docker-compose.yml
└── .env.example
```

## Switching to Real Adapters

All external integrations live in `apps/backend/src/integrations/<service>/`.
Each has a `mock.ts` and a `real.ts` sharing the same signatures. Set
`ADAPTER_MODE=real` in `.env` and fill in the `real.ts` files.

| Service | Mock behaviour |
|---|---|
| OpenAI chat | Rule-based JSON response |
| OpenAI vision | Filename-keyword hinting |
| OpenAI embedding | **Deterministic hash → 1536-dim** (so pgvector is real) |
| WATI send | Appends to `logs/outbound.jsonl` + console |
| WATI webhook signature | Real HMAC with `WATI_WEBHOOK_SECRET` |
| Shopify Admin API | Reads `fixtures/shopify-products.json` |
| 1688 API | Keyword search over `fixtures/onesix88-catalog.json` |

## Ports

| Service | Port |
|---|---|
| Backend API | 3001 |
| Admin panel | 3000 |
| Postgres | 5432 |
| Redis | 6379 |

Override via `BACKEND_PORT` / `ADMIN_PORT` / `POSTGRES_PORT` / `REDIS_PORT` env vars.

## Expected E2E Log Trace

```
[webhook] signature OK, customer upserted, message inserted
[queue]   job process-inbound:1 picked up
[router]  rule match: product_inquiry (conf 0.9)
[matcher] best "Xiaomi Robot Vacuum …" sim 0.82 → needs_confirmation
[wati-mock] sendText → +260971234567: "We have something similar (82% match)…"
```

## What's NOT in this skeleton (by design)

- Real OpenAI / WATI / Shopify / 1688 / Airtel API calls
- User auth (Clerk)
- Full order state machine (W5)
- Temp listings CRUD (W4)
- Multi-language (ZH / Bemba)
- Monitoring (Sentry / Slack)
- CI/CD, deploy configs

All have adapter interfaces or status stubs ready for Phase 2+ fill-in.
