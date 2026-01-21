# Motion Tracker - Architecture Design

**Date:** 2026-01-21
**Status:** Approved
**Author:** Tyler + Claude

## Overview

Motion Tracker is a web application for video-based motion analysis in physics education. Students upload videos, track objects frame-by-frame, and generate position/velocity/acceleration data with graphs.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 19 + TypeScript + Vite | Modern, fast DX |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| Client State | Zustand + immer + zundo | Simple, undo/redo built-in |
| Server State | TanStack Query | Caching, mutations, loading states |
| Routing | TanStack Router | Type-safe params and loaders |
| API | Hono | Lightweight, Vite integration |
| Auth | Clerk | Managed auth, scales well |
| Database | Railway Postgres + Drizzle | Same platform as hosting, type-safe ORM |
| Storage | Railway MinIO | S3-compatible, single platform |
| Charts | Recharts | React-native, handles our needs |
| Forms | React Hook Form + Zod | Validation, good DX |
| Linting | Biome | Fast, combined lint + format |
| Testing | Vitest + RTL + Playwright | Unit, component, E2E |
| Logging | Pino | Structured, fast |
| Hosting | Railway | App + DB + Storage in one place |

## Architecture Decisions

### 1. Single Platform (Railway)

Everything except auth lives on Railway: app, Postgres, MinIO. Simplifies ops, single bill, single dashboard. Clerk handles auth because it scales and we don't want to build it.

### 2. State Management Split

- **TanStack Query**: Fetches project from server, caches it
- **Zustand**: Owns working state during editing session, with undo/redo via zundo
- **Hydration**: Query fetches once → hydrate into Zustand → Zustand is source of truth → auto-save syncs back

### 3. Data Model: Pixels Only

Store pixel coordinates, calculate world coordinates on-the-fly. Allows re-calibration without re-tracking. Single source of truth.

### 4. Database: Hybrid Schema

- JSONB for settings (small, infrequent changes)
- Normalized rows for data points (append-efficient, queryable)

### 5. Layered Canvas

```
<video>          → Native playback (hardware accelerated)
<canvas:frame>   → Frozen frame when paused (pixel-accurate)
<canvas:overlay> → Points, paths, axes (separate layer)
```

Avoids redrawing video frame on every overlay update. Export composites both canvases.

### 6. Chunked Video Upload

500MB files need resilience. Use `@aws-sdk/lib-storage` for multipart upload directly to MinIO via presigned URLs. Progress tracking, retry on failure.

### 7. Auto-save Strategy

- Debounced: 2-3 seconds after last change
- Periodic fallback: 30 seconds if dirty
- Granular: Points INSERT immediately, settings saved separately
- Optimistic UI with rollback on error

### 8. Inline Feedback, Not Toasts

Toasts have accessibility and attention issues. Use:
- Persistent save indicator in header
- Inline errors at point of action
- Activity log for history
- Toast ONLY for destructive action undo

### 9. Structured Logging

Pino for server-side logging. Structured JSON in production, pretty-print in dev. Log all API requests, errors with context, business events. Don't log sensitive data.

## Folder Structure

```
src/
  components/ui/      # shadcn/ui components
  lib/                # Utilities, clients
  hooks/              # Shared hooks
  features/           # Domain modules
    video/            # Upload, playback, frame extraction
    coordinates/      # Scale, origin, axis rotation
    tracking/         # Point marking, path visualization
    data-table/       # Time series, calculations
    graphing/         # Plots, regression
    projects/         # CRUD, sharing, export
  stores/             # Zustand stores
  server/             # Hono API
    routes/
    lib/
```

## API Routes

```
POST   /api/projects              # Create project
GET    /api/projects              # List user's projects
GET    /api/projects/:id          # Get project + settings + points
PUT    /api/projects/:id          # Update settings
DELETE /api/projects/:id          # Delete project

POST   /api/projects/:id/points   # Add data point(s)
DELETE /api/projects/:id/points   # Delete data point(s)

POST   /api/upload/presign        # Get presigned URL for video
```

## Frontend Routes

```
/                       # Project list (authenticated)
/projects/$projectId    # Edit project (owner only)
/share/$shareToken      # View shared (public, read-only)
```

## Database Schema

```typescript
// Drizzle schema
projects: id, userId, name, createdAt, updatedAt, isPublic, shareToken
projectSettings: projectId, videoMetadata (jsonb), coordinateSystem (jsonb), uiSettings (jsonb)
dataPoints: id, projectId, frameNumber, timeSeconds, pixelX, pixelY, createdAt
```

## Testing Strategy

| Layer | Tool | Focus |
|-------|------|-------|
| Math/transforms | Vitest | Coordinate conversion, kinematics |
| Store logic | Vitest | Undo/redo, state transitions |
| Components | Vitest + RTL | Non-canvas UI |
| Visual | Playwright screenshots | Canvas, graphs |
| E2E | Playwright | Full user flows |

## Environment Variables

```bash
# Client (VITE_ prefix)
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_URL=

# Server only
CLERK_SECRET_KEY=
DATABASE_URL=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
```

## Out of Scope (MVP)

- Multi-tab sync (last-write-wins for now)
- Automatic object tracking (ML)
- Multiple object tracking
- Offline/PWA support
- Video transcoding
- LMS integrations

## Next Steps

1. Scaffold project with all dependencies
2. Set up Railway services (Postgres, MinIO)
3. Set up Clerk application
4. Implement core modules in order: Video → Coordinates → Tracking → Data Table → Graphing → Projects
