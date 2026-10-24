# Platform architecture: Next.js, groups, and compliance

**Goal:** Turn Speck from a single-user tracker into a content platform for classrooms, teachers, homeschool families and tutors. Public pages should rank in search, schools should be able to sign Speck's privacy agreements without a scramble, and every compliance answer should come from the system itself, not from memory.

**Builds on:** the lab library ([film plan](2026-10-24-library-film-plan.md)), [standards and lesson plans](2026-10-24-standards-and-lesson-plans.md), the sims ([linear motion sim](2026-10-24-linear-motion-sim.md)), and groups (Lab Library design).

---

## Where we are

- Hono serves the built SPA, and every URL returns the same `index.html`. Search engines see one title and description for the whole site, with no preview image, sitemap or robots.txt. The landing page is just the signed-out state of `/`.
- The database has three tables: `projects`, `project_settings` and `data_points`. There are no users beyond Clerk, and no groups, organizations, plans or audit trail.
- Video lives in Railway's S3-compatible bucket, served from a Railway URL.

## Decisions (talked through with Tyler, 2026-10-24)

1. **Move the whole app to Next.js (App Router).** Public pages are server-rendered. The editor runs client-only inside it. Next.js fits a content platform best (server components reading lab content, built-in metadata and preview images, first-class SDKs from Clerk, Stripe and Sentry), and it's useful experience for Tyler. TanStack Start was the smaller move. A Next marketing site next to the existing SPA was dropped because two apps would mean two places for the compliance plumbing to drift apart.
2. **Hosting stays on Railway, with Cloudflare in front.** The domain's DNS and CDN go through Cloudflare, and video moves to Cloudflare R2. The app and Postgres stay on Railway. A full move to Cloudflare was rejected: Postgres doesn't run there, and Workers aren't Node. The domain is `specklab.io` for now, and the name may change later. Keep the site URL in one config value (metadata, sitemap and preview images all read it) so a rename is a config change plus 301 redirects.
3. **Organizations, groups and memberships.** An optional organization (a school, co-op or tutoring business) holds a site license and admins. A teacher runs any number of groups, each with its own join code. Solo teachers, tutors and homeschool parents never need an organization.
4. **Access comes from three sources.** Group membership (free, scoped to what the teacher assigned in that group), a personal plan (the individual tier: full library), and an organization license. A request is allowed if any one of them allows it. Joining a group never checks the student's plan.
5. **The teacher tier sells class tools, not answer keys.** AI makes answer keys trivial to get. The paid value is assigned per-student takes (each student's numbers differ), automatic checks against each take's known values, and the class view. There is no teacher verification.
6. **Seats count teachers only.** Students are free everywhere.
7. **Under-13s are supported at launch, for schools, homeschool parents and tutors.** That makes a parent-consent flow a launch requirement.
8. **When a teacher leaves a school, student data stays with the school.** That's set by FERPA and the district agreement. The teacher's own content (customized labs, templates, empty group setups) is an organization setting, which defaults to "the teacher keeps it."
9. **Compliance is built into the foundation now,** not added before the first audit. A separate, sellable compliance product is parked.

## Next.js layout

```
app/
  (marketing)/          home, pricing, logger-pro-alternative, about, privacy, terms
    layout.tsx          marketing analytics and ad pixels allowed here only
  (app)/
    layout.tsx          no ad pixels, ever; Clerk-protected where needed
    projects/           project list (server component, reads with auth())
    projects/[id]/      editor: server page loads project, renders <ProjectWorkspace> client-only
    library/            catalog + lab pages (server-rendered from content/, public)
    library/[slug]/
    run/[takeId]/       client-only
    share/[token]/      server shell with real metadata + preview image; noindex
    try/
  api/[[...route]]/     mounts the existing Hono app (hono/vercel adapter)
  sitemap.ts, robots.ts
```

- **Server components** cover marketing pages, library and lab pages, sims pages, the project list, and the share-page shell.
- **Client components** cover the editor workspace and everything under it (video, canvases, tracking, graphs, the data table), loaded with `ssr: false`. Zustand stores and Recharts are only ever imported from client components.
- **The server page loads data and passes it in** as `initialProject`, replacing today's useQuery-then-hydrate step. TanStack Query stays for mutations and auto-save.
- **Hono stays.** Routes, Clerk middleware and Pino logging move over unchanged under `app/api`.
- **Clerk** switches to `@clerk/nextjs` with its middleware.
- **The no-flash theme script** moves into the root layout.
- **Deploy** uses `output: 'standalone'` in the Dockerfile on Railway.
- **Lab content** stays in `content/` as Markdown with Zod frontmatter (per the standards plan), read by server components. Teacher-only files are still never imported by client code.

**SEO:** Every public route exports `generateMetadata`. Lab, sim and share pages get generated preview images. `sitemap.ts` lists marketing, library and sim pages. Share links and everything under `(app)` that isn't public are `noindex`.

**Migration size:** 12 files import TanStack Router today, and the ~4,400 lines of features barely change. Estimate 2–4 focused days.

## Data model

```
organizations     id, name, kind (school | coop | tutoring), license plan, seats,
                  teacher_content_policy (teacher_keeps | org_keeps), verified_domains
org_memberships   org_id, user_id, role (admin | teacher)
groups            id, owner_id, org_id?, kind (class | homeschool | tutoring), name, join_code
group_memberships group_id, user_id, role (teacher | student), joined_at
plans             user_id, tier (individual | teacher), status, stripe ids
students          user_id, display_name, under_13, consent_status, consent_record_id
parent_consents   id, student_id, parent_email, method, notice_version, granted_at, withdrawn_at
audit_log         append-only (see Compliance)
deletion_records  what was deleted, why, when, by which job
```

Groups and memberships belong to the Lab Library design thread. This section lists only what the compliance and access rules need from them.

**Clerk Organizations** could back the organization layer. Their verified domains let anyone signing up with an @school.org email join that school's license automatically. Decide when the school tier is built.

## Access: one `can()` function

All permission rules live in `can(user, action, resource)`, which checks the three access sources (decision 4) plus roles. No route or component makes its own permission check. Its test file doubles as the access-control evidence for audits.

**Tyler writes the core rules** in `can()`. Claude scaffolds the signature, call sites and test table.

## Students and consent

| Who brings the student | Basis for collecting data | Flow |
|---|---|---|
| School (org or a teacher's class group) | The school consents for parents (FTC school exception), covered by the district agreement | Join code. Optional Google sign-in with a school account. |
| Homeschool parent | The parent consents for their own children at signup | The parent creates the group and adds their kids. |
| Tutor (or any group that isn't a school) | Verifiable parental consent | See below. |
| Individual tier, under 13 | A parent pays | The card payment plus notice counts as consent. |

**Parent-consent flow (tutors):**
1. The student joins with a code. The account is *pending*, and the only thing collected is the parent's email, which COPPA allows for the sole purpose of asking for consent.
2. The parent gets a direct notice, consents, and receives a confirmation email ("email plus").
3. Consent activates the account. If consent never comes, the pending account and the parent's email are deleted after 14 days.
4. The parent can withdraw at any time, which deletes the student's data.
5. A pending student can't upload video or save work.

**Minimal student data:** display name only. No student email unless it comes from school Google sign-in, no birthdate (just an under-13 flag), and no free-text profile.

## Tracking and observability

COPPA's internal-operations exception covers running, securing and improving the service. It doesn't cover advertising or profiling.

- **Observability** (Sentry, Pino, Railway traces) uses opaque user IDs and never logs student display names. Session replay is off on student-reachable pages.
- **Product analytics** go through one `track()` wrapper. Teacher and parent events go out in full. Student events are cut down to an allowlist, keyed to an opaque ID, with IP geolocation off.
- **Ad pixels and retargeting** load only in the `(marketing)` layout. **Email marketing** goes to adults only.

## Data stores

Postgres holds nearly everything. At Speck's scale it's a small database, and every extra datastore is one more thing to secure, back up and list as a subprocessor in every district agreement.

| Data | Where |
|---|---|
| Video | Cloudflare R2 |
| Lab content | Markdown in git (`content/`) |
| Logs, errors | Log service, Sentry |
| Product analytics | Analytics vendor |
| Everything else | Postgres |

Inside Postgres:

- **Relational tables** for organizations, groups, memberships, plans and consent. **JSONB** for settings, as today.
- **`data_points` stays one row per point.** That's easy to query for auto-checks and class graphs, and fine at millions of rows.
- **Background jobs** (deletion runs, consent emails, the yearly video purge) run on `pg-boss`, a job queue built on Postgres. No Redis.
- **Library search** uses Postgres full-text search until there are thousands of labs.
- **The live class view** uses `LISTEN/NOTIFY` plus server-sent events. No separate realtime service.
- **The audit log** is an append-only, hash-chained table, partitioned by month once it grows.
- **Row-level security on student tables only**, added when those tables are created. It's a second wall behind `can()` and good audit evidence.

**Revisit only if:** several app instances need shared rate limiting (Redis), or analysis across districts outgrows the analytics tool (a warehouse).

## Observability and logging

**Today:** Pino exists (`src/server/lib/logger.ts`, with redaction), but requests are logged by `hono/logger` as plain text, outside Pino. There are no request IDs, no error tracking, no client error reporting or error boundary, and no alerts. `/api/health` returns ok without checking the database.

**What to build, in the migration or right after it:**

1. **One logger.** Pino handles everything. `hono-pino` replaces `hono/logger` and records request ID, route, status, duration and an opaque user ID as JSON. A request ID (`x-request-id`) runs from the browser through the API and into Sentry, so one ID finds a whole failure.
2. **Redaction follows the data tags.** The Pino redact list and the Sentry scrubber are generated from the schema's data categories, so a new student field is redacted without anyone remembering to add it.
3. **Error tracking with Sentry** (the Next.js SDK, on server and client). `error.tsx` and `global-error.tsx` boundaries report and offer a retry. Source maps are uploaded at build time. `beforeSend` scrubs tagged fields, and session replay is off in `(app)`.
4. **Performance.** Sentry tracing through Next's `instrumentation.ts`, a Drizzle logger that warns on queries over 500 ms, and web vitals on public pages (they affect search ranking).
5. **Health and alerts.** `/api/health` checks the database and the bucket, and an outside uptime monitor calls it. Alerts fire on error-rate spikes, any failed point or settings save (the old false "Saved" bug), failed uploads, bounced consent emails, and any failed retention or deletion job.

**Logs are not the audit log.** Operational logs hold no student names, are kept for 30 days and exist for debugging. The audit log lives in Postgres, records who did what to student data, and is kept as long as the agreements require. Keeping them separate keeps the logs mostly out of compliance scope.

## Compliance built in

Each item produces evidence as it runs, so an audit or district questionnaire becomes an export.

1. **Data tags on the schema.** Every Drizzle column carries a data category. A script generates the data inventory and the subprocessor list. *Tyler writes the category list.*
2. **Audit log.** Append-only and hash-chained, so it's tamper-evident. It records who viewed, changed, exported or deleted student data, consent events, and every admin action, including Tyler's own.
3. **Retention and deletion jobs.** They cover the end of an org contract, a parent's withdrawal, expired pending accounts, and a yearly purge of student video. Each run writes a deletion record, so a district can get a deletion certificate.
4. **Subprocessor registry.** Clerk, Railway, Cloudflare, Sentry, analytics and Stripe, each with its data agreement. It feeds a public subprocessor page.
5. **CI policy checks.** No student-tagged field reaches `track()`, the `(app)` layout has no ad scripts, and the existing lint, typecheck and tests pass.
6. **Security basics.** Multi-factor sign-in on every vendor account, encryption at rest (Postgres, R2), backups with a tested restore, and least-privilege database roles.

**Paperwork, by the pilot:** privacy policy and terms (lawyer review), a children's privacy notice, an incident and breach runbook covering state deadlines (Illinois SOPPA: 30 days), and readiness to sign the SDPC national data privacy agreement plus state add-ons (NY Ed Law 2-d calls for NIST cybersecurity framework alignment).

**Later:** COPPA safe-harbor certification (iKeepSafe or kidSAFE), then SOC 2 when a district or state contract requires it.

## Build order

1. **Next.js migration.** Move the routes, mount Hono, switch to `@clerk/nextjs`, client-only editor, Dockerfile on Railway. No behavior change.
2. **Observability.** Pino for request logs with request IDs, Sentry with error boundaries, health check with database, uptime monitor and alerts. This lands before real users arrive.
3. **SEO basics.** Per-route metadata, sitemap, robots, noindex on share pages, preview images for lab, sim and share pages. Marketing pages: home, pricing, Logger Pro alternative.
4. **Domain and video.** Domain on Cloudflare, bucket moved to R2, video served from our own domain.
5. **Compliance foundation.** Data tags, audit log, `track()` wrapper, CI checks. This lands before any student table exists.
6. **Organizations, groups, memberships and `can()`.** Coordinated with the Lab Library design.
7. **Students and consent.** Minimal student accounts, school join, homeschool parent flow, tutor parent-consent flow.
8. **Retention and deletion jobs** and deletion records.
9. **Plans and billing.** Stripe for individual and teacher tiers. Organization licenses by invoice later.
10. **Paperwork for the pilot.** Privacy policy, terms, children's notice, subprocessor page, breach runbook.

## Open questions

- **Clerk Organizations or our own tables** for the organization layer? Decide when the school tier starts.
- **Analytics vendor.** It must sign a data agreement and support turning off IP collection.
- **Grace period** for unconsented accounts (14 days proposed) and the length of the yearly video purge window.
- **Answer keys.** The standards plan serves them to signed-in teachers through the API only. With decision 5, keep that as a convenience, but there's no need for more gating.
