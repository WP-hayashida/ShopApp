# Repository Guidelines
 
## Project Structure & Module Organization
- App routes: `src/app` (Next.js App Router). APIs in `src/app/api/*/route.ts`.
- UI components: `src/components/ui` and shared components under `src/components/shared`.
- State/context: `src/context`.
- Client/server integrations: `src/lib` (e.g., `supabase/client.ts`, `supabase/server.ts`).
- Features: `src/app/(features)/*` groups pages, hooks, and helpers per feature.
- Assets: `public/*`. Config at repo root (`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`).
- Database: `supabase/migrations/*` for SQL migrations.
 
## Build, Test, and Development Commands
- `npm run dev`  EStart Next.js dev server with HMR.
- `npm run build`  EProduction build (`.next/`).
- `npm start`  ERun the production server.
- `npm run lint`  ELint with ESLint config (`next/core-web-vitals`, TypeScript).
 
## Coding Style & Naming Conventions
- Language: TypeScript (`.ts/.tsx`). Indentation: 2 spaces.
- Components: PascalCase (`ShopCard.tsx`); hooks: `use*` (`useShopDetails.ts`).
- Files colocated by feature: `src/app/(features)/<feature>/...`.
- Styles: Tailwind CSS v4 via `@tailwindcss/postcss`. Prefer utility classes; avoid inline styles.
- Linting: Follow `eslint.config.mjs` ignores (e.g., `.next/`, `build/`, `src/lib/database.types.ts`). Fix issues before PRs.
 
## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests alongside code (`Component.test.tsx`) or in `__tests__`.
- Aim for critical path coverage on API routes, hooks, and feature components.
 
## Commit & Pull Request Guidelines
- Commits: imperative present tense, concise (“Add shop search API E “Fix build error E.
- Group related changes; avoid noisy refactors mixed with features.
- PRs: include a clear summary, screenshots for UI changes, steps to verify, and link issues.
- Pass `lint` and ensure `build` succeeds before requesting review.
 
## Security & Configuration Tips
- Environment: set in `.env.local` (not committed). Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Do not log secrets in server routes or middleware.
- Database changes go through `supabase/migrations/*`; keep migrations atomic and descriptive.
 

