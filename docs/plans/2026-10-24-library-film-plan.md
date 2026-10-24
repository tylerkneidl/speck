# Lab Library Film Plan

**Status:** Draft · **Date:** 2026-10-24 · **Builds on:** the lab library in PR #16 (`src/features/library/`) and the lab library design (`docs/plans/2026-10-23-lab-library-design.md`, not yet committed)

## Goal

Build a library of real, calibrated clips that lets a teacher run every AP Physics 1 lab from Speck, and the AP Physics 2 labs video can honestly measure. Every clip comes with an answer key.

Footage is always real. Generated video doesn't obey measurable physics (g, frame timing, scale). The howitzer clip on `/try` (LivePhoto Physics, RIT) has no license; the best Nerf take from the first shoot replaces it.

## Decisions so far

| Decision | Choice |
|---|---|
| Scope | AP Physics 1 first, with an eye on AP Physics 2 |
| Order | Follow the school year: film each unit about a month before classes reach it |
| Subjects | Cheap, real-world toys instead of lab equipment. Toys are familiar, cheap enough for a teacher to buy the same one, and inconsistent, which makes error and variability something students can measure |
| Shape of a lab | Several scenes per lab, each with a variable students can change |
| Runs | 5 runs at every setting, so students can see and measure the spread |
| First shoot | Kinematics, Forces and Circular Motion |

## Curriculum map

The College Board's *AP Physics 1 and 2 Inquiry-Based Lab Investigations* (Teacher's Manual, effective fall 2021) has 7 AP1 labs and 8 AP2 labs. The 2024 frameworks also moved fluids into AP1 (Unit 8) and waves into AP2 (Unit 14).

| Course | Lab | Video fit |
|---|---|---|
| AP1 | 1D and 2D Kinematics; Newton's Second Law; Circular Motion; Conservation of Energy; Impulse and Momentum; Harmonic Motion; Rotational Motion; Fluids (Unit 8) | **Full** |
| AP2 | Fluid Dynamics; Waves (Unit 14) | **Full** |
| AP2 | Magnetism; Electromagnetic Induction; Geometric Optics | **Partial**: still frames with the scale and angle tools, or eddy-current braking |
| AP2 | Boyle's Law; Resistor Circuits; RC Circuits; Particle Model of Light | **None**: these need sensors or meters, or a PhET sim |

AP1 is fully coverable and is what Speck should be sold on. For AP2, the honest pitch is "the motion-based parts".

## When classes need each unit

Typical pacing for a late-August start. Schools vary a lot, so these months are estimates. Block-schedule schools start AP1 again in January, and everyone reviews in April, so early units stay useful all year.

| AP1 unit | In class | Film by |
|---|---|---|
| 1 Kinematics | Aug–Sep (Jan for block schools; April review) | Mid-November |
| 2 Forces, incl. circular motion | Sep–Nov | Mid-November |
| 3 Work, Energy, Power | Nov–Dec | Early December |
| 4 Momentum | Dec–Jan | Mid-December |
| 5–6 Rotation | Jan–Feb | Early January |
| 7 Oscillations | March | February |
| 8 Fluids | March–April | February |

AP2 classes are in Electric Force and Field in late October. Magnetism comes around February, and Optics and Waves in the spring, so the AP2 scenes are filmed in January and February.

## How a scene is shaped

- **One main variable at 5 values.** That's enough points for a graph or a linearization. A class can also pool its data, with each group taking a different value and the class building one graph.
- **An optional second variable at 2–3 values**, as a full grid only if it stays under about 10 combinations.
- **5 runs at each setting.** We keep every run where the toy worked as designed, including the off ones; the spread is the point. A run is dropped only when something failed (a car hit the wall, a dart misfired), and the take sheet says why.
- **3 copies of the same toy** in some scenes ("are these identical pull-back cars actually identical?").

This fits the existing data model without code changes. Each run is a `LabTake`. "Run" (1–5) and "Copy" (A, B, C) are ordinary `LabSetting`s, so the bench shows them as rows of buttons and greys out what wasn't filmed.

## Standalone and story mode

**Standalone is the main product:** a plain physics question on each lab, as supplementary material for teachers.

**Story mode is optional and undecided** (Tyler, 2026-10-24). It may become a mode for self-guided learners and homeschool: students are the R&D division of a toy company, the lab arrives as a work order from another department, and they sign off on a spec or claim. The company name is on hold.

