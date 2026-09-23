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
