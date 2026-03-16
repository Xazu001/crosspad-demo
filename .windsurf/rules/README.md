---
trigger: model_decision
description: Overview of all development rules and their purposes. Use this as a directory to find relevant rules for your task.
---

# Development Rules

All rules use `model_decision` trigger and are loaded contextually based on the task.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CODEBASE STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  server/                    ◀── PURE SERVER-SIDE (never in browser bundle)   │
│  ├── services/              Business logic (AuthService, KitService, etc.)  │
│  ├── api/                   Hono REST endpoints                              │
│  ├── database/              Drizzle/Kysely/D1 layer                          │
│  ├── cloudflare/            Workers, crons, queues, KV                       │
│  └── lib/                   Server utilities (decorators, response, crypto)  │
│                                                                              │
│  app/                       ◀── HYBRID (client + server-side features)       │
│  ├── routes/                React Router routes                              │
│  │   ├── *.tsx              Client components (browser)                      │
│  │   ├── *.server.tsx       Server-only exports (RouteService, loader/action)│
│  │   ├── loader/action      Server-side data fetching & mutations             │
│  │   └── RouteService       Route-scoped service logic (extends BaseService) │
│  ├── components/            React components (UI, custom, pages)              │
│  ├── lib/                   Client utilities (hooks, stores, router helpers)│
│  └── style/                 Global SCSS                                      │
│                                                                              │
│  shared/                    ◀── SHARED (available to both server & app)      │
│  ├── constants/             Site config, categories                          │
│  ├── validators/            Zod schemas                                       │
│  ├── utils/                 Typed submit, helpers                            │
│  └── enums/                 TypeScript enums                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Rules

| File                | When to use                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **core.md**         | Naming (kebab-case, BEM, PascalCase), exports, type safety                               |
| **tokens.md**       | Colors, typography, spacing, UI component variants                                       |
| **comments.md**     | When/how to comment code                                                                 |
| **aliases.md**      | Import paths (`#/` app, `$/` server, `@/` shared)                                        |
| **app.md**          | App structure: client-side (hooks, stores) + server-side (loaders/actions, RouteService) |
| **server.md**       | Pure server: services, database, API, decorators, response systems                       |
| **components.md**   | React components, CVA variants, layouts, a11y                                            |
| **styling.md**      | SCSS units, colors, file co-location                                                     |
| **typed-submit.md** | Multi-action route forms                                                                 |

## Quick Decision Matrix

| What you're doing            | Read these rules                     |
| ---------------------------- | ------------------------------------ |
| Creating a new route         | `app.md`, `server.md` (RouteService) |
| Adding a loader/action       | `app.md`, `server.md` (decorators)   |
| Building a React component   | `components.md`, `tokens.md`         |
| Adding server business logic | `server.md` (services, decorators)   |
| Creating a REST API endpoint | `server.md` (API responses)          |
| Writing SCSS styles          | `styling.md`, `tokens.md`            |
| Multi-submit form handling   | `typed-submit.md`, `app.md`          |