Either way, the footage stays neutral (no story in frame), so the same clips serve both. The story is only text in the app, so nothing here changes what gets filmed.

### The story template

One fictional company (name TBD) runs all year. Each department always asks the same kind of question, so a new story is a department plus three blanks: **product**, **spec**, **claim**.

| Department | Always asks | Physics skill |
|---|---|---|
| Quality Control | "Are these units consistent?" | Variability, mean and spread |
| Marketing and Legal | "Can we print this claim on the box?" | Measure a number, compare to a claim |
| Safety | "Does it stay under the limit?" | Pass or fail against a threshold, with uncertainty |
| Packaging | "What spec goes on the box?" | Turn a measurement into a stated range or clearance |
| Product Design | "Where should this part go?" | Predict, then place |

### First-shoot work orders

Specs in brackets are filled in from the reference analysis, so the claim is testable but not a giveaway.

| Scene | Standalone question | Department | Work order |
|---|---|---|---|
| 1. Hot Wheels Off the Table | Where will the car land? | Product Design | Our stunt-ramp set needs a landing pad. Where does it go for each ramp height? |
| 2. Pull-Back Cars | How does the car speed up, and what does added mass change? | Quality Control | Customers say some cars go farther. Are units from one batch consistent? And will the heavier "deluxe" body still reach the finish line? |
| 3. Toy-Truck Atwood | How does the hanging weight set the acceleration? | Product Design | The tow-truck playset uses a falling counterweight. How heavy should it be to pull the truck at [target] m/s²? |
| 4. Crawler Race | When and where does the fast toy catch the slow one? | Marketing | For the commercial, the fast crawler must pass the slow one exactly at the finish line. What head start do we give? |
| 5. Flying Toy Plane | Predict the period from the string length and cone angle. | Packaging | How much clear space should the box say each string length needs? |
| 6. Nerf Projectile | Find the launch speed, then predict the range at another angle. | Marketing and Legal | The box says "shoots up to [claim] m". Can we print that? |
| 7. Stomp Rocket | How much does the launch vary between stomps? | Packaging | What range goes on the box, and what safety distance on the warning label? |
| 8. Parachute Men | How does terminal speed depend on the load? | Safety | The new heavier figure must land slower than [limit] m/s. How many washers can it carry and still pass? |
| 9. Ruler Flick | Which coin lands first? | Product Design | A "drop or launch" coin game: does the launched coin ever win? |

## First shoot: Kinematics, Forces, Circular Motion

Nine scenes, about 255 runs, over one weekend (one indoor day, one outdoor day). Target: done by mid-November.

### Indoors

**1. Hot Wheels Off the Table** (Kinematics)
- **Question:** Where will the car land?
- **Variable:** release height on the track, 10, 20, 30, 40 and 50 cm above the table. 5 × 5 = 25 runs.
- **Setup:** a track ramp taped to a box, a 30 cm flat run to the table edge. Side view of the flight from table edge to floor.
- **True values:** table height, landing distance (tape on the floor), car mass, release height.
- **Camera:** 240 fps. A vertical metre stick at the table edge, in the plane of flight.

**2. Pull-Back Cars** (Kinematics and Forces)
- **Question:** How does the car speed up, and what does added mass change?
- **Variables:**
  - Series A: pull-back distance, 5, 10, 15, 20 and 25 cm. 25 runs.
  - Series B: quarters taped on, 0, 1, 2, 3 and 4 (5.67 g each), at a fixed pull-back. 25 runs.
  - Series C: copies A, B and C of the same car, at a fixed pull-back. 15 runs.
- **Setup:** a smooth floor with a 2 m tape. Side view at car height.
- **True values:** car and coin masses, pull-back distance.
- **Camera:** 120 fps.

