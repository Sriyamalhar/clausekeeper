# ClauseKeeper — Project Plan

## One-line pitch
Contract, licensing, and deliverable tracking built for freelance creatives and small creative agencies — video editors, photographers, and designers — with an AI assistant that reads an uploaded client contract and flags the terms that actually bite: usage-rights scope, exclusivity, licensing renewal, payment schedule, and termination notice.

## Problem
Freelance creatives sign contracts full of licensing and usage-rights language that's easy to skim past and expensive to get wrong — a client using footage beyond the agreed scope, an exclusivity clause blocking other work, a licensing term quietly auto-renewing. Generic contract-lifecycle tools are built for legal/procurement teams at large companies; nothing lightweight exists for a solo editor or small creative studio juggling a dozen client contracts with wildly different licensing terms. Today this lives in scattered PDFs, email threads, and memory.

## Who it's for
Freelance video editors, photographers, and designers, and small creative agencies (2–10 people) doing client work where licensing/usage-rights terms vary contract to contract.

## Niche framing (why this, not generic CLM)
- Clause flags are tuned to this domain specifically: usage-rights scope, exclusivity, licensing renewal, in addition to the universal payment/termination terms
- Vocabulary, empty states, and onboarding copy speak to "client work" and "deliverables," not "vendors" or "procurement"
- This is the detail that separates it from the 10 generic contract trackers a reviewer has already seen

## Core entities

- **User** — id, email, passwordHash, name, role (owner/admin/member/viewer), createdAt
- **Organization** — id, name, ownerId, createdAt (supports multi-user agencies)
- **Membership** — userId, orgId, role (join table for RBAC)
- **Client** — id, orgId, name, contactEmail, contactName, notes, createdAt
- **Contract** — id, orgId, clientId, title, status (draft/active/expiring/expired/terminated), startDate, endDate, autoRenews (bool), renewalNoticeDays, valueAmount, valueCurrency, fileUrl, createdById, createdAt, updatedAt, deletedAt (soft delete)
- **ClauseFlag** — id, contractId, clauseType (payment_terms/termination/usage_rights/exclusivity/licensing_renewal/liability_cap/other), extractedText, riskLevel (low/medium/high), aiConfidence, createdAt — AI-extracted flags, editable/dismissable by user
- **Milestone** — id, contractId, title, dueDate, status (pending/in_progress/done/overdue), amount (nullable, for payment milestones), createdAt
- **ActivityLog** — id, orgId, actorId, entityType, entityId, action, metadata (json), createdAt — immutable audit trail

## Core user flows (v1)

1. **Sign up → create org → land on empty dashboard** with a clear "Add your first client" CTA
2. **Add a client → add a contract** (manual entry OR upload a PDF)
3. **Upload contract PDF → AI extracts clause flags** (payment terms, termination, usage-rights scope, exclusivity, licensing renewal) → user reviews flags (confirm/edit/dismiss) → flags become part of the contract record
4. **Dashboard** shows: contracts expiring in next 30 days, overdue milestones, at-a-glance risk flags across active contracts
5. **Contract detail page**: full info, milestones list (add/edit/complete), clause flags, activity log for that contract
6. **Search/filter contracts** by client, status, date range; sort by end date or value
7. **Team members** (if org has >1 user): invite via email, assign role, RBAC enforced server-side
8. **Export**: CSV of contracts + milestones for a given date range

## Out of scope for v1 (roadmap items, stated honestly in README)
- E-signature collection
- Multi-currency conversion / accounting integration
- Recurring/templated contract generation
- Mobile app (responsive web only)

## Acceptance criteria (high-level, per flow)
- A new user can go from signup to a fully created first contract with milestones in under 3 minutes with no documentation
- Uploading a contract PDF and getting back at least payment-terms + termination flags within ~10s (or a clear loading state if longer)
- All contract/milestone data persists across refresh and is scoped strictly to the user's org — verified by RBAC tests (a viewer from Org A can never read Org B's data, even by guessing IDs)
- Dashboard "expiring soon" and "overdue milestones" calculations are correct against real date math (timezone-safe)
- Every mutation shows optimistic UI or an explicit pending state — no double-submit possible

## Data shape questions / assumptions (resolved)
- Single organization per user for v1 simplicity, with room to extend (Membership table already supports multi-org, just not exposed in UI yet)
- AI clause extraction runs server-side against the uploaded PDF text (extracted via pdf-parse), sent to Claude via API route — never exposes the API key client-side
- File storage: uploaded contract PDFs stored via a signed-URL flow (Vercel Blob or Supabase Storage) — never stored as base64 in Postgres

## Tech stack (locked)
Next.js 14 App Router · TypeScript strict · PostgreSQL + Prisma · Auth.js (credentials + Google OAuth) · Tailwind + shadcn/ui · Zod · TanStack Query · Vercel · Vitest + Playwright

## Milestone build order
1. Schema + types (this doc → prisma schema → shared types)
2. Auth + RBAC middleware
3. Client + Contract CRUD (no AI yet)
4. Milestone CRUD + dashboard aggregation queries
5. AI clause-extraction feature (upload → parse → flag)
6. Search/filter/pagination + polished UI states (empty/loading/error)
7. Tests, CI, SEO/meta, docs, deploy config
