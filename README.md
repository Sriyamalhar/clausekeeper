# ClauseKeeper

> Contract and licensing tracking for freelance creatives — AI flags the usage-rights, exclusivity, and renewal clauses that actually matter.

**Live demo →** _add your deployed URL here after deploying_
**Demo login →** `demo@demo.com` / `demo1234`

## Features

- Track clients and contracts with full CRUD, search, filter, sort, and pagination
- Server-side RBAC (owner/admin/member/viewer) with row-level org scoping — never trust-the-client
- Upload a contract PDF and get AI-extracted clause flags: usage rights, exclusivity, licensing renewal, payment terms, termination, liability cap — risk-rated from the freelancer's perspective
- Milestone tracking with a dashboard surfacing what's expiring soon and what's overdue
- Real auth: email/password (Argon2id) + Google OAuth, email verification, rate-limited login/reset
- Immutable activity log across every mutation
- Designed empty/loading/error states throughout — no blank screens, no generic spinners

## Tech Stack

Next.js 14 (App Router) · TypeScript (strict) · PostgreSQL + Prisma · Auth.js · Tailwind CSS · Zod · TanStack Query · Anthropic API (clause extraction) · Vercel Blob (file storage) · Vercel (hosting)

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/clausekeeper && cd clausekeeper
cp .env.example .env   # then fill in values — see table below
npm install
npm run db:migrate && npm run db:seed
npm run dev             # http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (Supabase, Neon, or local) |
| `AUTH_SECRET` | Session signing secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` in dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — enables "Continue with Google" |
| `ANTHROPIC_API_KEY` | Required for AI clause extraction — server-side only, never exposed to the client |
| `RESEND_API_KEY` / `MAIL_FROM` | Optional — without these, emails log to the console in dev |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for contract PDF storage |

## Architecture

Full write-up in [`docs/architecture.md`](./docs/architecture.md) — data model diagram, the
auth/authorization model, and the non-obvious decisions (why status is computed not stored,
why cursor pagination, why extraction replaces rather than appends).

API endpoint reference: [`docs/api.md`](./docs/api.md).

## Testing

```bash
npm run test        # unit tests (Vitest) — RBAC boundary cases, contract-status date logic
npm run test:e2e     # e2e (Playwright) — critical path: login, create client + contract
```

## Roadmap

- [x] Auth, RBAC, CRUD, AI clause extraction, dashboard
- [ ] E-signature collection
- [ ] Multi-currency support
- [ ] Recurring/templated contract generation
- [ ] Native mobile app

## Screenshots

_Add screenshots of the dashboard, contract detail (with clause flags), and contracts list here after deploying — `docs/screenshots/`._

## License

MIT — see [LICENSE](./LICENSE).

---

Built for the [Digital Heroes](https://digitalheroesco.com) Full Stack Developer trial task.
