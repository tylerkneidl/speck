# Speck Sims, part 1: the linear motion notebook

**Goal:** Ship Speck's first simulation, a toy car on a straight track that looks like a lab notebook page come to life. Students explore 1D motion in a clean sandbox, drive the car themselves, and take on guided "match the graph" work orders. This is the foundation that later sims (projectile, forces, circular, energy, collisions, oscillations) build on.

**Prototype:** [Linear Motion Notebook](https://claude.ai/artifact/1XcqS8KvjYYMZ4oFUBAziU) is a single-file HTML mockup that settles the look and the three modes. This plan turns it into real code inside Speck.

**Tech stack:** React 19 + TypeScript + Vite, TanStack Router, Canvas 2D, [Rough.js](https://roughjs.com) (MIT) for the hand-drawn strokes, self-hosted handwriting fonts via `@fontsource`, Vitest for the engine, Playwright screenshots for the canvas.

---

## Why sims, and why our own

Video is real life: friction, air resistance, measurement error. That's the point of the filmed library, and it stays. Sims are the other half. They give students a clean sandbox to see the underlying pattern first, and then they can add "dirt" back in.

PhET is CC-BY and we could embed it, but an embedded sim is a sealed box: no data comes out, and it can't carry our look, our story mode, or our curriculum. We build our own.

## Decisions (locked with Tyler, 2026-10-24)

1. **Build our own sims.** Their purpose is discovery and another way to learn beyond video. Fitting a model to tracked footage is a possible later feature, not the core.
2. **Sandbox first, real world as an option.** Every sim starts ideal (no friction, no drag). Friction and drag arrive later as knobs students switch on. That's the bridge to the filmed labs.
3. **Guided and discovery in the same sim.** The sim is the sandbox. Guided activities are content layered on top.
4. **Sims can be their own product.** They don't have to share the tracker's interface. Speck's graphing gets reused only where it fits naturally.
5. **The look is a lab notebook, animated.** Graph paper, a margin rule, and neat, clean pen sketches that move: car, track, meter stick, graphs, labels. Neat, not doodly, so the numbers stay trustworthy.
6. **First sim: linear motion.** We start at the beginning of the curriculum.
7. **Curriculum is content, not code.** The goal is lots of supporting curriculum, so adding an activity must never need engineering work.
8. **Moving or measured art is drawn by code.** AI image models are only for static art (characters, logos, worksheet illustrations).
9. **Free vs. paid: decided later.** Build so either is easy to switch on.

## Architecture

Three layers, each knowing only about the one below it.

```
content    activities/*.ts      prompts, locked sliders, targets, work orders
UI         sims/linear-motion/  React page, modes, notebook canvas, controls
engine     sims/engine/         pure TypeScript: state, step, clock, samples
```

### Engine (no React, no DOM)

```ts
// src/features/sims/engine/types.ts
export interface Body1D { t: number; x: number; v: number; a: number }

export interface Sample1D extends Body1D {}

/** Fixed-timestep clock: turns wall-clock frames into whole physics ticks. */
export interface SimClock { dt: number; accumulator: number }
```

- `step(state, a, dt) → Body1D`: one physics tick. **Tyler writes this** (see below).
- `advance(sim, realDt)`: runs whole ticks off the accumulator so physics never depends on frame rate. It handles track ends (clamp and stop) after each step, so `step` stays pure.
- `recorder`: keeps samples every 1/30 s for the graphs and a ticker-tape dot every 0.5 s.
- **Shared data contract:** `TimeSeries = { t: number[]; channels: Record<string, { values: number[]; unit: string }> }`. This one small type is the only thing sims share with the rest of Speck. It lets a sim send a run to the data table or `lib/regression` later without the two products depending on each other.

### UI

- **Route:** `/sims` (an index of sims, one card for now) and `/sims/linear-motion`. Both are public, with no sign-in, the same as `/try`. Mode and activity live in search params (`?mode=match&activity=qc-01`) so a teacher can link straight to an activity.
- **Notebook canvas layers.** The static layer (paper, ruler, end stops) is drawn once to an offscreen canvas. The moving layer (car, arrow, dots) is redrawn each frame. Rough.js shapes use fixed seeds so the sketches don't wobble between frames.
- **`NotebookGraph`** is a new canvas component, not the existing Recharts `Graph`. `Graph.tsx` is wired to the tracking stores, and Recharts can't draw pencil predictions or self-drawing pen lines. The axes are pen-drawn, the grid is aligned to the data, the data is a smooth ink line, the target is a dashed red pen line, and predictions are grey pencil strokes.
- **Fonts:** Caveat (handwritten labels) and Patrick Hand (UI labels) through `@fontsource`, matching how Archivo and Hanken Grotesk ship today. JetBrains Mono stays the font for numbers, per CLAUDE.md.
- **Theme:** the notebook follows the app theme. Light is graph paper with blue-black ink. Dark is a blueprint: white and pale-cyan lines on deep blue, with the red pen kept for targets and arrows. All notebook colors come from a `notebookColors(theme)` helper next to `lib/theme-colors.ts`, so canvas drawing never hardcodes a color.
- **State:** a small Zustand store for the sim (params, mode, run state, prediction strokes). The engine state lives in a ref and runs on `requestAnimationFrame`, so React doesn't re-render every frame. A throttled readout updates the numbers.

### Modes

| Mode | What students do | Controls |
|---|---|---|
| Explore | Set x₀, v₀, a, then run, pause, step, reset. They can change a mid-run. | Three sliders |
| Drive it | Push the car with ← / → (or on-screen buttons) and watch x, v, a draw themselves | x₀ slider, arrows |
| Match the graph | Read a work order, sketch a pencil prediction, set sliders, run, get scored | Sliders + work order |

Space toggles run/pause, matching the tracker's shortcut.

### Activities (content)

```ts
// src/features/sims/linear-motion/activities.ts
export const activities: Activity[] = [
  {
    id: 'qc-01',
    mode: 'match',
    department: 'Quality Control',          // story mode; ignored when standalone
    prompt: "Make the car's position graph land on the red line.",
    target: { x0: 2, v0: 0.5, a: 0 },
    locked: ['a'],                          // sliders students can't touch
    predictFirst: true,                     // must sketch before Run unlocks
  },
]
```

Activities start as typed TypeScript objects, which are easy to review in PRs. They move to the database (and a teacher authoring UI) when there are enough of them to need it. The `department` field connects to the toy-company story mode from the film plan, and standalone mode simply leaves it out.

## Code Tyler writes

Two functions hold the real teaching judgment. Each gets a signature, call sites, and tests, with a `TODO(Tyler)` body.

**1. `step(state, a, dt)`** in `engine/step.ts`. The choice of integrator: explicit Euler, semi-implicit Euler, or the exact kinematic equation for constant a. That choice decides how drag and friction will slot in later. The tests check the contract, not the method:
- Constant velocity stays exact.
- Constant acceleration stays within 1 mm of x₀ + v₀t + ½at² after 10 s at dt = 1/240.
- `step` never mutates its input.

**2. `scoreMatch(samples, target) → { gap, verdict, hint? }`** in `linear-motion/score.ts`. How strict to be, whether to forgive a small time offset, and which mistakes deserve a named hint: a slope with the wrong sign means v has the wrong direction, and curvature with the wrong sign means a has the wrong sign. The tests pin down only the shape: a perfect match gets the best verdict, and every verdict comes from a fixed set.

## Phases

**Phase 0: setup.** Add `roughjs`, `@fontsource/caveat`, and `@fontsource/patrick-hand`, and scaffold the `src/features/sims/` folders.

**Phase 1: engine (TDD).** Types, clock, `advance`, recorder, `TimeSeries` export, and wall handling, with tests written first. `step` is scaffolded for Tyler.

**Phase 2: notebook primitives.** Paper and blueprint palettes, Rough.js helpers with fixed seeds, the offscreen static layer, and `NotebookGraph`.

**Phase 3: Explore mode.** Route, page layout (margin column of controls, graphs on the right, stacked on phones), car, ticker-tape dots, velocity arrow, and readouts.

**Phase 4: Drive it.** Arrow keys, hold-to-push buttons (pointer events for touch), and acceleration from input.

**Phase 5: Match the graph.** The activity format, a work-order sticky note, target lines, and `scoreMatch` scaffolded for Tyler. Two or three starter activities.

**Phase 6: pencil predictions.** Draw on the x–t graph before a run, erase, and the `predictFirst` gate.

**Phase 7: polish and verification.** Keyboard access to every control, an `aria-live` readout, reduced motion (show the motion diagram instead of animating), phone layout, and Playwright screenshots of each mode at desktop and phone widths.

## Verification

- Vitest: the engine (`advance`, recorder, walls) plus the contract tests for Tyler's two functions.
- Playwright: screenshots of Explore, Drive, and Match at 1280px and 400px in both themes, and a scripted run that checks the readout at t = 10 s against x₀ + v₀t + ½at².
- `npm run check` and `npm run typecheck` pass.

## Out of scope for this plan

- Friction and drag knobs (the next linear-motion iteration, after `step` exists).
- Saving sim runs to a project, or class assignments.
- Story mode chrome beyond the work-order sticky note.
- Free vs. paid gating.
- SEO and prerendering for `/sims` pages (that's a separate thread on SEO and marketing).

## Open questions

1. What should the fictional toy company be called? The film plan leaves this open too, and the work orders will need it.
