import type { Exp3Expression } from '../lib/live2d/exp3-engine'

export interface MotionDef {
  group: string
  index: number
  label: string
  duration?: number
}

export interface CharacterPackage {
  name: string
  modelUrl: string
  expressions: Record<string, Exp3Expression>
  motions: Record<string, MotionDef>
  /** Display config */
  display?: {
    scale?: number
    offsetY?: number
  }
}
