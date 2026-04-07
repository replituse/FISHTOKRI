# FishTokri

A mobile-first, full-stack web application for an online fresh fish, seafood, and meat retailer based in Mumbai. Provides a premium, app-like storefront for customers and a protected admin panel for inventory and order management.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express 5
- **Database**: MongoDB with Mongoose ODM
- **Auth**: Passport.js (local strategy) with session-based auth via connect-mongo
- **State/Data**: TanStack Query (React Query), React Context (cart)
- **Routing**: wouter
- **UI Components**: Radix UI / shadcn-ui, Lucide icons, Embla Carousel

## Project Structure

- `client/` — React frontend (Vite)
  - `src/components/storefront/` — Customer-facing components
  - `src/components/admin/` — Admin panel components
  - `src/components/ui/` — Shared Radix/shadcn UI components
  - `src/pages/storefront/` — Storefront pages (Home, Product Detail, Profile)
  - `src/pages/admin/` — Admin pages (Dashboard, Orders, Products)
  - `src/hooks/` — Custom React hooks
  - `src/context/` — Cart context
- `server/` — Express backend
  - `index.ts` — Entry point, middleware setup
  - `routes.ts` — API route definitions (all data routes are hub-aware via X-Hub-DB header)
  - `db.ts` — Minimal placeholder (no default DB connection)
  - `adminDb.ts` — `fishtokri_admin` DB connection; stores SuperHub, SubHub, admin Users, sessions
  - `hubConnections.ts` — Per-location DB connection cache; provides Product, Section, Carousel, Category, Combo models per hub
  - `ordersDb.ts` — Shared `orders` DB connection
  - `customerDb.ts` — Shared `customers` DB connection
  - `storage.ts` — Data access layer for user auth, orders, and customers
  - `auth.ts` — Passport.js authentication (sessions stored in fishtokri_admin)
  - `vite.ts` — Vite dev server middleware (development only)
  - `static.ts` — Static file serving (production only)
  - `imageStore.ts` — In-memory image storage
- `shared/` — Shared TypeScript types and Zod schemas
- `script/` — Build scripts

## Database Architecture

The app uses **multiple MongoDB databases** — one per hub (location), plus shared admin/orders/customers databases:

| Database | Purpose |
|---|---|
| `fishtokri_admin` | Admin users, sessions, SuperHub & SubHub config |
| `orders` | All customer orders (shared across hubs) |
| `customers` | Customer profiles and addresses (shared) |
| `<hub-dbName>` | Per-location products, sections, carousel, categories, combos |

Each storefront API request includes an `X-Hub-DB` header (set by the frontend based on the selected location) to route reads and writes to the correct hub database. No "fishtokri" default database is created.

## Environment Variables

- `MONGODB_URI` — MongoDB connection string (required, set as a secret)
- `SESSION_SECRET` — Express session secret (recommended for production)
- `PORT` — Server port (defaults to 5000)

## Running the App

- **Development**: `npm run dev` — starts the Express server with Vite middleware
- **Build**: `npm run build` — builds the frontend to `dist/public`
- **Production**: `npm start` — serves the built frontend + API

## Key Features

### Customer Storefront
- Dynamic product browsing with category filters (Fish, Prawns, Chicken, Mutton, Masalas, etc.)
- Carousel banners, "Today's Fresh Catch" hero section
- Shopping cart with slide-up drawer and order request flow
- Availability badges, combo specials
- Homepage sections driven by MongoDB `sections` collection — fully dynamic

### Admin Panel
- Secure login (session-based auth)
- Dashboard with summary statistics and availability toggles
- Full CRUD for products and categories
- Order management (pending/confirmed)
- Carousel slide management
- **Sections management** (`/admin/sections`) — create/edit/delete homepage sections; sections have a `type` ("products" or "combos"), `sortOrder`, and `isActive` toggle
- Products have a `sectionId` field to assign them to a specific homepage section
