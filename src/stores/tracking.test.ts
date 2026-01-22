import { describe, it, expect, beforeEach } from 'vitest'
import { useTrackingStore, undo, redo, clearHistory } from './tracking'

describe('useTrackingStore', () => {
  beforeEach(() => {
    useTrackingStore.getState().reset()
  })

  it('should start with empty data points', () => {
    const state = useTrackingStore.getState()
    expect(state.dataPoints).toEqual([])
  })

  it('should add a data point', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({
      frameNumber: 0,
      time: 0,
      pixelX: 100,
      pixelY: 200,
    })

    const state = useTrackingStore.getState()
    expect(state.dataPoints).toHaveLength(1)
    expect(state.dataPoints[0]).toMatchObject({
      frameNumber: 0,
      time: 0,
      pixelX: 100,
      pixelY: 200,
    })
  })

  it('should delete a data point', () => {
    const { addPoint, deletePoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0]!.id

    deletePoint(pointId)

    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
  })

  it('should update a data point position', () => {
    const { addPoint, updatePoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0]!.id

    updatePoint(pointId, { x: 150, y: 250 })

    const point = useTrackingStore.getState().dataPoints[0]!
    expect(point.pixelX).toBe(150)
    expect(point.pixelY).toBe(250)
  })

  it('should track selected point', () => {
    const { addPoint, selectPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0]!.id

    selectPoint(pointId)
    expect(useTrackingStore.getState().selectedPointId).toBe(pointId)

    selectPoint(null)
    expect(useTrackingStore.getState().selectedPointId).toBeNull()
  })

  it('should clear selection when selected point is deleted', () => {
    const { addPoint, selectPoint, deletePoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0]!.id

    selectPoint(pointId)
    expect(useTrackingStore.getState().selectedPointId).toBe(pointId)

    deletePoint(pointId)
    expect(useTrackingStore.getState().selectedPointId).toBeNull()
  })

  it('should reset all state to initial values', () => {
    const { addPoint, selectPoint, setAutoAdvance, setTrailLength, reset } = useTrackingStore.getState()

    // Set up some state
    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    addPoint({ frameNumber: 1, time: 0.033, pixelX: 110, pixelY: 210 })
    const pointId = useTrackingStore.getState().dataPoints[0]!.id
    selectPoint(pointId)
    setAutoAdvance(false)
    setTrailLength(25)

    // Verify state was set
    expect(useTrackingStore.getState().dataPoints).toHaveLength(2)
    expect(useTrackingStore.getState().selectedPointId).toBe(pointId)
    expect(useTrackingStore.getState().autoAdvance).toBe(false)
    expect(useTrackingStore.getState().trailLength).toBe(25)

    // Reset
    reset()

    // Verify all state is back to initial
    const state = useTrackingStore.getState()
    expect(state.dataPoints).toEqual([])
    expect(state.selectedPointId).toBeNull()
    expect(state.autoAdvance).toBe(true)
    expect(state.trailLength).toBe(10)
  })
})

describe('useTrackingStore undo/redo', () => {
  beforeEach(() => {
    useTrackingStore.getState().reset()
    clearHistory()
  })

  it('should undo adding a point', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)

    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
  })

  it('should redo after undo', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)

    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)

    redo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)
  })

  it('should preserve UI state when undoing data changes', () => {
    const { addPoint, setTrailLength } = useTrackingStore.getState()

    // First, change UI state
    setTrailLength(25)

    // Then make a data change
    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)
    expect(useTrackingStore.getState().trailLength).toBe(25)

    // Undo the data change - UI state should be preserved
    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
    expect(useTrackingStore.getState().trailLength).toBe(25) // UI state preserved
  })

  it('should undo multiple operations', () => {
    const { addPoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    addPoint({ frameNumber: 1, time: 0.033, pixelX: 110, pixelY: 210 })
    addPoint({ frameNumber: 2, time: 0.066, pixelX: 120, pixelY: 220 })

    expect(useTrackingStore.getState().dataPoints).toHaveLength(3)

    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(2)

    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(1)

    undo()
    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
  })
})
