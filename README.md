# Walter OS

A mobile-first PWA for restaurant management. Designed with accessibility and simplicity in mind.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Neon (PostgreSQL) + Drizzle ORM
- **Auth:** Clerk
- **PWA:** next-pwa

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your credentials:
   - `DATABASE_URL` - Your Neon database connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Database Commands

```bash
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## Modules

- **Providers** - Manage suppliers and their products
- **Products** - Track inventory items
- **Services** - Utilities and fixed bills
- **House Expenses** - Personal/home expenses
- **Employees** - Staff management and payroll
- **Recipes** - Recipe management
- **Menu** - Menu items and pricing
