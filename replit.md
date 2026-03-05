# FishTokri

A mobile-first, full-stack web application for a Mumbai-based online fresh fish, seafood, and meat retailer. Customers can browse today's fresh stock and submit order requests, while employees manage inventory and orders through a protected admin panel.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Shadcn/UI, Wouter (routing), TanStack Query, Framer Motion
- **Backend**: Node.js, Express, Passport.js (local auth), Drizzle ORM, Zod validation
- **Database**: PostgreSQL (Replit built-in), connect-pg-simple for session storage

## Project Structure

- `/client` - React frontend application
  - `/src/components` - UI components (admin, storefront, ui/Shadcn)
  - `/src/pages` - Page-level components (Home, Products, Orders)
  - `/src/hooks` - Custom hooks for Auth, Cart, data fetching
  - `/src/context` - React context providers
- `/server` - Express backend
  - `index.ts` - App entry point, serves on port 5000
  - `routes.ts` - API endpoints + database seeding on first run
  - `storage.ts` - Data access layer (Repository pattern)
  - `auth.ts` - Passport.js configuration
  - `db.ts` - Database connection
- `/shared` - Shared code between frontend and backend
  - `schema.ts` - Drizzle schemas + Zod validation types
  - `routes.ts` - API route path constants

## Running the App

- Development: `npm run dev` (starts tsx server + Vite dev server)
- Build: `npm run build`
- Production: `npm start`
- DB schema push: `npm run db:push`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - DB credentials
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Session secret for Passport.js

## Default Admin Credentials

The app auto-creates a default admin on first run: `admin` / `admin`

## Key Features

- Customer storefront with category browsing (Fish, Prawns, Chicken, Mutton, Masalas)
- Real-time availability badges (Available, Unavailable, Limited)
- Cart and checkout flow for order requests
- Admin panel with product CRUD and bulk availability updates
- Order status tracking (Pending, Confirmed, Shipped, etc.)
- Auto-seeds 48 products on first run
