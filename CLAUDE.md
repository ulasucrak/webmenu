# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint check
npm run import:niyokki   # Import restaurant data from data/ into Supabase
```

## Architecture

**webmenu** is a digital menu SaaS platform. Restaurants get public QR-scannable menus, admins manage content via a dashboard.

### Route Structure

| Path | Purpose |
|---|---|
| `/[restaurant]/[branch]/[category]` | Public menu (server-rendered) |
| `/[restaurant]/[branch]/about` | Branch info page |
| `/[restaurant]/[branch]/ai` (POST) | AI assistant API endpoint |
| `/admin/*` | Protected admin dashboard |
| `/superadmin/*` | Restaurant-level management |
| `/login` | Auth page |
| `/api/auth/signout` | Sign-out endpoint |

### Supabase Clients

Three distinct clients — use the right one or caching/auth will break:

- `lib/supabase/public.ts` — Module-level singleton, no cookies. **Use for all public menu queries so `unstable_cache()` works.**
- `lib/supabase/server.ts` — Cookie-based server client for admin/auth. Export `createServiceClient()` for service-role operations.
- `lib/supabase/client.ts` — Browser client for `'use client'` components.

### Caching (Public Menu Only)

Public menu data uses two layers:
1. **`React.cache()`** — deduplicates within a single request.
2. **`unstable_cache()`** — cross-request Next.js cache with tags.

Revalidation windows: restaurants/branches → 300s, categories/products → 60s.
When writing mutations, call `revalidateTag()` with the relevant tag.

### Database Schema

- **restaurants**: `id`, `name`, `slug`, `logo_url`, `primary_color`
- **branches**: `id`, `restaurant_id`, `name`, `slug`, `address`, `phone`, `google_maps_url`, `google_rating`, `opening_hours`, `is_active`
- **categories**: `id`, `branch_id`, `name_tr`, `name_en`, `description_tr`, `cover_url`, `cover_type`, `display_order`, `is_active`
- **subcategories**: `id`, `category_id`, `name_tr`, `name_en`, `display_order`
- **products**: `id`, `subcategory_id`, `name_tr`, `name_en`, `description_tr`, `description_en`, `price`, `currency`, `image_url`, `tags`, `is_featured`, `is_active`, `display_order`, `external_id`
- **admin_users**: `id` (FK → `auth.users`), `restaurant_id`, `role`

All user-facing text has `_tr` / `_en` columns. `LanguageContext` selects between them.

### Context Providers

- **`LanguageContext`** (`lib/menu/LanguageContext.tsx`) — TR/EN toggle, `localStorage: menu-language`. Exports `T` object for UI strings.
- **`ThemeContext`** (`lib/menu/ThemeContext.tsx`) — Dark/light via `data-theme` attribute on wrapper div, `localStorage: menu-theme`. CSS vars in `app/globals.css`.
- **`BranchContext`** (`lib/admin/BranchContext.tsx`) — Admin multi-branch selection, `?branch={id}` query param + localStorage fallback.

### AI Assistant

`components/menu/AiAssistant.tsx` → calls `/[restaurant]/[branch]/ai` POST endpoint.
- Uses Google Gemini with fallback: `gemini-2.0-flash` → `gemini-2.0-flash-lite` → `gemini-2.5-flash`
- Retries on 429/quota errors; throws on auth/bad-request errors
- Expects JSON response: `{ "products": [...], "message": "..." }`, max 3 recommendations
- Language follows current `LanguageContext`

### Key Next.js 16 Differences

- **`params` is a Promise** in page components — always `await params` before destructuring.
- Refer to `node_modules/next/dist/docs/` for any unfamiliar API behavior.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Server only
GEMINI_API_KEY=AIz...
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Optional
```

## Image Domains

Configured in `next.config.ts`: `cdn.pardonapp.co` and `*.supabase.co`. All media is stored in Supabase Storage.
