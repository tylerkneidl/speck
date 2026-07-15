# Light-First + De-Code the Chrome — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Visual work is verified with `@superpowers:verification-before-completion` (screenshots in **both** themes), not unit tests. TDD (`@superpowers:test-driven-development`) applies only to the theme-toggle logic in Phase 1.

**Goal:** Move Speck from a dark-only, developer-tool aesthetic to a light-first "classroom tool" look — without losing any brand equity — by (a) making the app genuinely theme-driven and light-by-default with a dark toggle, and (b) removing JetBrains Mono from UI chrome while keeping it for numeric data.

**Architecture:** The app currently hardcodes dark ink shades at ~270 raw `zinc`/`emerald` call sites; shadcn's semantic tokens are only wired inside `components/ui/*`. We refactor the raw classes to semantic tokens, define real light + dark values for those tokens, and add a small theme system (OS-aware, persisted, class-based). Canvas/Recharts/`.speck-*` colors are string literals that don't follow Tailwind — they get a shared theme-aware color resolver. Chrome mono is swapped to the body font per a fixed inventory; data mono stays.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind (with `darkMode: ['class']`), shadcn/ui, Recharts, Canvas 2D, `@fontsource-variable/*`. Tests: Vitest + RTL (jsdom). Visual verify: local dev server + browser screenshots.

**Keep (do NOT touch):** flare (`#ff4e22`) + plasma (`#27e0cf`) hues, Archivo display type, the stroboscopic-trajectory motif, `font-mono` on *numeric data*. Physics-convention colors (red X-axis / blue Y-axis in `AxisRotation.tsx`) stay as-is.

---

## Design decisions (locked)

1. **Semantic-token refactor** (chosen over variable-backing the ramp): raw `zinc`/`emerald` classes → shadcn tokens across all surfaces.
2. **Light is the default** (`:root` = light); **dark** lives under `.dark` and is opt-in via a toggle that also respects the OS setting on first visit.
3. **Chrome → body font, data → mono.** Per the inventory in "Chrome mono" below.
4. **Accent-on-accent text stays dark:** flare CTAs keep near-black labels (`primary-foreground`), matching today's `text-zinc-950` on emerald and passing contrast (white-on-flare fails AA for small text).
5. **Starting token values below are a starting point** — tune each against WCAG AA during per-surface QA.

---

## Token architecture

Redefine `src/index.css` so `:root` holds light values and `.dark` holds dark values. Restore the elevation ladder the raw `zinc` steps imply (bg 5% → card 9% → secondary 13% → accent 21% in dark), which the current flattened tokens (all 15%) lose. Add two tokens beyond the shadcn defaults: `--sunken` (recessed inset panels, from `bg-zinc-950/50`) and `--sunken-foreground`.

| Token | Light `H S% L%` | Dark `H S% L%` | Role (raw class it replaces) |
|---|---|---|---|
| `--background` | `220 20% 98%` | `224 31% 5%` | page bg (`zinc-950`) |
| `--foreground` | `222 24% 11%` | `222 40% 96%` | primary text (`zinc-100/200/300`) |
| `--card` | `0 0% 100%` | `224 26% 9%` | card/panel (`zinc-900`) |
| `--card-foreground` | `222 24% 11%` | `222 40% 96%` | — |
| `--sunken` | `220 20% 95%` | `224 34% 6%` | inset sub-panel (`zinc-950/50`) |
| `--sunken-foreground` | `215 14% 40%` | `220 12% 62%` | — |
| `--popover` | `0 0% 100%` | `224 26% 9%` | tooltip/popover surface (`zinc-900`) |
| `--popover-foreground` | `222 24% 11%` | `222 40% 96%` | tooltip text (`zinc-300`) |
| `--primary` | `12 100% 56%` | `12 100% 57%` | flare fills/accents (`emerald-600`) |
| `--primary-foreground` | `18 70% 8%` | `18 70% 8%` | text on flare (`zinc-950`) |
| `--secondary` | `220 16% 93%` | `223 24% 13%` | pills/badges/elevated (`zinc-800`) |
| `--secondary-foreground` | `222 24% 11%` | `222 40% 96%` | — |
| `--muted` | `220 16% 93%` | `223 24% 13%` | track/muted surface (`zinc-800`, `bg-muted`) |
| `--muted-foreground` | `215 14% 40%` | `220 12% 62%` | secondary/eyebrow text (`zinc-400/500/600`) |
| `--accent` | `220 16% 88%` | `221 21% 21%` | hover/active surface (`zinc-700`) |
| `--accent-foreground` | `222 24% 11%` | `222 40% 96%` | — |
| `--destructive` | `0 72% 48%` | `0 72% 51%` | errors (`red-*` destructive uses) |
| `--destructive-foreground` | `0 0% 100%` | `222 40% 96%` | — |
| `--warning` *(new)* | `36 96% 44%` | `38 92% 55%` | armed/uncalibrated (`amber-400/500`) |
| `--warning-foreground` | `36 60% 12%` | `38 60% 10%` | — |
| `--border` | `220 16% 90%` | `221 21% 20%` | card/divider border (`zinc-800`) |
| `--input` | `220 14% 84%` | `220 18% 26%` | control border (`zinc-700`) |
| `--ring` | `12 100% 56%` | `12 100% 57%` | focus ring (`ring-zinc-600` dupes → `ring-ring`) |
| `--radius` | `0.7rem` | `0.7rem` | unchanged |

