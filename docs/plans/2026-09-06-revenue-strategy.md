# Speck revenue strategy

_Research + recommendation, 6 Sep 2026. Sources: the repo at `ced4db2`, the Speck Linear board, and public pricing/market data (links at the end)._

## TL;DR

1. **Speck is a good demo, not yet a sellable product.** The physics loop is solid and 88 unit tests pass, but the things a paying stranger needs (quotas, validation, CI, a privacy policy, a pricing page) don't exist yet. Nothing on the board's P5 Monetization milestone has started.
2. **Don't try to out-price the free tools or out-feature Vernier.** Tracker and FizziQ are free; Vernier Video Analysis has autotracking and a sales force. Speck wins on *no-install, beautiful, shareable, guided* and on a thing none of them do well: **a teacher seeing all their students' work in one place.**
3. **Charge teachers, not students.** Teacher Pro at $36/yr (already on the board) plus a school licence at $249/yr priced under Vernier. Students are always free.
4. **Revenue is small at first and that's fine.** A realistic year-one range is $3k–$13k. The board's own P5 goal is "cover hosting + a little more". Site licences are where it scales.
5. **The next 30 days are about instrumentation, trust, and the gate.** Analytics, privacy policy + terms, a pricing page with a Pro waitlist and a "quote for my school" form, and the P2 hardening issues. Then Stripe.

---

## 1. Where we are

### Shipped (per git, 59 commits / 15 PRs)

- Clerk auth with server-side ownership checks; account-deletion webhook
- Editor persistence with debounced auto-save + save-status indicator
- Guided setup wizard (calibrate → track → analyze)
- Frame-accurate stepping, zoom loupe, drag-to-reposition points, point delete
- Kinematics table with Basic/Advanced tiers, inline physics explanations
- Graphs with graph↔video linking, fit models (linear/quadratic/power/exp/log), equations in axis variables
- CSV export
- Real share links (`/share/:token`, read-only, "Shared by")
- `/try` sample project with no sign-in
- Light-first theme, Speck brand, Dockerfile deploy on Railway with migrations on deploy
- Typecheck green; 13 test files / 88 tests green

### Not shipped (verified in code)

| Gap | Linear | Why it blocks revenue |
|---|---|---|
| No per-user storage quota or upload limits beyond 500 MB | SPE-21 | A free tier with unbounded video storage is a cost bomb, and it's the metering layer entitlements build on |
| No Zod validation on any route | SPE-23 | Malformed payloads from paying users = support load |
| `cors()` wide open, no rate limiting | SPE-24, SPE-25 | Public-beta abuse surface |
| No root error boundary | SPE-16 | A white screen is a refund request |
| No CI, lint gate is red | SPE-36, SPE-35 | You can't ship weekly fixes safely without it |
| Prod still runs TypeScript via `tsx` | SPE-13 | Slower cold starts, larger image |
| No responsive layout (zero breakpoints in the workspace) | SPE-30 | K-12 is Chromebooks and 1366×768; this is a hard requirement for school sales |
| No HEVC / unplayable video handling | SPE-29 | iPhone default is HEVC; the first video most students upload will fail |
| No analytics | — | You cannot price or sell what you can't measure |
| No privacy policy, terms, or student-data language | — | No school can buy without these |
| No pricing page, no Stripe, no entitlements | SPE-43/44/45/46 | The actual revenue machinery |

### The Linear board is stale

Several issues are done in code but still open in Linear. Worth a 10-minute reconcile so the board reflects reality:

