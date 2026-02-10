import { describe, expect, it } from 'vitest'
import { randomSaccadeInterval } from '../saccade-timing'

describe('randomSaccadeInterval', () => {
  it('returns a positive number', () => {
    for (let i = 0; i < 100; i++) {
      const interval = randomSaccadeInterval()
      expect(interval).toBeGreaterThan(0)
    }
  })

  it('returns values within a reasonable range (0..5000ms)', () => {
    for (let i = 0; i < 200; i++) {
      const interval = randomSaccadeInterval()
      expect(interval).toBeGreaterThanOrEqual(0)
      expect(interval).toBeLessThan(5000)
    }
  })

  it('produces varying values (not constant)', () => {
    const values = new Set<number>()
    for (let i = 0; i < 50; i++) {
      values.add(Math.round(randomSaccadeInterval()))
    }
    expect(values.size).toBeGreaterThan(1)
  })
})
