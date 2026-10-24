# Standards and lesson plans

**Goal:** Every lab and sim activity in Speck arrives as a complete teaching package, tagged to the standards a teacher is held to. A teacher should be able to pick a lab, read one page, click "Copy lesson plan", paste it into their school's template, and teach it tomorrow. They should never have to design questions, work out a method, or write up a plan themselves.

**Builds on:** the lab library ([film plan](2026-10-24-library-film-plan.md)), the sims ([linear motion sim](2026-10-24-linear-motion-sim.md)), and groups (Lab Library design).

---

## The problem

When Tyler taught, planning a lab ate time at every step: designing the questions, working out the method, and then writing the whole thing up again in the admin's lesson plan format. Speck already removes the equipment and the filming. This plan removes the rest.

## Decisions (talked through with Tyler, 2026-10-24)

1. **Teacher-first, story-free.** The main product is standalone labs that supplement a teacher's course. The toy-company story is out of lesson plans. It may come back later as a self-guided or homeschool track, built on the same labs.
2. **Standards: AP first, NGSS second, states later.** AP Physics 1 and 2 (2024 course framework), tagged by unit, topic and science practice. NGSS high school physical science (HS-PS) for regular physics and homeschool. Individual state standards wait; most states use NGSS or something close.
3. **We show codes, not College Board text.** The AP framework is copyrighted. We store each code (e.g. `AP1 2.5`) with a short description in our own words, and link to the official framework.
4. **Tag the activity, not the footage.** The same clip can be a kinematics lab or a forces lab depending on the questions. Standards live on each lab package and sim activity. A scene shows the union of its packages' tags.
5. **One standards registry in the repo.** A typed list of every code we use. A tag that isn't in the registry fails the build, so typos never ship.
6. **Every lab follows one pattern.** The method and question types are designed once and reused, so each new lab fills in specifics instead of starting over. This is what makes "lots of labs" possible, and it keeps quality even.
7. **"Copy lesson plan" fits a standard admin template.** Tyler's school template wasn't available, so we use the sections most templates share (below) and adjust when real templates come in from the teacher pilot.

## The lab pattern

Every package has the same six parts, in this order. Each part has a small bank of question types; a lab picks from the bank and fills in the specifics.

| Part | What students do | Question types |
|---|---|---|
| 1. Question | Read one plain question about the scene | "How does ___ depend on ___?", "Where will ___?", "Is ___ consistent?" |
| 2. Predict | Commit to a prediction before seeing data: a sketch of a graph, a number, or a choice | Sketch the graph, estimate a value, pick the shape (linear, square, inverse) |
| 3. Method | Choose which takes to track and what to hold constant | Name the independent, dependent and controlled variables; pick the settings |
| 4. Analyze | Track in Speck, graph, fit | Read a slope, linearize, compare to prediction, find the mean and spread across runs |
| 5. Claim, evidence, reasoning | Answer the question in writing | CER paragraph with one graph as evidence |
| 6. Extend | Go one step further | Predict an untested setting and check it against a held-back take; explain an outlier; compare to the sim |

The question bank is the one part of the content that needs Tyler's teaching judgment, so Tyler writes or approves it. Each lab's specifics are drafted from the scene's take sheet and reviewed by Tyler.

## What's in a lab package

| Section | Who sees it | Contents |
|---|---|---|
| Overview | Everyone | Question, time needed, standards, prerequisite labs, which sim pairs with it |
| Student handout | Students | The six parts as students see them, with blanks to fill in. Printable and in-app |
| Teacher notes | Teachers | Expected results, common mistakes, how to steer the discussion, which takes give the cleanest data |
| Answer key | Teachers only | Reference values with uncertainty, sample graphs, a model CER, scoring guide |
| Lesson plan | Teachers | The copy-paste plan (below), generated from the sections above |

### Answer keys stay off the client

Library content ships in the public JavaScript bundle, so anything in it is readable by students. Answer keys and teacher notes are served by the API only to signed-in teachers (and later only to paid plans, if Tyler decides so). They live in the repo next to the lab but are never imported by client code.

## The copy-paste lesson plan

One button, "Copy lesson plan", copies the plan in two formats at once: rich HTML (headings and bullets survive pasting into Google Docs or Word) and plain text (for district systems that strip formatting). A preview lets the teacher change the date, period length and group before copying.

Sections, matching what most school templates ask for:

1. **Standards** (AP codes and/or NGSS performance expectations, with descriptions)
2. **Learning objective** ("Students will be able to…")
3. **Success criteria** ("I can…" statements)
4. **Materials** (Speck link, devices, handout)
5. **Warm-up** (5 minutes)
6. **Procedure** with timings, sized to the period length
7. **Differentiation** (support, English learners, extension)
8. **Assessment** (formative checks and the CER as the product)
9. **Closure** (exit ticket)

A teacher can switch AP or NGSS standards on or off depending on the course. The sections come from the package, so a lab written once produces plans for a 45-minute, 50-minute or 90-minute block.

## Unit kits

