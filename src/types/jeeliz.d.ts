/** Jeeliz FaceFilter type declarations */

interface JeelizRotation {
  /** Pitch (up/down) in radians */
  rx: number
  /** Yaw (left/right) in radians */
  ry: number
  /** Roll (tilt) in radians */
  rz: number
}

interface JeelizDetectState {
  detected: number
  x: number
  y: number
  s: number
  rx: number
  ry: number
  rz: number
  expressions: number[]
}

interface JeelizInitParams {
  canvasId?: string
  canvas?: HTMLCanvasElement
  NNCPath?: string
  callbackReady: (errCode: string | false) => void
  callbackTrack: (detectState: JeelizDetectState) => void
  videoSettings?: {
    idealWidth?: number
    idealHeight?: number
    maxWidth?: number
    maxHeight?: number
    facingMode?: string
  }
}

interface JeelizFaceFilterAPI {
  init: (params: JeelizInitParams) => void
  destroy: () => void
  toggle_pause: (isPaused: boolean) => void
  toggle_slow: (isSlow: boolean) => void
  resize: () => void
  set_inputTexture: (texture: WebGLTexture, width: number, height: number) => void
}

declare const JEEFACEFILTERAPI: JeelizFaceFilterAPI

interface Window {
  JEEFACEFILTERAPI: JeelizFaceFilterAPI
}
