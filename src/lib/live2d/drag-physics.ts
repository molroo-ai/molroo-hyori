/**
 * Drag-based physics interaction for Live2D model.
 *
 * Tracks pointer drag on canvas and computes smoothed
 * head/body rotation values. The head movement triggers
 * natural physics reactions in hair and accessories.
 *
 * Pattern: attachXxx(deps) → cleanup function
 */

export interface DragResult {
  angleX: number
  angleY: number
  bodyAngleX: number
  /** Blend weight 0..1 for mixing with motion-driven values */
  weight: number
}

export interface DragPhysics {
  /** Call each frame. Returns rotation offsets or null when inactive. */
  update(): DragResult | null
  cleanup(): void
}

const ENGAGE_SPEED = 10
const RELEASE_SPEED = 3
const DRAG_TRACK_SPEED = 8
const RETURN_TRACK_SPEED = 4
const WEIGHT_THRESHOLD = 0.001

export function attachDragPhysics(
  canvas: HTMLCanvasElement,
  options?: { headRange?: number; bodyRange?: number },
): DragPhysics {
  const headRange = options?.headRange ?? 30
  const bodyRange = options?.bodyRange ?? 10

  let targetX = 0
  let targetY = 0
  let smoothX = 0
  let smoothY = 0
  let weight = 0
  let dragging = false
  let lastTime = 0

  function onPointerDown(e: PointerEvent) {
    dragging = true
    setTarget(e)
  }

  function onPointerMove(e: PointerEvent) {
    if (dragging) setTarget(e)
  }

  function onPointerUp() {
    dragging = false
    targetX = 0
    targetY = 0
  }

  function setTarget(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    targetX = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1)
    targetY = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  return {
    update(): DragResult | null {
      const now = performance.now()
      const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60
      lastTime = now

      const wSpeed = dragging ? ENGAGE_SPEED : RELEASE_SPEED
      weight += (Number(dragging) - weight) * expFactor(wSpeed, dt)

      const pSpeed = dragging ? DRAG_TRACK_SPEED : RETURN_TRACK_SPEED
      const pf = expFactor(pSpeed, dt)
      smoothX += (targetX - smoothX) * pf
      smoothY += (targetY - smoothY) * pf

      if (weight < WEIGHT_THRESHOLD) {
        weight = 0
        smoothX = 0
        smoothY = 0
        lastTime = 0
        return null
      }

      return {
        angleX: smoothX * headRange,
        angleY: -smoothY * headRange,
        bodyAngleX: smoothX * bodyRange,
        weight,
      }
    },

    cleanup() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
    },
  }
}

/** Exponential smoothing factor — frame-rate independent. */
export function expFactor(speed: number, dt: number): number {
  return 1 - Math.exp(-speed * dt)
}

export function clamp(v: number, min = -1, max = 1): number {
  return Math.max(min, Math.min(max, v))
}
