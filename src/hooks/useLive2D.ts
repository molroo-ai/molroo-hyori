import { useEffect, useRef, useState } from 'react'
import type { InternalModel } from 'pixi-live2d-display/cubism4'
import { Live2DFactory, Live2DModel } from 'pixi-live2d-display/cubism4'

import type { CharacterPackage } from '../characters/types'
import type { CameraTrackingStatus } from '../lib/face-tracking/jeeliz-adapter'
import { createJeelizAdapter } from '../lib/face-tracking/jeeliz-adapter'
import type { Exp3Expression } from '../lib/live2d/exp3-engine'
import { applyExp3Expression } from '../lib/live2d/exp3-engine'
import { attachMouseGaze, resolveGaze } from '../lib/live2d/gaze'
import { attachGestureHandlers } from '../lib/live2d/gestures'
import { interceptStartMotion, patchIdleMotions } from '../lib/live2d/motion-patches'
import { createLive2DIdleEyeFocus } from '../lib/live2d/saccade'

// Import zip-loader side effects
import '../lib/live2d/zip-loader'

export interface ActiveMotion {
  group: string
  index: number
}

export interface Live2DController {
  setExpression(name: string, weight?: number): void
  clearExpression(): void
  playMotion(group: string, index?: number): void
  setParameter(key: string, value: number): void
  getParameter(key: string): number | undefined
  getParameterNames(): string[]
  setHeadRotation(x: number, y: number, z?: number): void
  setBodyRotation(x: number, y?: number): void
  lookAt(x: number, y: number): void
  setMouthOpen(value: number): void
  setAutoSaccade(enabled: boolean): void
  setCameraTracking(enabled: boolean): void
  cameraTrackingStatus: CameraTrackingStatus
  isLoaded: boolean
  motionGroups: Record<string, number>
  activeMotion: ActiveMotion | null
}

