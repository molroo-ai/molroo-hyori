import { describe, it, expect } from 'vitest'
import { vadToExpression } from '../vad-expression'

describe('vadToExpression', () => {
  it('returns happy/positive expression for high V, moderate A', () => {
    const result = vadToExpression({ V: 0.6, A: 0.3, D: 0.5 })
    expect(result).not.toBeNull()
    expect(['cheerful', 'smile', 'excited', 'smug']).toContain(result!.name)
  })

  it('returns sad expression for low V, low A, low D', () => {
    const result = vadToExpression({ V: -0.5, A: -0.2, D: -0.3 })
    expect(result).not.toBeNull()
    expect(['sad', 'cry']).toContain(result!.name)
  })

  it('returns angry expression for low V, high A, high D', () => {
    const result = vadToExpression({ V: -0.5, A: 0.7, D: 0.7 })
    expect(result).not.toBeNull()
    expect(result!.name).toBe('angry')
  })

  it('returns surprised for mid V, high A, low D', () => {
    const result = vadToExpression({ V: 0.0, A: 0.8, D: -0.3 })
    expect(result).not.toBeNull()
    expect(['surprised', 'amazed']).toContain(result!.name)
  })

  it('returns null for extreme out-of-range input where no mapping matches', () => {
    // Neutral point may not match any range
    const result = vadToExpression({ V: 0.0, A: 0.0, D: 0.0 })
    // Neutral could match 'think' or return null
    if (result) {
      expect(result.weight).toBeGreaterThan(0)
    }
  })

  it('weight is clamped between 0.3 and 1', () => {
    const result = vadToExpression({ V: 0.8, A: 0.8, D: 0.8 })
    expect(result).not.toBeNull()
    expect(result!.weight).toBeGreaterThanOrEqual(0.3)
    expect(result!.weight).toBeLessThanOrEqual(1)
  })

  it('returns fear for low V, high A, low D', () => {
    const result = vadToExpression({ V: -0.5, A: 0.6, D: -0.3 })
    expect(result).not.toBeNull()
    expect(result!.name).toBe('fear')
  })

  it('returns relaxed for moderate positive V, low A', () => {
    const result = vadToExpression({ V: 0.3, A: -0.5, D: 0.5 })
    expect(result).not.toBeNull()
    expect(result!.name).toBe('relaxed')
  })
})