- **SPE-14** share flow → shipped in PR #7
- **SPE-19** secure presign routes → shipped in PR #8
- **SPE-12** migrations on deploy → shipped in PR #6 (`preDeployCommand` in `railway.json`)
- **SPE-28** point delete/move → shipped (delete in `9b6311d`, drag in PR #4)
- **SPE-62 / SPE-61** fit models + axis-variable equations → shipped in PR #3
- **SPE-53** sample video → effectively shipped as `/try` (PR #5)

Milestone progress after reconcile: P0 ≈ 100%, P1 ≈ 70%, P2 ≈ 10%, P3 ≈ 55%, P4 ≈ 0%, P5 = 0%.

---

## 2. The market

### Who buys

| Segment | Size (US) | Notes |
|---|---|---|
| High-school physics teachers | ~27,600 | AIP 2018–19 survey; flat for a decade |
| AP Physics 1 exam takers | ~175,000 / yr (2025) | Plus AP Physics C and ~1.4M non-AP physics students |
| Intro college physics | large, but department procurement | Second-year target |

Video analysis is a standard lab in every kinematics unit (free fall, projectile, cart on ramp, pendulum). Every one of those 27,600 teachers does *something* here today, usually with Tracker or a Vernier product.

### Who we compete with

| Product | Price | Platform | Strengths | Weakness Speck can exploit |
|---|---|---|---|---|
| **Tracker** (Open Source Physics) | Free | Java desktop; a web version exists | Powerful, autotracking, modeling, the incumbent | Install friction, dated UI, no Chromebook story, no sharing, no teacher view |
| **Vernier Video Analysis** | Site licence subscription; a one-year site licence "starts at $149" per one reseller listing, 3-year saves $225 (verify by requesting a quote) | Web app, works on Chromebooks | Autotracking, Vernier's brand and sales channel into every science department | Needs a licence key even to try; teachers call it expensive; no student→teacher workflow |
| **Pivot Interactives** (Discovery Education) | $5–6.10 / student / yr; class of 30 ≈ $165/yr; teachers free | Web | 500+ ready-made video labs, LMS integration | Their videos, not yours; per-student pricing means rosters and DPAs |
| **FizziQ** | Free | Web + mobile | Video analysis + phone sensors, video library | French-first, no accounts, no persistence or sharing |
| **Logger Pro / Graphical Analysis Pro** | Site licence | Desktop / web | Whole-lab data suite | Overkill for video; tied to Vernier hardware |

**Read:** the bottom of the market is free and the top is owned by Vernier. Speck's wedge is the middle: the teacher who wants Vernier's polish without a PO, wants it to work on the Chromebook cart today, and wants to *see what students did*.

### How teachers buy

- **Bottom-up.** 92% of teachers say they discover tools through free trials or free tiers. The individual teacher champions it, then the department buys.
- **Out of pocket is normal.** Roughly 30% of teachers have paid for classroom apps themselves; average out-of-pocket classroom spend is ~$895/yr. A $36/yr tool is inside that envelope. (The share who pay out of pocket for ed-tech is shrinking, though: 35% said "never" in 2025 vs 21% in 2021.)
- **Schools pay by PO.** Department budgets, quotes, W-9s, and invoices. Credit cards are the exception. Purchase windows: **April–June** (next year's budget) and **August–September** (use-it-or-lose-it).
- **Schools need paperwork.** A privacy policy, terms, and a student-data agreement. Many states require vendors to sign a DPA; the Student Data Privacy Consortium's National DPA is the common one. COPPA matters if any user can be under 13 (the board targets 12–18).

### When they need it

Kinematics is taught **September–November**. Projectile motion follows. AP exams are in May. Right now is the highest-intent window of the year for a video-analysis tool; the *purchase* window for next year is April–June.

---

## 3. Pricing recommendation

Keep the board's direction (teacher-paid Pro + school licence) with two adjustments: price the school licence *under* Vernier, and make **the class workflow** the thing Pro and School are actually buying.

| Plan | Price | Who | What's in it |
|---|---|---|---|
| **Free** | $0 | Students, curious teachers | 3 projects · videos ≤ 60 s / 150 MB · 1 GB storage · share links · CSV export · `/try` |
| **Teacher Pro** | **$36 / yr** (or $4 / mo) | One teacher | Unlimited projects · videos ≤ 5 min / 500 MB · 20 GB · **class codes + a dashboard of every student's project** · experiment templates · PDF lab-report export |
| **School** | **$249 / yr** (3-yr $599) | One school or department, unlimited teachers + students | Everything in Pro · invoice/PO · W-9 and quote PDF · signed DPA |
| **District** | Quote | 5+ schools | Volume pricing |

Why these choices:

- **Students never pay.** Per-student pricing (Pivot's model) forces rosters, DPAs, and parents into the loop. Teacher-paid keeps the funnel one person long.
- **$36/yr is impulse-sized.** It's a lab kit's worth of money and it's expensable or DonorsChoose-able. Don't go lower; it doesn't help conversion and it caps the school-licence anchor.
- **$249 beats Vernier on paper.** Vernier's site licence appears to start around $149–$300 depending on term (unverified). Being the cheaper *and* nicer option for a science department is a clean pitch. If the quote comes back at $149, drop School to $199.
- **The "free for the first 50 teachers" lever.** Give Pro free for a year to the first 50 teachers who do a 15-minute call. That's the case-study and testimonial pipeline, and it costs nothing.

### Unit economics sanity check

Storage is the only cost that scales with users. At Railway bucket rates (~$0.015/GB-month), a Pro user who fills 20 GB costs ~$3.60/yr against $36 revenue. Free users capped at 1 GB cost ~$0.18/yr. Fine, **provided SPE-21 quotas exist**. Without them a single free account can upload 500 MB videos indefinitely.

### Scenarios

| | Teacher Pro | School | Annual revenue |
|---|---|---|---|
| Year 1 conservative | 60 × $36 | 5 × $249 | **≈ $3.4k** |
| Year 1 target | 200 × $36 | 20 × $249 | **≈ $12k** |
| Year 2 (class workflow + templates shipped) | 500 × $36 | 80 × $249 | **≈ $38k** |

Year-1 target is ~0.7% of US HS physics teachers on Pro. That is achievable from community posts alone if activation is good.

---

## 4. What actually makes it sell: the product bets

Ordered by revenue leverage per week of work.

1. **Class codes + teacher dashboard.** Teacher creates a class, students join with a code, teacher sees every student's project (points, graphs, fit) in a grid. This is the one thing no free tool has, it's what a *school* pays for, and it turns every Pro teacher into 30 student sign-ups. Schema: `classes`, `class_members`, `projects.classId`. This is the P5 feature that isn't on the board yet.
2. **Experiment templates (SPE-54).** Free fall, projectile, cart-on-ramp, pendulum, each with instructions and "you should find ≈ −9.8 m/s²". Drop-in labs are the adoption driver for teachers who don't have time to design the lab. Also a natural Pro gate and a content-marketing engine (each template = a landing page).
3. **Responsive / Chromebook layout (SPE-30).** Not a feature, a prerequisite. Schools will demo on a 1366×768 Chromebook.
4. **HEVC handling + fps override (SPE-29).** Most student phones shoot HEVC. The first-upload failure is the biggest silent churn risk in the funnel.
5. **Autotracking.** Vernier's headline feature. A normalized-cross-correlation template matcher on a small patch (what Tracker does) is doable in-browser in a week or two and removes the "but Vernier autotracks" objection. Ship it *after* the class workflow; it's a parity feature, not a differentiator.
6. **PDF lab report export.** Points + graph + fit equation + student name on one page. Teachers grade paper. Cheap to build, obviously Pro.

Things to deliberately *not* build yet: LMS/LTI integration, per-student billing, a content library of your own videos, mobile apps.

---

## 5. Go-to-market

### Channels, ranked

1. **Direct posts in teacher communities with the `/try` link.** Facebook groups (AP Physics Teachers, Physics Teacher Community, National AP Physics Teachers), r/PhysicsTeachers, the College Board AP Physics community (~8k), the AMTA modeling-instruction list. `/try` is the single best asset you have: one click, no sign-in, a real tracked cart. Ask for 15-minute calls, offer free Pro.
2. **SEO on the searches teachers actually make.** "video analysis physics Chromebook", "Tracker alternative online", "Vernier video analysis alternative", "free fall video analysis lab". Each experiment template gets its own page. Low competition, high intent, compounding.
3. **Physics educators on YouTube.** Rhett Allain writes about video-analysis software; Flipping Physics and similar channels do kinematics labs. Free Pro for life in exchange for an honest look.
4. **AAPT winter meeting (January 2027) and AMTA summer workshops.** Where department heads and modeling teachers are. A table costs real money; a lightning talk or a workshop demo costs a plane ticket.
5. **Teachers Pay Teachers.** Free lab handouts ("Free-fall video analysis lab, works with Speck") as a lead magnet.

### Sequencing against the school calendar

- **Now – October:** teachers are teaching kinematics. Get `/try` in front of them; collect 50 teacher conversations and signups. Ship analytics, privacy/terms, pricing page + waitlist.
- **November – January:** ship Stripe + Pro; convert the waitlist. Ship class codes. AAPT winter meeting.
- **February – March:** ship templates and the school quote/PO flow. Start school conversations with every Pro teacher ("want your department on this next year?").
- **April – June:** school purchase window. Close site licences for 2027–28.

### Trust package for schools (required, not optional)

- Privacy policy and terms of service on the site
- Student data language: what's collected (email via Clerk, videos, points), where it lives (Railway, US), retention, deletion (the Clerk webhook already handles account deletion)
- A signed National DPA template ready to send
- An accessibility statement (SPE-32 helps here)
- A one-page PDF quote generator so a teacher can hand it to a department head

---

## 6. The 30-day plan

| Week | Do | Linear |
|---|---|---|
| 1 | Reconcile the board. Add PostHog or Plausible with four events: signup, `/try` → signup, project reaches 10 points, share link created. Write privacy policy + terms. | new: Analytics; new: Privacy + Terms |
| 1 | Quotas + upload limits, Zod on every route, CORS lock, rate limit, error boundary. | SPE-21, 23, 24, 25, 16 |
| 2 | Pricing page with the three plans, a "Join the Pro waitlist" button, and a "Get a quote for my school" form (email is fine). Post `/try` in three communities. | new: Pricing page + waitlist |
| 2 | CI + lint gate green; HEVC/unplayable handling. | SPE-36, 35, 29 |
| 3 | Entitlements model (`plan` + limits on the user, enforced server-side) and Free/Pro gating in the UI. | SPE-43, 45 |
| 3–4 | Responsive layout for Chromebooks. | SPE-30 |
| 4 | Stripe Checkout + Customer Portal + webhook. Convert the waitlist. | SPE-44 |
| 5+ | Class codes + teacher dashboard, then templates, then the school quote/PO flow. | new: Classes; SPE-54; SPE-46 |

### Metrics to watch from week 1

- `/try` visits → signups (target 5%+)
- Signups → activated (a project with ≥10 points) (target 40%+)
- Activated → share link created (the "I'm showing someone" signal)
- 7-day return
- Waitlist size; then Pro conversions and school quote requests

---

## Open questions to verify

- **Vernier's actual site-licence price.** One listing says "starts at $149"; Vernier's own page only says a 3-year term saves $225. Request a quote as a teacher.
- **Whether users under 13 are allowed.** If yes, COPPA applies and the sign-up flow needs school consent. Simplest: require 13+, which covers the AP/honors audience.
- **Railway bucket egress pricing** at scale; share links re-mint presigned URLs on every load.

## Sources

- AIP Statistical Research Center, High School Physics Overview (27,600 teachers, 2018–19): https://www.aip.org/statistics/high-school-physics-overview
- College Board / Trevor Packer, 2025 AP Physics 1 exam volume (~175k): https://x.com/AP_Trevor/status/1940099811438637092
- Vernier Video Analysis product page (site licence, 3-year saves $225): https://www.vernier.com/product/video-analysis/
- Pivot Interactives pricing ($5–6.10/student/yr): https://www.pivotinteractives.com/pricing/ and https://education.toolsinfo.com/tool/pivot-interactives
- Discovery Education acquires Pivot Interactives (Aug 2022): https://www.discoveryeducation.com/details/clearlake-capital-backed-discovery-education-acquires-pivot-interactives/
- FizziQ video analysis, free: https://www.fizziq.org/en/video-analysis/
- Tracker (Open Source Physics): https://opensourcephysics.github.io/tracker-website/
- EdWeek Market Brief, teachers paying for ed-tech out of pocket (2022, 2025): https://marketbrief.edweek.org/meeting-district-needs/teachers-are-still-paying-for-ed-tech-out-of-their-own-pockets-despite-booming-district-inventories/2025/09
- AdoptAClassroom 2025 teacher spending survey ($895 avg): https://www.adoptaclassroom.org/2025/06/09/2025-teacher-survey-spending-stats-classroom-needs/
- Monetizely, education SaaS pricing (92% discover via free tiers; bottom-up adoption): https://www.getmonetizely.com/articles/edtech-pricing-models-monetizing-education-technology-effectively
- Common Sense Education teacher review of Vernier Video Physics ("expensive for every student"): https://www.commonsense.org/education/reviews/vernier-video-physics
- Chromebook toolchain for AP Physics (teacher blog on the Chromebook gap): https://pedagoguepadawan.net/378/chromebook-toolchain-for-ap-physics/
