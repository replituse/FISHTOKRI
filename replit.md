# FishTokri

A mobile-first, full-stack web application for a Mumbai-based online fresh fish, seafood, and meat retailer. Customers can browse today's fresh stock and submit order requests, while employees manage inventory and orders through a protected admin panel.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Shadcn/UI, Wouter (routing), TanStack Query, Framer Motion
- **Backend**: Node.js, Express, Passport.js (local auth), Mongoose, Zod validation
- **Database**: MongoDB (Mongoose) for all persistent data (products, orders, users, sessions)
- **Images**: Stored in-memory on the server (lost on restart; re-upload after redeploy)

## Project Structure

- `/client` - React frontend application
  - `/src/components` - UI components (admin, storefront, ui/Shadcn)
  - `/src/pages` - Page-level components (Home, Products, Orders)
  - `/src/hooks` - Custom hooks for Auth, Cart, data fetching
  - `/src/context` - React context providers
- `/server` - Express backend
  - `index.ts` - App entry point, serves on port 5000
  - `routes.ts` - API endpoints + MongoDB seeding on first run
  - `storage.ts` - Data access layer (MongoStorage)
  - `auth.ts` - Passport.js + MongoDB session store (connect-mongo)
  - `db.ts` - Mongoose connection + schemas
  - `imageStore.ts` - In-memory image storage (Map-based)
- `/shared` - Shared code between frontend and backend
  - `schema.ts` - TypeScript types + Zod validation schemas
  - `routes.ts` - API route path constants

## Running the App

- Development: `npm run dev` (starts tsx server + Vite dev server)
- Build: `npm run build`
- Production (VPS): `npm run build` then `pm2 start ecosystem.config.cjs`

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (set in ecosystem.config.cjs for VPS)
- `MONGODB_DB` - Database name (default: fishtokri)
- `PORT` - Server port (default: 5000, VPS uses 3010)
- `SESSION_SECRET` - Session secret for Passport.js

## VPS Deployment

The `ecosystem.config.cjs` already contains the MongoDB URI and all required env vars.
Steps:
1. Pull latest code
2. `npm install`
3. `npm run build`
4. `pm2 start ecosystem.config.cjs`

## Default Admin Credentials

The app auto-creates a default admin on first run: `admin` / `admin`

## Key Features

- Customer storefront with category browsing (Fish, Prawns, Chicken, Mutton, Masalas)
- Real-time availability badges (Available, Unavailable, Limited)
- Cart and checkout flow for order requests
- Admin panel with product CRUD and bulk availability updates
- Order status tracking (Pending, Confirmed, Shipped, etc.)
- Auto-seeds 48 products on first run if MongoDB collection is empty