export function useLive2D(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  character: CharacterPackage,
  jeelizCanvasRef?: React.RefObject<HTMLCanvasElement | null>,
): Live2DController {
  const [isLoaded, setIsLoaded] = useState(false)
  const [motionGroups, setMotionGroups] = useState<Record<string, number>>({})
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)
  const [cameraTrackingStatus, setCameraTrackingStatus] = useState<CameraTrackingStatus>('off')

  const jeelizRef = useRef(createJeelizAdapter())

  const controllerRef = useRef<{
    coreModel: any
    motionManager: any
    internalModel: InternalModel
    currentExpression: Exp3Expression | undefined
    currentExpressionWeight: number
    targetExpressionWeight: number
    autoSaccadeEnabled: boolean
    cameraTrackingEnabled: boolean
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.parentElement) return
    const container = canvas.parentElement!

    let disposed = false
    let app: any
    let live2DModel: Live2DModel<InternalModel>

    async function init() {
      const { Application } = await import('@pixi/app')
      const { extensions } = await import('@pixi/extensions')
      const { Ticker, TickerPlugin } = await import('@pixi/ticker')

      if (disposed) return

      extensions.add(TickerPlugin)

      const pixelRatio = globalThis.devicePixelRatio ?? 1
      app = new Application({
        view: canvas!,
        width: container.clientWidth,
        height: container.clientHeight,
        resolution: pixelRatio,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
      })

      Live2DModel.registerTicker(Ticker as any)

      live2DModel = new Live2DModel<InternalModel>()
      await Live2DFactory.setupLive2DModel(live2DModel, character.modelUrl, { autoInteract: false })

      if (disposed) {
        live2DModel.destroy()
        app.destroy()
        return
      }

      app.stage.addChild(live2DModel as any)
      const initialModelWidth = live2DModel.width
      const initialModelHeight = live2DModel.height
      live2DModel.anchor.set(0.5, 0.5)

      const scaleFactor = character.display?.scale ?? 2.2

      function setScaleAndPosition() {
        const width = container.clientWidth
        const height = container.clientHeight

        const heightScale = (height * 0.95 / initialModelHeight * scaleFactor)
        const widthScale = (width * 0.95 / initialModelWidth * scaleFactor)
        let scale = Math.min(heightScale, widthScale)

        if (Number.isNaN(scale) || scale <= 0) {
          scale = 1e-6
        }

        live2DModel.scale.set(scale, scale)
        live2DModel.x = width / 2
        live2DModel.y = height + (character.display?.offsetY ?? 0)
      }

      setScaleAndPosition()

      // --- Core references ---
      let mouseGaze: { x: number; y: number } | null = null
      const idleEyeFocus = createLive2DIdleEyeFocus()
      const internalModel = live2DModel.internalModel
      const motionManager = internalModel.motionManager
      const coreModel = internalModel.coreModel as any

      controllerRef.current = {
        coreModel,
        motionManager,
        internalModel,
        currentExpression: undefined,
        currentExpressionWeight: 0,
        targetExpressionWeight: 0,
        autoSaccadeEnabled: true,
        cameraTrackingEnabled: false,
      }

      // --- Motion patches ---
      patchIdleMotions(motionManager)
      interceptStartMotion(motionManager, (group, index) => {
        setActiveMotion({ group, index })
      })

      // --- Gaze + idle tracking (motionManager.update hook) ---
      const idleGroupName = motionManager.groups.idle
      const originalMotionUpdate = motionManager.update.bind(motionManager)
      let prevIsIdle = true

      motionManager.update = function (cm: any, now: number) {
        const result = originalMotionUpdate(cm, now)

        const isIdle = !motionManager.state.currentGroup
          || motionManager.state.currentGroup === idleGroupName

        const cameraGaze = controllerRef.current?.cameraTrackingEnabled
          ? jeelizRef.current.getGaze()
          : null

        const gaze = resolveGaze(cameraGaze, mouseGaze)
        if (gaze) {
          coreModel.setParameterValueById('ParamEyeBallX', gaze.x)
          coreModel.setParameterValueById('ParamEyeBallY', gaze.y)
        } else if (isIdle && controllerRef.current?.autoSaccadeEnabled) {
          idleEyeFocus.update(internalModel, now)
        }

        if (isIdle && !prevIsIdle) {
          setActiveMotion(null)
        }
        prevIsIdle = isIdle

        return result
      }

      // --- Expression blend (coreModel.update hook) ---
      const FADE_SPEED = 4
      const originalCoreUpdate = coreModel.update.bind(coreModel)
      let lastUpdateTime = 0

      coreModel.update = function () {
        const now = performance.now()
        const timeDelta = lastUpdateTime ? (now - lastUpdateTime) / 1000 : 0
        lastUpdateTime = now

        const ctrl = controllerRef.current
        if (ctrl) {
          if (ctrl.currentExpressionWeight !== ctrl.targetExpressionWeight) {
            if (ctrl.currentExpressionWeight < ctrl.targetExpressionWeight) {
              ctrl.currentExpressionWeight = Math.min(
                ctrl.targetExpressionWeight,
                ctrl.currentExpressionWeight + timeDelta * FADE_SPEED,
              )
            } else {
              ctrl.currentExpressionWeight = Math.max(
                ctrl.targetExpressionWeight,
                ctrl.currentExpressionWeight - timeDelta * FADE_SPEED,
              )
            }
          }

          if (ctrl.currentExpression && ctrl.currentExpressionWeight > 0) {
            applyExp3Expression(coreModel, ctrl.currentExpression, ctrl.currentExpressionWeight)
          }
        }

        originalCoreUpdate()
      }

      // --- Extract motion groups ---
      const defs = (motionManager as any).definitions ?? {}
      const groups: Record<string, number> = {}
      for (const [group, motions] of Object.entries(defs)) {
        groups[group] = (motions as any[]).length
      }
      setMotionGroups(groups)

      // --- Event handlers ---
      const cleanupGestures = attachGestureHandlers(
        canvas!, live2DModel, motionManager, () => disposed,
      )
      const cleanupMouse = attachMouseGaze(container, (g) => { mouseGaze = g })

      const resizeObserver = new ResizeObserver(() => {
        if (disposed) return
        app.renderer.resize(container.clientWidth, container.clientHeight)
        setScaleAndPosition()
      })
      resizeObserver.observe(container)

      setIsLoaded(true)

      return () => {
        resizeObserver.disconnect()
        cleanupGestures()
        cleanupMouse()
      }
    }

    let cleanupResize: (() => void) | undefined

    init().then(cleanup => {
      cleanupResize = cleanup
    })

    return () => {
      disposed = true
      cleanupResize?.()
      jeelizRef.current.stop()
      setCameraTrackingStatus('off')
      controllerRef.current = null
      setIsLoaded(false)
      if (live2DModel) {
        app?.stage?.removeChild(live2DModel as any)
        live2DModel.destroy()
      }
      app?.destroy()
    }
  }, [character.modelUrl])

  return {
    setExpression(name: string, weight = 1) {
      const ctrl = controllerRef.current
      if (!ctrl) return
      const expr = character.expressions[name]

      if (name === 'normal' || name === 'neutral' || !expr) {
        ctrl.targetExpressionWeight = 0
      } else {
        ctrl.currentExpression = expr
        ctrl.targetExpressionWeight = Math.max(0, Math.min(1, weight))
        ctrl.currentExpressionWeight = 0
      }
    },

    clearExpression() {
      const ctrl = controllerRef.current
      if (!ctrl) return
      ctrl.targetExpressionWeight = 0
    },

    playMotion(group: string, index = 0) {
      controllerRef.current?.motionManager.startMotion(group, index)
    },

    setParameter(key: string, value: number) {
      const cm = controllerRef.current?.coreModel
      if (!cm) return
      const idx = cm.getParameterIndex(key)
      if (idx >= 0) {
        cm.setParameterValueByIndex(idx, value)
      }
    },

    getParameter(key: string): number | undefined {
      const cm = controllerRef.current?.coreModel
      if (!cm) return undefined
      const idx = cm.getParameterIndex(key)
      if (idx < 0) return undefined
      return cm.getParameterValueByIndex(idx)
    },

    getParameterNames(): string[] {
      const cm = controllerRef.current?.coreModel
      if (!cm) return []
      const count = cm.getParameterCount?.() ?? 0
      const names: string[] = []
      for (let i = 0; i < count; i++) {
        const id = cm.getParameterIds?.()?.[i]
        if (id) names.push(id)
      }
      return names
    },

    setHeadRotation(x: number, y: number, z = 0) {
      const cm = controllerRef.current?.coreModel
      if (!cm) return
      cm.setParameterValueById('ParamAngleX', x)
      cm.setParameterValueById('ParamAngleY', y)
      cm.setParameterValueById('ParamAngleZ', z)
    },

    setBodyRotation(x: number, y = 0) {
      const cm = controllerRef.current?.coreModel
      if (!cm) return
      cm.setParameterValueById('ParamBodyAngleX', x)
      cm.setParameterValueById('ParamBodyAngleY', y)
    },

    lookAt(x: number, y: number) {
      const cm = controllerRef.current?.coreModel
      if (!cm) return
      cm.setParameterValueById('ParamEyeBallX', x)
      cm.setParameterValueById('ParamEyeBallY', y)
    },

    setMouthOpen(value: number) {
      const cm = controllerRef.current?.coreModel
      if (!cm) return
      cm.setParameterValueById('ParamMouthOpenY', Math.max(0, Math.min(1, value)))
    },

    setAutoSaccade(enabled: boolean) {
      if (controllerRef.current) {
        controllerRef.current.autoSaccadeEnabled = enabled
      }
    },

    setCameraTracking(enabled: boolean) {
      const ctrl = controllerRef.current
      if (!ctrl) return

      if (enabled) {
        const canvas = jeelizCanvasRef?.current
        if (!canvas) {
          setCameraTrackingStatus('error')
          return
        }
        ctrl.cameraTrackingEnabled = true
        setCameraTrackingStatus('requesting')
        jeelizRef.current.start(canvas).then(
          () => setCameraTrackingStatus('active'),
          () => {
            ctrl.cameraTrackingEnabled = false
            setCameraTrackingStatus('error')
          },
        )
      } else {
        ctrl.cameraTrackingEnabled = false
        jeelizRef.current.stop()
        setCameraTrackingStatus('off')
      }
    },

    cameraTrackingStatus,
    isLoaded,
    motionGroups,
    activeMotion,
  }
}
