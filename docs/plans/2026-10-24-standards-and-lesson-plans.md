# Standards and lesson plans

**Goal:** Every lab and sim activity in Speck arrives as a complete teaching package, tagged to the standards a teacher is held to. A teacher should be able to pick a lab, read one page, click "Copy lesson plan", paste it into their school's template, and teach it tomorrow. They should never have to design questions, work out a method, or write up a plan themselves.

**Builds on:** the lab library ([film plan](2026-10-24-library-film-plan.md)), the sims ([linear motion sim](2026-10-24-linear-motion-sim.md)), and groups (Lab Library design).

---

## The problem

When Tyler taught, planning a lab ate time at every step: designing the questions, working out the method, and then writing the whole thing up again in the admin's lesson plan format. Speck already removes the equipment and the filming. This plan removes the rest.

## Decisions (talked through with Tyler, 2026-10-24)

1. **Teacher-first, story-free.** The main product is standalone labs that supplement a teacher's course. The toy-company story is out of lesson plans. It may come back later as a self-guided or homeschool track, built on the same labs.
2. **Standards follow the level.** AP Physics 1 and 2 (2024 course framework) for AP, tagged by unit, topic and science practice. NGSS high school physical science (HS-PS) for regular physics, NGSS middle school (MS-PS) for middle school. Individual state standards wait; most states use NGSS or something close.
3. **We show codes, not College Board text.** The AP framework is copyrighted. We store each code (e.g. `AP1 2.5`) with a short description in our own words, and link to the official framework.
4. **Tag the activity, not the footage.** The same clip can be a kinematics lab or a forces lab depending on the questions. Standards live on each lab package and sim activity. A scene shows the union of its packages' tags.
5. **One standards registry in the repo.** A typed list of every code we use. A tag that isn't in the registry fails the build, so typos never ship.
6. **Every lab follows one pattern.** The method and question types are designed once and reused, so each new lab fills in specifics instead of starting over. This is what makes "lots of labs" possible, and it keeps quality even.
7. **Labs come in levels, from middle school to AP.** Each lab can have a middle school, conceptual, high school and AP version over the same footage. The level below is the support version and the level above is the extension, so differentiation comes from the levels instead of being written separately.
8. **Lesson plans fit any school's template.** Every school asks for different sections in a different order. Packages store the content once as building blocks, and a template decides which headings appear and which blocks fill them. Teachers pick a preset or set up their own template once.

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

## Levels

Every level uses the same footage and the same six parts. What changes is the math students do and the standards it meets.

| Level | Standards | Analyze looks like | Example (pull-back cars, added mass) |
|---|---|---|---|
| Middle school | NGSS MS-PS (e.g. MS-PS2-2) | Describe and compare. Read values off a graph; no fitting | Which car speeds up faster, the light one or the heavy one? How can you tell from the graph? |
| Conceptual / physics first | NGSS HS-PS (e.g. HS-PS2-1), lighter math | Patterns and proportional reasoning. Draw a best-fit line by eye; "double this, what happens to that?"; little algebra | Rank the cars by how steep their velocity graphs are. When the mass doubles, roughly what happens to the steepness? |
| High school | NGSS HS-PS (e.g. HS-PS2-1) | Straight-line fits; the slope means something; CER | Find each car's acceleration from the slope. How does it change as mass goes up? |
| AP | AP 1/2 framework | Linearize, uncertainty and spread across runs, compare to a model | Linearize acceleration against 1/m. Is the motor's force constant? Use the spread across runs to decide |

- **One package, several levels.** Shared parts (scene, takes, materials, teacher notes on the setup) are written once. Each level adds its own question, prediction, analysis steps, CER prompt, answer key and standards.
- **Differentiation comes from the levels.** In a lesson plan, the support suggestion is drawn from the level below and the extension from the level above. A teacher writing for a mixed class can hand out two levels of the same lab in one period, and everyone's data still goes on the same class graph.
- **Not every lab needs every level.** Circular motion with the flying toy plane is probably high school and AP only; the ruler-flick coin drop works at all four.
- **The tracker can match the level later.** A middle school mode could hide the acceleration column and fitting tools so students aren't swamped. That's a later build, not a blocker for content.

The question bank is the one part of the content that needs Tyler's teaching judgment, so Tyler writes or approves it. Each lab's specifics are drafted from the scene's take sheet and reviewed by Tyler.

## What's in a lab package

| Section | Who sees it | Contents |
|---|---|---|
| Overview | Everyone | Levels available, question, time needed, standards, prerequisite labs, which sim pairs with it |
| Student handout | Students | The six parts as students see them, with blanks to fill in. Printable and in-app |
| Teacher notes | Teachers | Expected results, common mistakes, how to steer the discussion, which takes give the cleanest data |
| Answer key | Teachers only | Reference values with uncertainty, sample graphs, a model CER, scoring guide |
| Lesson plan | Teachers | The copy-paste plan (below), generated from the sections above |

### Answer keys stay off the client

Library content ships in the public JavaScript bundle, so anything in it is readable by students. Answer keys and teacher notes are served by the API only to signed-in teachers (and later only to paid plans, if Tyler decides so). They live in the repo next to the lab but are never imported by client code.

