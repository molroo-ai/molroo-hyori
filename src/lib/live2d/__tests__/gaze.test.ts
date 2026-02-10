import { describe, expect, it } from 'vitest'
import { resolveGaze } from '../gaze'

describe('resolveGaze', () => {
  it('returns camera gaze when both camera and mouse are available', () => {
    const camera = { eyeX: 0.5, eyeY: -0.3 }
    const mouse = { x: -0.2, y: 0.8 }
    const result = resolveGaze(camera, mouse)

    expect(result).toEqual({ x: 0.5, y: -0.3 })
  })

  it('returns mouse gaze with inverted Y when camera is null', () => {
    const mouse = { x: 0.7, y: 0.4 }
    const result = resolveGaze(null, mouse)

    expect(result).toEqual({ x: 0.7, y: -0.4 })
  })

  it('returns null when both sources are null (fall through to saccade)', () => {
    expect(resolveGaze(null, null)).toBeNull()
  })

  it('ignores mouse when camera gaze is available', () => {
    const camera = { eyeX: 0, eyeY: 0 }
    const mouse = { x: 1, y: 1 }
    const result = resolveGaze(camera, mouse)

    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('handles extreme camera values', () => {
    const camera = { eyeX: -1, eyeY: 1 }
    const result = resolveGaze(camera, null)

    expect(result).toEqual({ x: -1, y: 1 })
  })
})
