# Mama Lucica

E-commerce store by SC Vomix Genius SRL (CUI 43025661).

## Setup

1. Copy `.env.example` to `.env` and fill in the real values:
   ```bash
   cp .env.example .env
   ```
2. **Never commit `.env`** — it contains secrets. Only `.env.example` (with placeholders) belongs in the repo.
3. Install dependencies and start the dev server:
   ```bash
   bun install
   bun dev
   ```

## Tech Stack

- TanStack Start (React 19 + Vite 7)
- Tailwind CSS v4
- Supabase (database, auth, storage) via Lovable Cloud
- Deployed on Cloudflare Workers

## Security

- All secrets live in `.env` (gitignored) and in the Lovable Cloud secret manager for production.
- See `.env.example` for the full list of required environment variables.
- Row-Level Security (RLS) is enabled on every table; admin access is gated through `has_role()`.
