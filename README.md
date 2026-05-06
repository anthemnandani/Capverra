# Identity and asset platform


## Supabase setup

1. Create a Supabase project.
2. In your project dashboard, copy:
   - Project URL
   - Anon key
   - Optional project ID
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID` (optional)
4. Run the SQL script in Supabase SQL editor:
   - `scripts/01-create-tables.sql`
5. Start the app:
   - `npm run dev`

The app now uses Supabase Auth + RLS. All data is scoped to the authenticated user session.