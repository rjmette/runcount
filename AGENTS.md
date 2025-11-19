# Repository Guidelines

## Project Structure & Module Organization

- The interactive client lives in `src`; components stay in `src/components`, hooks in `src/hooks`, contexts in `src/context`, and helpers in `src/utils` and `src/types`.
- Tests sit beside source (`src/__tests__`, `App*.test.tsx`); assets live in `public/` and `assets/`.
- Deployment helpers are under `scripts/`, and `npm run build` emits the production bundle into `build/`.

## Build, Test, and Development Commands

- `npm start` – runs the Vite dev server on http://localhost:5173 (use `.env.local` for Supabase).
- `npm run build` – produces an optimized bundle in `build/` for S3/CloudFront deploys.
- `npm run preview` – serves the latest production build locally.
- `npm run lint` / `npm run lint:fix` – checks or auto-fixes ESLint naming/import/React rules.
- `npm run format` / `npm run format:check` – enforces the shared Prettier style (TS/TSX/JS/JSON/MD/CSS/HTML).
- `npm run test` / `npm run test:watch` – runs the Vitest + Testing Library suite once or in watch mode.
- `npm run test:ui` – opens the Vitest UI for debugging.

## Coding Style & Naming Conventions

- Stick with TypeScript; prefer strict types and discriminated unions for game state.
- Components are `PascalCase`, hooks/helpers are `camelCase`, and Tailwind utility classes stay inline within JSX.
- Honor the ESLint config (`eslint.config.mjs`), which enforces naming, import order, React hooks, and Prettier (CI + pre-push hooks run `npm run lint`).
- Favor Tailwind utilities and keep custom CSS limited to `App.css`/`index.css`. Prettier settings live in `.prettierrc.cjs`.

## Automation Hooks

- Husky runs `lint-staged` on each commit, so only staged files that pass ESLint + Prettier are allowed.
- A `pre-push` hook runs `npm run lint && npm run test`; push again after resolving any failures.

## Testing Guidelines

- Write Vitest specs under `src/__tests__` or beside the component (`Component.test.tsx`).
- Prefer Testing Library queries (`screen.getByRole`) over DOM selectors, and mirror user flows.
- Maintain coverage for scoring logic, fouls, timers, and Supabase persistence; add regression tests for issue fixes.

## Issue Tracking & Workflow

- Run `gh issue list` from the repo root before starting work to stay aligned with priority and labels.
- Always use the GitHub CLI (`gh`) for issue lookups and other GitHub interactions.
- Create a fresh branch per issue (`git checkout -b feature/issue-64-turn-clock`) and keep commits scoped to that ticket.

## Commit & Pull Request Guidelines

- Commits typically start with an emoji + imperative summary (e.g., `✨ Add quick-select target score buttons`) and end with `(#NN)` tying back to GitHub issues/PRs.
- Branches always map to a single issue; mirror the naming structure noted above.
- Pull requests should include: purpose summary, linked issue, screenshots/GIFs for UI tweaks, and notes on tests run (`npm run test`, `npm run build`).

## Configuration & Security Notes

- Create `.env.local` with Supabase keys (`VITE_SUPABASE_KEY`, `VITE_SUPABASE_URL`). Do not commit credentials; rely on GitHub secrets for CI/CD.
- When testing auth-dependent flows, seed Supabase with demo data or use the staging project referenced in `App.tsx`.
