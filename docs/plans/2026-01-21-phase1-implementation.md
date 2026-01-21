# Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete video-based motion analysis tool for AP Physics students that allows uploading videos, tracking object positions frame-by-frame, and generating position/velocity/acceleration graphs with linear regression.

**Architecture:** React 19 + TypeScript frontend with Zustand state management (undo/redo via zundo). Hono API server with Drizzle ORM connecting to Railway Postgres. Video storage via Railway MinIO with chunked uploads. Clerk handles authentication.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack Query/Router, Hono, Drizzle, Clerk, Recharts, Vitest, Playwright

---

## Prerequisites

Before starting, ensure these external services are configured:
- Railway project with Postgres database provisioned
- Railway MinIO instance running with bucket created
- Clerk application created with publishable/secret keys
- Environment variables set in `.env` (copy from `.env.example`)

---

## Task 1: Video Store Foundation

**Files:**
- Create: `src/stores/video.ts`
- Test: `src/stores/video.test.ts`

**Step 1: Write the failing test**

```typescript
// src/stores/video.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useVideoStore } from './video'

describe('useVideoStore', () => {
  beforeEach(() => {
    useVideoStore.getState().reset()
  })

  it('should start with null video metadata', () => {
    const state = useVideoStore.getState()
    expect(state.metadata).toBeNull()
  })

  it('should set video metadata', () => {
    const { setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    const state = useVideoStore.getState()
    expect(state.metadata?.fileName).toBe('test.mp4')
    expect(state.metadata?.totalFrames).toBe(300)
  })

  it('should track current frame', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(15)

    expect(useVideoStore.getState().currentFrame).toBe(15)
  })

  it('should clamp frame to valid range', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(-5)
    expect(useVideoStore.getState().currentFrame).toBe(0)

    setCurrentFrame(500)
    expect(useVideoStore.getState().currentFrame).toBe(299)
  })

  it('should calculate current time from frame', () => {
    const { setCurrentFrame, setMetadata } = useVideoStore.getState()

    setMetadata({
      storageUrl: 'https://example.com/video.mp4',
      fileName: 'test.mp4',
      duration: 10,
      frameRate: 30,
      width: 1920,
      height: 1080,
      totalFrames: 300,
    })

    setCurrentFrame(60)

    expect(useVideoStore.getState().currentTime).toBe(2) // 60 / 30 = 2 seconds
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/video.test.ts`
Expected: FAIL with "Cannot find module './video'"

**Step 3: Write minimal implementation**

```typescript
// src/stores/video.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface VideoMetadata {
  storageUrl: string
  fileName: string
  duration: number
  frameRate: number
  width: number
  height: number
  totalFrames: number
  thumbnailUrl?: string
}

interface VideoState {
  metadata: VideoMetadata | null
  currentFrame: number
  currentTime: number
  isPlaying: boolean
  playbackSpeed: number

  setMetadata: (metadata: VideoMetadata) => void
  setCurrentFrame: (frame: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  nextFrame: () => void
  prevFrame: () => void
  jumpFrames: (delta: number) => void
  goToFirstFrame: () => void
  goToLastFrame: () => void
  reset: () => void
}

const initialState = {
  metadata: null,
  currentFrame: 0,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
}

export const useVideoStore = create<VideoState>()(
  immer((set, get) => ({
    ...initialState,

    setMetadata: (metadata) => set((state) => {
      state.metadata = metadata
      state.currentFrame = 0
      state.currentTime = 0
    }),

    setCurrentFrame: (frame) => set((state) => {
      const { metadata } = state
      if (!metadata) return

      const clampedFrame = Math.max(0, Math.min(frame, metadata.totalFrames - 1))
      state.currentFrame = clampedFrame
      state.currentTime = clampedFrame / metadata.frameRate
    }),

    setIsPlaying: (playing) => set((state) => {
      state.isPlaying = playing
    }),

    setPlaybackSpeed: (speed) => set((state) => {
      state.playbackSpeed = speed
    }),

    nextFrame: () => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame + 1)
    },

    prevFrame: () => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame - 1)
    },

    jumpFrames: (delta) => {
      const { currentFrame, setCurrentFrame } = get()
      setCurrentFrame(currentFrame + delta)
    },

    goToFirstFrame: () => {
      get().setCurrentFrame(0)
    },

    goToLastFrame: () => {
      const { metadata, setCurrentFrame } = get()
      if (metadata) {
        setCurrentFrame(metadata.totalFrames - 1)
      }
    },

    reset: () => set(() => initialState),
  }))
)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/video.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/stores/video.ts src/stores/video.test.ts
git commit -m "feat(video): add video store with frame navigation"
```

---

## Task 2: Coordinate System Store

**Files:**
- Create: `src/stores/coordinates.ts`
- Test: `src/stores/coordinates.test.ts`

**Step 1: Write the failing test**

```typescript
// src/stores/coordinates.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCoordinateStore } from './coordinates'

describe('useCoordinateStore', () => {
  beforeEach(() => {
    useCoordinateStore.getState().reset()
  })

  it('should start with default coordinate system', () => {
    const state = useCoordinateStore.getState()
    expect(state.origin).toEqual({ x: 0, y: 0 })
    expect(state.rotation).toBe(0)
    expect(state.yAxisUp).toBe(true)
    expect(state.scaleDistance).toBeNull()
  })

  it('should set scale points and distance', () => {
    const { setScalePoint1, setScalePoint2, setScaleDistance, setScaleUnit } =
      useCoordinateStore.getState()

    setScalePoint1({ x: 100, y: 200 })
    setScalePoint2({ x: 200, y: 200 })
    setScaleDistance(1)
    setScaleUnit('m')

    const state = useCoordinateStore.getState()
    expect(state.scalePoint1).toEqual({ x: 100, y: 200 })
    expect(state.scalePoint2).toEqual({ x: 200, y: 200 })
    expect(state.scaleDistance).toBe(1)
    expect(state.scaleUnit).toBe('m')
  })

  it('should calculate pixels per unit', () => {
    const { setScalePoint1, setScalePoint2, setScaleDistance } =
      useCoordinateStore.getState()

    setScalePoint1({ x: 0, y: 0 })
    setScalePoint2({ x: 100, y: 0 })
    setScaleDistance(1) // 100 pixels = 1 meter

    expect(useCoordinateStore.getState().pixelsPerUnit).toBe(100)
  })

  it('should set origin', () => {
    const { setOrigin } = useCoordinateStore.getState()

    setOrigin({ x: 50, y: 100 })

    expect(useCoordinateStore.getState().origin).toEqual({ x: 50, y: 100 })
  })

  it('should set rotation', () => {
    const { setRotation } = useCoordinateStore.getState()

    setRotation(45)

    expect(useCoordinateStore.getState().rotation).toBe(45)
  })

  it('should toggle Y axis direction', () => {
    const { toggleYAxis } = useCoordinateStore.getState()

    expect(useCoordinateStore.getState().yAxisUp).toBe(true)
    toggleYAxis()
    expect(useCoordinateStore.getState().yAxisUp).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/coordinates.test.ts`
Expected: FAIL with "Cannot find module './coordinates'"

**Step 3: Write minimal implementation**

