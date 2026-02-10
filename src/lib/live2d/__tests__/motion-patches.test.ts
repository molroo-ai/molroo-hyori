import { describe, expect, it } from 'vitest'
import { patchEyeBallCurves, patchIdleMotions } from '../motion-patches'

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
