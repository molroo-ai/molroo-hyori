/**
 * Gaze tracking utilities for Live2D.
 *
 * - Mouse tracking: normalizes cursor position to -1..1 range
 * - Gaze resolution: priority chain (camera > mouse > saccade)
 */

import type { CameraGaze } from '../face-tracking/jeeliz-adapter'

export interface ResolvedGaze {
  x: number
  y: number
}

/**
 * Resolve gaze from multiple sources with priority: camera > mouse.
 * Returns null if no source is active (fall through to saccade).
 */
export function resolveGaze(
  cameraGaze: CameraGaze | null,
  mouseGaze: { x: number; y: number } | null,
): ResolvedGaze | null {
  if (cameraGaze) {
    return { x: cameraGaze.eyeX, y: cameraGaze.eyeY }
  }
  if (mouseGaze) {
    return { x: mouseGaze.x, y: -mouseGaze.y }
  }
  return null
}

/**
 * Attach mouse-based gaze tracking to a container element.
 * Calls `onGaze` with normalized -1..1 coordinates or null on mouse leave.
 */
export function attachMouseGaze(
  container: HTMLElement,
  onGaze: (gaze: { x: number; y: number } | null) => void,
): () => void {
  function onMouseMove(e: MouseEvent) {
    const rect = container.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
    onGaze({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    })
  }

  function onMouseLeave() {
    onGaze(null)
  }

  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('mouseleave', onMouseLeave)

  return () => {
    container.removeEventListener('mousemove', onMouseMove)
    container.removeEventListener('mouseleave', onMouseLeave)
  }
}