```typescript
// src/stores/coordinates.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type ScaleUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in'

export interface Point {
  x: number
  y: number
}

interface CoordinateState {
  scalePoint1: Point | null
  scalePoint2: Point | null
  scaleDistance: number | null
  scaleUnit: ScaleUnit
  origin: Point
  rotation: number
  yAxisUp: boolean
  pixelsPerUnit: number | null

  setScalePoint1: (point: Point) => void
  setScalePoint2: (point: Point) => void
  setScaleDistance: (distance: number) => void
  setScaleUnit: (unit: ScaleUnit) => void
  setOrigin: (point: Point) => void
  setRotation: (degrees: number) => void
  toggleYAxis: () => void
  reset: () => void
}

const initialState = {
  scalePoint1: null,
  scalePoint2: null,
  scaleDistance: null,
  scaleUnit: 'm' as ScaleUnit,
  origin: { x: 0, y: 0 },
  rotation: 0,
  yAxisUp: true,
  pixelsPerUnit: null,
}

function calculatePixelsPerUnit(
  p1: Point | null,
  p2: Point | null,
  distance: number | null
): number | null {
  if (!p1 || !p2 || !distance || distance === 0) return null
  const pixelDistance = Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
  )
  return pixelDistance / distance
}

export const useCoordinateStore = create<CoordinateState>()(
  immer((set, get) => ({
    ...initialState,

    setScalePoint1: (point) => set((state) => {
      state.scalePoint1 = point
      state.pixelsPerUnit = calculatePixelsPerUnit(
        point,
        state.scalePoint2,
        state.scaleDistance
      )
    }),

    setScalePoint2: (point) => set((state) => {
      state.scalePoint2 = point
      state.pixelsPerUnit = calculatePixelsPerUnit(
        state.scalePoint1,
        point,
        state.scaleDistance
      )
    }),

    setScaleDistance: (distance) => set((state) => {
      state.scaleDistance = distance
      state.pixelsPerUnit = calculatePixelsPerUnit(
        state.scalePoint1,
        state.scalePoint2,
        distance
      )
    }),

    setScaleUnit: (unit) => set((state) => {
      state.scaleUnit = unit
    }),

    setOrigin: (point) => set((state) => {
      state.origin = point
    }),

    setRotation: (degrees) => set((state) => {
      state.rotation = degrees
    }),

    toggleYAxis: () => set((state) => {
      state.yAxisUp = !state.yAxisUp
    }),

    reset: () => set(() => initialState),
  }))
)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/coordinates.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/stores/coordinates.ts src/stores/coordinates.test.ts
git commit -m "feat(coordinates): add coordinate system store"
```

---

## Task 3: Coordinate Transformation Utility

**Files:**
- Create: `src/lib/transforms.ts`
- Test: `src/lib/transforms.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/transforms.test.ts
import { describe, it, expect } from 'vitest'
import { pixelToWorld, worldToPixel } from './transforms'

describe('pixelToWorld', () => {
  const defaultSystem = {
    origin: { x: 0, y: 0 },
    rotation: 0,
    yAxisUp: true,
    pixelsPerUnit: 100, // 100 pixels = 1 unit
  }

  it('should convert pixel at origin to (0, 0)', () => {
    const result = pixelToWorld({ x: 0, y: 0 }, defaultSystem)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('should convert positive x pixel to positive world x', () => {
    const result = pixelToWorld({ x: 100, y: 0 }, defaultSystem)
    expect(result.x).toBeCloseTo(1) // 100px / 100 = 1 unit
    expect(result.y).toBeCloseTo(0)
  })

  it('should flip y-axis when yAxisUp is true (physics convention)', () => {
    // In video, y increases downward. With yAxisUp=true,
    // a pixel below origin should have negative world y
    const result = pixelToWorld({ x: 0, y: 100 }, defaultSystem)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(-1) // 100px down = -1 unit
  })

  it('should not flip y-axis when yAxisUp is false', () => {
    const system = { ...defaultSystem, yAxisUp: false }
    const result = pixelToWorld({ x: 0, y: 100 }, system)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(1) // 100px = 1 unit (same direction)
  })

  it('should handle non-zero origin', () => {
    const system = { ...defaultSystem, origin: { x: 50, y: 50 } }
    const result = pixelToWorld({ x: 150, y: 50 }, system)
    expect(result.x).toBeCloseTo(1) // (150-50)/100 = 1
    expect(result.y).toBeCloseTo(0)
  })

  it('should apply rotation (45 degrees)', () => {
    const system = { ...defaultSystem, rotation: 45 }
    // Pixel at (100, 0) with 45 degree rotation
    const result = pixelToWorld({ x: 100, y: 0 }, system)
    // After 45 deg rotation: x' = x*cos(45) + y*sin(45) ≈ 0.707
    expect(result.x).toBeCloseTo(Math.sqrt(2) / 2)
    expect(result.y).toBeCloseTo(-Math.sqrt(2) / 2) // y flipped
  })

  it('should return null for missing pixelsPerUnit', () => {
    const system = { ...defaultSystem, pixelsPerUnit: null }
    const result = pixelToWorld({ x: 100, y: 100 }, system)
    expect(result).toBeNull()
  })
})

describe('worldToPixel', () => {
  const defaultSystem = {
    origin: { x: 0, y: 0 },
    rotation: 0,
    yAxisUp: true,
    pixelsPerUnit: 100,
  }

  it('should be inverse of pixelToWorld', () => {
    const pixel = { x: 150, y: 75 }
    const system = { ...defaultSystem, origin: { x: 50, y: 50 } }

    const world = pixelToWorld(pixel, system)
    expect(world).not.toBeNull()

    const backToPixel = worldToPixel(world!, system)
    expect(backToPixel).not.toBeNull()
    expect(backToPixel!.x).toBeCloseTo(pixel.x)
    expect(backToPixel!.y).toBeCloseTo(pixel.y)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/transforms.test.ts`
Expected: FAIL with "Cannot find module './transforms'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/transforms.ts
import type { Point } from '@/stores/coordinates'

export interface CoordinateSystem {
  origin: Point
  rotation: number
  yAxisUp: boolean
  pixelsPerUnit: number | null
}

