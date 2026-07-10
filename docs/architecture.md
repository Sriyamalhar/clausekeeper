# Architecture

## Data model

```
Organization ──< Membership >── User
     │
     ├──< Client ──< Contract ──< Milestone
     │                    │
     │                    └──< ClauseFlag
     │
     └──< ActivityLog
```

- **Organization** is the tenancy boundary. Every query that touches `Client`, `Contract`,
  `Milestone`, or `ClauseFlag` is scoped through `orgId`, enforced server-side in
  `src/server/authz.ts` (`assertOwnsResource`) — never trusted from a client-supplied field.
- **Membership** joins User ↔ Organization with a role (`owner`/`admin`/`member`/`viewer`).
  v1 exposes one org per user in the UI, but the schema already supports multi-org
  membership without a migration.
- **Contract.status** stores explicit user actions (`draft`, `active`, `terminated`).
  `expiring` and `expired` are *not* stored — they're computed at read time from `endDate`
  in `src/lib/contract-status.ts`. This avoids needing a background cron job to keep a
  stored status in sync with the calendar, and it's always correct even if a cron hasn't
  run recently.
- **ClauseFlag** rows are the output of the AI extraction feature — one row per detected
  clause, with a risk level and confidence score, editable/dismissable by the user.

## Auth & authorization

- Auth.js (NextAuth) with two providers: Credentials (email + Argon2id-hashed password)
  and Google OAuth.
- Sessions use the JWT strategy (required for the Credentials provider) with httpOnly,
  Secure, SameSite=Lax cookies. The JWT carries `orgId` and `role` so authorization checks
  don't need an extra DB round-trip per request beyond the initial membership lookup.
- Every mutating route calls `requireAuth()` first (resolves session → org/role from the
  DB, not from client input), then `requireRole()` where a minimum role applies, then
  `assertOwnsResource()` on the specific record being touched. Role checks alone are not
  sufficient — row-level scoping is what actually prevents cross-org data access.
- Email/password login always runs `verifyPassword` against a real or dummy Argon2id hash
  regardless of whether the account exists, so response timing doesn't leak which emails
  are registered.

## Non-obvious decisions & trade-offs

**Why compute `expiring`/`expired` instead of storing it?**
A stored status requires a scheduled job to keep it current, and if that job fails
silently, dashboards quietly go stale. Computing it from `endDate` at read time means
it's always correct, at the cost of a small amount of CPU per request — a fine trade for
this scale.

**Why cursor pagination instead of offset?**
Offset pagination (`LIMIT/OFFSET`) degrades badly past ~10k rows and produces duplicate/
skipped rows if data changes between page loads. Cursor pagination (`WHERE id > :cursor`)
stays fast and stable regardless of table size.

**Why re-extract clauses by replacing, not appending?**
If a user re-uploads a corrected contract PDF, appending would leave stale flags from the
old version mixed with new ones. Extraction replaces all non-dismissed flags in a single
transaction — flags the user has already dismissed are left alone, since dismissal is a
human judgment that shouldn't be undone by a re-run.

**Why is AI risk rated from the freelancer's perspective, not "generic legal risk"?**
A generic contract-analysis tool rates risk neutrally. This product is opinionated: an
unlimited-exclusivity or perpetual-usage-rights clause is objectively bad *for the
freelancer specifically*, even if it's standard boilerplate from the client's perspective.
That's the product's actual point of view, not an oversight.

## AI clause extraction pipeline

1. User uploads a contract PDF → stored via Vercel Blob, `fileUrl` saved on the Contract
2. User triggers extraction → server fetches the PDF, extracts text (`pdf-parse`, capped
   at ~15k characters to bound prompt cost/latency)
3. Text sent to Claude with a system prompt scoped to six clause categories, risk-rated
   for the freelancer
4. Response is strictly validated against a Zod schema before anything is trusted or
   written to the database — a malformed or unexpected response fails loudly rather than
   silently storing garbage
5. Flags are shown to the user for review: confirm (implicit, by leaving it), edit, or
   dismiss
