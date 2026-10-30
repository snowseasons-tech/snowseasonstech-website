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

### Social posting (phase 3)
Apply `supabase/migrations/20261030000000_social_accounts_and_posts.sql` after the two earlier migrations.

Set these on the server (never in the browser):

- `SOCIAL_APP_URL`: the public `https://` origin of this site, for example `https://www.snowseasonstech.com`.
- `SOCIAL_TOKEN_KEY`: 32 random bytes, base64-encoded. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Store a backup in your secrets manager; losing it means reconnecting every account.
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`: from a LinkedIn developer app with the "Share on LinkedIn" and "Sign In with OpenID Connect" products. Register the redirect URI `<SOCIAL_APP_URL>/suite/connect/linkedin/callback`.
- `META_APP_ID` and `META_APP_SECRET`: from a Meta developer app with Facebook Login. Register the redirect URI `<SOCIAL_APP_URL>/suite/connect/meta/callback`. Posting needs app review for `pages_manage_posts` and `instagram_content_publish`. Until then, only app admins and testers can connect.

Flow: members write and submit posts, an owner or admin approves, then an admin publishes. Tokens are encrypted before they are stored, and members cannot read them. Platform API versions are pinned in `lib/social/config.ts`.

Known limits in this phase: LinkedIn posts are personal profiles only (no company pages), LinkedIn posts are text-only, and tokens are not refreshed automatically, so an expired account must be reconnected. A post stuck in `publishing` after a crash needs a database fix until a retry path is added.