export function pixelToWorld(
  pixel: Point,
  system: CoordinateSystem
): Point | null {
  const { origin, rotation, yAxisUp, pixelsPerUnit } = system

  if (pixelsPerUnit === null || pixelsPerUnit === 0) {
    return null
  }

  // Step 1: Translate to origin
  const translated = {
    x: pixel.x - origin.x,
    y: pixel.y - origin.y,
  }

  // Step 2: Apply rotation (convert degrees to radians)
  const theta = (rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const rotated = {
    x: translated.x * cos + translated.y * sin,
    y: -translated.x * sin + translated.y * cos,
  }

  // Step 3: Apply Y-axis direction
  const yAdjusted = {
    x: rotated.x,
    y: yAxisUp ? -rotated.y : rotated.y,
  }

  // Step 4: Convert to world units
  return {
    x: yAdjusted.x / pixelsPerUnit,
    y: yAdjusted.y / pixelsPerUnit,
  }
}

export function worldToPixel(
  world: Point,
  system: CoordinateSystem
): Point | null {
  const { origin, rotation, yAxisUp, pixelsPerUnit } = system

  if (pixelsPerUnit === null || pixelsPerUnit === 0) {
    return null
  }

  // Reverse step 4: Convert from world units
  const scaled = {
    x: world.x * pixelsPerUnit,
    y: world.y * pixelsPerUnit,
  }

  // Reverse step 3: Apply Y-axis direction
  const yAdjusted = {
    x: scaled.x,
    y: yAxisUp ? -scaled.y : scaled.y,
  }

  // Reverse step 2: Reverse rotation
  const theta = (rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const rotated = {
    x: yAdjusted.x * cos - yAdjusted.y * sin,
    y: yAdjusted.x * sin + yAdjusted.y * cos,
  }

  // Reverse step 1: Translate from origin
  return {
    x: rotated.x + origin.x,
    y: rotated.y + origin.y,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/transforms.test.ts`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/lib/transforms.ts src/lib/transforms.test.ts
git commit -m "feat(transforms): add pixel-to-world coordinate conversion"
```

---

## Task 4: Kinematics Calculations

**Files:**
- Create: `src/lib/kinematics.ts`
- Test: `src/lib/kinematics.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/kinematics.test.ts
import { describe, it, expect } from 'vitest'
import { calculateVelocity, calculateAcceleration, linearRegression } from './kinematics'

describe('calculateVelocity', () => {
  it('should return null for endpoints', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 1, y: 0 },
      { time: 2, x: 2, y: 0 },
    ]

    expect(calculateVelocity(data, 0)).toBeNull() // first point
    expect(calculateVelocity(data, 2)).toBeNull() // last point
  })

  it('should calculate velocity using central difference', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 1, y: 2 },
      { time: 2, x: 2, y: 4 },
    ]

    const v = calculateVelocity(data, 1)
    expect(v).not.toBeNull()
    expect(v!.vx).toBeCloseTo(1) // (2-0)/(2-0) = 1
    expect(v!.vy).toBeCloseTo(2) // (4-0)/(2-0) = 2
  })

  it('should handle non-uniform time steps', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 0.5, x: 1, y: 1 },
      { time: 2, x: 4, y: 4 },
    ]

    const v = calculateVelocity(data, 1)
    expect(v).not.toBeNull()
    expect(v!.vx).toBeCloseTo(2) // (4-0)/(2-0) = 2
  })
})

describe('calculateAcceleration', () => {
  it('should calculate acceleration from velocities', () => {
    const data = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 0.5, y: 0 },
      { time: 2, x: 2, y: 0 },
      { time: 3, x: 4.5, y: 0 },
      { time: 4, x: 8, y: 0 },
    ]

    // Velocities: null, 1, 2, 3, null (constant acceleration of 1)
    const a = calculateAcceleration(data, 2)
    expect(a).not.toBeNull()
    expect(a!.ax).toBeCloseTo(1) // (3-1)/(3-1) = 1
  })
})

describe('linearRegression', () => {
  it('should calculate perfect linear fit', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
    ]

    const result = linearRegression(points)
    expect(result.slope).toBeCloseTo(2)
    expect(result.intercept).toBeCloseTo(0)
    expect(result.rSquared).toBeCloseTo(1)
  })

  it('should calculate y-intercept correctly', () => {
    const points = [
      { x: 0, y: 5 },
      { x: 1, y: 7 },
      { x: 2, y: 9 },
    ]

    const result = linearRegression(points)
    expect(result.slope).toBeCloseTo(2)
    expect(result.intercept).toBeCloseTo(5)
  })

  it('should return null for insufficient data', () => {
    const points = [{ x: 0, y: 0 }]
    expect(linearRegression(points)).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/kinematics.test.ts`
Expected: FAIL with "Cannot find module './kinematics'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/kinematics.ts
export interface DataPointWithWorld {
  time: number
  x: number
  y: number
}

export interface Velocity {
  vx: number
  vy: number
  speed: number
}

export interface Acceleration {
  ax: number
  ay: number
}

export interface RegressionResult {
  slope: number
  intercept: number
  rSquared: number
}

/**
 * Calculate velocity at index using central difference method.
 * Returns null for first and last points (no neighbors on both sides).
 */
export function calculateVelocity(
  data: DataPointWithWorld[],
  index: number
): Velocity | null {
  if (index <= 0 || index >= data.length - 1) {
    return null
  }

  const prev = data[index - 1]
  const next = data[index + 1]
  const dt = next.time - prev.time

  if (dt === 0) return null

  const vx = (next.x - prev.x) / dt
  const vy = (next.y - prev.y) / dt
  const speed = Math.sqrt(vx * vx + vy * vy)

  return { vx, vy, speed }
}

/**
 * Calculate acceleration at index using central difference on velocities.
 * Requires at least 2 points on each side for velocity calculation.
 */
export function calculateAcceleration(
  data: DataPointWithWorld[],
  index: number
): Acceleration | null {
  if (index <= 1 || index >= data.length - 2) {
    return null
  }

  const vPrev = calculateVelocity(data, index - 1)
  const vNext = calculateVelocity(data, index + 1)

  if (!vPrev || !vNext) return null

  const dt = data[index + 1].time - data[index - 1].time
  if (dt === 0) return null

  return {
    ax: (vNext.vx - vPrev.vx) / dt,
    ay: (vNext.vy - vPrev.vy) / dt,
  }
}

/**
 * Perform linear regression on (x, y) points.
 * Returns slope, intercept, and R² correlation coefficient.
 */
export function linearRegression(
  points: Array<{ x: number; y: number }>
): RegressionResult | null {
  const n = points.length
  if (n < 2) return null

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  let sumYY = 0

  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumXX += p.x * p.x
    sumYY += p.y * p.y
  }

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // Calculate R²
  const meanY = sumY / n
  let ssTot = 0
  let ssRes = 0

  for (const p of points) {
    const predicted = slope * p.x + intercept
    ssTot += (p.y - meanY) ** 2
    ssRes += (p.y - predicted) ** 2
  }

  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/kinematics.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/lib/kinematics.ts src/lib/kinematics.test.ts
git commit -m "feat(kinematics): add velocity, acceleration, and regression calculations"
```

---

## Task 5: Enhanced Tracking Store with Undo/Redo

**Files:**
- Modify: `src/stores/tracking.ts`
- Modify: `src/stores/tracking.test.ts`

**Step 1: Write the failing test**

Add these tests to the existing file:

```typescript
// src/stores/tracking.test.ts - add these tests
import { describe, it, expect, beforeEach } from 'vitest'
import { useTrackingStore } from './tracking'

describe('useTrackingStore undo/redo', () => {
  beforeEach(() => {
    useTrackingStore.getState().reset()
    useTrackingStore.temporal.getState().clear()
  })

  it('should undo adding a point', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)

    useTrackingStore.temporal.getState().undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
  })

  it('should redo after undo', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    useTrackingStore.temporal.getState().undo()
    useTrackingStore.temporal.getState().redo()

    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)
  })

  it('should track selected point', () => {
    const { addPoint, selectPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0].id

    selectPoint(pointId)
    expect(useTrackingStore.getState().selectedPointId).toBe(pointId)

    selectPoint(null)
    expect(useTrackingStore.getState().selectedPointId).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/tracking.test.ts`
Expected: FAIL (temporal.getState() may not exist or selectPoint missing)

**Step 3: Update implementation**

```typescript
// src/stores/tracking.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'

export interface DataPoint {
  id: string
  frameNumber: number
  time: number
  pixelX: number
  pixelY: number
}

interface TrackingState {
  dataPoints: DataPoint[]
  selectedPointId: string | null
  autoAdvance: boolean
  trailLength: number | null // null = show all

  addPoint: (point: Omit<DataPoint, 'id'>) => void
  updatePoint: (id: string, update: { x: number; y: number }) => void
  deletePoint: (id: string) => void
  selectPoint: (id: string | null) => void
  setAutoAdvance: (enabled: boolean) => void
  setTrailLength: (length: number | null) => void
  hydrate: (points: DataPoint[]) => void
  reset: () => void
}

const initialState = {
  dataPoints: [],
  selectedPointId: null,
  autoAdvance: true,
  trailLength: null,
}

export const useTrackingStore = create<TrackingState>()(
  temporal(
    immer((set) => ({
      ...initialState,

      addPoint: (point) => set((state) => {
        state.dataPoints.push({
          ...point,
          id: crypto.randomUUID(),
        })
      }),

      updatePoint: (id, update) => set((state) => {
        const point = state.dataPoints.find((p) => p.id === id)
        if (point) {
          point.pixelX = update.x
          point.pixelY = update.y
        }
      }),

      deletePoint: (id) => set((state) => {
        const index = state.dataPoints.findIndex((p) => p.id === id)
        if (index !== -1) {
          state.dataPoints.splice(index, 1)
        }
        if (state.selectedPointId === id) {
          state.selectedPointId = null
        }
      }),

      selectPoint: (id) => set((state) => {
        state.selectedPointId = id
      }),

      setAutoAdvance: (enabled) => set((state) => {
        state.autoAdvance = enabled
      }),

      setTrailLength: (length) => set((state) => {
        state.trailLength = length
      }),

      hydrate: (points) => set((state) => {
        state.dataPoints = points
        state.selectedPointId = null
      }),

      reset: () => set(() => initialState),
    })),
    {
      limit: 50, // Keep 50 history states
      partialize: (state) => {
        // Only track dataPoints changes for undo/redo
        const { dataPoints } = state
        return { dataPoints }
      },
    }
  )
)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/tracking.test.ts`
Expected: PASS (7 tests total)

**Step 5: Commit**

```bash
git add src/stores/tracking.ts src/stores/tracking.test.ts
git commit -m "feat(tracking): add undo/redo and point selection"
```

---

## Task 6: Video Upload Types and API Route

**Files:**
- Create: `src/server/routes/upload.ts`
- Modify: `src/server/index.ts`

**Step 1: Create the upload route**

```typescript
// src/server/routes/upload.ts
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Hono } from 'hono'
import { createLogger } from '../lib/logger'
import { s3Client, BUCKET_NAME } from '../lib/storage'

const logger = createLogger('upload')

export const uploadRouter = new Hono()

// Generate presigned URL for video upload
uploadRouter.post('/presign', async (c) => {
  const body = await c.req.json<{
    fileName: string
    contentType: string
    fileSize: number
  }>()

  // Validate file size (500MB max)
  const MAX_SIZE = 500 * 1024 * 1024
  if (body.fileSize > MAX_SIZE) {
    return c.json({ error: 'File too large. Maximum size is 500MB.' }, 400)
  }

  // Validate content type
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
  if (!allowedTypes.includes(body.contentType)) {
    return c.json({ error: 'Invalid file type. Allowed: MP4, WebM, MOV.' }, 400)
  }

  // TODO: Get userId from Clerk session
  const userId = 'temp-user-id'
  const key = `videos/${userId}/${Date.now()}-${body.fileName}`

  logger.info({ userId, fileName: body.fileName, fileSize: body.fileSize }, 'Generating presigned URL')

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: body.contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    // Also generate a read URL for after upload
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    const storageUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 86400 * 7 })

    return c.json({
      uploadUrl,
      storageUrl,
      key,
    })
  } catch (error) {
    logger.error({ error }, 'Failed to generate presigned URL')
    return c.json({ error: 'Failed to generate upload URL' }, 500)
  }
})
```

**Step 2: Create storage client**

```typescript
// src/server/lib/storage.ts
import { S3Client } from '@aws-sdk/client-s3'

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'motion-tracker'

