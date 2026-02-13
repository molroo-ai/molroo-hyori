/**
 * Tap / Flick gesture handlers for Live2D model interaction.
 *
 * Attaches pointer events to the canvas and dispatches
 * motion groups based on gesture type and hit area.
 */

import type { InternalModel } from 'pixi-live2d-display/cubism4'
import type { Live2DModel } from 'pixi-live2d-display/cubism4'

const FLICK_DIST = 30   // px — minimum drag to count as flick
const FLICK_TIME = 400  // ms — max duration for flick gesture

export function attachGestureHandlers(
  canvas: HTMLCanvasElement,
  model: Live2DModel<InternalModel>,
  motionManager: any,
  isDisposed: () => boolean,
): () => void {
  let pointerStart: { x: number; y: number; t: number } | null = null

  function onPointerDown(e: PointerEvent) {
    pointerStart = { x: e.clientX, y: e.clientY, t: performance.now() }
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointerStart || isDisposed()) return

    const dx = e.clientX - pointerStart.x
    const dy = e.clientY - pointerStart.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const elapsed = performance.now() - pointerStart.t
    pointerStart = null

    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const hitAreas = model.hitTest(sx, sy)
    const isBody = hitAreas.includes('Body')

    if (dist < FLICK_DIST && elapsed < FLICK_TIME) {
      // Tap
      if (isBody) {
        motionManager.startMotion('Tap@Body', 0)
      } else {
        motionManager.startMotion('Tap', Math.floor(Math.random() * 2))
      }
    } else if (elapsed < FLICK_TIME) {
      // Flick — determine direction
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDy > absDx && dy < 0) {
        motionManager.startMotion('FlickUp', 0)
      } else if (absDy > absDx && dy > 0) {
        motionManager.startMotion('FlickDown', 0)
      } else if (isBody) {
        motionManager.startMotion('Flick@Body', 0)
      } else {
        motionManager.startMotion('Flick', 0)
      }
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', onPointerUp)
  }
}