Notes:
- `--warning` is added to absorb the parallel `amber-*` status system (armed/placing, uncalibrated) so it themes too. Red X / blue Y axis colors in `AxisRotation.tsx` are physics convention — leave literal.
- Update `<meta name="theme-color">` (`index.html:7`) to be set dynamically by the theme system (light `#f7f8fa`, dark `#090b11`).

---

## The mapping — raw class → semantic token

Apply mechanically. Opacity/state variants keep their modifier (`hover:`, `/50`, `data-[state=…]:`).

**Backgrounds**
| Raw | Token |
|---|---|
| `bg-zinc-950` | `bg-background` |
| `bg-zinc-950/50` | `bg-sunken` |
| `bg-zinc-900` | `bg-card` |
| `bg-zinc-900/50` | `bg-card/60` |
| `bg-zinc-800` | `bg-secondary` |
| `bg-zinc-800/50` | `bg-secondary/50` |
| `bg-zinc-700` | `bg-accent` |
| `hover:bg-zinc-800`, `hover:bg-zinc-700` | `hover:bg-accent` |
| `hover:bg-zinc-900` | `hover:bg-card` |
| `focus:bg-zinc-700` | `focus:bg-accent` |

**Text**
| Raw | Token |
|---|---|
| `text-zinc-100`, `text-zinc-200`, `text-zinc-300` | `text-foreground` |
| `text-zinc-400`, `text-zinc-500`, `text-zinc-600`, `text-zinc-700` | `text-muted-foreground` |
| `placeholder:text-zinc-600` | `placeholder:text-muted-foreground` |
| `text-zinc-950` (on flare only) | `text-primary-foreground` |
| `hover:text-zinc-100/200/300` | `hover:text-foreground` |
| `hover:text-zinc-400`, `group-hover:text-zinc-400/500` | `hover:text-muted-foreground` / `group-hover:text-muted-foreground` |
| `group-hover:text-zinc-100` | `group-hover:text-foreground` |

*Judgment call:* where `text-zinc-300` sits next to `text-zinc-100` in the same component and the contrast matters, keep the dimmer one `text-muted-foreground`. Default is `text-foreground`; QA decides per surface.

**Borders / ring**
| Raw | Token |
|---|---|
| `border-zinc-800` | `border-border` |
| `border-zinc-700` | `border-input` |
| `border-zinc-600`, `hover:border-zinc-600`, `focus:border-zinc-600` | `border-input`, `hover:border-ring`, `focus:border-ring` |
| `group-hover:border-zinc-500` | `group-hover:border-ring` |
| `ring-zinc-600` / `focus:ring-zinc-600` | delete and rely on the primitive's `ring-ring`; for raw `<input>`, use `focus:ring-ring` |
| `fill-zinc-700` (tooltip arrow) | `fill-popover` |
| `decoration-zinc-600`, `hover:decoration-zinc-400` | `decoration-muted-foreground`, `hover:decoration-foreground` |

**Accent (emerald/flare/plasma)**
| Raw | Token |
|---|---|
| `bg-emerald-600` | `bg-primary` |
| `hover:bg-emerald-500`, `hover:bg-flare-hi` | `hover:bg-primary/90` |
| `data-[state=active]:bg-emerald-600`, `data-[state=checked]:bg-emerald-600` | `…:bg-primary` |
| `text-emerald-400`, `text-emerald-500` | `text-primary` (QA: if a spot fails AA on light, use `text-flare-lo`) |
| `bg-emerald-500` (status dot) | `bg-primary` |
| `bg-emerald-500/5`, `bg-emerald-500/20` | `bg-primary/10` |
| `border-emerald-500`, `border-emerald-500/50`, `border-emerald-500/30`, `hover:border-emerald-500` | `border-primary` (+ keep opacity) |
| `border-t-emerald-500` (spinner) | `border-t-primary` |
| `bg-plasma` (dot/fill) | keep `bg-plasma` (works on both grounds) |
| `text-plasma` | `text-plasma` on dark; on light QA-swap to `text-plasma-lo` (`#14b9ab`) where contrast fails |
| `bg-plasma/15` | keep |