**3. Toy-Truck Atwood** (Forces, Newton's Second Law)
- **Question:** How does the hanging weight set the truck's acceleration?
- **Variable:** washers in the cup, 2, 4, 6, 8 and 10. 25 runs. An optional second variable is truck load at 0, 100 and 200 g with 6 washers (15 runs).
- **Setup:** a free-rolling toy dump truck on a table. A string runs over a pulley clamped at the edge to a paper cup of washers.
- **True values:** washer mass (weigh 10 and average), cup mass, truck mass, friction (the washer count at which the truck rolls at constant speed after a nudge).
- **Camera:** 60 fps.

**4. Crawler Race** (Kinematics, constant velocity)
- **Question:** When and where does the fast toy catch the slow one?
- **Variables:**
  - Each crawler alone: 2 toys × 5 runs = 10.
  - Head start for the slow toy, 0, 25, 50, 75 and 100 cm, 3 runs each = 15.
- **Setup:** two battery crawler toys on the floor with a 2 m tape. Side view.
- **True values:** each toy's speed from a stopwatch over 2 m (a cross-check).
- **Camera:** 60 fps. The race clips need multi-object tracking; the solo clips work today.

**5. Flying Toy Plane** (Circular Motion)
- **Question:** Predict the period from the string length and the cone angle.
- **Variable:** string length, 50, 75, 100, 125 and 150 cm. 5 × 5 = 25 runs.
- **Setup:** a battery flying-plane toy hung from a ceiling hook, settled into a steady circle. Side view: the plane's sideways motion is a sine wave whose amplitude is the radius and whose period is the period. The angle tool gives the cone angle.
- **True values:** string length to the plane, plane mass, period (time 10 laps with a stopwatch as a cross-check).
- **Camera:** 60 fps. A metre stick hung vertically in the plane through the hook.

### Outdoors (calm morning)

**6. Nerf Projectile** (Kinematics)
- **Question:** Find the launch speed, then predict the range at another angle.
- **Variable:** launch angle, 15, 30, 45, 60 and 75°. 5 × 5 = 25 runs. Darts vary a lot; that's welcome.
- **Setup:** the blaster clamped to a protractor mount. A tape on the ground and a vertical pole in the launch plane.
- **True values:** angle (digital gauge), launch height, launch speed (chronograph, optional), landing range.
- **Camera:** 240 fps, far enough back to frame the whole arc.

**7. Stomp Rocket** (Kinematics, variability)
- **Question:** Same angle, different stomps: how much does the launch speed vary, and how does that show up in the range?
- **Variable:** launcher angle, 30, 45, 60, 70 and 80°. 5 × 5 = 25 runs, human stomp.
- **Setup:** frame only the first 1–2 s of flight (the rocket climbs out of frame). Measure the landing point with a tape.
- **True values:** angle, landing range, rocket mass.
- **Camera:** 240 fps.

**8. Parachute Men** (Forces, drag and terminal velocity)
- **Question:** How does terminal speed depend on the load?
- **Variable:** washers added to the figure, 0, 1, 2, 3 and 4. 5 × 5 = 25 runs.
- **Setup:** dropped from about 4 m, ideally in a stairwell or garage, because wind ruins this outdoors. A wall taped every 0.5 m in the drop plane.
- **True values:** masses, drop height.
- **Camera:** 120 fps.

**9. Ruler Flick** (Kinematics, indoors; replaces the howitzer idea)
- **Question:** One coin is flicked sideways and one is dropped at the same instant. Which lands first?
- **Variable:** launch height: chair, table, counter (about 45, 75 and 90 cm). 3 × 5 = 15 runs.
- **Setup:** a ruler pivoted on the table edge. One sharp tap launches one coin sideways and releases the other straight down. Side view with a vertical metre stick in the plane of motion.
- **True values:** launch heights, landing distance of the flicked coin.
- **Camera:** 240 fps.

A launcher riding on a moving toy was dropped: poppers are hard enough to film going straight up. The howitzer clip on `/try` is replaced by the best Nerf take instead.

## Second shoot: Energy

Five scenes, about 125 runs (100 without the optional crane), one indoor day. Target: done by early December. Most of the toys come from the first shoot.

| Scene | Standalone question | Department | Work order |
|---|---|---|---|
| 10. Loop-the-Loop | What's the lowest start height that makes the loop? | Marketing | The box says it clears the loop every time. What's the lowest start height we can print? |
| 11. Ramp onto Carpet and Tile | How far does the car roll on each floor? | Packaging | How much play space does the box say you need on each floor? |
| 12. Bouncy Balls | What fraction of its energy does each ball keep? | Quality Control | Our "Super Bounce" ball must return at least 80% of its drop height. Does it, and which competitor beats it? |
| 13. Rubber-Band Launcher | How does launch speed depend on stretch? | Product Design | Where do the stretch marks go for slow, medium and fast? |
| 14. Toy Crane (optional) | Is the motor's power the same at every load? | Product Design | Is the motor's power the same at every load? |

**10. Loop-the-Loop**
- **Variable:** start height, 5 values from just below the ideal 2.5R to well above it. 5 × 5 = 25 runs. Runs that fall off the loop are kept; they are the data.
- **Setup:** a Hot Wheels loop on a board, the start ramp clamped so the height is repeatable. Side view.
- **True values:** loop radius, start heights, car mass. Friction pushes the real minimum above 2.5R, which is the discussion.
- **Camera:** 240 fps.

**11. Ramp onto Carpet and Tile**
- **Variables:** ramp height, 10, 20, 30, 40 and 50 cm × floor, carpet or tile. 10 × 3 runs = 30.
- **Setup:** the first shoot's ramp ending on the floor, with a tape along the stopping path. Side view, wide enough to see the car stop.
- **True values:** ramp heights, stopping distances (tape), car mass. Students get μ from mgh = μmgd.
- **Camera:** 60 fps.

**12. Bouncy Balls**
- **Variable:** ball, superball, tennis ball, ping-pong ball, golf ball and a playground ball, dropped from 1 m. 5 × 5 = 25 runs, filmed through at least 3 bounces.
- **Setup:** a hard floor with a vertical metre stick in the drop plane.
- **True values:** drop height, rebound heights (reference analysis), ball masses.
- **Camera:** 240 fps.

**13. Rubber-Band Launcher**
- **Variable:** stretch, 4, 6, 8, 10 and 12 cm. 5 × 5 = 25 runs.
- **Setup:** a rubber band between two posts launches a toy car along the floor. Side view.
- **True values:** car mass. A separate force-stretch clip: washers hung on the same band, stretch measured at each load. Bands aren't ideal springs, so students find the stored energy as the area under the curve.
- **Camera:** 120 fps.

**14. Toy Crane (optional, for power)**
- **Variable:** load, 2, 4, 6, 8 and 10 washers. 5 × 5 = 25 runs.
- **Setup:** a battery toy crane lifting a cup of washers. Side view with a vertical metre stick.
- **True values:** washer and cup masses, fresh batteries at the start (note it on the take sheet).
- **Camera:** 60 fps.

**Energy shopping list:** Hot Wheels loop ($15), carpet remnant ($10), superball, tennis ball, ping-pong ball, golf ball and playground ball ($20), rubber bands and two posts ($5), battery toy crane ($25, optional). **About $75.**

## Later shoots (outline)

Each gets the same detail as the first shoot once we get to it.

No lab equipment is needed; Tyler has none to borrow. Where a lab classically uses school gear, a toy or household version stands in (DIY column).

| Shoot | Film by | Toy scenes | DIY stand-ins for classic lab gear |
|---|---|---|---|
| Momentum | Mid-December | Toy trucks colliding (Velcro vs magnets, added load), marbles colliding, a Newton's cradle, a stacked-ball "astro blaster" | Smooth shelf board instead of a dynamics track; friction becomes part of the error analysis |
| Rotation | Early January | Yo-yo falling, fidget spinner spin-down, spinning tops, can and ball race | Yo-yo stands in for the unwinding spool |
| Oscillations | February | Plastic slinky as a spring (added mass), bobblehead, spider toy on a bungee, playground swing (adult riders) | Washers on a string for the pendulum; slinky for the mass on a spring |
| Fluids | February | Water rockets (water volume), squirt-gun stream, bobbing rubber duck, marble sinking through syrup, draining bottle | |
| AP2 | January–February | Magnet sliding down an aluminium ramp, slinky waves, laser pointer through a water glass (refraction), compass near a wire | Magnifying glass and a phone flashlight for the lens bench |

## Filming standards (every run)

**Camera**
- Phone on a tripod. Turn off digital stabilisation; it shifts and warps frames.
- Lock focus, exposure, white balance and frame rate. A manual camera app such as Blackmagic Camera (free) is easiest.
- Frame rate: 60 fps for slow motion, 120 for medium, 240 for fast or short events (as listed per scene). 1080p, or 720p at 240 fps.
- Shutter 1/500 s or faster at 120–240 fps, so the toy isn't a smear.
- For slow-motion files, the take's `frameRate` is the **capture** rate (240), not the 30 fps playback rate. Export the original file, not the slowed edit.

**Geometry**
- Camera square to the plane of motion, level, with the motion centred.
- Stand back and zoom (2× lens) rather than going close with the wide lens, to cut perspective and edge distortion.
- The scale reference (metre stick or measured tape marks) sits in the plane of motion. A reference 10 cm closer to a camera 2 m away makes every length 5% wrong.
- A high-contrast dot sticker on the point students should track.

**Light and background**
- Indoors: two flicker-free LED panels. Test for flicker banding at 240 fps before each session.
- Outdoors: shoot in the morning, out of direct sun glare, with no wind.
- A plain matte background that contrasts with the toy. No clutter, logos or people.

**Each run**
1. Slate: a whiteboard with the take id and settings, in frame for 1 second.
2. Trim to the motion plus about 0.5 s before it starts.
3. Strip audio and re-encode for frame-accurate stepping (see `docs/video-encoding.md`):
   ```bash
   ffmpeg -i original.mov -an -c:v libx264 -x264-params keyint=1:bframes=0 -crf 18 -pix_fmt yuv420p <take-id>.mp4
   ```
4. Keep the original untouched in the archive.

**Frame-rate check, once per session and per fps setting:** film a ball dropped from rest about 1 m in front of the scale reference and track it in Speck. If g isn't within 2% of 9.80 m/s², fix the frame rate or scale before going on.

## Answer keys

For each run:
- **Measured independently:** masses on a 0.1 g scale, lengths with a tape or calipers, angles with a digital gauge, landing points, stopwatch cross-checks.
- **Reference analysis:** for each setting, we track at least one run carefully in Speck and record the result with an uncertainty.

For each setting:
- **The spread across the 5 runs:** mean and standard deviation of the key result (range, acceleration, period). This is what a variability lab is graded against.

If the reference analysis and the independent measurement disagree by more than the tolerance, the run is re-shot.

Each run has a row in the take sheet: take id, scene, settings, run number, toy copy, date, fps, resolution, camera distance, scale reference, independent measurements, reference result and notes. Take ids follow `<scene>-<values>-r<run>`, for example `pullback-d15-r3`.

## First-shoot shopping list

Rough Amazon prices.

| Item | For | Rough cost |
|---|---|---|
| Hot Wheels track pieces and 3 identical cars | Scene 1 | $25 |
| 6-pack of identical pull-back cars | Scene 2 | $15 |
| Free-rolling toy dump truck, pulley clamp, string, washers, paper cups | Scene 3 | $35 |
| 2 battery crawler toys (different speeds) | Scene 4 | $20 |
| Flying plane on a string toy, ceiling hook | Scene 5 | $20 |
| Nerf blaster and darts, protractor mount | Scene 6 | $30 |
| Stomp rocket kit | Scene 7 | $20 |
| 12-pack parachute men | Scene 8 | $10 |
| Rulers and coins | Scene 9 | $0 |
| **Toys subtotal** | | **about $175** |
| Tripod with an overhead arm, phone level | All | $50 |
| 2 flicker-free LED panels | Indoors | $60 |
| White foam boards, black felt | Backgrounds | $30 |
| 2 metre sticks, 5 m tape, calipers | Scale and true values | $35 |
| 0.1 g scale, digital angle gauge | True values | $40 |
| Dot stickers, painter's tape, small whiteboard | Markers, slates | $15 |
| Chronograph (optional) | Nerf launch speed | $40 |
| **Filming kit subtotal** | | **about $270** |

## Rights and people

- We own all footage. Keep the originals and take sheets as proof.
- No students or other minors on camera. Adults who appear sign a short release.
- Cover toy and brand logos with tape where they're prominent, so no endorsement is implied.

## What the app needs

- **Multi-object tracking** (first in the design's build order): for the crawler race, and later for collisions.
- **Answer keys on takes:** `LabTake` needs fields for the true values, the reference result and its tolerance, and the per-setting spread.
- **Briefs on labs:** each `Lab` needs a standalone question and an optional story (department, product, work order, the deliverable students sign off), if story mode goes ahead (for self-guided and homeschool use).
- **Catalog updates:** the launch labs in `catalog.ts` (Nerf, ramp, collisions, balcony drop) should be swapped for the first-shoot scenes. AP2 later needs a `course` field and new topics.

## Open questions for Tyler

None. The parachute-men drop spot is decided at shoot time.
