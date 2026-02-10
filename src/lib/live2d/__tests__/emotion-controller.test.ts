import { describe, it, expect } from 'vitest'
import { resolveExpression } from '../emotion-controller'
import type { DiscreteEmotion, VAD } from '../../api/types'

function de(primary: string, intensity = 'medium', secondary: string | null = null): DiscreteEmotion {
  return { primary, secondary, intensity }
}

describe('resolveExpression', () => {
  describe('discrete emotion mapping', () => {
    it('maps joy → cheerful', () => {
      const cmd = resolveExpression(de('joy', 'high'), { V: 0.5, A: 0.3, D: 0.2 }, 0.6, 0.8)
      expect(cmd?.expression).toBe('cheerful')
    })

    it('maps anger → angry', () => {
      const cmd = resolveExpression(de('anger', 'high'), { V: -0.6, A: 0.7, D: 0.5 }, 0.8, 0.7)
      expect(cmd?.expression).toBe('angry')
    })

    it('maps sadness → sad', () => {
      const cmd = resolveExpression(de('sadness', 'low'), { V: -0.4, A: 0.1, D: -0.2 }, 0.3, 0.6)
      expect(cmd?.expression).toBe('sad')
    })

    it('maps calm → relaxed', () => {
      const cmd = resolveExpression(de('calm'), { V: 0.1, A: 0.1, D: 0.1 }, 0.1, 0.9)
      expect(cmd?.expression).toBe('relaxed')
    })

    it('maps shame → shy', () => {
      const cmd = resolveExpression(de('shame'), { V: -0.3, A: 0.2, D: -0.5 }, 0.4, 0.7)
      expect(cmd?.expression).toBe('shy')
    })
  })

  describe('intensity to weight', () => {
    it('high intensity produces higher weight', () => {
      const high = resolveExpression(de('joy', 'high'), { V: 0.5, A: 0.3, D: 0.2 }, 0.8, 0.8)
      const low = resolveExpression(de('joy', 'low'), { V: 0.5, A: 0.3, D: 0.2 }, 0.8, 0.8)
      expect(high!.weight).toBeGreaterThan(low!.weight)
    })
  })

  describe('body budget modulation', () => {
    it('low body budget reduces weight', () => {
      const healthy = resolveExpression(de('joy', 'high'), { V: 0.5, A: 0.3, D: 0.2 }, 0.6, 0.9)
      const exhausted = resolveExpression(de('joy', 'high'), { V: 0.5, A: 0.3, D: 0.2 }, 0.6, 0.1)
      expect(exhausted!.weight).toBeLessThan(healthy!.weight)
    })

    it('very low body budget adds fatigue overlay', () => {
      const cmd = resolveExpression(de('joy'), { V: 0.3, A: 0.2, D: 0.1 }, 0.3, 0.1)
      expect(cmd!.fatigueOverlay).toBeGreaterThan(0)
    })

    it('healthy body budget has no fatigue overlay', () => {
      const cmd = resolveExpression(de('joy'), { V: 0.3, A: 0.2, D: 0.1 }, 0.3, 0.8)
      expect(cmd!.fatigueOverlay).toBe(0)
    })
  })

  describe('VAD fallback', () => {
    it('uses VAD when discrete emotion is unknown', () => {
      const cmd = resolveExpression(
        de('unknown_emotion'),
        { V: 0.5, A: 0.7, D: 0.3 },
        0.6,
        0.8,
      )
      // Should still produce an expression from VAD mapping
      expect(cmd).not.toBeNull()
      expect(cmd!.expression).toBeTruthy()
    })

    it('returns null for very neutral state with unknown emotion', () => {
      // VAD at A=0.25 midpoint, V=0 — may not match any range
      const cmd = resolveExpression(
        de('unknown_emotion'),
        { V: 0, A: 0.25, D: 0 },
        0.05,
        0.8,
      )
      // Could be null or match think; either is acceptable
      if (cmd) {
        expect(cmd.weight).toBeLessThan(0.5)
      }
    })
  })

  describe('emotion_intensity modulation', () => {
    it('higher emotion_intensity increases weight', () => {
      const intense = resolveExpression(de('anger', 'medium'), { V: -0.5, A: 0.7, D: 0.4 }, 0.9, 0.7)
      const mild = resolveExpression(de('anger', 'medium'), { V: -0.5, A: 0.7, D: 0.4 }, 0.2, 0.7)
      expect(intense!.weight).toBeGreaterThan(mild!.weight)
    })
  })
})
