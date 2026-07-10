# API Reference

All routes are Next.js Route Handlers under `src/app/api/`. All routes except
`/api/auth/*` require an authenticated session (enforced via `requireAuth()`
server-side). Responses are JSON.

## Auth

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create user + org, sends verification email |
| GET | `/api/auth/verify` | No | Consumes email verification token |
| POST | `/api/auth/reset-password/request` | No | Request password reset email |
| POST | `/api/auth/reset-password/confirm` | No | Set new password with reset token |
| * | `/api/auth/[...nextauth]` | — | Auth.js session/OAuth handling |

## Clients

| Method | Path | Description |
|---|---|---|
| GET | `/api/clients` | List clients in the caller's org |
| POST | `/api/clients` | Create a client |
| GET | `/api/clients/:id` | Get a single client |
| PATCH | `/api/clients/:id` | Update a client |
| DELETE | `/api/clients/:id` | Soft-delete (blocked if active contracts reference it) |

## Contracts

| Method | Path | Description |
|---|---|---|
| GET | `/api/contracts?q=&status=&clientId=&sort=&order=&cursor=&limit=` | Search/filter/sort/paginate |
| POST | `/api/contracts` | Create a contract |
| GET | `/api/contracts/:id` | Get a contract with client, milestones, active clause flags |
| PATCH | `/api/contracts/:id` | Update a contract (returns the mutated record) |
| DELETE | `/api/contracts/:id` | Soft-delete a contract |
| POST | `/api/contracts/:id/upload` | Upload contract PDF (multipart/form-data, `file` field) |
| POST | `/api/contracts/:id/extract-clauses` | Run AI clause extraction against the uploaded PDF |

## Milestones

| Method | Path | Description |
|---|---|---|
| POST | `/api/milestones` | Create a milestone (`contractId` in body) |
| PATCH | `/api/milestones/:id` | Update a milestone |
| DELETE | `/api/milestones/:id` | Delete a milestone |

## Clause flags

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/clause-flags/:id` | Edit or dismiss an AI-extracted flag |

## Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Expiring-soon contracts, overdue milestones, active count, open high-risk flags |

## Error format

```json
{ "error": "Human-readable message", "issues": { "fieldErrors": { "email": ["Invalid email"] } } }
```

`issues` is only present on 400 validation errors (from Zod). Status codes: `400` invalid
input, `401` not authenticated, `403` forbidden (wrong org or insufficient role), `404` not
found, `429` rate limited (includes `Retry-After` header), `500` unexpected server error.
