import { describe, it, expect } from 'vitest'
import { generateCSV } from './export'

describe('generateCSV', () => {
  it('should generate CSV with headers', () => {
    const data = [
      { time: 0, x: 1, y: 2 },
      { time: 1, x: 3, y: 4 },
    ]
    const columns = ['time', 'x', 'y'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('time,x,y')
    expect(csv).toContain('0,1,2')
    expect(csv).toContain('1,3,4')
  })

  it('should handle null values', () => {
    const data = [{ time: 0, x: 1, y: null }]
    const columns = ['time', 'x', 'y'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('0,1,')
  })

  it('should handle undefined values', () => {
    const data = [{ time: 0, x: 1, y: undefined }]
    const columns = ['time', 'x', 'y'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('0,1,')
  })

  it('should escape commas in values', () => {
    const data = [{ name: 'Hello, World', value: 1 }]
    const columns = ['name', 'value'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('"Hello, World"')
  })

  it('should escape quotes in values', () => {
    const data = [{ name: 'Say "Hello"', value: 1 }]
    const columns = ['name', 'value'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('"Say ""Hello"""')
  })

  it('should escape newlines in values', () => {
    const data = [{ name: 'Line1\nLine2', value: 1 }]
    const columns = ['name', 'value'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('"Line1\nLine2"')
  })

  it('should handle empty data array', () => {
    const data: { time: number; x: number }[] = []
    const columns = ['time', 'x'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toBe('time,x')
  })

  it('should handle numeric precision', () => {
    const data = [{ time: 0.123456789, x: 1.5 }]
    const columns = ['time', 'x'] as const

    const csv = generateCSV(data, [...columns])

    expect(csv).toContain('0.123456789')
    expect(csv).toContain('1.5')
  })
})
