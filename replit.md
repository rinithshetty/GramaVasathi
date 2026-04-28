# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Houses **Grama Vasathi**, a rural homestay booking platform that connects travelers with village hosts across India.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind + wouter + TanStack Query

## Artifacts

- `artifacts/grama-vasathi` — React + Vite frontend (served at `/`)
- `artifacts/api-server` — Express API server (served at `/api`)
- `artifacts/mockup-sandbox` — design canvas

## Domain model

- `homestays` — hostable rural stays (name, host, village, region, price, rating, activities, etc.)
- `bookings` — guest reservations (one per check-in date per homestay)
- `checklists` — host readiness checklist per homestay (8 items, 0–100 score)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-grama-vasathi` — reseed homestays/bookings/checklists

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