export const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
})
```

**Step 3: Update server index to include upload route**

```typescript
// src/server/index.ts - add import and route
import { uploadRouter } from './routes/upload'

// Add this after other routes
app.route('/api/upload', uploadRouter)
```

**Step 4: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS (no type errors)

**Step 5: Commit**

```bash
git add src/server/routes/upload.ts src/server/lib/storage.ts src/server/index.ts
git commit -m "feat(upload): add presigned URL generation for video uploads"
```

---

## Task 7: Video Player Component Shell

**Files:**
- Create: `src/features/video/components/VideoPlayer.tsx`
- Create: `src/features/video/components/index.ts`

**Step 1: Create VideoPlayer component**

```typescript
// src/features/video/components/VideoPlayer.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVideoStore } from '@/stores/video'

interface VideoPlayerProps {
  src: string | null
  onFrameChange?: (frame: number) => void
}

export function VideoPlayer({ src, onFrameChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    metadata,
    currentFrame,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setIsPlaying,
  } = useVideoStore()

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Seek to frame when currentFrame changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !metadata) return

    const targetTime = currentFrame / metadata.frameRate
    if (Math.abs(video.currentTime - targetTime) > 0.001) {
      video.currentTime = targetTime
    }
  }, [currentFrame, metadata])

  // Draw current frame to canvas when paused
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = frameCanvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
  }, [])

  // Handle video seeked event
  const handleSeeked = useCallback(() => {
    if (!isPlaying) {
      drawFrame()
    }
    onFrameChange?.(currentFrame)
  }, [isPlaying, drawFrame, currentFrame, onFrameChange])

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
      drawFrame()
    }
  }, [isPlaying, drawFrame])

  // Handle playback speed
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Update frame during playback
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !metadata || !isPlaying) return

    const frame = Math.floor(video.currentTime * metadata.frameRate)
    if (frame !== currentFrame) {
      setCurrentFrame(frame)
    }
  }, [metadata, isPlaying, currentFrame, setCurrentFrame])

  // Handle video end
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])

  // Calculate display dimensions
  useEffect(() => {
    if (!metadata || !containerRef.current) return

    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const videoAspect = metadata.width / metadata.height
    const containerAspect = containerWidth / containerHeight

    let width: number
    let height: number

    if (videoAspect > containerAspect) {
      width = containerWidth
      height = containerWidth / videoAspect
    } else {
      height = containerHeight
      width = containerHeight * videoAspect
    }

    setDimensions({ width, height })
  }, [metadata])

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        No video loaded
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative flex h-full items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={src}
        className={isPlaying ? 'block' : 'hidden'}
        style={{ width: dimensions.width, height: dimensions.height }}
        onSeeked={handleSeeked}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        playsInline
        muted
      />
      <canvas
        ref={frameCanvasRef}
        className={isPlaying ? 'hidden' : 'block'}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
    </div>
  )
}
```

**Step 2: Create barrel export**

```typescript
// src/features/video/components/index.ts
export { VideoPlayer } from './VideoPlayer'
```

**Step 3: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/video/components/
git commit -m "feat(video): add VideoPlayer component with canvas rendering"
```

---

## Task 8: Video Controls Component

**Files:**
- Create: `src/features/video/components/VideoControls.tsx`
- Update: `src/features/video/components/index.ts`

**Step 1: Create VideoControls component**

```typescript
// src/features/video/components/VideoControls.tsx
import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, Rewind, FastForward
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVideoStore } from '@/stores/video'

export function VideoControls() {
  const {
    metadata,
    currentFrame,
    currentTime,
    isPlaying,
    playbackSpeed,
    setCurrentFrame,
    setIsPlaying,
    setPlaybackSpeed,
    nextFrame,
    prevFrame,
    jumpFrames,
    goToFirstFrame,
    goToLastFrame,
  } = useVideoStore()

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  // Keyboard shortcuts
  useHotkeys('space', (e) => {
    e.preventDefault()
    togglePlayPause()
  }, [togglePlayPause])

  useHotkeys('right, .', () => nextFrame(), [nextFrame])
  useHotkeys('left, ,', () => prevFrame(), [prevFrame])
  useHotkeys('shift+right', () => jumpFrames(10), [jumpFrames])
  useHotkeys('shift+left', () => jumpFrames(-10), [jumpFrames])
  useHotkeys('home', () => goToFirstFrame(), [goToFirstFrame])
  useHotkeys('end', () => goToLastFrame(), [goToLastFrame])

  const handleSliderChange = useCallback((value: number[]) => {
    setCurrentFrame(value[0])
  }, [setCurrentFrame])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(2)
    return `${mins}:${secs.padStart(5, '0')}`
  }

  if (!metadata) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 p-4 border-t bg-background">
      {/* Timeline */}
      <Slider
        value={[currentFrame]}
        max={metadata.totalFrames - 1}
        step={1}
        onValueChange={handleSliderChange}
        className="w-full"
      />

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Left: Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToFirstFrame} title="First frame (Home)">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => jumpFrames(-10)} title="Back 10 frames (Shift+Left)">
            <Rewind className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={prevFrame} title="Previous frame (Left/,)">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={togglePlayPause} title="Play/Pause (Space)">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={nextFrame} title="Next frame (Right/.)">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => jumpFrames(10)} title="Forward 10 frames (Shift+Right)">
            <FastForward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToLastFrame} title="Last frame (End)">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Time display */}
        <div className="flex items-center gap-4 text-sm tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{formatTime(metadata.duration)}</span>
          <span className="text-muted-foreground">|</span>
          <span>Frame {currentFrame + 1} / {metadata.totalFrames}</span>
        </div>

        {/* Right: Speed selector */}
        <Select
          value={playbackSpeed.toString()}
          onValueChange={(v) => setPlaybackSpeed(Number.parseFloat(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">0.25x</SelectItem>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

**Step 2: Update barrel export**

```typescript
// src/features/video/components/index.ts
export { VideoPlayer } from './VideoPlayer'
export { VideoControls } from './VideoControls'
```

**Step 3: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/video/components/
git commit -m "feat(video): add VideoControls with keyboard shortcuts"
```

---

## Task 9: Video Upload Component

**Files:**
- Create: `src/features/video/components/VideoUpload.tsx`
- Update: `src/features/video/components/index.ts`

**Step 1: Create VideoUpload component**

