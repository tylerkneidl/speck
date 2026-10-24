# Equation Toolbox: problem solving as picking the right tool

**Goal:** Give students a way to see how a word problem turns into equations. They pull givens out of the text, assign each one a variable (including implicit ones like "starts from rest" → v₀ = 0), and watch which equations in their toolbox become usable. At higher levels, solving one equation unlocks the next, and the chain is drawn on the page. It is built for the moment students struggle most: when the list of taught equations piles up and they no longer know which one to reach for.

**Tech stack:** React 19 + TypeScript + Vite, TanStack Router, the notebook primitives from the sims plan (Rough.js, Caveat / Patrick Hand, paper and blueprint palettes), Zod for problem files, Vitest for the logic, Playwright for screenshots and flows.

---

## Where this came from

Tyler taught problem solving as "equations are a toolbox": identify what you're given, and let that tell you which tool to pick. This tool makes that habit visible and practiceable, with the scaffolding a teacher would give in person and then fade.

## Decisions (locked with Tyler, 2026-10-24)

1. **Students do the extracting, not the app.** The problem sits on a notebook page. Students highlight a phrase and tag it with a variable. Each problem is authored with the correct tags, so mistakes get caught and explained instead of going through silently.
2. **Implicit phrases come from a shared glossary.** "At rest" → v₀ = 0, "comes to a stop" → v_f = 0, "dropped" → v₀ = 0 and a = −g, "at the top" → v_y = 0. Students can open it as a hint, and the guidance level decides when it's offered.
3. **Equation cards light up as givens are tagged.** One unknown means usable now, two means almost, more means not yet. The variable they want to find is circled in red, and a card glows when it can reach it.
4. **Chaining is visible.** When a card is solved, its result becomes a new given, so more cards light up. The page draws the chain as arrows.
5. **The toolbox grows with the course.** A toolbox holds only the equations taught so far. The teacher picks it, or it follows from the difficulty.
6. **Two separate dials per problem: difficulty and guidance.** Each problem is written once and can be played at any guidance level, so a teacher can start a class guided and fade to independent.
7. **Students rearrange and plug in.** The tool doesn't stop at choosing an equation. At guidance levels 1 and 2 the rearranged form is shown for them.
8. **Problems come from us first.** Teacher-written problems come later, once the format has settled.
9. **It's a standalone tool, linked from labs.** Each lab and sim links to a few matching problems, but the toolbox doesn't depend on them.
10. **It looks like the sims:** a notebook page, neat pen strokes, highlighter for tagged phrases, and red pen for feedback. The dark theme is the blueprint look.

## The two dials

### Difficulty (filterable, maps onto the MS / HS / AP levels in the standards plan)

| Difficulty | What it looks like | Toolbox |
|---|---|---|
| `ms` | One step, one equation, givens stated plainly. | average speed (v = d/t) |
| `hs-intro` | One equation, chosen from several. Implicit phrases appear. | the big four kinematics equations + average velocity |
| `hs` | Two steps: one answer feeds the next equation. Some extra info that isn't needed. | same |
| `ap` | Multi-step and multi-phase (speeds up, then brakes), free fall with signs, 2D, symbolic answers. | same, plus g and per-axis variables |

`hs-intro` and `hs` both map to the HS level for standards and lesson plans.

### Guidance (the scaffold)

| Level | Tagging | Equation cards | Rearranging | Feedback |
|---|---|---|---|---|
| 1 Worked | Givens arrive already tagged; the student reads why | Light up live | Shown | Right away |
| 2 Guided | Student tags; glossary hints on | Light up live | Shown | Each tag is checked right away |
| 3 Supported | Student tags; glossary on request | Show their state only after the student commits to a card | Pick from rearranged forms (with common wrong ones) | When they press Check |
| 4 Independent | Student lists knowns and the unknown on a blank page | No lighting; student picks cards | Done on paper; they enter the number | Only at the end |

Guidance is a URL search param (`?guide=3`), so a teacher can link a whole class to the same setting.

## Content format

