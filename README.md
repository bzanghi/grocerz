Family Groceries – Step 1 (Auth + Household Setup)

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase

Getting started

1) Copy env

   cp .env.local.example .env.local

   Fill in:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

2) Supabase

   - Enable Email/Password and Google OAuth
   - Add callback: http://localhost:3000/auth/callback
   - Apply SQL in supabase/migrations/001_init.sql

3) Dev

   npm install
   npm run dev

Routes

- /        Landing
- /login   Email/Password + Google
- /signup  Email/Password + Google
- /auth/callback  OAuth handler
- /setup   Create household or accept invite (?invite=TOKEN)
- /invite/[token] → redirects to /setup?invite=token
- /(app)/dashboard   Authenticated placeholder
