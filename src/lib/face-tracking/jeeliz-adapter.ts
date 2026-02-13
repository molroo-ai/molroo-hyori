/**
 * Jeeliz FaceFilter adapter — camera-based face tracking
 *
 * Maps head rotation (yaw/pitch) to eye gaze values (-1..1).
 * Requires the Jeeliz FaceFilter CDN script loaded in index.html.
 */

export type CameraTrackingStatus = 'off' | 'requesting' | 'active' | 'error'

export interface CameraGaze {
  eyeX: number
  eyeY: number
}

export interface JeelizAdapter {
  start(canvas: HTMLCanvasElement): Promise<void>
  stop(): void
  getGaze(): CameraGaze | null
  getStatus(): CameraTrackingStatus
}

const NN_PATH = 'https://cdn.jsdelivr.net/gh/jeeliz/jeelizFaceFilter@master/neuralNets/'

// Sensitivity multipliers for head rotation → eye gaze mapping
const YAW_SENSITIVITY = 2.5
const PITCH_SENSITIVITY = 2.0

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function createJeelizAdapter(): JeelizAdapter {
  let status: CameraTrackingStatus = 'off'
  let currentGaze: CameraGaze | null = null

  function start(canvas: HTMLCanvasElement): Promise<void> {
    const api = window.JEELIZFACEFILTER
    if (!api) {
      status = 'error'
      return Promise.reject(new Error('JEELIZFACEFILTER not loaded'))
    }

    status = 'requesting'

    return new Promise<void>((resolve, reject) => {
      api.init({
        canvas,
        NNCPath: NN_PATH,
        videoSettings: {
          idealWidth: 320,
          idealHeight: 240,
          maxWidth: 320,
          maxHeight: 240,
          facingMode: 'user',
        },
        callbackReady(errCode) {
          if (errCode) {
            status = 'error'
            currentGaze = null
            reject(new Error(`Jeeliz init error: ${errCode}`))
          } else {
            status = 'active'
            resolve()
          }
        },
        callbackTrack(detectState) {
          if (detectState.detected < 0.5) {
            currentGaze = null
            return
          }
          // ry = yaw (left/right), rx = pitch (up/down)
          // Map head rotation to eye gaze, mirrored for natural feel
          const eyeX = clamp(-detectState.ry * YAW_SENSITIVITY, -1, 1)
          const eyeY = clamp(detectState.rx * PITCH_SENSITIVITY, -1, 1)
          currentGaze = { eyeX, eyeY }
        },
      })
    })
  }

  function stop() {
    const api = window.JEELIZFACEFILTER
    if (api && status === 'active') {
      api.destroy()
    }
    status = 'off'
    currentGaze = null
  }

  function getGaze(): CameraGaze | null {
    return currentGaze
  }

  function getStatus(): CameraTrackingStatus {
    return status
  }

  return { start, stop, getGaze, getStatus }
}