```typescript
// src/features/video/components/VideoUpload.tsx
import { useCallback, useState } from 'react'
import { Upload, FileVideo, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVideoStore } from '@/stores/video'

interface VideoUploadProps {
  onUploadComplete?: (url: string) => void
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const { setMetadata } = useVideoStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, WebM, or MOV.'
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 500MB.'
    }

    return null
  }

  const extractMetadata = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        // Try to detect frame rate using requestVideoFrameCallback
        let frameRate = 30 // Default fallback

        if ('requestVideoFrameCallback' in video) {
          let lastTime = 0
          let frameCount = 0

          const countFrames = (now: number, metadata: VideoFrameCallbackMetadata) => {
            if (lastTime > 0) {
              frameCount++
              if (frameCount >= 10) {
                frameRate = Math.round(frameCount / (metadata.mediaTime - lastTime) * metadata.mediaTime)
                video.pause()
                URL.revokeObjectURL(video.src)

                setMetadata({
                  storageUrl: '', // Will be set after upload
                  fileName: file.name,
                  duration: video.duration,
                  frameRate,
                  width: video.videoWidth,
                  height: video.videoHeight,
                  totalFrames: Math.floor(video.duration * frameRate),
                })
                resolve()
                return
              }
            }
            lastTime = metadata.mediaTime
            video.requestVideoFrameCallback(countFrames)
          }

          video.requestVideoFrameCallback(countFrames)
          video.play().catch(() => {
            // If autoplay fails, use default frame rate
            setMetadata({
              storageUrl: '',
              fileName: file.name,
              duration: video.duration,
              frameRate: 30,
              width: video.videoWidth,
              height: video.videoHeight,
              totalFrames: Math.floor(video.duration * 30),
            })
            resolve()
          })
        } else {
          // Fallback for browsers without requestVideoFrameCallback
          setMetadata({
            storageUrl: '',
            fileName: file.name,
            duration: video.duration,
            frameRate: 30,
            width: video.videoWidth,
            height: video.videoHeight,
            totalFrames: Math.floor(video.duration * 30),
          })
          resolve()
        }
      }

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (file: File): Promise<string> => {
    // Get presigned URL
    const presignResponse = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    })

    if (!presignResponse.ok) {
      const error = await presignResponse.json()
      throw new Error(error.error || 'Failed to get upload URL')
    }

    const { uploadUrl, storageUrl } = await presignResponse.json()

    // Upload to MinIO with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    return storageUrl
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Extract metadata first (while showing "Processing...")
      await extractMetadata(file)

      // Then upload
      const storageUrl = await uploadFile(file)

      // Update metadata with storage URL
      const { metadata } = useVideoStore.getState()
      if (metadata) {
        setMetadata({ ...metadata, storageUrl })
      }

      onUploadComplete?.(storageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [setMetadata, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isUploading ? (
        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {uploadProgress === 0 ? 'Processing video...' : `Uploading... ${uploadProgress}%`}
          </div>
          {uploadProgress > 0 && <Progress value={uploadProgress} className="w-64" />}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg
            transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
          `}
        >
          <FileVideo className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop your video here</p>
            <p className="text-xs text-muted-foreground">MP4, WebM, or MOV (max 500MB)</p>
          </div>
          <label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="secondary" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Update barrel export**

```typescript
// src/features/video/components/index.ts
export { VideoPlayer } from './VideoPlayer'
export { VideoControls } from './VideoControls'
export { VideoUpload } from './VideoUpload'
```

**Step 3: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/video/components/
git commit -m "feat(video): add VideoUpload component with drag-drop and progress"
```

---

## Task 10: Canvas Overlay Component

**Files:**
- Create: `src/features/tracking/components/CanvasOverlay.tsx`
- Create: `src/features/tracking/components/index.ts`

**Step 1: Create CanvasOverlay component**

```typescript
// src/features/tracking/components/CanvasOverlay.tsx
import { useCallback, useEffect, useRef } from 'react'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'

interface CanvasOverlayProps {
  width: number
  height: number
  onClick?: (pixelX: number, pixelY: number) => void
}

export function CanvasOverlay({ width, height, onClick }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { dataPoints, selectedPointId, trailLength } = useTrackingStore()
  const { origin, rotation, scalePoint1, scalePoint2 } = useCoordinateStore()
  const { currentFrame, metadata } = useVideoStore()

  // Draw overlay content
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw coordinate system
    drawCoordinateSystem(ctx, origin, rotation, scalePoint1, scalePoint2, width, height)

    // Draw tracked points and path
    drawPoints(ctx, dataPoints, selectedPointId, currentFrame, trailLength)
  }, [width, height, origin, rotation, scalePoint1, scalePoint2, dataPoints, selectedPointId, currentFrame, trailLength])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const pixelX = (e.clientX - rect.left) * scaleX
    const pixelY = (e.clientY - rect.top) * scaleY

    onClick(pixelX, pixelY)
  }, [onClick])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="absolute inset-0 cursor-crosshair"
      style={{ width, height }}
    />
  )
}