## The copy-paste lesson plan

One button, "Copy lesson plan", copies the plan in two formats at once: rich HTML (headings and bullets survive pasting into Google Docs or Word) and plain text (for district systems that strip formatting). A preview lets the teacher change the date, period length and group before copying.

### Building blocks

A package never stores a finished lesson plan. It stores the pieces every template is made from:

| Block | Example |
|---|---|
| Standards | AP and NGSS codes with descriptions (the teacher switches each set on or off) |
| Essential question | The lab's question |
| Objective | "Students will be able to…" |
| Success criteria | "I can…" statements |
| Vocabulary | Terms students need |
| Prior knowledge | Prerequisite skills and labs |
| Materials | Speck link, devices, handout |
| Warm-up | A 5-minute opener |
| Procedure steps | Each step has a duration and two phase labels: a 5E phase (engage, explore, explain, elaborate, evaluate) and a gradual-release phase (I do, we do, you do) |
| Differentiation | Support (from the level below), English learners, extension (from the level above) |
| Formative checks | Questions to ask while students work |
| Summative assessment | The CER and its scoring guide |
| Closure | Exit ticket |
| Homework | Optional follow-up |

Because each procedure step carries its phase labels, the same steps can be printed as one timed list, grouped into the five 5E sections, or grouped into I do / we do / you do. Step durations scale to the period length.

### Templates

A template is an ordered list of headings, and each heading names the blocks that fill it. Speck ships presets for the formats schools use most:

- **General:** standards, objective, materials, warm-up, procedure, differentiation, assessment, closure
- **5E:** standards, objective, then engage, explore, explain, elaborate, evaluate
- **Madeline Hunter:** objective, anticipatory set, input and modeling, guided practice, checking for understanding, independent practice, closure
- **Understanding by Design:** desired results, evidence, learning plan
- **Gradual release:** objective, I do, we do, you do, assessment

A teacher can edit any preset or build their own: rename headings, reorder them, and choose which blocks fill each one. They can also paste in their school's blank template; Speck matches its headings to blocks ("Learning target" to objective, "Do now" to warm-up), and the teacher confirms or fixes the matches. The template is saved to the teacher's account, so every lab after that copies out in their school's format with no extra work. Later, a school on a site license can set one template for all its teachers.

The template is data, separate from the content, so adding a new preset or a teacher's custom format never touches a lab package.

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
  templates/
    presets.ts        General, 5E, Madeline Hunter, UbD, gradual release
```

Frontmatter is checked with Zod at build time, including every standards tag against the registry. Adding a lab is adding a folder; no engineering work. Teachers' custom templates are user data, so they live in the database (a `lesson_templates` table keyed by user, and later by organization), not in the repo.

## Sample package: Pull-Back Cars, added mass

This is what one package looks like end to end at the AP level, using scene 2, series B from the film plan. The middle school and high school versions are in the levels table above. Reference values come from the shoot.

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

**Lesson plan** (what "Copy lesson plan" produces with the General preset, in short)
- *Objective:* Students will be able to determine how a pull-back car's acceleration depends on its mass using video analysis, and support a claim about Newton's second law with a linearized graph.
- *Warm-up (5 min):* Which accelerates faster, an empty shopping cart or a full one, if you push the same? Why?
- *Procedure (40 min):* predict (5), method (5), track and graph in pairs (20), class pools results and compares to 1/m (10).
- *Differentiation:* support with the high school version (acceleration against mass, no linearizing) and a pre-calibrated take; extension compares the pull-back distance series.
- *Assessment:* CER paragraph with the a vs 1/m graph.
- *Closure (5 min):* exit ticket: double the mass, what happens to the acceleration?

## Build order

1. **Standards registry.** AP1 codes first (units, topics, science practices), then NGSS HS-PS and MS-PS. Conceptual uses the HS-PS codes. Descriptions in our own words, checked against the official documents.
2. **Package format and loader.** Folder layout with shared parts plus one section per level, Zod frontmatter, build-time tag check, API route for teacher-only files.
3. **Question bank.** The six-part pattern and its question types. Tyler writes or approves.
4. **Lab page and handout.** The package page in the library, the student handout in-app and printable.
5. **Copy lesson plan.** Building blocks, the five presets, rich HTML plus plain text, period length and standards toggles.
6. **Custom templates.** Edit a preset, build your own, paste a school template and match headings. Saved per teacher.
7. **First packages.** One per first-shoot scene, written as the footage comes in (mid-November). High school and AP first, then conceptual and middle school.
8. **Unit kits and filter by standard.** AP1 Units 1 and 2 first.
9. **Pilot feedback.** Collect real school templates from the 5–10 pilot teachers, check the heading matching against them, and add presets for any common format we missed.

## Open questions


- **Answer keys on the free plan?** Teacher-only either way. Whether they need a paid plan is part of the deferred free vs. paid decision.
- **Docs and Word export.** Copying covers most teachers. A "Download .docx" or "Open in Google Docs" button could come later if pilot teachers ask.
- **NGSS depth.** Performance expectations are enough for tagging. Whether to also tag practices and crosscutting concepts depends on what NGSS teachers in the pilot look for.
