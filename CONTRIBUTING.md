# Contributing to ClauseKeeper

## Local setup

See the Quick Start in [README.md](./README.md).

## Branching & commits

- Branch off `main`: `feat/short-description`, `fix/short-description`
- Commit style: [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Keep commits small and focused — one logical change per commit

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four must pass locally — CI runs the same checks and will block merge otherwise.

## Opening a PR

- Fill out the PR template: what changed, why, and how to test it
- Link any related issue
- Rebase on `main` before requesting review — resolve conflicts on your branch, not in the merge queue

## Running tests

```bash
npm run test        # unit tests (Vitest)
npm run test:e2e    # end-to-end (Playwright) — starts a dev server automatically
```
