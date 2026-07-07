# DEPLOYMENT.md

## Deployment Strategy

- **Frontend (`client/`):** Deploy to **Vercel** (or Netlify). Connect the GitHub repo; Vercel builds on every push to `main` and serves the static Vite build via its CDN.
- **Backend (`server/`):** Deploy to **Render** (or Railway). Connect the GitHub repo; configure the start command (`npm start`), set environment variables in the platform's dashboard (never in code).
- **Database:** **MongoDB Atlas**, free/shared tier for MVP, with IP access list configured to allow the backend host (or `0.0.0.0/0` only if the provider doesn't offer static egress IPs — a documented, deliberate trade-off, not an oversight, since Atlas still requires the correct database credentials regardless).

This split (managed platforms rather than a raw VPS) is chosen to keep deployment friction low so you can focus learning time on the application itself; a manual VPS/Docker deployment is a legitimate and valuable *later* exercise (see Advanced note below), not an MVP requirement.

## Environment Variables (production)

Set directly in each platform's dashboard, never committed:
```
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ENCRYPTION_KEY=
CLIENT_ORIGIN=          # for CORS allow-list
NODE_ENV=production
```
The startup validation described in `BACKEND_ARCHITECTURE.md`/`SECURITY.md` ensures a missing variable here fails the deploy loudly (boot error) rather than causing a confusing runtime bug later.

## Production Checklist

- [ ] All secrets set via platform env vars, `.env` confirmed gitignored
- [ ] CORS allow-list set to the real deployed frontend origin (not `*`)
- [ ] `NODE_ENV=production` set (disables verbose error output, enables production logging behavior)
- [ ] Helmet, rate limiting, and cookie `secure` flag all active (cookies must be `secure: true` in production, since they're only sent over HTTPS)
- [ ] MongoDB Atlas IP access list configured
- [ ] GitHub OAuth app's callback URL updated to the production backend URL
- [ ] Health-check endpoint (`GET /api/health`) returns 200 for the hosting platform's monitoring
- [ ] Background job scheduler confirmed running in the deployed environment (easy to forget if `server.js` doesn't start it outside of local dev)

## Hosting Options (considered)

| Option | Verdict |
|---|---|
| Vercel/Netlify (frontend) + Render/Railway (backend) + Atlas | **Chosen** — lowest friction, generous free tiers, standard for MERN portfolio projects |
| Single VPS (DigitalOcean/AWS EC2) with Docker + Nginx | Valuable as a *later* learning exercise in infra/Linux/Nginx — not needed for MVP, explicitly postponable |
| AWS full stack (EC2/ECS, RDS/DocumentDB, CloudFront) | Overkill for this project's scale; postpone indefinitely unless a specific AWS-skills goal justifies it |

## CI/CD Overview

MVP: rely on the hosting platforms' built-in git-push-to-deploy (Vercel/Render both do this natively — genuinely sufficient CI/CD for this project's stage).
V2/Advanced: introduce **GitHub Actions** to run the test suite (see `TESTING.md`) on every PR before merge, and only allow deploys from a passing `main` branch — a meaningful, resume-relevant addition once a real test suite exists to run.

## Domain

Optional for a portfolio project, but a custom domain (e.g., via Namecheap/Cloudflare, pointed at Vercel) noticeably improves the "professional" feel for recruiters clicking a live link from your resume/README.

## HTTPS

Provided automatically by Vercel/Netlify/Render for both custom and platform-provided domains — no manual certificate management needed at this stage.

## Monitoring

MVP: platform-provided basic uptime/log dashboards (Render/Vercel both provide these free).
V2/Advanced: **Sentry** for error tracking (captures unhandled exceptions with stack traces and user context) — introduce once the app has real users whose errors you wouldn't otherwise see.

## Logging

Winston (see `TECH_STACK.md`) writing structured JSON logs to stdout in production (platform log aggregators capture stdout automatically — no need to manage log files yourself on managed hosting).

## Backup Strategy

MongoDB Atlas free tier has limited/no automated backups — for a portfolio project this is an acceptable, explicitly-stated risk; if this were a real production product with real user data, upgrading to a tier with continuous backups would be a hard requirement, worth noting in the README as an honest, deliberate scope boundary rather than an oversight.

## Related Documents

- `SECURITY.md` — production security posture referenced in the checklist
- `TESTING.md` — the test suite CI/CD will eventually run
- `SCALABILITY.md` — what changes about this deployment story at real scale
