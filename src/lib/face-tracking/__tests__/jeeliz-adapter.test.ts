// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createJeelizAdapter } from '../jeeliz-adapter'

function createMockJeelizAPI() {
  let trackCallback: ((state: any) => void) | null = null
  let readyCallback: ((err: string | false) => void) | null = null

  return {
    init: vi.fn((params: any) => {
      readyCallback = params.callbackReady
      trackCallback = params.callbackTrack
    }),
    destroy: vi.fn(),
    toggle_pause: vi.fn(),
    toggle_slow: vi.fn(),
    resize: vi.fn(),
    set_inputTexture: vi.fn(),
    // Test helpers
    _simulateReady(err: string | false = false) {
      readyCallback?.(err)
    },
    _simulateTrack(state: any) {
      trackCallback?.(state)
    },
  }
}

describe('createJeelizAdapter', () => {
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
  })

  afterEach(() => {
    delete (window as any).JEELIZFACEFILTER
  })

  it('starts in off status with no gaze', () => {
    const adapter = createJeelizAdapter()
    expect(adapter.getStatus()).toBe('off')
    expect(adapter.getGaze()).toBeNull()
  })

  it('rejects start when API is not loaded', async () => {
    const adapter = createJeelizAdapter()
    await expect(adapter.start(mockCanvas)).rejects.toThrow('JEELIZFACEFILTER not loaded')
    expect(adapter.getStatus()).toBe('error')
  })

  it('transitions to requesting then active on successful init', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)

    expect(adapter.getStatus()).toBe('requesting')

    mockAPI._simulateReady(false)
    await startPromise

    expect(adapter.getStatus()).toBe('active')
  })

  it('transitions to error on init failure', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)

    mockAPI._simulateReady('WEBCAM_UNAVAILABLE')

    await expect(startPromise).rejects.toThrow('Jeeliz init error: WEBCAM_UNAVAILABLE')
    expect(adapter.getStatus()).toBe('error')
  })

  it('maps head rotation to eye gaze', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)
    mockAPI._simulateReady(false)
    await startPromise

    mockAPI._simulateTrack({
      detected: 1,
      x: 0, y: 0, s: 1,
      rx: 0.2,   // pitch → eyeY
      ry: -0.3,  // yaw → eyeX (negated)
      rz: 0,
      expressions: [],
    })

    const gaze = adapter.getGaze()
    expect(gaze).not.toBeNull()
    // eyeX = -ry * 2.5 = 0.3 * 2.5 = 0.75
    expect(gaze!.eyeX).toBeCloseTo(0.75)
    // eyeY = rx * 2.0 = 0.2 * 2.0 = 0.4
    expect(gaze!.eyeY).toBeCloseTo(0.4)
  })

  it('returns null gaze when face not detected', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)
    mockAPI._simulateReady(false)
    await startPromise

    mockAPI._simulateTrack({
      detected: 0.2,
      x: 0, y: 0, s: 1,
      rx: 0.5, ry: 0.5, rz: 0,
      expressions: [],
    })

    expect(adapter.getGaze()).toBeNull()
  })

  it('clamps gaze values to -1..1', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)
    mockAPI._simulateReady(false)
    await startPromise

    // Large rotation values that would exceed -1..1
    mockAPI._simulateTrack({
      detected: 1,
      x: 0, y: 0, s: 1,
      rx: 2.0,  // 2.0 * 2.0 = 4.0 → clamped to 1
      ry: -2.0, // 2.0 * 2.5 = 5.0 → clamped to 1
      rz: 0,
      expressions: [],
    })

    const gaze = adapter.getGaze()
    expect(gaze!.eyeX).toBe(1)
    expect(gaze!.eyeY).toBe(1)
  })

  it('stop resets to off and clears gaze', async () => {
    const mockAPI = createMockJeelizAPI()
    ;(window as any).JEELIZFACEFILTER = mockAPI

    const adapter = createJeelizAdapter()
    const startPromise = adapter.start(mockCanvas)
    mockAPI._simulateReady(false)
    await startPromise

    mockAPI._simulateTrack({
      detected: 1,
      x: 0, y: 0, s: 1,
      rx: 0.1, ry: 0.1, rz: 0,
      expressions: [],
    })

    expect(adapter.getGaze()).not.toBeNull()

    adapter.stop()

    expect(adapter.getStatus()).toBe('off')
    expect(adapter.getGaze()).toBeNull()
    expect(mockAPI.destroy).toHaveBeenCalled()
  })
})
