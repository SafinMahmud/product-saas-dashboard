# Firebase & Firestore setup

Follow these steps once. Takes about 10 minutes.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it (e.g. `product-saas-dashboard`)
3. Disable Google Analytics if you want a faster setup (optional)
4. Click **Create project**

## 2. Enable Email/Password authentication

1. In the left sidebar: **Build → Authentication**
2. Click **Get started**
3. Open the **Sign-in method** tab
4. Enable **Email/Password** (first provider in the list)
5. Save

## 3. Create Firestore database

1. **Build → Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (our `firestore.rules` deny all client access — the app uses the Admin SDK on the server)
4. Pick a region close to you (e.g. `us-central1`)
5. Click **Enable**

No manual collections are required. The app creates `users` and `products` on first sign-up and product create.

## 4. Register a web app (client config)

1. Project **Settings** (gear icon) → **General**
2. Under **Your apps**, click the **Web** icon (`</>`)
3. App nickname: `product-saas-dashboard`
4. Do **not** enable Firebase Hosting for now
5. Click **Register app**
6. Copy the `firebaseConfig` values — you need these for `.env.local`:

| Env variable | Firebase config key |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

## 5. Create a service account (server / Admin SDK)

1. Project **Settings → Service accounts**
2. Click **Generate new private key** → **Generate key**
3. A JSON file downloads — keep it **private**, never commit it

From that JSON file, map to env vars:

| Env variable | JSON field |
|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` |

**Important for `FIREBASE_PRIVATE_KEY`:** paste the full key including `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`. In `.env.local`, keep it on one line with `\n` for line breaks, or wrap in quotes as shown in `.env.example`.

## 6. Configure local environment

```bash
cd product-saas-dashboard
cp .env.example .env.local
```

Edit `.env.local` and fill in all values from steps 4 and 5.

Set admin access (comma-separated emails that get **admin** role on signup):

```env
ADMIN_EMAILS=your-email@gmail.com
```

## 7. (Optional) Deploy Firestore rules & indexes

Install Firebase CLI once:

```bash
npm install -g firebase-tools
firebase login
cd product-saas-dashboard
firebase use --add   # select your project
firebase deploy --only firestore
```

This deploys:

- `firestore.rules` — blocks all direct client access (server-only via Admin SDK)
- `firestore.indexes.json` — composite indexes for filtered/sorted product queries

If you skip this step, Firestore may prompt you to create indexes when you first filter products — click the link in the error to auto-create them.

## 8. Run locally

```bash
npm install
node scripts/check-env.js   # optional sanity check (load .env.local first)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. **Sign up** with an email listed in `ADMIN_EMAILS` → you get **admin** (create/edit/delete products)
2. Sign up with any other email → **viewer** (read-only)

## Troubleshooting

| Error | Fix |
|---|---|
| `auth/invalid-api-key` | Check `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local` |
| `Failed to create session` / Admin SDK errors | Verify service account vars; ensure private key newlines are `\n` |
| `Missing or insufficient permissions` | Enable Firestore; confirm service account has Editor/Owner on project |
| Firestore index error in terminal | Run `firebase deploy --only firestore:indexes` or use the link in the error |
| CI failing on lint | Fixed in latest commit — push again after pull |

## Data model (auto-created)

**`users/{uid}`**

```json
{ "email": "...", "role": "admin|viewer", "createdAt": "ISO-8601" }
```

**`products/{id}`**

```json
{
  "name": "string",
  "category": "string",
  "price": 0,
  "status": "active|inactive",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "createdBy": "uid"
}
```
