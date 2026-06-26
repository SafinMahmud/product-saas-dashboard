# Product SaaS Dashboard

A mini SaaS product management dashboard built for a Senior Full Stack Developer take-home challenge. Authenticated users can manage products, view analytics, and access features based on their role (admin or viewer).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Firebase Auth · Firestore · Tailwind CSS · shadcn/ui

---

## Quick start (< 5 minutes)

### Prerequisites

- Node.js 20+
- A [Firebase project](https://console.firebase.google.com/) with **Email/Password** auth enabled and **Firestore** created

### 1. Clone and install

```bash
git clone <your-repo-url>
cd product-saas-dashboard
npm install
```

### 2. Configure Firebase

1. In Firebase Console → Project Settings → **General**, copy your web app config.
2. In Project Settings → **Service accounts**, generate a new private key (JSON).
3. Copy `.env.example` to `.env.local` and fill in values (see **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for full Firebase setup):

```bash
cp .env.example .env.local
```

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key` (keep `\n` escapes) |
| `ADMIN_EMAILS` | Comma-separated emails that get **admin** role on signup |

4. Deploy Firestore rules and indexes (optional but recommended):

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with an email listed in `ADMIN_EMAILS` for admin access; all other signups receive the **viewer** role.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  AuthProvider · Dashboard UI · Product CRUD forms               │
│  Firebase Client SDK (sign-in/sign-up only)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ ID token → POST /api/auth/session
                            │ httpOnly session cookie
┌───────────────────────────▼─────────────────────────────────────┐
│                    Next.js (App Router)                          │
│  middleware.ts ── route protection (cookie presence)            │
│  API Routes ──── session verify + role enforcement              │
│  lib/data/products.ts ── Firestore data access layer            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Firebase Admin SDK
┌───────────────────────────▼─────────────────────────────────────┐
│              Firebase (Auth + Firestore)                         │
│  users/{uid} · products/{id}                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key modules

| Path | Responsibility |
|------|----------------|
| `src/lib/firebase/client.ts` | Browser Firebase Auth |
| `src/lib/firebase/admin.ts` | Server Firebase Admin (Auth + Firestore) |
| `src/lib/auth/server-auth.ts` | Session verification, role lookup, RBAC helpers |
| `src/lib/data/products.ts` | **Data access layer** — all Firestore product operations |
| `src/lib/api/helpers.ts` | `withAuth` / `withAdmin` wrappers for API routes |
| `src/middleware.ts` | Redirect unauthenticated users away from protected pages |

---

## Database schema

### Collection: `users`

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email from Firebase Auth |
| `role` | `"admin"` \| `"viewer"` | Access level |
| `createdAt` | ISO string | Account creation timestamp |

**Document ID:** Firebase Auth `uid`

### Collection: `products`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name (max 200 chars) |
| `category` | string | Product category |
| `price` | number | Price in USD |
| `status` | `"active"` \| `"inactive"` | Product availability |
| `createdAt` | ISO string | Creation timestamp |
| `updatedAt` | ISO string | Last update timestamp |
| `createdBy` | string | UID of creating user |

**Document ID:** Auto-generated Firestore ID

### Indexing strategy

Composite indexes are defined in `firestore.indexes.json` for common query patterns:

- Filter by `category` + sort by `createdAt`
- Filter by `status` + sort by `createdAt` / `price`
- Filter by `category` + `status` + sort by `createdAt`

Single-field indexes are auto-created by Firestore.

### Scaling considerations

**Multi-tenancy:** Add a `tenantId` field to all documents and scope every query with `.where("tenantId", "==", tenantId)`. Store tenant metadata in a `tenants/{id}` collection. User roles would become tenant-scoped (e.g. subcollection `tenants/{id}/members/{uid}`).

**10× product volume:** Current metrics aggregation reads all products — acceptable for hundreds, not thousands. At scale:
- Use Firestore **aggregation queries** or maintain denormalized counters in a `stats/global` document updated via Cloud Functions triggers
- Replace in-memory text search with [Algolia](https://www.algolia.com/) or Firestore extension for full-text search
- Cursor-based pagination (already implemented) avoids offset scans

---

## Security decisions

| Concern | Approach |
|---------|----------|
| **Session handling** | Firebase ID token exchanged for httpOnly, `sameSite=lax` session cookie via Admin SDK. No tokens in URLs. |
| **Route protection** | Middleware redirects unauthenticated page requests; API routes verify session server-side. |
| **Role enforcement** | Roles stored in Firestore `users` collection, read on every authenticated API call. Mutations require `admin` via `withAdmin()`. |
| **Client Firestore access** | **Denied entirely** (`firestore.rules` blocks all client reads/writes). All data flows through the API. |
| **Input validation** | Zod schemas on all API inputs. |
| **Admin assignment** | Only emails in `ADMIN_EMAILS` env var receive admin on signup — not user-selectable. |

**Defense in depth:** Viewers cannot create/edit/delete even if they craft API requests — server returns `403 Forbidden`.

---

## Features implemented

### Core (required)

- [x] Firebase Authentication (email/password sign-up & sign-in)
- [x] Role-based access control (admin / viewer)
- [x] Protected routes and API endpoints
- [x] Product CRUD with Firestore persistence
- [x] Clean data access layer (`lib/data/products.ts`)
- [x] Dashboard with metrics (total, active, inactive, active revenue)
- [x] Product list with filtering, sorting, and search
- [x] Documented Firestore schema and indexing strategy

### Bonus

- [x] **Role-based UI** — admins see add/edit/delete; viewers get read-only table
- [x] **Search & cursor pagination** — server-side cursor pagination via Firestore `startAfter`
- [x] **CI/CD** — GitHub Actions workflow (lint + build)
- [x] **Structured logging** — JSON logs in API layer (`lib/logging/logger.ts`)

---

## Trade-offs & scope decisions

| Decision | Rationale |
|----------|-----------|
| Server-only Firestore access | Stronger security; avoids duplicating RBAC in client rules |
| Role in Firestore vs custom claims | Simpler setup without Cloud Functions; trade-off is extra Firestore read per request |
| In-memory search filter | Avoids Algolia setup; documented as first scaling bottleneck |
| Metrics via full collection scan | Fine for demo scale; would use aggregations/triggers in production |
| No Firebase Emulator in repo | Reduces setup friction; documented as a "what's next" item |
| No AI feature | Prioritized auth, RBAC, and data layer depth over a demo AI integration |

---

## What's next (with another week)

1. **Firebase Emulator Suite** — local dev without cloud credentials
2. **Custom claims + Cloud Function** — set roles on user create, eliminate per-request Firestore role lookup
3. **Aggregation-based metrics** — Cloud Function triggers to maintain live counters
4. **AI product descriptions** — Vercel AI SDK with rate limiting, prompt injection guards, and human review queue
5. **E2E tests** — Playwright flows for auth and CRUD
6. **Vercel deployment** — production env vars + preview deployments per PR

---

## AI tool usage

This project was built with assistance from **Cursor (Claude)**. AI was used to:

- Scaffold the Next.js project structure and shadcn/ui components
- Generate boilerplate for Firebase Admin integration and session cookie flow
- Draft the README architecture documentation and Firestore schema tables
- Accelerate UI component composition (table, forms, dialogs)

All code was reviewed, adapted, and integrated manually. I can explain every architectural decision and line of security-critical code in a walkthrough.

**Open-source frameworks used:**

- [Next.js](https://nextjs.org/) — full-stack React framework
- [Firebase Admin & Client SDKs](https://firebase.google.com/) — auth and database
- [shadcn/ui](https://ui.shadcn.com/) — accessible UI components
- [Zod](https://zod.dev/) — runtime validation
- [Tailwind CSS](https://tailwindcss.com/) — styling

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## License

MIT — built as a take-home assessment submission.
