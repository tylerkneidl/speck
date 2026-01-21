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
