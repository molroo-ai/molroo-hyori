// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { attachGestureHandlers } from '../gestures'

function createMockModel(hitAreas: string[] = []) {
  return {
    hitTest: vi.fn(() => hitAreas),
  } as any
}

function createMockMotionManager() {
  return {
    startMotion: vi.fn(),
  }
}

function firePointerDown(canvas: HTMLCanvasElement, x: number, y: number) {
  canvas.dispatchEvent(new PointerEvent('pointerdown', {
    clientX: x,
    clientY: y,
    bubbles: true,
  }))
}

function firePointerUp(canvas: HTMLCanvasElement, x: number, y: number) {
  canvas.dispatchEvent(new PointerEvent('pointerup', {
    clientX: x,
    clientY: y,
    bubbles: true,
  }))
}

describe('attachGestureHandlers', () => {
  it('triggers Tap motion on short press + release (non-body)', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    firePointerDown(canvas, 100, 100)
    firePointerUp(canvas, 100, 100)

    expect(mm.startMotion).toHaveBeenCalledWith('Tap', expect.any(Number))
  })

  it('triggers Tap@Body when body is hit', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel(['Body'])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    firePointerDown(canvas, 100, 100)
    firePointerUp(canvas, 100, 100)

    expect(mm.startMotion).toHaveBeenCalledWith('Tap@Body', 0)
  })

  it('triggers FlickUp on upward swipe', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    // Fast upward swipe (dy = -50, well beyond FLICK_DIST=30)
    firePointerDown(canvas, 200, 250)
    firePointerUp(canvas, 200, 200)

    expect(mm.startMotion).toHaveBeenCalledWith('FlickUp', 0)
  })

  it('triggers FlickDown on downward swipe', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    firePointerDown(canvas, 200, 200)
    firePointerUp(canvas, 200, 250)

    expect(mm.startMotion).toHaveBeenCalledWith('FlickDown', 0)
  })

  it('triggers Flick on horizontal swipe (non-body)', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    firePointerDown(canvas, 200, 200)
    firePointerUp(canvas, 250, 200)

    expect(mm.startMotion).toHaveBeenCalledWith('Flick', 0)
  })

  it('triggers Flick@Body on horizontal swipe over body', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel(['Body'])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => false)

    firePointerDown(canvas, 200, 200)
    firePointerUp(canvas, 250, 200)

    expect(mm.startMotion).toHaveBeenCalledWith('Flick@Body', 0)
  })

  it('does nothing when disposed', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    attachGestureHandlers(canvas, model, mm, () => true)

    firePointerDown(canvas, 100, 100)
    firePointerUp(canvas, 100, 100)

    expect(mm.startMotion).not.toHaveBeenCalled()
  })

  it('cleanup removes event listeners', () => {
    const canvas = document.createElement('canvas')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 } as DOMRect)
    const model = createMockModel([])
    const mm = createMockMotionManager()

    const cleanup = attachGestureHandlers(canvas, model, mm, () => false)
    cleanup()

    firePointerDown(canvas, 100, 100)
    firePointerUp(canvas, 100, 100)

    expect(mm.startMotion).not.toHaveBeenCalled()
  })
})
