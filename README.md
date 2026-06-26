# Product SaaS Dashboard

A mini SaaS product management dashboard built for a Senior Full Stack Developer take-home challenge. Authenticated users can manage products, view analytics, and control access based on their role (admin or viewer). Includes AI-powered product descriptions and category suggestions.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Firebase Auth · Firestore · Tailwind CSS · shadcn/ui · Vercel AI SDK

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
3. Copy `.env.example` to `.env.local` and fill in values (see **[docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** for detailed steps):

```bash
cp .env.example .env.local
```

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key` (keep `\n` escapes) |
| `GOOGLE_APPLICATION_CREDENTIALS` | **Alternative:** path to service account JSON file (takes precedence) |
| `ADMIN_EMAILS` | Comma-separated emails that get **admin** role on signup |
| `GROQ_API_KEY` | *Optional* — enables AI description and category features (Groq free tier: 30 RPM) |

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

### 4. Seed demo data (optional)

Populate the dashboard with 8 sample Food & Beverage products:

```bash
npm run seed
```

To replace existing products:

```bash
npm run seed -- --force
```

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  AuthProvider · Dashboard UI · Product CRUD forms               │
│  Firebase Client SDK (sign-in/sign-up only)                     │
│  AI description streaming · AI category suggestions             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ ID token → POST /api/auth/session
                            │ httpOnly session cookie
┌───────────────────────────▼─────────────────────────────────────┐
│                    Next.js (App Router)                          │
│  proxy.ts ─── route protection (cookie presence check)          │
│  API Routes ── session verify + role enforcement                │
│  /api/ai/* ── Vercel AI SDK → OpenAI (streaming + structured)   │
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
| `src/lib/firebase/client.ts` | Browser Firebase Auth (sign-in/sign-up only) |
| `src/lib/firebase/admin.ts` | Server Firebase Admin (Auth + Firestore) |
| `src/lib/auth/server-auth.ts` | Session verification, role lookup, RBAC helpers |
| `src/lib/data/products.ts` | **Data access layer** — all Firestore product operations |
| `src/lib/api/helpers.ts` | `withAuth` / `withAdmin` wrappers for API routes |
| `src/lib/validation/schemas.ts` | Zod schemas for all API inputs |
| `src/proxy.ts` | Route-level redirects for unauthenticated users |
| `src/app/api/ai/*` | AI endpoints (streaming descriptions, structured categories) |

---

## Database schema

### Collection: `users`

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email from Firebase Auth |
| `role` | `"admin"` \| `"viewer"` | Access level |
| `createdAt` | ISO 8601 string | Account creation timestamp |

**Document ID:** Firebase Auth `uid`

### Collection: `products`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name (max 200 chars) |
| `description` | string | Product description (max 1000 chars, can be AI-generated) |
| `category` | string | Product category (max 100 chars) |
| `price` | number | Price in USD |
| `status` | `"active"` \| `"inactive"` | Product availability |
| `createdAt` | ISO 8601 string | Creation timestamp |
| `updatedAt` | ISO 8601 string | Last update timestamp |
| `createdBy` | string | UID of creating admin |

**Document ID:** Auto-generated Firestore ID

### Indexing strategy

Composite indexes are defined in `firestore.indexes.json` for common query patterns:

- Filter by `category` + sort by `createdAt`
- Filter by `status` + sort by `createdAt` / `price`
- Filter by `category` + `status` + sort by `createdAt`
- Filter by `category` + sort by `name`

Single-field indexes are auto-created by Firestore for all fields.

### Scaling considerations

**Multi-tenancy:** Add a `tenantId` field to all documents and scope every query with `.where("tenantId", "==", tenantId)`. Store tenant metadata in a `tenants/{id}` collection. User roles would become tenant-scoped (e.g. subcollection `tenants/{id}/members/{uid}`).

**10× product volume:** Current metrics aggregation reads all products — acceptable for hundreds, not thousands. At scale:
- Use Firestore **aggregation queries** (`count()`, `sum()`) or maintain denormalized counters in a `stats/global` document updated via Cloud Functions triggers
- Replace in-memory text search with [Algolia](https://www.algolia.com/) or a Firestore extension for full-text search
- Cursor-based pagination (already implemented) avoids offset scans

---

## Security decisions

| Concern | Approach |
|---------|----------|
| **Session handling** | Firebase ID token exchanged for httpOnly, `sameSite=lax` session cookie via Admin SDK. No tokens in URLs or localStorage. |
| **Route protection** | `proxy.ts` redirects unauthenticated page requests; API routes verify session server-side via `withAuth()`. |
| **Role enforcement** | Roles stored in Firestore `users` collection, checked on every API call. Mutations require `admin` via `withAdmin()`. Returns 403 for viewers attempting write operations. |
| **Client Firestore access** | **Denied entirely** — `firestore.rules` blocks all client reads/writes. All data flows through the server API. |
| **Input validation** | Zod schemas validate all API request bodies server-side. |
| **Admin assignment** | Only emails in `ADMIN_EMAILS` env var receive admin on signup — not user-selectable. |
| **AI safety** | AI endpoints require authentication. Gracefully disabled when `GROQ_API_KEY` is absent (503 with descriptive message). Rate-limit and quota errors return user-friendly messages. |

**Defense in depth:** Viewers cannot create/edit/delete even if they craft direct API requests — the server returns `403 Forbidden`.

---

## Features implemented

### Core (required)

- [x] Firebase Authentication (email/password sign-up & sign-in)
- [x] Role-based access control (admin / viewer) with server-side enforcement
- [x] Protected routes and API endpoints
- [x] Product CRUD with Firestore persistence
- [x] Clean data access layer (`lib/data/products.ts`)
- [x] Dashboard with four summary metrics (total, active, inactive, active revenue)
- [x] Product list with filtering, sorting, and search
- [x] Documented Firestore schema with indexing strategy and scaling considerations

### Bonus

- [x] **Role-based UI** — admin sees add/edit/delete controls; viewer gets read-only interface. Enforced server-side.
- [x] **Search & cursor pagination** — Firestore cursor-based pagination via `startAfter`, text search, category/status filters, multi-field sorting
- [x] **CI/CD** — GitHub Actions workflow (lint + build on push/PR to main)
- [x] **AI-powered features** — product descriptions, category suggestions, and natural language dashboard filtering via Vercel AI SDK + Groq
- [x] **Observability** — structured JSON logging in the API layer (`lib/logging/logger.ts`)

---

## AI-powered features

### Product description generation
When creating or editing a product, admins can click **"AI describe"** to auto-generate a compelling product description. Uses Groq (`llama-3.1-8b-instant`) via the Vercel AI SDK with streaming for real-time feedback.

### Smart category suggestions
Click **"AI suggest"** next to the category field. The AI analyzes the product name and returns a best-fit category with confidence score and alternative suggestions. Uses Zod-validated structured output.

### Natural language dashboard filtering
Type a plain-English query in the dashboard search bar (e.g. *"Show me all active products under $20"*). The LLM parses it into a validated filter schema (`status`, `category`, `priceMin`/`priceMax`, `sortBy`), which is safely applied in the data access layer — never executing raw user input against Firestore.

### Productionisation plan
To ship these AI features safely at scale:
1. **Rate limiting** — per-user request caps (e.g. 20 AI calls/hour) to prevent cost runaway
2. **Prompt injection guards** — sanitize user input, use system prompts that can't be overridden
3. **Cost monitoring** — log token usage per request, set billing alerts
4. **Human review queue** — flag AI-generated descriptions for review before publishing
5. **Caching** — cache identical product name/category requests to reduce API calls
6. **Fallback providers** — Vercel AI SDK makes switching providers a one-line config change

---

## Trade-offs & scope decisions

| Decision | Rationale |
|----------|-----------|
| Server-only Firestore access | Stronger security; avoids duplicating RBAC in Firestore client rules |
| Roles in Firestore vs custom claims | Simpler setup without Cloud Functions; trade-off is extra Firestore read per request |
| In-memory text search | Avoids Algolia setup; documented as first scaling bottleneck |
| Metrics via full collection scan | Fine for demo scale; would use aggregations/Cloud Function counters in production |
| No unit/E2E tests | Prioritized feature depth and security; CI runs lint + build |
| No Firebase Emulator | Reduces local setup friction; documented as a "what's next" item |

---

## What's next (with another week)

1. **Firebase Emulator Suite** — local dev without cloud credentials
2. **Custom claims + Cloud Function** — set roles on user create, eliminate per-request Firestore role lookup
3. **Aggregation-based metrics** — Cloud Function triggers to maintain live counters
4. **E2E tests** — Playwright flows for auth, CRUD, and role-based access
5. **Vercel deployment** — production env vars + preview deployments per PR
6. **AI rate limiting** — Redis-backed per-user rate limits for AI endpoints
7. **Full-text search** — Algolia integration for production-grade product search

---

## AI tool usage

This project was built with assistance from **Cursor (Claude)**. AI was used to:

- Scaffold the Next.js project structure and shadcn/ui component setup
- Generate boilerplate for Firebase Admin integration and the session cookie flow
- Draft README documentation, architecture diagrams, and Firestore schema tables
- Accelerate UI component composition (table, forms, dialogs, AI buttons)
- Implement the AI feature endpoints with Vercel AI SDK integration

All code was reviewed, understood, and adapted. I can explain every architectural decision and line of security-critical code in a walkthrough.

**Open-source frameworks used:**

- [Next.js 16](https://nextjs.org/) — full-stack React framework (App Router)
- [Firebase Admin & Client SDKs](https://firebase.google.com/) — authentication and Firestore database
- [shadcn/ui](https://ui.shadcn.com/) — accessible, composable UI components
- [Vercel AI SDK](https://sdk.vercel.ai/) — streaming AI text generation and structured output
- [Zod](https://zod.dev/) — runtime schema validation
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [date-fns](https://date-fns.org/) — date formatting
- [Sonner](https://sonner.emilkowal.dev/) — toast notifications

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run check:env  # Validate environment variables
npm run seed       # Seed demo products (use -- --force to replace)
```

---

## License

MIT — built as a take-home assessment submission.