**Black scrims** (these are *over video/imagery*, correct in both themes — keep literal): `bg-black/80` (dialog overlay), `bg-black/60`, `bg-black/50`→`hover:bg-black/70`, `shadow-black/50`. **Do not convert.**

**Amber/red/blue** (out of the zinc/emerald core, handle in Phase 7): `amber-*` → `warning` token; destructive `red-*` → `destructive`; keep axis-convention red/blue literal; fix the `bg-blue-600` "Best fit" switch (`projects.$projectId.tsx:543`) to `bg-primary` for consistency with every other switch.

---

## Non-class colors (separate handling — Phase 4)

These are string literals; token changes do **not** reach them. Introduce `src/lib/theme-colors.ts` exporting a `getThemeColors(theme: 'light'|'dark')` map (+ a `useThemeColors()` hook that re-reads on theme change) and replace the literals below.

- **`src/index.css:73`** `.speck-traj-line` uses raw `hsl(174 75% 52%)` — replace with the plasma token (bug: should have referenced plasma). `:79-80` `.speck-live` flare `#ff4e22` — fine on both grounds, keep.
- **`src/features/graphing/components/Graph.tsx`** Recharts literals (`:291,298,304,305,306,314,325,326,327,331,332,337`): grid `#27272a`, ticks `#71717a`, axis lines `#3f3f46`, tooltip bg `#18181b`/border `#3f3f46`/label `#a1a1aa` — all map to theme colors. Data line/dots `#ff4e22` (keep), fit curve `#27e0cf` (keep), current-time `#fbbf24` → `warning`.
- **`src/features/tracking/components/CanvasOverlay.tsx`** `ctx` literals: loupe bg `#090b11` → `background`; point dots/crosshair flare (keep); axis/origin `#27e0cf` (keep); `#000000` origin/point centers → theme fg-contrast; `#2f83bb`/`#bfe0ff` scale-calibration blue (not in palette — pick a themeable blue or move to plasma); current-frame `#fbbf24` → `warning`; selection ring `#ffffff` → theme contrast.

---

## Verification protocol (every visual task)

1. `npm run typecheck` → clean.
2. Start dev server (`@run` skill / `npm run dev`), open the surface in the browser.
3. Screenshot in **light** (default) and **dark** (toggle). Check: legible text contrast, visible borders, correct elevation (cards brighter than bg in light, lighter than bg in dark), flare/plasma still pop, no invisible/black-on-black or white-on-white.
4. Fix misfires, re-verify, then commit.

**Surfaces checklist:** landing (signed-out `/`), project list (signed-in `/`), editor shell (`/projects/$id`), scale calibration, origin tool, axis rotation, setup wizard, data table, graph, video player + controls + upload, frame-rate control, share page, dialogs/tooltips/selects.

---

## Phases & Tasks

### Phase 0 — Branch & baseline
- **Task 0.1:** Create branch off the current clean tree: `git checkout -b feat/light-first`. Confirm `git status` clean.
- **Task 0.2:** Baseline screenshots of every surface in current dark theme (reference for "did I regress the dark theme"). Save to `docs/plans/baseline/`.

### Phase 1 — Token foundation + theme system (TDD the logic)
- **Task 1.1 (TDD):** `src/lib/use-theme.ts` — a `useTheme()` hook + `applyTheme()`: resolves `stored ?? OS pref`, writes `dark` class on `document.documentElement`, persists to `localStorage['speck-theme']`, updates `theme-color` meta. Test (`src/lib/use-theme.test.ts`): defaults to OS when unset; stored value wins; `applyTheme('dark')` adds the class + persists; `'light'` removes it. Steps: write failing test → run (fail) → implement → run (pass) → commit.
- **Task 1.2:** Rewrite `src/index.css` `:root`/`.dark` per the token table (light in `:root`, dark in `.dark`); add `--sunken(-foreground)`, `--warning(-foreground)`. Register the new tokens in `tailwind.config.js` (`sunken`, `warning`). Commit.
- **Task 1.3:** Mount theme on load in `src/main.tsx` (call `applyTheme` with resolved value before render to avoid flash) and set `index.html` no-flash inline script + default `theme-color`. Commit.
- **Task 1.4:** Add a theme toggle control (sun/moon) into the header/nav of the landing, project list, and editor. Verify toggle persists across reload. Commit.
- **Checkpoint:** `components/ui/*` primitives (11 of 13) should now render light automatically. Screenshot a primitive-heavy view to confirm the token layer works before mass conversion.

