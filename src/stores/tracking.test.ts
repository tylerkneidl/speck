import { describe, it, expect, beforeEach } from 'vitest'
import { useTrackingStore } from './tracking'

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
    const pointId = useTrackingStore.getState().dataPoints[0].id

    deletePoint(pointId)

    expect(useTrackingStore.getState().dataPoints).toHaveLength(0)
  })

  it('should update a data point position', () => {
    const { addPoint, updatePoint } = useTrackingStore.getState()

    addPoint({ frameNumber: 0, time: 0, pixelX: 100, pixelY: 200 })
    const pointId = useTrackingStore.getState().dataPoints[0].id

    updatePoint(pointId, { x: 150, y: 250 })

    const point = useTrackingStore.getState().dataPoints[0]
    expect(point.pixelX).toBe(150)
    expect(point.pixelY).toBe(250)
  })
})
