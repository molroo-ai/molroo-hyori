import { describe, expect, it, vi } from 'vitest'
import { interceptStartMotion, patchEyeBallCurves, patchIdleMotions } from '../motion-patches'

function makeMotion(curveIds: string[]) {
  return {
    _motionData: {
      curves: curveIds.map(id => ({ id })),
    },
  }
}

describe('patchEyeBallCurves', () => {
  it('prefixes ParamEyeBallX with underscore', () => {
    const motion = makeMotion(['ParamEyeBallX', 'ParamAngleX'])

    patchEyeBallCurves(motion)

    expect(motion._motionData.curves[0].id).toBe('_ParamEyeBallX')
    expect((motion._motionData.curves[0] as any)._originalId).toBe('ParamEyeBallX')
  })

  it('prefixes ParamEyeBallY with underscore', () => {
    const motion = makeMotion(['ParamEyeBallY'])

    patchEyeBallCurves(motion)

    expect(motion._motionData.curves[0].id).toBe('_ParamEyeBallY')
  })

  it('does not touch other curves', () => {
    const motion = makeMotion(['ParamAngleX', 'ParamBodyAngleZ'])

    patchEyeBallCurves(motion)

    expect(motion._motionData.curves[0].id).toBe('ParamAngleX')
    expect(motion._motionData.curves[1].id).toBe('ParamBodyAngleZ')
  })

  it('skips already-prefixed curves', () => {
    const motion = makeMotion(['_ParamEyeBallX'])

    patchEyeBallCurves(motion)

    expect(motion._motionData.curves[0].id).toBe('_ParamEyeBallX')
  })

  it('handles null/undefined motion gracefully', () => {
    expect(() => patchEyeBallCurves(null)).not.toThrow()
    expect(() => patchEyeBallCurves(undefined)).not.toThrow()
    expect(() => patchEyeBallCurves({})).not.toThrow()
  })
})

describe('patchIdleMotions', () => {
  it('patches all motions in the idle group', () => {
    const m1 = makeMotion(['ParamEyeBallX'])
    const m2 = makeMotion(['ParamEyeBallY'])

    const motionManager = {
      groups: { idle: 'Idle' },
      motionGroups: { Idle: [m1, m2] },
    }

    patchIdleMotions(motionManager)

    expect(m1._motionData.curves[0].id).toBe('_ParamEyeBallX')
    expect(m2._motionData.curves[0].id).toBe('_ParamEyeBallY')
  })

  it('does nothing when idle group is undefined', () => {
    const motionManager = {
      groups: {},
      motionGroups: {},
    }

    expect(() => patchIdleMotions(motionManager)).not.toThrow()
  })
})

describe('interceptStartMotion', () => {
  function createMotionManager() {
    return {
      groups: { idle: 'Idle' },
      motionGroups: {
        Idle: [makeMotion(['ParamEyeBallX'])],
        Tap: [makeMotion(['ParamAngleX'])],
      },
      startMotion: vi.fn((_group: string, _index: number, _priority?: number) => {
        return Promise.resolve()
      }),
    }
  }

  it('calls onNonIdleMotion for non-idle groups', () => {
    const mm = createMotionManager()
    const onNonIdle = vi.fn()

    interceptStartMotion(mm, onNonIdle)
    mm.startMotion('Tap', 0)

    expect(onNonIdle).toHaveBeenCalledWith('Tap', 0)
  })

  it('does not call onNonIdleMotion for idle group', () => {
    const mm = createMotionManager()
    const onNonIdle = vi.fn()

    interceptStartMotion(mm, onNonIdle)
    mm.startMotion('Idle', 0)

    expect(onNonIdle).not.toHaveBeenCalled()
  })

  it('patches idle motion curves after lazy load resolves', async () => {
    const mm = createMotionManager()
    const onNonIdle = vi.fn()

    interceptStartMotion(mm, onNonIdle)
    mm.startMotion('Idle', 0)

    // Wait for the Promise.resolve().then() to complete
    await new Promise(r => setTimeout(r, 0))

    expect(mm.motionGroups.Idle[0]._motionData.curves[0].id).toBe('_ParamEyeBallX')
  })

  it('passes through priority parameter to original', () => {
    const mm = createMotionManager()
    const originalFn = mm.startMotion

    interceptStartMotion(mm, vi.fn())
    mm.startMotion('Tap', 2, 3)

    expect(originalFn).toHaveBeenCalledWith('Tap', 2, 3)
  })

  it('returns the result from original startMotion', () => {
    const mm = createMotionManager()
    const expectedResult = Promise.resolve()
    mm.startMotion.mockReturnValue(expectedResult)

    interceptStartMotion(mm, vi.fn())
    const result = mm.startMotion('Tap', 0)

    expect(result).toBe(expectedResult)
  })
})