Problems, equations, and glossary entries are typed content files, the same approach as the sims activities and the `content/` folder in the standards plan. A bad variable name or equation id fails typecheck.

### Variables and equations

```ts
// src/features/toolbox/content/variables.ts
export const variables = {
  dx: { symbol: 'Δx', name: 'displacement', unit: 'm' },
  v0: { symbol: 'v₀', name: 'initial velocity', unit: 'm/s' },
  vf: { symbol: 'v_f', name: 'final velocity', unit: 'm/s' },
  a:  { symbol: 'a', name: 'acceleration', unit: 'm/s²' },
  t:  { symbol: 't', name: 'time', unit: 's' },
  // ...
} as const

// src/features/toolbox/content/equations.ts
export const equations: Equation[] = [
  {
    id: 'kin-vf-v0-a-t',
    display: 'v_f = v₀ + a t',
    vars: ['vf', 'v0', 'a', 't'],
    // One rearranged form per variable, written by hand (no algebra engine).
    solveFor: {
      vf: { display: 'v_f = v₀ + a t', fn: ({ v0, a, t }) => v0 + a * t },
      t:  { display: 't = (v_f − v₀) / a', fn: ({ vf, v0, a }) => (vf - v0) / a },
      // ...
    },
  },
  // Δx = v₀t + ½at² is quadratic in t: its solveFor.t returns both roots,
  // and the problem's answer says which one is physical.
]

export const toolboxes = {
  'ms-speed': ['avg-speed'],
  'hs-kinematics': ['kin-vf-v0-a-t', 'kin-dx-v0-t-a', 'kin-vf2', 'kin-dx-avg', 'avg-velocity'],
}
```

Rearranged forms are written out by hand. That's a handful per equation, it gives us control over how each form looks, and it avoids pulling in a computer algebra system.

### Problems

```ts
// src/features/toolbox/content/problems/kin-hs-007.ts
export default defineProblem({
  id: 'kin-hs-007',
  difficulty: 'hs-intro',
  toolbox: 'hs-kinematics',
  standards: [/* ids from the standards registry (PR #21) */],
  text: 'A toy car starts from rest and speeds up at 3.0 m/s² for 4.0 s. How far does it travel?',
  givens: [
    { phrase: 'starts from rest', var: 'v0', value: 0, implicit: true, glossary: 'at-rest' },
    { phrase: '3.0 m/s²', var: 'a', value: 3.0 },
    { phrase: '4.0 s', var: 't', value: 4.0 },
  ],
  extras: [],                     // info in the text that isn't needed (hs and up)
  find: { phrase: 'How far', var: 'dx' },
  solution: [{ equation: 'kin-dx-v0-t-a', solveFor: 'dx' }],   // one valid chain, used for level 1
  answer: { value: 24, sigFigs: 2, tolerance: 0.02 },
})
```

Multi-phase AP problems add `phases`, and their variables get a phase subscript (v₁ is the final velocity of phase 1 and the initial velocity of phase 2). The problem file states which variables are shared between phases.

### Glossary

```ts
{ id: 'at-rest', phrases: ['at rest', 'from rest', 'starts from rest'], sets: { v0: 0 } }
{ id: 'dropped', phrases: ['dropped', 'released'], sets: { v0: 0, a: '-g' }, note: 'Up is positive.' }
```

The hint button finds glossary entries whose phrases appear in the problem text and offers them one at a time.

## The page

Route `/toolbox` (a problem list with difficulty and topic filters) and `/toolbox/$problemId?guide=2`. Public and no sign-in needed, the same as `/sims` and `/try`. Code lives in `src/features/toolbox/`.

Layout on a single notebook page (it stacks on phones):

- **Problem card (top left).** The problem text on an index card. Selecting text opens a popover of variable chips. A tagged phrase gets a highlighter stroke in the variable's color, with a small handwritten label like "v₀ = 0" above it. On touch, tapping a word starts a selection and tapping again extends it. Words are focusable, so keyboard users can do this too.
- **Knowns (left margin).** A handwritten table of variable, value, and unit, with the unknown circled in red. Values that come from solving a card arrive with an arrow from that card.
- **Toolbox (right).** One card per equation in the toolbox. Each variable in the equation is a slot: inked if known, empty if not, red circle if it's the target. Usable cards get a highlighter glow, almost cards are inked but plain, and not-yet cards are faint pencil.
- **Work area (below).** Choose a card → see or pick the rearranged form → plug in → enter the answer. A solved card's result drops into Knowns, and the chain arrow is drawn.