A unit kit is an ordered list of packages for one unit, with suggested days: sim introduction, then filmed lab, then extension or check. For example, AP1 Unit 2 might be: forces sim, toy-truck Atwood, pull-back cars (mass), flying toy plane. The unit page has "Copy unit plan" too, which strings the lesson plans together. Filtering the library by standard falls out of the tags for free.

A pacing calendar (assign a kit to a group with dates) waits until groups exist.

## Content format

Labs are already TypeScript objects in `src/features/library/catalog.ts`, and sim activities will be too. Lab packages are mostly prose, so they get one folder each, in Markdown with structured frontmatter:

```
content/
  standards/
    ap1.ts            unit, topic and science practice codes with our descriptions
    ap2.ts
    ngss-hs-ps.ts     performance expectations, practices, crosscutting concepts
  labs/
    pull-back-cars-mass/
      package.md      frontmatter (scene, standards, time, pairs-with) + overview, handout, procedure
      teacher.md      teacher notes and answer key (served by the API only)
  units/
    ap1-unit-2.ts     ordered package ids and suggested days
```

Frontmatter is checked with Zod at build time, including every standards tag against the registry. Adding a lab is adding a folder; no engineering work.

## Sample package: Pull-Back Cars, added mass

This is what one package looks like end to end, using scene 2, series B from the film plan. Reference values come from the shoot.

**Question:** What happens to a pull-back car's acceleration as we add mass?

**Time:** one 50-minute period. **Pairs with:** the linear motion sim (velocity-time graphs). **Prerequisite:** reading slope from a velocity-time graph.

**Standards**
- AP Physics 1, Unit 2, topic 2.5: Newton's second law. Our description: the acceleration of a system depends on the net force on it and its mass.
- AP Physics 1 science practices: creating representations (velocity-time graphs), mathematical routines (linearizing), argumentation (CER).
- NGSS HS-PS2-1: analyze data to support the claim that Newton's second law describes the relationship among net force, mass and acceleration.

**Student handout**
1. *Question:* As we tape more quarters to the car, what happens to its acceleration?
2. *Predict:* Sketch acceleration against total mass. Is it a straight line down, a curve, or flat?
3. *Method:* The pull-back distance is fixed. Your independent variable is the number of quarters (0 to 4, 5.67 g each). What else stays the same? Track one run per setting from the release to top speed.
4. *Analyze:* Make a velocity-time graph for each run and read the acceleration from the slope of the speeding-up part. Plot acceleration against total mass, then against 1/(total mass).
5. *CER:* Which graph is a straight line, and what does that tell you about the force from the motor?
6. *Extend:* Predict the acceleration with 6 quarters, then check it against the held-back take.

**Teacher notes** (teachers only)
- Expect acceleration against 1/mass to be close to linear. It isn't perfect, because the spring motor's push fades as it unwinds. That gap is a good discussion: what would a perfectly constant force look like? (The sim shows it.)
- The cleanest data is in takes `pullback-q0-r2`, `-q2-r1`, `-q4-r3`.
- Common mistake: including the coasting part of the run in the slope.

**Lesson plan** (what "Copy lesson plan" produces, in short)
- *Objective:* Students will be able to determine how a pull-back car's acceleration depends on its mass using video analysis, and support a claim about Newton's second law with a linearized graph.
- *Warm-up (5 min):* Which accelerates faster, an empty shopping cart or a full one, if you push the same? Why?
- *Procedure (40 min):* predict (5), method (5), track and graph in pairs (20), class pools results and compares to 1/m (10).
- *Differentiation:* support with a pre-calibrated take and a partially drawn graph; extension compares the pull-back distance series.
- *Assessment:* CER paragraph with the a vs 1/m graph.
- *Closure (5 min):* exit ticket: double the mass, what happens to the acceleration?

## Build order

1. **Standards registry.** AP1 codes first (units, topics, science practices), then NGSS HS-PS. Descriptions in our own words, checked against the official documents.
2. **Package format and loader.** Folder layout, Zod frontmatter, build-time tag check, API route for teacher-only files.
3. **Question bank.** The six-part pattern and its question types. Tyler writes or approves.
4. **Lab page and handout.** The package page in the library, the student handout in-app and printable.
5. **Copy lesson plan.** Rich HTML plus plain text, period length and standards toggles.
6. **First packages.** One per first-shoot scene, written as the footage comes in (mid-November).
7. **Unit kits and filter by standard.** AP1 Units 1 and 2 first.
8. **Pilot feedback.** Collect real school templates from the 5–10 pilot teachers and adjust the lesson plan sections.

## Open questions

- **Answer keys on the free plan?** Teacher-only either way. Whether they need a paid plan is part of the deferred free vs. paid decision.
- **Docs and Word export.** Copying covers most teachers. A "Download .docx" or "Open in Google Docs" button could come later if pilot teachers ask.
- **NGSS depth.** Performance expectations are enough for tagging. Whether to also tag practices and crosscutting concepts depends on what NGSS teachers in the pilot look for.