### Phase 2 — Fix the two non-token primitives
- **Task 2.1:** `src/components/ui/tooltip.tsx:18,25` — convert hardcoded `border-zinc-700 bg-zinc-900 text-zinc-300 fill-zinc-700` → `border-border bg-popover text-popover-foreground fill-popover`. Verify tooltips both themes. Commit.
- **Task 2.2:** `src/components/ui/dialog.tsx:22` — leave `bg-black/80` (scrim). Confirm dialog body already token-based. No-op or comment.

### Phase 3 — Convert surfaces to tokens (apply the mapping, per file)
One commit per file/area; each ends with the verification protocol. Order by visibility:
- **3.1** `src/routes/index.tsx` (landing + project list; note inline `rgb(39,39,42)` grid gradient `:104` → token) 
- **3.2** `src/routes/projects.$projectId.tsx` (editor shell; fix `bg-blue-600` switch `:543` → `bg-primary`)
- **3.3** `src/features/coordinates/components/ScaleCalibration.tsx`, `OriginTool.tsx`, `AxisRotation.tsx` (keep axis red/blue)
- **3.4** `src/features/coordinates/components/SetupWizard.tsx` (already partly semantic; finish it)
- **3.5** `src/features/data-table/components/DataTable.tsx`
- **3.6** `src/features/graphing/components/Graph.tsx` (Tailwind classes only here; literals in Phase 4)
- **3.7** `src/features/video/components/VideoPlayer.tsx`, `VideoControls.tsx`, `VideoUpload.tsx`, `FrameRateControl.tsx`
- **3.8** `src/routes/share.$shareToken.tsx` (already semantic — just verify light)

### Phase 4 — Theme-aware canvas / charts / brand CSS
- **Task 4.1:** Create `src/lib/theme-colors.ts` + `useThemeColors()`. Commit.
- **Task 4.2:** `CanvasOverlay.tsx` — replace `ctx` literals per the list; resolve scale-calibration blue to a themeable value; re-verify the loupe, axes, points, selection ring readable on light video frames. Commit.
- **Task 4.3:** `Graph.tsx` — replace Recharts literals with theme colors; keep data line/fit curve; current-time → warning. Verify light + dark. Commit.
- **Task 4.4:** `src/index.css` `.speck-traj-line` → plasma token. Verify landing hero motion both themes. Commit.

### Phase 5 — De-code the chrome (mono → body)
Using the inventory (chrome vs data), remove `font-mono` from CHROME only; leave DATA mono. One commit. Chrome sites include: section eyebrows ("Axis Settings", "Scale Calibration", "Motion Data", "Setup Guide", graph titles), buttons ("Reset", "Basic/Advanced", model buttons), status/hints ("Saving…/Saved", "Ready to track", "Click video to add point", "Analyzing video", "NO VIDEO LOADED"), badges ("Calibrated", "Optional", "Dev Mode"), field labels, unit-select text. **Keep mono:** coordinates, angles (`°`), `px/unit`, `R²`, equations, fps, table cells + headers, time/frame counters, `%`, `MP4 • WebM…` sizes. Verify a chrome-heavy panel reads as body font. Commit.

### Phase 6 — De-cockpit + copy warmups (light touch)
- **6.1** Loosen density on first-run surfaces: SetupWizard steps, empty states ("No projects yet", "No data points tracked", "NO VIDEO LOADED") — more padding, larger hit targets, sentence-case (not ALL-CAPS/mono) empty-state text.
- **6.2** Warm 3–5 copy strings where they read like a console (e.g. "publication-quality" in OG/landing is fine to keep, but bare status strings can soften). Keep it minimal; no childish tone. Commit.

### Phase 7 — Cleanup & follow-ups
- **7.1** `amber-*` → `warning` token across armed/uncalibrated states.
- **7.2** Remove the duplicate `ring-zinc-600` focus mechanism where the primitive already rings.
- **7.3** Fix/refresh stale `e2e/home.spec.ts` (asserts old "Motion Tracker"/"Get Started" copy).
- **7.4** Add a short "Theming" note to `CLAUDE.md` (light-first, tokens are the source of truth, mono = data only).
- **7.5** Final full-app pass in both themes; update the brand memory + close out.

---

## Execution handoff

Plan complete. Recommended: **Phase 1 is the "Minimal (flip the theme)" milestone** — shippable on its own; Phases 3–5 are the genre fix. Two execution options:

1. **Subagent-Driven (this session)** — dispatch a fresh subagent per task/phase with review between; fast iteration, I keep the thread. → `@superpowers:subagent-driven-development`.
2. **Parallel Session (separate)** — open a new session in the `feat/light-first` branch and batch-execute with checkpoints. → `@superpowers:executing-plans`.
