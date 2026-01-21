# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Motion Tracker** is a web application for video-based motion analysis in physics education. Students upload videos, track objects frame-by-frame, and generate position/velocity/acceleration data with graphs. Target users are AP Physics students and educators.

## Claude Code Skills

- **`/frontend-design`** - Use when building UI components for polished, production-grade interfaces
- **`/brainstorming`** - Use when designing new features or making architectural decisions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand + immer + zundo (client state, undo/redo) |
| Server State | TanStack Query |
| Auth | Clerk |
| Database | Railway Postgres |
| ORM | Drizzle |
| Storage | Railway MinIO (S3-compatible) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Routing | TanStack Router |
| API | Hono |
| Logging | Pino (server) |
| Linting/Formatting | Biome |
| Testing | Vitest + React Testing Library + Playwright |
| Hosting | Railway |

### Supporting Libraries

- **react-hotkeys-hook** - Keyboard shortcut handling
- **zundo** - Temporal middleware for Zustand (undo/redo)
- **@aws-sdk/lib-storage** - Chunked multipart uploads to MinIO

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Biome lint
npm run format       # Biome format
npm run check        # Biome lint + format check
npm run typecheck    # TypeScript compiler check
npm run test         # Vitest unit/component tests
npm run test:ui      # Vitest with UI
npm run test:e2e     # Playwright E2E tests
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Architecture

### Folder Structure (Hybrid)

```
src/
  components/ui/     # Shared primitives (shadcn/ui components)
  lib/               # Utilities, Supabase client, helpers
  hooks/             # Shared hooks
  features/          # Domain modules
    video/           # Upload, playback, frame extraction
    coordinates/     # Scale calibration, origin, axis rotation
    tracking/        # Point marking, path visualization, undo/redo
    data-table/      # Time series, calculated columns
    graphing/        # Plots, regression, graph-video sync
    projects/        # CRUD, sharing, export
  stores/            # Zustand stores (or colocate in features)
```

### Core Modules

Six modules that can be developed somewhat independently:

1. **Video Engine** (`src/features/video/`) - Upload, playback, frame extraction, navigation
2. **Coordinate System** (`src/features/coordinates/`) - Scale calibration, origin placement, axis rotation
3. **Point Tracking** (`src/features/tracking/`) - Manual point marking, path visualization, undo/redo
4. **Data Table** (`src/features/data-table/`) - Time series display, calculated columns, derived columns
5. **Graphing** (`src/features/graphing/`) - Plot types, linear regression, graph-video sync
6. **Project Management** (`src/features/projects/`) - Cloud storage, sharing, export

### State Management Pattern

**Two types of state, two tools:**

| State Type | Tool | Examples |
|------------|------|----------|
| Server state | TanStack Query | Projects list, project data from Supabase |
| Client state | Zustand | Current frame, tracking session, undo history, UI |

**TanStack Query for fetching, Zustand owns working state:**
```typescript
// 1. Fetch project
const { data: project } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => fetchProject(projectId),
  staleTime: Infinity, // Don't refetch while editing
})

// 2. Hydrate into Zustand on load
useEffect(() => {
  if (project) {
    trackingStore.getState().hydrate(project.dataPoints)
    coordinateStore.getState().hydrate(project.coordinateSystem)
  }
}, [project])

// 3. Auto-save syncs Zustand → Server (debounced)
```

**Zustand for client state (with undo/redo):**
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'

export const useTrackingStore = create<TrackingState>()(
  temporal(
    immer((set) => ({
      dataPoints: [],
      selectedPointId: null,
      addPoint: (point) => set((state) => { state.dataPoints.push(point) }),
      // ...
    }))
  )
)

// Undo/redo
const { undo, redo } = useTrackingStore.temporal.getState()
```

### Key Data Models

**DataPoint** - Stored per tracked measurement (normalized rows):
- `id`, `frameNumber`, `time`, `pixelX`, `pixelY`
- World coordinates (`worldX`, `worldY`) are **calculated on-the-fly** from pixel coordinates
- This allows re-calibration without re-tracking: change coordinate system → all world values update

**CoordinateSystem** - Defines pixel-to-world mapping (stored as JSONB):
- `scalePoint1`, `scalePoint2`, `scaleDistance`, `scaleUnit`
- `origin`, `rotation`, `yAxisUp`

**Project** - Persisted to Supabase:
- Settings as JSONB blobs (small, change infrequently)
- Data points as normalized rows (append-efficient, queryable)

### Coordinate Transformation

Pixel to world conversion follows this sequence:
1. Calculate scale factor: `pixelsPerUnit = pixelDistance / scaleDistance`
2. Translate to origin
3. Apply rotation (support for tilted axes on ramp experiments)
4. Apply Y-axis direction (physics convention: positive Y up)
5. Convert to world units

### Kinematics Calculations

Use **central difference method** for derivatives:
- Velocity: `v[n] = (x[n+1] - x[n-1]) / (t[n+1] - t[n-1])`
- Acceleration: `a[n] = (v[n+1] - v[n-1]) / (t[n+1] - t[n-1])`

### Video Frame Handling

- Frame seeking: `video.currentTime = frameNumber / frameRate`
- Wait for `'seeked'` event before drawing to canvas
- Use `requestVideoFrameCallback()` for frame rate detection where supported (Chrome/Edge)
- Canvas must match video dimensions for accurate coordinate mapping

### Canvas Architecture (Layered)

```tsx
<div className="relative">
  {/* Native video for playback (browser-optimized) */}
  <video ref={videoRef} className={isPlaying ? '' : 'hidden'} />

  {/* Frame canvas for paused/tracking (frame-accurate) */}
  <canvas ref={frameCanvasRef} className={isPlaying ? 'hidden' : ''} />

  {/* Overlay canvas for points, paths, axes (always visible) */}
  <canvas ref={overlayCanvasRef} className="absolute inset-0 pointer-events-none" />
