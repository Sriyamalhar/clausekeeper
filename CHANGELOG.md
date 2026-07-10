# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-10

### Added
- Authentication: email/password (Argon2id) + Google OAuth, email verification, password reset
- Server-side RBAC with row-level org scoping (owner/admin/member/viewer)
- Client and contract CRUD with server-side search, filter, sort, and cursor pagination
- Milestone tracking with optimistic status toggling
- AI-assisted clause extraction tuned to freelance-creative licensing terms
  (usage rights, exclusivity, licensing renewal, payment terms, termination, liability cap)
- Dashboard: contracts expiring soon, overdue milestones, open high-risk flags
- Immutable activity log across all mutations
- Design system: teal-accent visual identity, RiskTab signature element
- Landing page with SEO metadata, JSON-LD structured data, sitemap, robots.txt
- Unit tests (RBAC boundary cases, contract-status date logic) and an e2e critical-path test
- CI pipeline: lint, typecheck, unit tests, build — on every push and PR
