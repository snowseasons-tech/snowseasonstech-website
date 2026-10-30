# SnowSeasonsTech

Production-oriented Next.js website for SnowSeasonsTech — AI infrastructure, software engineering, security, DevOps, data engineering, and architecture.

## Stack
- Next.js 16.3.6 / App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Resend for contact-form delivery

## Local development
Requirements: Node.js 20.9+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Contact form
Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_TO_EMAIL`. The API validates inputs server-side and includes a honeypot. Never expose the Resend API key client-side.

## Production checks
```bash
npm run lint
npm run build
npm start
```

Before launch, replace the placeholder domain in `app/layout.tsx`, configure a verified sending domain in Resend, and put a real rate limiter/WAF in front of the public contact endpoint.

## Social suite (phase 1)
The suite lives under `/suite` and the public blog under `/blog/<org-slug>`. It needs a Supabase project:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Apply `supabase/migrations/20261029000000_suite_tenancy_and_blog.sql` to the project (SQL editor or `supabase db push`).
3. Create an account at Supabase Auth (or sign up through your normal flow). Sign in at `/suite/login`, then create the organization. You become its owner and can add members from the same page.

Writes go through database functions that check membership and role, so the rules hold even if the UI is bypassed. Tables have row level security with no direct write policies. Only published posts are readable without signing in.
