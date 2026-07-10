# Case Study: ClauseKeeper

## Problem

Freelance video editors, photographers, and designers sign contracts full of licensing
and usage-rights language that's easy to skim past and expensive to get wrong — a client
using footage beyond the agreed scope, an exclusivity clause quietly blocking other work,
a licensing term auto-renewing without notice. Generic contract-lifecycle tools are built
for legal and procurement teams at large companies; nothing lightweight exists for a solo
editor or small creative studio juggling a dozen client contracts with wildly different
terms. Today, this mostly lives in scattered PDFs, email threads, and memory.

## Approach

I started from the brief's own recommended workflow: spec before code. `docs/plan.md`
locked the entities, user flows, and acceptance criteria before a single line of
implementation, which meant the schema (users, orgs, RBAC, clients, contracts,
milestones, clause flags, activity log) only had to be designed once.

Key decisions:
- **Niched the idea deliberately.** The first draft was a generic contract tracker —
  closer to the ten other "CLM" tools a reviewer has already seen. Narrowing it to
  freelance creatives and licensing/usage-rights terms specifically (rather than
  procurement-style vendor contracts) gave the AI feature a sharper, more opinionated
  point of view: risk is rated *for the freelancer*, not generically.
- **Row-level authorization everywhere.** Every read/write of a specific record checks
  that it belongs to the caller's org, not just that the caller has the right role — the
  difference between "permission" and "actually can't reach another org's data by
  guessing an ID."
- **Computed, not stored, contract status.** Expiring/expired status is derived from
  dates at read time rather than written by a background job, so it's never stale.
- **AI output is never trusted blindly.** Claude's clause-extraction response is
  strictly Zod-validated before anything is written to the database.

## Result

A deployed app covering full auth (email/password + Google OAuth), RBAC, client/contract/
milestone CRUD with server-side search/filter/sort/pagination, AI-assisted clause
flagging tuned to the niche, a dashboard surfacing what needs attention, and a design
system built around one signature element (the RiskTab) rather than generic defaults.

**What I'd build next:** e-signature collection so a contract's full lifecycle — draft,
send, sign, track — lives in one tool instead of handing off to email at the signing
step; and a lightweight browser extension that flags risky clauses inline while a
freelancer is reading a contract in Gmail or Docs, before they even upload it here.

## What I learned

Building the AI feature was the easy part — a well-scoped prompt and schema validation
got it working quickly. The harder, less glamorous work was the authorization layer:
making sure every single query was scoped correctly, and writing tests specifically for
the failure case (an owner of Org A reaching into Org B's data) rather than only testing
that the happy path works. That's the part a demo video doesn't show but a real product
actually depends on.