Wrong tags get red-pen margin notes written for the specific mistake, not "incorrect": "That's how long it took, not how far: try t." Each problem's authored tags drive these, with a short generic fallback.

## Code Tyler writes

Two functions hold the real teaching judgment. Each gets a signature, call sites, and tests, with a `TODO(Tyler)` body.

**1. `classifyEquations(toolbox, known, target) → Map<EquationId, { status, missing }>`** in `toolbox/logic/classify.ts`. This decides how cards light up. The judgment calls: whether a card that's fully solvable but doesn't touch the target should glow as strongly as one that does; whether "almost" is shown at all at a given difficulty; and how to treat an equation that is quadratic in its unknown. The tests pin down only the contract: a card with every variable known except the target is `usable`, a card with no known variables is `not-yet`, and `status` comes from a fixed set.

**2. `findChains(toolbox, known, target, maxSteps) → Chain[]`** in `toolbox/logic/chains.ts`. This decides which multi-step paths count. It's used for the "two steps away" hint and for grading at level 4, where any valid chain should get credit, not only the authored one. The judgment calls: shortest first or every chain, whether reusing an equation counts, and how to rank equal-length chains. The tests check that every authored `solution` in the content is among the chains found, and that a target that's already known returns an empty chain.

## Phases

**Phase 0: setup.** Scaffold `src/features/toolbox/`, routes, and content folders. Reuse the notebook primitives from the sims work (PR #20); if they haven't landed yet, build only what this needs inside the shared `notebook/` folder.

**Phase 1: content model.** Variables, equations with hand-written rearranged forms, toolboxes, the glossary, and `defineProblem` with Zod validation. A test solves every authored problem along its `solution` and checks it matches `answer`.

**Phase 2: logic.** `classifyEquations` and `findChains` scaffolded for Tyler, with contract tests. A stand-in version keeps the UI work moving until his lands.

**Phase 3: problem card and tagging.** Text selection, the variable popover, highlighter strokes, tag checking against the authored givens, and red-pen feedback.

**Phase 4: knowns and toolbox cards.** Card slots, lighting states, and the target circle.

**Phase 5: solving and chaining.** The work area, rearranged forms, answer checking with sig figs and tolerance, new givens from solved cards, and chain arrows.

**Phase 6: guidance levels.** Wire levels 1 to 4 from the table above, plus the glossary hint button.

**Phase 7: problem list and starter content.** Filters for difficulty and topic. Starter set, 1D kinematics only: 6 `ms`, 8 `hs-intro`, 6 `hs`, 4 `ap`. Each lab page links its matching problems.

**Phase 8: polish and verification.** Keyboard access throughout, `aria-live` for feedback, phone layout, reduced motion, both themes.

## Verification

- Vitest: the content test (every problem solves to its answer), contract tests for Tyler's two functions, tag checking, and answer checking.
- Playwright: one problem at each guidance level, played start to finish, plus screenshots at 1280px and 400px in both themes.
- `npm run check` and `npm run typecheck` pass.

## Out of scope for this plan

- Toolboxes beyond 1D kinematics (forces, energy, momentum). The format supports them, and they come after the first set has been used in a class.
- Teacher-written problems and an authoring UI.
- Saving progress, class assignments, and teacher dashboards.
- Typed algebra (students entering their own rearranged formula). At level 4 they rearrange on paper.
- Hiding answers from students. Answers ship to the browser so practice works without an account. That's fine for practice, but graded assignments will need answers checked on the server.

## Open questions

1. **Symbols.** This plan uses v₀ and v_f, matching how Tyler taught it. Some classes use vᵢ, or u and v. Should a toolbox be able to switch symbols, or is one convention enough for now?
