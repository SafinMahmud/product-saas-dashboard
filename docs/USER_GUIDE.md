# User Guide

A complete walkthrough of every feature in the Product SaaS Dashboard, organized by user role.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Viewer Workflow](#viewer-workflow)
5. [Admin Workflow](#admin-workflow)
6. [AI Features (Admin)](#ai-features-admin)
7. [Signing Out](#signing-out)

---

## Getting Started

### Accessing the app

Open the dashboard in your browser:

- **Local development:** [http://localhost:3000](http://localhost:3000)
- **Production:** your deployed URL

You will be redirected to the **Sign in** page if you don't have an active session.

### Role overview

| Role | Can view dashboard | Can filter/sort/search | Can create products | Can edit products | Can delete products | Can use AI features |
|------|---|---|---|---|---|---|
| **Admin** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Viewer** | Yes | Yes | No | No | No | No |

Your role is assigned at sign-up and displayed as a badge in the dashboard header.

---

## Authentication

### Creating an account (Sign up)

1. From the sign-in page, click **Sign up**
2. Enter your **email** and a **password** (minimum 8 characters)
3. Click **Sign up**
4. You are redirected to the dashboard

**Role assignment:**
- If your email is listed in the server's `ADMIN_EMAILS` configuration, you receive the **admin** role
- All other emails receive the **viewer** role
- Roles cannot be changed by users — only a server administrator can update `ADMIN_EMAILS`

### Signing in

1. Enter your **email** and **password**
2. Click **Sign in**
3. You are redirected to the dashboard

If you enter incorrect credentials, a toast notification will say "Invalid email or password."

### Session behavior

- Your session persists across browser tabs and page refreshes (stored as an httpOnly cookie)
- Sessions expire after **5 days** of inactivity
- You can sign out manually at any time (see [Signing Out](#signing-out))

---

## Dashboard Overview

After signing in, you land on the main dashboard at `/dashboard`. It has three sections:

### 1. Header bar

- **App title** — "Product Dashboard"
- **Role badge** — shows "Admin" or "Viewer" next to the title
- **Email** — your signed-in email (visible on wider screens)
- **Sign out button** — ends your session

### 2. Metrics cards

Four summary cards displayed at the top:

| Card | What it shows |
|------|---------------|
| **Total Products** | Count of all products in the system |
| **Active Products** | Count of products with status "active" |
| **Inactive Products** | Count of products with status "inactive" |
| **Active Revenue** | Sum of prices for all active products (USD) |

These metrics refresh automatically when products are created, updated, or deleted.

### 3. Products section

A table of all products with controls for filtering, sorting, searching, and (for admins) managing products.

---

## Viewer Workflow

As a viewer, you have **read-only access** to the dashboard. You cannot create, edit, or delete products.

### Browsing products

The product table shows all products with these columns:

| Column | Description |
|--------|-------------|
| **Name** | Product name |
| **Category** | Product category (e.g. Electronics, Clothing) |
| **Price** | Price in USD |
| **Status** | Badge showing "active" or "inactive" |
| **Created** | Date the product was added |

### Searching

1. Type in the **search box** at the top of the products section
2. Results filter in real-time by product **name** and **category**
3. Clear the search box to see all products again

### Filtering by category

1. Click the **category dropdown** (shows "All categories" by default)
2. Select a specific category to show only those products
3. Select "All categories" to reset

### Filtering by status

1. Click the **status dropdown** (shows "All statuses" by default)
2. Select **Active** or **Inactive** to filter
3. Select "All statuses" to reset

### Sorting

1. Click the **sort dropdown** (shows "Newest first" by default)
2. Available sort options:
   - **Newest first** — most recently created at top
   - **Oldest first** — oldest at top
   - **Name A–Z** — alphabetical
   - **Name Z–A** — reverse alphabetical
   - **Price high–low** — most expensive first
   - **Price low–high** — cheapest first

### Pagination

- The table shows **10 products per page**
- If more products exist, a **Load more** button appears at the bottom
- Click it to append the next page of results
- Changing any filter, search, or sort resets to the first page

### What viewers cannot do

- No **Add product** button is shown
- No **Edit** or **Delete** icons appear in the table
- If a viewer attempts to call the API directly (e.g. via curl), the server returns **403 Forbidden**

---

## Admin Workflow

Admins have everything viewers have, plus the ability to manage products.

### Creating a product

1. Click the **Add product** button (top-right of the products section)
2. A dialog opens with these fields:

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Product name (max 200 characters) |
| **Description** | No | Product description (max 1000 characters). Can be AI-generated. |
| **Category** | Yes | Product category (max 100 characters). Can be AI-suggested. |
| **Price (USD)** | Yes | Numeric price (minimum $0.00) |
| **Status** | Yes | "Active" or "Inactive" (defaults to Active) |

3. Fill in the fields (or use AI — see [AI Features](#ai-features-admin))
4. Click **Create product**
5. A success toast appears and the table refreshes with the new product
6. Metrics update automatically

### Editing a product

1. Find the product in the table
2. Click the **pencil icon** in the Actions column
3. The edit dialog opens pre-filled with current values
4. Modify any fields
5. Click **Save changes**
6. A success toast appears and the table refreshes

### Deleting a product

1. Find the product in the table
2. Click the **trash icon** in the Actions column
3. A confirmation dialog asks "Delete this product?"
4. Click **OK** to confirm (or **Cancel** to abort)
5. A success toast appears, the product is removed, and metrics update

### Bulk operations

There is no bulk delete or bulk edit. Products are managed one at a time. This is a scope decision documented in the README — bulk operations would be a future enhancement.

---

## AI Features

AI features require a `GROQ_API_KEY` on the server. Powered by Groq (`llama-3.1-8b-instant`) — free tier: 30 requests/minute, 14,400 requests/day.

### Natural Language Dashboard Filtering

Filter the product table by typing plain English instead of using dropdowns.

1. Go to the **Products** section on the dashboard
2. Type a query in the search bar at the top, e.g.:
   - *"Show me all active products under $20"*
   - *"What are our inactive products?"*
   - *"Cheapest food and beverage items"*
3. Click **Ask AI**
4. The AI parses your query into structured filters and applies them to the table
5. A summary chip appears showing what was understood (e.g. *"Showing active products, under $20"*)
6. Click **X** on the chip to clear the AI filter and reset the table

The manual dropdown filters (category, status, sort) still work and update when AI applies a filter.

---

## AI Features (Admin — Product Form)

AI features are available when creating or editing products. They require a `GROQ_API_KEY` to be configured on the server. If not configured, the buttons show a "not configured" message. The AI is powered by Groq (`llama-3.1-8b-instant`), which has a generous free tier (30 requests/minute, 14,400 requests/day).

### AI Product Description

Automatically generates a 2–3 sentence product description.

1. Open the **Add product** or **Edit product** dialog
2. Enter a **product name** (required for AI to work)
3. Optionally fill in **category** and **price** for better context
4. Click the **"AI describe"** button next to the Description label
5. The description field fills in **real-time as the AI streams** its response
6. Review and edit the generated text as needed
7. Save the product as usual

**Example:**
- Name: "Wireless Bluetooth Headphones"
- Category: "Electronics"
- Price: "$79.99"
- AI generates: *"Experience premium sound quality with these wireless Bluetooth headphones featuring advanced noise-cancellation technology. Designed for all-day comfort with cushioned ear cups and an adjustable headband. Perfect for commuting, working out, or enjoying your favorite music at home."*

### AI Category Suggestion

Automatically suggests the best product category based on the product name.

1. Open the **Add product** or **Edit product** dialog
2. Enter a **product name** (required)
3. Click the **"AI suggest"** button next to the Category label
4. The **category field auto-fills** with the AI's top suggestion
5. A toast notification shows **alternative categories** you might consider
6. Change the category if the suggestion doesn't fit
7. Save the product as usual

**Example:**
- Name: "Organic Green Tea"
- AI suggests: "Food & Beverage"
- Toast shows: "Also consider: Health & Beauty, Grocery"

### When AI is unavailable

If the server doesn't have a `GROQ_API_KEY` configured:
- The AI buttons still appear but show a toast message when clicked: *"AI features are not configured"*
- If you hit the free-tier rate limit, a clear message explains the limit and suggests waiting
- All other functionality works normally — AI is an optional enhancement

---

## Signing Out

1. Click **Sign out** in the top-right corner of the header
2. Your session cookie is cleared
3. You are redirected to the **Sign in** page
4. You must sign in again to access the dashboard

---

## Quick Reference

### Keyboard shortcuts

The app uses standard browser keyboard navigation:
- **Tab** — move between interactive elements
- **Enter** — activate buttons, submit forms
- **Escape** — close dialogs

### Browser support

Tested on modern browsers:
- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)

### Mobile

The dashboard is fully responsive:
- Filter controls stack vertically on small screens
- The product table scrolls horizontally
- Metric cards adjust from 4 columns → 2 → 1 as screen width decreases
- Forms and dialogs are full-width on mobile

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid email or password" | Check credentials. If you forgot your password, delete and recreate the account via Firebase Console. |
| Form fields are disabled | The app is still loading your session. Wait a moment and try again. |
| "Failed to load products" | Check that Firestore is enabled in your Firebase project. Check the browser console for errors. |
| AI buttons say "unavailable" | The server needs `GROQ_API_KEY` in `.env.local`. Get a free key from [Groq Console](https://console.groq.com/keys). |
| Session expired | Sign in again. Sessions last 5 days. |
| "Could not create account" | The email may already be registered. Try signing in, or use a different email. |
