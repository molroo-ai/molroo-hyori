/**
 * Drag-based physics interaction for Live2D model.
 *
 * Two-pronged approach for maximum visual feedback:
 * 1. Head/body rotation — blended with motion values via weight
 * 2. Direct wind force on physics rig — makes hair/accessories sway
 *
 * Pattern: attachXxx(deps) → cleanup function
 */

export interface DragResult {
  angleX: number
  angleY: number
  bodyAngleX: number
  /** Blend weight 0..1 for mixing with motion-driven values */
  weight: number
  /** Wind force vector for direct physics rig control */
  windX: number
  windY: number
}

export interface DragPhysics {
  /** Call each frame. Returns rotation + wind offsets or null when inactive. */
  update(): DragResult | null
  cleanup(): void
}

const ENGAGE_SPEED = 10
const RELEASE_SPEED = 3
const DRAG_TRACK_SPEED = 8
const RETURN_TRACK_SPEED = 4
const WEIGHT_THRESHOLD = 0.001
const WIND_STRENGTH = 8

export function attachDragPhysics(
  canvas: HTMLCanvasElement,
  options?: { headRange?: number; bodyRange?: number; windStrength?: number },
): DragPhysics {
  const headRange = options?.headRange ?? 50
  const bodyRange = options?.bodyRange ?? 15
  const windStrength = options?.windStrength ?? WIND_STRENGTH

  let targetX = 0
  let targetY = 0
  let smoothX = 0
  let smoothY = 0
  let prevSmoothX = 0
  let prevSmoothY = 0
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

      prevSmoothX = smoothX
      prevSmoothY = smoothY

      const pSpeed = dragging ? DRAG_TRACK_SPEED : RETURN_TRACK_SPEED
      const pf = expFactor(pSpeed, dt)
      smoothX += (targetX - smoothX) * pf
      smoothY += (targetY - smoothY) * pf

      if (weight < WEIGHT_THRESHOLD) {
        weight = 0
        smoothX = 0
        smoothY = 0
        prevSmoothX = 0
        prevSmoothY = 0
        lastTime = 0
        return null
      }

      // Wind from drag velocity (delta / dt) — capped to prevent spikes
      const vx = dt > 0 ? (smoothX - prevSmoothX) / dt : 0
      const vy = dt > 0 ? (smoothY - prevSmoothY) / dt : 0

      return {
        angleX: smoothX * headRange,
        angleY: -smoothY * headRange,
        bodyAngleX: smoothX * bodyRange,
        weight,
        windX: clamp(vx * windStrength, -windStrength, windStrength),
        windY: clamp(vy * windStrength, -windStrength, windStrength),
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
