# Teacher AI Tools: drafting problems and sim activities

**Goal:** Let teachers describe what they want ("a two-step braking problem for HS, car on a wet road" or "a match-the-graph activity where the car starts behind the origin and slows down") and get a draft they can edit and give to their classes. AI is for teachers only. It never talks to students and never sees student data.

**Tech stack:** Hono route on the Next.js server, the Anthropic TypeScript SDK with Claude Sonnet 5.5 (`claude-sonnet-5-5`) for drafting and Claude Haiku 5.5 (`claude-haiku-5-5`) for moderation checks, structured outputs validated by the existing Zod content schemas, Postgres for drafts, Vitest for the checks.

---

## Where this came from

Tyler wants AI in Speck, but not on the student side. Two ideas: generating problems for the equation toolbox, and giving teachers the sim engine so they can make their own sims. Both already have typed content formats (toolbox problems in the equation toolbox plan, activities in the linear motion sim plan), which is what makes this safe to do.

## Decisions (talked through with Tyler, 2026-10-24)

1. **Teacher-facing only.** No AI on any student page, and no student data in any request.
2. **AI drafts content files, never code.** The output is a problem or an activity in the same format we write by hand, and it must pass the same Zod schema.
3. **The AI writes the words, our code does the math.** The model picks the scenario, the wording, and draft numbers. Our solver computes the answer along the chain, and the engine runs each sim activity. The model never supplies an answer we trust.
4. **"Their own sims" means new activities on our engines, not new engines.** Teachers get new scenarios, locked sliders, targets, prompts, and predict-then-run steps. Engines (and `step()`) stay hand-written and tested.
5. **The teacher always reviews.** Every generation lands as a draft. Nothing reaches a class until the teacher publishes it.
6. **Paid, probably as an add-on** to the teacher tier, because every call costs money.
7. **Teachers can share with other teachers, with basic moderation.** Speck needs a moderation layer for teacher-shared content anyway, so AI drafts go through the same path.

## How a generation works

```
teacher prompt + chosen level + toolbox / sim
        │
        ▼
 1. input check      length, rate limit, on-topic (Haiku); no student names allowed in
        │
        ▼
 2. draft            Sonnet with structured output → problem or activity object
        │
        ▼
 3. schema           the same Zod schema as hand-written content
        │
        ▼
 4. physics checks   problems: solve along `solution`, set `answer` from our solver,
                     run checkReasonable(); activities: run the engine, confirm the
                     target is reachable with the unlocked sliders and stays on the track
        │            (fail → one retry with the error fed back, then show the teacher why)
        ▼
 5. draft saved      teacher edits in the authoring UI, then publishes to their groups
```

The prompt carries the content schema, the toolbox for the chosen level, the shared glossary, and two or three of our hand-written examples at that level. Those examples are what make drafts read like Speck content, which is why this comes after we have a good set of them.

## Per-student variants don't need AI

The paid teacher value is per-student versions of a problem with different correct answers. That's mostly a code job: each problem declares a range for each given, `makeVariant(problem, seed)` picks numbers, and the solver computes the answer. AI is only needed for new scenarios. This keeps variants free to produce, repeatable from a seed (so auto-checking knows each student's answer), and available without the add-on.

## Data and compliance

- **What the model sees:** the teacher's prompt, the level, our schema and our example content. No student names, work, scores, or group rosters.
- **The input check rejects prompts that look like student data,** such as names with grades, as a backstop. The UI also says plainly not to paste student information.
- **Calls are server-side only.** The API key never reaches the browser.
- **Each generation writes an audit log row** (teacher, time, kind, draft id, pass or fail), and operational logs keep the prompt for 30 days like other logs.
- **Anthropic goes on the subprocessor registry** as a processor of teacher-provided content only. Ask Anthropic about zero data retention before launch.
- **Tagging:** the drafts table is tagged as teacher content, not student data, in the schema's data categories.

## Moderation (shared content)

Anything private to a teacher's own groups needs no review beyond the checks above. Sharing to other teachers adds:

1. An automatic check on publish-to-shared (Haiku): on-topic, age-appropriate for the level, no personal data.
2. A report button on every shared item.
3. A small review queue for Tyler. Reported or flagged items are hidden until reviewed.

This applies to all teacher-shared content, whether it was written by hand or with AI.

## What has to exist first

- Problems and activities stored in the database, plus a teacher authoring UI. Both plans keep content in TypeScript files for now, and move it to the database when teacher authoring arrives. This plan is that trigger.
- Plans and billing (platform architecture plan), so the add-on can be gated.
- Enough hand-written problems and activities at each level to use as examples.

## Code Tyler writes

**1. `checkReasonable(problem) → Issue[]`** in `toolbox/logic/reasonable.ts`. This decides when a draft that solves correctly is still a bad problem: a car going 300 m/s, a negative time, a braking distance longer than a highway, an answer with nine significant figures. The judgment calls: the realistic range for each kind of object, how "nice" the numbers must be at each level, and which issues block the draft and which only warn. The same function guards `makeVariant`.

**2. `makeVariant(problem, seed) → Problem`** in `toolbox/logic/variants.ts`. This decides how numbers vary between students. The judgment calls: step sizes per level (whole numbers for MS), keeping the variants equally hard, and avoiding numbers that give away the answer. The tests check that the same seed always gives the same variant and that every variant passes `checkReasonable`.

## Phases

**Phase 0: variants, without AI.** Given ranges on problems, `makeVariant`, `checkReasonable`. This ships the paid per-student value on its own.

**Phase 1: content in the database and the authoring UI.** Teachers can write and edit problems and activities by hand.

**Phase 2: problem drafting.** The `/api/ai/draft` route, input check, structured output, schema and physics checks, retry, drafts table, audit rows, add-on gate, and a monthly allowance per teacher.

**Phase 3: activity drafting.** The same pipeline for sim activities, with the engine reachability check.

**Phase 4: sharing and moderation.** Publish to shared, the automatic check, reports, and Tyler's review queue.

## Verification

- An eval set of about 30 teacher prompts across the four levels. Track the share that pass all checks on the first try, and Tyler's own rating of a sample.
- A test that no request body built by the route contains a field tagged as student data.
- Every hand-written problem passes `checkReasonable`, so the checker doesn't fight our own content.

## Open questions

- Add-on price and monthly allowance. This needs real cost per generation from the eval set first.
- Whether AI drafts should be marked as AI-assisted once shared with other teachers.
- When to build it. The recommendation is after launch, once the toolbox and sim activities ship with hand-written content.

## Out of scope for this plan

- Any AI on student pages, including hints and tutoring.
- AI-written engines or code of any kind.
- Grading student work with AI.