</div>
```

- Video element for smooth playback (hardware decoding)
- Frame canvas for pixel-accurate display when paused
- Separate overlay avoids redrawing video frame on every point update
- Export = composite frameCanvas + overlayCanvas

## Routes

**Frontend (TanStack Router):**
```
/                       → Project list (authenticated)
/projects/$projectId    → Edit project (authenticated, owner only)
/share/$shareToken      → View shared project (public, read-only)
```

**API (Hono):**
```
POST   /api/projects              → Create project
GET    /api/projects              → List user's projects
GET    /api/projects/:id          → Get project with settings + data points
PUT    /api/projects/:id          → Update project settings
DELETE /api/projects/:id          → Delete project

POST   /api/projects/:id/points   → Add data point(s)
DELETE /api/projects/:id/points   → Delete data point(s)

POST   /api/upload/presign        → Get presigned URL for video upload
```

All API routes verify Clerk session. TanStack Query handles caching and mutations.

## UI Design

**Use `/frontend-design` skill** when building UI components. This ensures production-grade, polished interfaces that avoid generic AI aesthetics.

### UI Modes

The interface adapts based on current task:
- **Setup Mode**: Coordinate system tools prominent (scale, origin, axis rotation)
- **Track Mode**: Point marking primary, auto-advance toggle, trail visualization
- **Analyze Mode**: Graph panel maximized, regression controls, interactive data table

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Play/pause | Space |
| Next frame | Right arrow or `.` |
| Previous frame | Left arrow or `,` |
| Jump 10 frames forward | Shift + Right |
| Jump 10 frames backward | Shift + Left |
| First frame | Home |
| Last frame | End |
| Undo | Ctrl/Cmd + Z |
| Redo | Ctrl/Cmd + Shift + Z |

## Database Schema (Drizzle + Railway Postgres)

Hybrid approach: JSONB for settings, normalized rows for data points.

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),  // Clerk user ID
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isPublic: boolean('is_public').default(false),
  shareToken: text('share_token').unique(),
})

export const projectSettings = pgTable('project_settings', {
  projectId: uuid('project_id').primaryKey().references(() => projects.id, { onDelete: 'cascade' }),
  videoMetadata: jsonb('video_metadata'),      // storageUrl, fileName, frameRate, duration, dimensions
  coordinateSystem: jsonb('coordinate_system'), // scalePoints, origin, rotation, unit, yAxisUp
  uiSettings: jsonb('ui_settings'),            // trailLength, pointSize, etc.
})

export const dataPoints = pgTable('data_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  frameNumber: integer('frame_number').notNull(),
  timeSeconds: numeric('time_seconds').notNull(),
  pixelX: numeric('pixel_x').notNull(),
  pixelY: numeric('pixel_y').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  projectIdIdx: index('data_points_project_id_idx').on(table.projectId),
}))
```

## Testing Strategy

| What | Tool | Priority |
|------|------|----------|
| Coordinate transforms | Vitest | High |
| Kinematics calculations | Vitest | High |
| Undo/redo store logic | Vitest | Medium |
| React components (non-canvas) | Vitest + RTL | Medium |
| Canvas/graph rendering | Playwright screenshots | Medium |
| Full user flows | Playwright E2E | High |

Canvas content isn't in the DOM - use screenshot comparison for visual verification, unit test the underlying math.

## Video Upload

- **Max size:** 500MB
- **Formats:** MP4 (H.264), WebM (VP8/VP9), MOV (Safari warning for others)
- **Method:** Chunked multipart upload via `@aws-sdk/lib-storage`
- **Flow:** Presigned URL from API → Direct upload to MinIO → Client-side thumbnail generation

## Logging

**Server (Pino):**
- Structured JSON in production, pretty-print in development
- Request logging via `hono-pino` middleware
- Log levels: `error`, `warn`, `info`, `debug`
- Include request ID for tracing

```typescript
// Usage pattern
import { logger } from '@/server/lib/logger'

logger.info({ projectId, userId }, 'Project created')
logger.error({ err, projectId }, 'Failed to save data points')
```

**What to log:**
- All API requests (method, path, status, duration)
- Errors with context (stack, user, request)
- Business events (project created, video uploaded, export generated)
- Performance warnings (slow queries >500ms)

**What NOT to log:**
- Sensitive data (passwords, tokens, full video content)
- High-frequency client events (every frame change)
- Successful health checks

**Client:** Console in dev, error boundary catches + reports errors to `/api/log` endpoint for server-side collection. Full monitoring (Sentry) added later.

## Feedback & Error Handling

**Principle:** Inline feedback at point of action, not toasts.

| Scenario | Solution |
|----------|----------|
| Save status | Persistent header indicator ("Saved" / "Saving..." / "Offline") |
| Point added | Visual feedback on canvas (point appears) |
| Validation errors | Inline on form fields |
| Upload progress/error | Inline in upload area with retry |
| Project deleted | Toast with Undo (only toast use case) |
| Video format issue | Inline warning in video panel |
| Unexpected error | Error boundary with retry |

**Activity log:** Collapsible panel for reviewing recent actions (helps users who missed inline feedback).

## Auto-save Strategy

- **Debounced save:** 2-3 seconds after last change
- **Periodic fallback:** Every 30 seconds if dirty
- **Granular:** New points INSERT immediately (debounced), settings saved separately
- **Conflict:** Last-write-wins (no multi-tab sync for MVP)
- **Optimistic UI:** Update immediately, rollback on error
