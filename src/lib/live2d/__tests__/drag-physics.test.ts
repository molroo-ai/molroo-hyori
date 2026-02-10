// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { attachDragPhysics, clamp, expFactor } from '../drag-physics'

function makeCanvas(width = 400, height = 400): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON() {} }) as DOMRect
  return canvas
}

function fire(canvas: HTMLCanvasElement, type: string, x: number, y: number) {
  canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }))
}

describe('clamp', () => {
  it('clamps to default -1..1 range', () => {
    expect(clamp(-2)).toBe(-1)
    expect(clamp(2)).toBe(1)
    expect(clamp(0.5)).toBe(0.5)
  })

  it('clamps to custom range', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
  })
})

describe('expFactor', () => {
  it('returns 0 for zero dt', () => {
    expect(expFactor(8, 0)).toBeCloseTo(0)
  })

  it('approaches 1 for large dt', () => {
    expect(expFactor(8, 10)).toBeCloseTo(1, 5)
  })

  it('returns intermediate value for typical frame', () => {
    const f = expFactor(8, 1 / 60)
    expect(f).toBeGreaterThan(0)
    expect(f).toBeLessThan(1)
  })
})

describe('attachDragPhysics', () => {
  let perfNowMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    let time = 1000
    perfNowMock = vi.spyOn(performance, 'now').mockImplementation(() => time)
    // Helper to advance time
    ;(globalThis as any).__advanceTime = (ms: number) => { time += ms }
  })

  afterEach(() => {
    perfNowMock.mockRestore()
    delete (globalThis as any).__advanceTime
  })

  function advanceTime(ms: number) {
    ;(globalThis as any).__advanceTime(ms)
  }

  it('returns null when no drag has occurred', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    const result = dp.update()
    expect(result).toBeNull()

    dp.cleanup()
  })

  it('returns rotation values during drag', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    // First update to establish baseline time
    dp.update()
    advanceTime(16)

    // Start drag at center-right of canvas (x=300 on 400px → normalized 0.5)
    fire(canvas, 'pointerdown', 300, 200)
    advanceTime(16)

    const result = dp.update()
    expect(result).not.toBeNull()
    expect(result!.weight).toBeGreaterThan(0)
    expect(result!.angleX).toBeGreaterThan(0)  // dragging right → positive angle

    dp.cleanup()
  })

  it('tracks pointer movement during drag', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    dp.update()
    advanceTime(16)

    fire(canvas, 'pointerdown', 200, 200) // center
    advanceTime(16)
    dp.update()
    advanceTime(16)

    fire(canvas, 'pointermove', 400, 200) // far right (normalized ~1.0)
    advanceTime(16)

    const result = dp.update()
    expect(result).not.toBeNull()
    expect(result!.angleX).toBeGreaterThan(0)

    dp.cleanup()
  })

  it('decays after pointer release', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    dp.update()
    advanceTime(16)

    fire(canvas, 'pointerdown', 300, 200)
    advanceTime(16)
    const during = dp.update()

    fire(canvas, 'pointerup', 300, 200)

    // Simulate many frames to let it decay
    let result = during
    for (let i = 0; i < 200; i++) {
      advanceTime(16)
      result = dp.update()
      if (result === null) break
    }

    expect(result).toBeNull()

    dp.cleanup()
  })

  it('resets on pointerleave', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    dp.update()
    advanceTime(16)

    fire(canvas, 'pointerdown', 300, 200)
    advanceTime(16)
    dp.update()

    fire(canvas, 'pointerleave', 300, 200)

    // Let it decay
    for (let i = 0; i < 200; i++) {
      advanceTime(16)
      if (dp.update() === null) break
    }

    expect(dp.update()).toBeNull()

    dp.cleanup()
  })

  it('respects custom headRange and bodyRange', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas, { headRange: 15, bodyRange: 5 })

    dp.update()
    advanceTime(16)

    // Drag to far right
    fire(canvas, 'pointerdown', 400, 200)

    // Run many updates to converge
    for (let i = 0; i < 60; i++) {
      advanceTime(16)
      dp.update()
    }

    advanceTime(16)
    const result = dp.update()
    expect(result).not.toBeNull()
    // With headRange=15, angleX should approach 15 (not 30)
    expect(Math.abs(result!.angleX)).toBeLessThanOrEqual(15)
    expect(Math.abs(result!.bodyAngleX)).toBeLessThanOrEqual(5)

    dp.cleanup()
  })

  it('cleanup removes event listeners', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    dp.cleanup()

    dp.update()
    advanceTime(16)

    fire(canvas, 'pointerdown', 300, 200)
    advanceTime(16)

    // After cleanup, drag events should not register
    const result = dp.update()
    expect(result).toBeNull()
  })

  it('inverts Y axis (drag down → negative angleY = look down)', () => {
    const canvas = makeCanvas()
    const dp = attachDragPhysics(canvas)

    dp.update()
    advanceTime(16)

    // Drag below center (y=300 on 400px → normalized 0.5)
    // angleY = -smoothY * headRange = -0.5 * 30 = -15 (look down)
    fire(canvas, 'pointerdown', 200, 300)

    for (let i = 0; i < 30; i++) {
      advanceTime(16)
      dp.update()
    }

    advanceTime(16)
    const result = dp.update()
    expect(result).not.toBeNull()
    expect(result!.angleY).toBeLessThan(0)

    dp.cleanup()
  })
})
