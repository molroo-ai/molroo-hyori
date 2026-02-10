// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { attachMouseGaze, resolveGaze } from '../gaze'

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

describe('attachMouseGaze', () => {
  function createContainer(rect: { left: number; top: number; width: number; height: number }) {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON() {},
    })
    return el
  }

  it('calls onGaze with normalized coordinates on mousemove', () => {
    const container = createContainer({ left: 0, top: 0, width: 200, height: 100 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    // Center of container → (0, 0)
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    expect(onGaze).toHaveBeenCalledWith({ x: 0, y: 0 })
  })

  it('normalizes top-left corner to (-1, -1)', () => {
    const container = createContainer({ left: 0, top: 0, width: 200, height: 100 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }))
    expect(onGaze).toHaveBeenCalledWith({ x: -1, y: -1 })
  })

  it('normalizes bottom-right corner to (1, 1)', () => {
    const container = createContainer({ left: 0, top: 0, width: 200, height: 100 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }))
    expect(onGaze).toHaveBeenCalledWith({ x: 1, y: 1 })
  })

  it('clamps values beyond container bounds to -1..1', () => {
    const container = createContainer({ left: 100, top: 100, width: 200, height: 200 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    // Way beyond right edge
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 100 }))
    expect(onGaze).toHaveBeenCalledWith(
      expect.objectContaining({ x: 1, y: -1 }),
    )
  })

  it('calls onGaze with null on mouseleave', () => {
    const container = createContainer({ left: 0, top: 0, width: 200, height: 100 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    container.dispatchEvent(new MouseEvent('mouseleave'))
    expect(onGaze).toHaveBeenCalledWith(null)
  })

  it('returns cleanup that removes event listeners', () => {
    const container = createContainer({ left: 0, top: 0, width: 200, height: 100 })
    const onGaze = vi.fn()

    const cleanup = attachMouseGaze(container, onGaze)
    cleanup()

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    container.dispatchEvent(new MouseEvent('mouseleave'))
    expect(onGaze).not.toHaveBeenCalled()
  })

  it('handles container with offset position', () => {
    const container = createContainer({ left: 50, top: 25, width: 100, height: 100 })
    const onGaze = vi.fn()

    attachMouseGaze(container, onGaze)

    // Center of offset container
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 75 }))
    expect(onGaze).toHaveBeenCalledWith({ x: 0, y: 0 })
  })
})