function drawCoordinateSystem(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  rotation: number,
  scalePoint1: { x: number; y: number } | null,
  scalePoint2: { x: number; y: number } | null,
  canvasWidth: number,
  canvasHeight: number
) {
  const rotationRad = (rotation * Math.PI) / 180

  // Draw origin crosshairs
  ctx.save()
  ctx.translate(origin.x, origin.y)
  ctx.rotate(rotationRad)

  ctx.strokeStyle = '#22c55e' // Green
  ctx.lineWidth = 2
  ctx.setLineDash([])

  // X-axis (extends across canvas)
  ctx.beginPath()
  ctx.moveTo(-canvasWidth, 0)
  ctx.lineTo(canvasWidth, 0)
  ctx.stroke()

  // Y-axis
  ctx.beginPath()
  ctx.moveTo(0, -canvasHeight)
  ctx.lineTo(0, canvasHeight)
  ctx.stroke()

  // Origin marker
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.arc(0, 0, 6, 0, 2 * Math.PI)
  ctx.fill()

  ctx.restore()

  // Draw scale reference line
  if (scalePoint1 && scalePoint2) {
    ctx.strokeStyle = '#3b82f6' // Blue
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    ctx.moveTo(scalePoint1.x, scalePoint1.y)
    ctx.lineTo(scalePoint2.x, scalePoint2.y)
    ctx.stroke()

    // Scale point markers
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(scalePoint1.x, scalePoint1.y, 5, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(scalePoint2.x, scalePoint2.y, 5, 0, 2 * Math.PI)
    ctx.fill()

    ctx.setLineDash([])
  }
}

function drawPoints(
  ctx: CanvasRenderingContext2D,
  dataPoints: Array<{ id: string; frameNumber: number; pixelX: number; pixelY: number }>,
  selectedPointId: string | null,
  currentFrame: number,
  trailLength: number | null
) {
  if (dataPoints.length === 0) return

  // Determine which points to show based on trail length
  const sortedPoints = [...dataPoints].sort((a, b) => a.frameNumber - b.frameNumber)

  let visiblePoints = sortedPoints
  if (trailLength !== null) {
    const currentIndex = sortedPoints.findIndex(p => p.frameNumber >= currentFrame)
    const startIndex = Math.max(0, currentIndex - trailLength)
    visiblePoints = sortedPoints.slice(startIndex, currentIndex + 1)
  }

  // Draw path connecting points
  if (visiblePoints.length > 1) {
    ctx.strokeStyle = '#ef4444' // Red
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(visiblePoints[0].pixelX, visiblePoints[0].pixelY)

    for (let i = 1; i < visiblePoints.length; i++) {
      ctx.lineTo(visiblePoints[i].pixelX, visiblePoints[i].pixelY)
    }
    ctx.stroke()
  }

  // Draw points
  for (const point of visiblePoints) {
    const isSelected = point.id === selectedPointId
    const isCurrent = point.frameNumber === currentFrame

    ctx.fillStyle = isCurrent ? '#fbbf24' : '#ef4444' // Yellow for current, red for others
    ctx.strokeStyle = isSelected ? '#ffffff' : 'transparent'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(point.pixelX, point.pixelY, isCurrent ? 8 : 5, 0, 2 * Math.PI)
    ctx.fill()
    if (isSelected) {
      ctx.stroke()
    }
  }
}
```

**Step 2: Create barrel export**

```typescript
// src/features/tracking/components/index.ts
export { CanvasOverlay } from './CanvasOverlay'
```

**Step 3: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/tracking/components/
git commit -m "feat(tracking): add CanvasOverlay for points and coordinate system"
```

---

## Task 11: Data Table Component

**Files:**
- Create: `src/features/data-table/components/DataTable.tsx`
- Create: `src/features/data-table/components/index.ts`
- Create: `src/features/data-table/hooks/useTableData.ts`

**Step 1: Create useTableData hook**

```typescript
// src/features/data-table/hooks/useTableData.ts
import { useMemo } from 'react'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'
import { useVideoStore } from '@/stores/video'
import { pixelToWorld, type CoordinateSystem } from '@/lib/transforms'
import { calculateVelocity, calculateAcceleration } from '@/lib/kinematics'

export interface TableRow {
  id: string
  rowNumber: number
  frameNumber: number
  time: number
  pixelX: number
  pixelY: number
  worldX: number | null
  worldY: number | null
  vx: number | null
  vy: number | null
  speed: number | null
  ax: number | null
  ay: number | null
}

export function useTableData(): TableRow[] {
  const { dataPoints } = useTrackingStore()
  const { origin, rotation, yAxisUp, pixelsPerUnit } = useCoordinateStore()
  const { metadata } = useVideoStore()

  return useMemo(() => {
    const coordinateSystem: CoordinateSystem = {
      origin,
      rotation,
      yAxisUp,
      pixelsPerUnit,
    }

    // Sort by frame number and calculate world coordinates
    const sortedPoints = [...dataPoints]
      .sort((a, b) => a.frameNumber - b.frameNumber)
      .map((point) => {
        const world = pixelToWorld({ x: point.pixelX, y: point.pixelY }, coordinateSystem)
        return {
          ...point,
          worldX: world?.x ?? null,
          worldY: world?.y ?? null,
        }
      })

    // Build data array for kinematics calculations
    const kinematicsData = sortedPoints
      .filter((p) => p.worldX !== null && p.worldY !== null)
      .map((p) => ({
        time: p.time,
        x: p.worldX!,
        y: p.worldY!,
      }))

    // Calculate velocities and accelerations
    return sortedPoints.map((point, index) => {
      const kinematicsIndex = kinematicsData.findIndex(
        (k) => Math.abs(k.time - point.time) < 0.0001
      )

      const velocity = kinematicsIndex >= 0
        ? calculateVelocity(kinematicsData, kinematicsIndex)
        : null

      const acceleration = kinematicsIndex >= 0
        ? calculateAcceleration(kinematicsData, kinematicsIndex)
        : null

      return {
        id: point.id,
        rowNumber: index + 1,
        frameNumber: point.frameNumber,
        time: point.time,
        pixelX: point.pixelX,
        pixelY: point.pixelY,
        worldX: point.worldX,
        worldY: point.worldY,
        vx: velocity?.vx ?? null,
        vy: velocity?.vy ?? null,
        speed: velocity?.speed ?? null,
        ax: acceleration?.ax ?? null,
        ay: acceleration?.ay ?? null,
      }
    })
  }, [dataPoints, origin, rotation, yAxisUp, pixelsPerUnit])
}
```

**Step 2: Create DataTable component**

```typescript
// src/features/data-table/components/DataTable.tsx
import { useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTrackingStore } from '@/stores/tracking'
import { useVideoStore } from '@/stores/video'
import { useCoordinateStore } from '@/stores/coordinates'
import { useTableData, type TableRow as DataRow } from '../hooks/useTableData'
import { cn } from '@/lib/utils'

interface DataTableProps {
  className?: string
}

export function DataTable({ className }: DataTableProps) {
  const { selectedPointId, selectPoint } = useTrackingStore()
  const { setCurrentFrame } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()
  const data = useTableData()

  const handleRowClick = useCallback((row: DataRow) => {
    selectPoint(row.id)
    setCurrentFrame(row.frameNumber)
  }, [selectPoint, setCurrentFrame])

  const formatNumber = (value: number | null, decimals = 3) => {
    if (value === null) return '—'
    return value.toFixed(decimals)
  }

  return (
    <div className={cn('overflow-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>t (s)</TableHead>
            <TableHead>x ({scaleUnit})</TableHead>
            <TableHead>y ({scaleUnit})</TableHead>
            <TableHead>vx ({scaleUnit}/s)</TableHead>
            <TableHead>vy ({scaleUnit}/s)</TableHead>
            <TableHead>|v| ({scaleUnit}/s)</TableHead>
            <TableHead>ax ({scaleUnit}/s²)</TableHead>
            <TableHead>ay ({scaleUnit}/s²)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => handleRowClick(row)}
              className={cn(
                'cursor-pointer',
                selectedPointId === row.id && 'bg-accent'
              )}
            >
              <TableCell className="font-medium">{row.rowNumber}</TableCell>
              <TableCell>{formatNumber(row.time)}</TableCell>
              <TableCell>{formatNumber(row.worldX)}</TableCell>
              <TableCell>{formatNumber(row.worldY)}</TableCell>
              <TableCell>{formatNumber(row.vx)}</TableCell>
              <TableCell>{formatNumber(row.vy)}</TableCell>
              <TableCell>{formatNumber(row.speed)}</TableCell>
              <TableCell>{formatNumber(row.ax)}</TableCell>
              <TableCell>{formatNumber(row.ay)}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No data points tracked yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

**Step 3: Create barrel export**

```typescript
// src/features/data-table/components/index.ts
export { DataTable } from './DataTable'
```

**Step 4: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/data-table/
git commit -m "feat(data-table): add data table with kinematics calculations"
```

---

## Task 12: Graph Component

**Files:**
- Create: `src/features/graphing/components/Graph.tsx`
- Create: `src/features/graphing/components/index.ts`

**Step 1: Create Graph component**

```typescript
// src/features/graphing/components/Graph.tsx
import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTableData } from '@/features/data-table/hooks/useTableData'
import { useVideoStore } from '@/stores/video'
import { useCoordinateStore } from '@/stores/coordinates'
import { linearRegression } from '@/lib/kinematics'

export type GraphType = 'x-t' | 'y-t' | 'vx-t' | 'vy-t' | 'y-x'

interface GraphProps {
  type: GraphType
  showRegression?: boolean
  className?: string
}

export function Graph({ type, showRegression = false, className }: GraphProps) {
  const data = useTableData()
  const { currentTime } = useVideoStore()
  const { scaleUnit } = useCoordinateStore()

  const { chartData, xKey, yKey, xLabel, yLabel, regression } = useMemo(() => {
    let xKey: string
    let yKey: string
    let xLabel: string
    let yLabel: string

    switch (type) {
      case 'x-t':
        xKey = 'time'
        yKey = 'worldX'
        xLabel = 't (s)'
        yLabel = `x (${scaleUnit})`
        break
      case 'y-t':
        xKey = 'time'
        yKey = 'worldY'
        xLabel = 't (s)'
        yLabel = `y (${scaleUnit})`
        break
      case 'vx-t':
        xKey = 'time'
        yKey = 'vx'
        xLabel = 't (s)'
        yLabel = `vx (${scaleUnit}/s)`
        break
      case 'vy-t':
        xKey = 'time'
        yKey = 'vy'
        xLabel = 't (s)'
        yLabel = `vy (${scaleUnit}/s)`
        break
      case 'y-x':
        xKey = 'worldX'
        yKey = 'worldY'
        xLabel = `x (${scaleUnit})`
        yLabel = `y (${scaleUnit})`
        break
    }

    // Filter out null values for the selected axes
    const chartData = data.filter((row) => {
      const xVal = row[xKey as keyof typeof row]
      const yVal = row[yKey as keyof typeof row]
      return xVal !== null && yVal !== null
    })

    // Calculate regression if requested
    let regression = null
    if (showRegression && chartData.length >= 2) {
      const points = chartData.map((row) => ({
        x: row[xKey as keyof typeof row] as number,
        y: row[yKey as keyof typeof row] as number,
      }))
      regression = linearRegression(points)
    }

    return { chartData, xKey, yKey, xLabel, yLabel, regression }
  }, [data, type, showRegression, scaleUnit])

  // Generate regression line data
  const regressionLineData = useMemo(() => {
    if (!regression || chartData.length < 2) return null

    const xValues = chartData.map((d) => d[xKey as keyof typeof d] as number)
    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)

    return [
      { x: minX, y: regression.slope * minX + regression.intercept },
      { x: maxX, y: regression.slope * maxX + regression.intercept },
    ]
  }, [regression, chartData, xKey])

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-muted-foreground ${className}`}>
        No data to display
      </div>
    )
  }

  return (
    <div className={className}>
      {regression && (
        <div className="mb-2 text-sm text-muted-foreground">
          y = {regression.slope.toFixed(4)}x + {regression.intercept.toFixed(4)}
          <span className="ml-4">R² = {regression.rSquared.toFixed(4)}</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
            type="number"
            domain={['auto', 'auto']}
          />
          <YAxis
            label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
            type="number"
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(4)}
            labelFormatter={(label: number) => `${xLabel}: ${label.toFixed(4)}`}
          />

          {/* Current time reference line for time-based graphs */}
          {xKey === 'time' && (
            <ReferenceLine x={currentTime} stroke="#fbbf24" strokeDasharray="3 3" />
          )}

          {/* Data points and line */}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4, fill: '#ef4444' }}
            activeDot={{ r: 6, fill: '#fbbf24' }}
          />

          {/* Regression line */}
          {regressionLineData && (
            <Line
              data={regressionLineData}
              type="linear"
              dataKey="y"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 2: Create barrel export**

```typescript
// src/features/graphing/components/index.ts
export { Graph, type GraphType } from './Graph'
```

**Step 3: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/features/graphing/
git commit -m "feat(graphing): add Graph component with regression support"
```

---

## Task 13: Coordinate System Setup Components

**Files:**
- Create: `src/features/coordinates/components/ScaleCalibration.tsx`
- Create: `src/features/coordinates/components/OriginTool.tsx`
- Create: `src/features/coordinates/components/AxisRotation.tsx`
- Create: `src/features/coordinates/components/index.ts`

**Step 1: Create ScaleCalibration component**

```typescript
// src/features/coordinates/components/ScaleCalibration.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCoordinateStore, type ScaleUnit } from '@/stores/coordinates'
import { Ruler } from 'lucide-react'

interface ScaleCalibrationProps {
  onStartCalibration: () => void
  isCalibrating: boolean
}

export function ScaleCalibration({ onStartCalibration, isCalibrating }: ScaleCalibrationProps) {
  const {
    scalePoint1,
    scalePoint2,
    scaleDistance,
    scaleUnit,
    pixelsPerUnit,
    setScaleDistance,
    setScaleUnit,
  } = useCoordinateStore()

  const [inputValue, setInputValue] = useState(scaleDistance?.toString() || '')

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    const num = Number.parseFloat(value)
    if (!Number.isNaN(num) && num > 0) {
      setScaleDistance(num)
    }
  }

  const hasPoints = scalePoint1 !== null && scalePoint2 !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4" />
        <span className="font-medium">Scale Calibration</span>
      </div>

      <Button
        variant={isCalibrating ? 'default' : 'outline'}
        onClick={onStartCalibration}
        className="w-full"
      >
        {isCalibrating
          ? scalePoint1
            ? 'Click second point'
            : 'Click first point'
          : hasPoints
            ? 'Re-calibrate Scale'
            : 'Set Scale Points'}
      </Button>

      {hasPoints && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="distance">Known Distance</Label>
            <div className="flex gap-2">
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.01"
                value={inputValue}
                onChange={handleDistanceChange}
                placeholder="Enter distance"
              />
              <Select value={scaleUnit} onValueChange={(v) => setScaleUnit(v as ScaleUnit)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {pixelsPerUnit !== null && (
            <p className="text-sm text-muted-foreground">
              Scale: {pixelsPerUnit.toFixed(2)} pixels/{scaleUnit}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create OriginTool component**

```typescript
// src/features/coordinates/components/OriginTool.tsx
import { Button } from '@/components/ui/button'
import { useCoordinateStore } from '@/stores/coordinates'
import { Crosshair } from 'lucide-react'

interface OriginToolProps {
  onStartPlacement: () => void
  isPlacing: boolean
}

export function OriginTool({ onStartPlacement, isPlacing }: OriginToolProps) {
  const { origin } = useCoordinateStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crosshair className="h-4 w-4" />
        <span className="font-medium">Origin</span>
      </div>

      <Button
        variant={isPlacing ? 'default' : 'outline'}
        onClick={onStartPlacement}
        className="w-full"
      >
        {isPlacing ? 'Click to place origin' : 'Set Origin'}
      </Button>

      <p className="text-sm text-muted-foreground">
        Position: ({origin.x.toFixed(0)}, {origin.y.toFixed(0)}) px
      </p>
    </div>
  )
}
```

**Step 3: Create AxisRotation component**

```typescript
// src/features/coordinates/components/AxisRotation.tsx
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useCoordinateStore } from '@/stores/coordinates'
import { RotateCcw } from 'lucide-react'

export function AxisRotation() {
  const { rotation, yAxisUp, setRotation, toggleYAxis } = useCoordinateStore()

  const handleSliderChange = useCallback((value: number[]) => {
    setRotation(value[0])
  }, [setRotation])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!Number.isNaN(value)) {
      setRotation(value % 360)
    }
  }, [setRotation])

  const snapToAngle = useCallback((angle: number) => {
    setRotation(angle)
  }, [setRotation])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4" />
        <span className="font-medium">Axis Orientation</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Rotation (degrees)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={360}
              value={rotation}
              onChange={handleInputChange}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {[0, 30, 45, 60, 90].map((angle) => (
            <Button
              key={angle}
              variant={rotation === angle ? 'default' : 'outline'}
              size="sm"
              onClick={() => snapToAngle(angle)}
            >
              {angle}°
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="y-axis-up">Positive Y is up</Label>
          <Switch
            id="y-axis-up"
            checked={yAxisUp}
            onCheckedChange={toggleYAxis}
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Create barrel export**

```typescript
// src/features/coordinates/components/index.ts
export { ScaleCalibration } from './ScaleCalibration'
export { OriginTool } from './OriginTool'
export { AxisRotation } from './AxisRotation'
```

**Step 5: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/features/coordinates/
git commit -m "feat(coordinates): add scale, origin, and rotation tools"
```

---

## Task 14: Project Editor Layout

**Files:**
- Create: `src/routes/projects/$projectId.tsx`

**Step 1: Create project editor route**

```typescript
// src/routes/projects/$projectId.tsx
import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { useHotkeys } from 'react-hotkeys-hook'

import { VideoPlayer, VideoControls, VideoUpload } from '@/features/video/components'
import { CanvasOverlay } from '@/features/tracking/components'
import { DataTable } from '@/features/data-table/components'
import { Graph, type GraphType } from '@/features/graphing/components'
import { ScaleCalibration, OriginTool, AxisRotation } from '@/features/coordinates/components'

import { useVideoStore } from '@/stores/video'
import { useTrackingStore } from '@/stores/tracking'
import { useCoordinateStore } from '@/stores/coordinates'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Undo2, Redo2 } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectEditor,
})

type Mode = 'setup' | 'track' | 'analyze'
type CalibrationTool = 'scale' | 'origin' | null

function ProjectEditor() {
  const { projectId } = Route.useParams()

  const [mode, setMode] = useState<Mode>('setup')
  const [calibrationTool, setCalibrationTool] = useState<CalibrationTool>(null)
  const [graphType, setGraphType] = useState<GraphType>('x-t')
  const [showRegression, setShowRegression] = useState(false)

  const { metadata } = useVideoStore()
  const { addPoint, autoAdvance, setAutoAdvance } = useTrackingStore()
  const { setScalePoint1, setScalePoint2, setOrigin, scalePoint1 } = useCoordinateStore()
  const { nextFrame } = useVideoStore()

  // Undo/redo keyboard shortcuts
  useHotkeys('mod+z', () => {
    useTrackingStore.temporal.getState().undo()
  }, [])

  useHotkeys('mod+shift+z, mod+y', () => {
    useTrackingStore.temporal.getState().redo()
  }, [])

  // Handle canvas click based on mode
  const handleCanvasClick = useCallback((pixelX: number, pixelY: number) => {
    if (calibrationTool === 'scale') {
      if (!scalePoint1) {
        setScalePoint1({ x: pixelX, y: pixelY })
      } else {
        setScalePoint2({ x: pixelX, y: pixelY })
        setCalibrationTool(null)
      }
      return
    }

    if (calibrationTool === 'origin') {
      setOrigin({ x: pixelX, y: pixelY })
      setCalibrationTool(null)
      return
    }

    if (mode === 'track' && metadata) {
      const { currentFrame, currentTime } = useVideoStore.getState()
      addPoint({
        frameNumber: currentFrame,
        time: currentTime,
        pixelX,
        pixelY,
      })

      if (autoAdvance) {
        nextFrame()
      }
    }
  }, [calibrationTool, scalePoint1, setScalePoint1, setScalePoint2, setOrigin, mode, metadata, addPoint, autoAdvance, nextFrame])

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="flex h-screen flex-col">
          {/* Toolbar */}
          <header className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">Project Editor</h1>
              <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <TabsList>
                  <TabsTrigger value="setup">Setup</TabsTrigger>
                  <TabsTrigger value="track">Track</TabsTrigger>
                  <TabsTrigger value="analyze">Analyze</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().undo()}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => useTrackingStore.temporal.getState().redo()}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: Video panel */}
            <div className="flex w-3/5 flex-col border-r">
              <div className="relative flex-1">
                {metadata ? (
                  <>
                    <VideoPlayer src={metadata.storageUrl} />
                    <CanvasOverlay
                      width={metadata.width}
                      height={metadata.height}
                      onClick={handleCanvasClick}
                    />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <VideoUpload />
                  </div>
                )}
              </div>
              {metadata && <VideoControls />}
            </div>

            {/* Right: Tools/Data/Graph panel */}
            <div className="flex w-2/5 flex-col">
              {mode === 'setup' && (
                <div className="flex-1 space-y-6 overflow-auto p-4">
                  <ScaleCalibration
                    onStartCalibration={() => setCalibrationTool('scale')}
                    isCalibrating={calibrationTool === 'scale'}
                  />
                  <OriginTool
                    onStartPlacement={() => setCalibrationTool('origin')}
                    isPlacing={calibrationTool === 'origin'}
                  />
                  <AxisRotation />
                </div>
              )}

              {mode === 'track' && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center gap-4 border-b p-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-advance"
                        checked={autoAdvance}
                        onCheckedChange={setAutoAdvance}
                      />
                      <Label htmlFor="auto-advance">Auto-advance</Label>
                    </div>
                  </div>
                  <DataTable className="flex-1" />
                </div>
              )}

              {mode === 'analyze' && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center gap-4 border-b p-4">
                    <Select value={graphType} onValueChange={(v) => setGraphType(v as GraphType)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="x-t">x vs t</SelectItem>
                        <SelectItem value="y-t">y vs t</SelectItem>
                        <SelectItem value="vx-t">vx vs t</SelectItem>
                        <SelectItem value="vy-t">vy vs t</SelectItem>
                        <SelectItem value="y-x">y vs x</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="regression"
                        checked={showRegression}
                        onCheckedChange={setShowRegression}
                      />
                      <Label htmlFor="regression">Best fit line</Label>
                    </div>
                  </div>
                  <Graph
                    type={graphType}
                    showRegression={showRegression}
                    className="flex-1 p-4"
                  />
                  <DataTable className="h-64 border-t" />
                </div>
              )}
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  )
}
```

**Step 2: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/projects/
git commit -m "feat(projects): add project editor route with full UI"
```

---

## Task 15: Project List Page

**Files:**
- Modify: `src/routes/index.tsx`

**Step 1: Update home page with project list**

```typescript
// src/routes/index.tsx
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Folder, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export const Route = createFileRoute('/')(
  component: HomePage,
})

interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Motion Tracker</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SignedIn>
          <ProjectList />
        </SignedIn>
        <SignedOut>
          <LandingContent />
        </SignedOut>
      </main>
    </div>
  )
}

function LandingContent() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">Video-Based Motion Analysis</h2>
      <p className="mt-2 text-muted-foreground">
        Sign in to start analyzing motion in your videos
      </p>
    </div>
  )
}

function ProjectList() {
  const [newProjectName, setNewProjectName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to create project')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setNewProjectName('')
      setIsDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleCreate = () => {
    if (newProjectName.trim()) {
      createMutation.mutate(newProjectName.trim())
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Give your project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Ball Drop Experiment"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!newProjectName.trim() || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card key={project.id} className="group relative">
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                  <CardDescription>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  if (confirm('Delete this project?')) {
                    deleteMutation.mutate(project.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat(projects): add project list with create/delete"
```

---

## Task 16: E2E Test for Core Flow

**Files:**
- Modify: `e2e/home.spec.ts`

**Step 1: Update E2E test**

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Motion Tracker', () => {
  test('should show landing page when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Motion Tracker')).toBeVisible()
    await expect(page.getByText('Video-Based Motion Analysis')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Motion Tracker/)
  })
})

// These tests require authentication setup - placeholder for now
test.describe('Authenticated flows', () => {
  test.skip('should create a new project', async ({ page }) => {
    // TODO: Set up Clerk test authentication
    await page.goto('/')

    await page.getByRole('button', { name: 'New Project' }).click()
    await page.getByLabel('Project Name').fill('Test Project')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByText('Test Project')).toBeVisible()
  })
})
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: PASS (non-auth tests pass, auth tests skip)

**Step 3: Commit**

```bash
git add e2e/
git commit -m "test(e2e): add basic E2E tests for landing page"
```

---

## Task 17: CSV Export Utility

**Files:**
- Create: `src/lib/export.ts`
- Test: `src/lib/export.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/export.test.ts
import { describe, it, expect } from 'vitest'
import { generateCSV, downloadCSV } from './export'

describe('generateCSV', () => {
  it('should generate CSV with headers', () => {
    const data = [
      { time: 0, x: 1, y: 2 },
      { time: 1, x: 3, y: 4 },
    ]
    const columns = ['time', 'x', 'y']

    const csv = generateCSV(data, columns)

    expect(csv).toContain('time,x,y')
    expect(csv).toContain('0,1,2')
    expect(csv).toContain('1,3,4')
  })

  it('should handle null values', () => {
    const data = [
      { time: 0, x: 1, y: null },
    ]
    const columns = ['time', 'x', 'y']

    const csv = generateCSV(data, columns)

    expect(csv).toContain('0,1,')
  })

  it('should escape commas in values', () => {
    const data = [
      { name: 'Hello, World', value: 1 },
    ]
    const columns = ['name', 'value']

    const csv = generateCSV(data, columns)

    expect(csv).toContain('"Hello, World"')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/export.test.ts`
Expected: FAIL with "Cannot find module './export'"

**Step 3: Write implementation**

```typescript
// src/lib/export.ts
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[]
): string {
  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.join(',')
  const rows = data.map((row) =>
    columns.map((col) => escapeValue(row[col])).join(',')
  )

  return [header, ...rows].join('\n')
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadPNG(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/export.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/export.ts src/lib/export.test.ts
git commit -m "feat(export): add CSV generation and download utilities"
```

---

## Summary

This plan covers the core Phase 1 implementation:

| Task | Component | Description |
|------|-----------|-------------|
| 1 | Video Store | Frame navigation, playback state |
| 2 | Coordinate Store | Scale, origin, rotation state |
| 3 | Transforms | Pixel-to-world coordinate conversion |
| 4 | Kinematics | Velocity, acceleration, regression |
| 5 | Tracking Store | Undo/redo, point selection |
| 6 | Upload API | Presigned URLs for MinIO |
| 7 | VideoPlayer | Canvas rendering, playback |
| 8 | VideoControls | Keyboard shortcuts, timeline |
| 9 | VideoUpload | Drag-drop, progress tracking |
| 10 | CanvasOverlay | Points, paths, coordinate system |
| 11 | DataTable | Time series display |
| 12 | Graph | Recharts with regression |
| 13 | Coordinate Tools | Scale, origin, rotation UI |
| 14 | Project Editor | Main analysis workspace |
| 15 | Project List | Home page with CRUD |
| 16 | E2E Tests | Basic smoke tests |
| 17 | Export | CSV generation |

---

**Plan complete and saved to `docs/plans/2026-01-21-phase1-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
