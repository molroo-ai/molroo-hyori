import { useEffect, useRef, useState } from 'react'
import type { InternalModel } from 'pixi-live2d-display/cubism4'
import { Live2DFactory, Live2DModel } from 'pixi-live2d-display/cubism4'

import type { CharacterPackage } from '../characters/types'
import type { Exp3Expression } from '../lib/live2d/exp3-engine'
import { applyExp3Expression } from '../lib/live2d/exp3-engine'
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
  isLoaded: boolean
  motionGroups: Record<string, number>
  activeMotion: ActiveMotion | null
}

export function useLive2D(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  character: CharacterPackage,
): Live2DController {
  const [isLoaded, setIsLoaded] = useState(false)
  const [motionGroups, setMotionGroups] = useState<Record<string, number>>({})
  const [activeMotion, setActiveMotion] = useState<ActiveMotion | null>(null)

  // Mutable refs for internal state
  const controllerRef = useRef<{
    coreModel: any
    motionManager: any
    internalModel: InternalModel
    currentExpression: Exp3Expression | undefined
    currentExpressionWeight: number
    targetExpressionWeight: number
    autoSaccadeEnabled: boolean
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

      // Core references
      const idleEyeFocus = createLive2DIdleEyeFocus()
      const internalModel = live2DModel.internalModel
      const motionManager = internalModel.motionManager
      const coreModel = internalModel.coreModel as any

      // Store controller state
      controllerRef.current = {
        coreModel,
        motionManager,
        internalModel,
        currentExpression: undefined,
        currentExpressionWeight: 0,
        targetExpressionWeight: 0,
        autoSaccadeEnabled: true,
      }

      // EyeBall curve patching (saccade only)
      function patchEyeBallCurves(motion: any) {
        if (!motion?._motionData?.curves) return
        for (const curve of motion._motionData.curves) {
          if (!curve.id || curve.id.startsWith('_')) continue
          if (curve.id === 'ParamEyeBallX' || curve.id === 'ParamEyeBallY') {
            curve._originalId = curve.id
            curve.id = `_${curve.id}`
          }
        }
      }

      function patchAllIdleMotions() {
        const idleGroup = motionManager.groups.idle
        if (!idleGroup) return
        motionManager.motionGroups[idleGroup]?.forEach(patchEyeBallCurves)
      }

      patchAllIdleMotions()

      // Intercept startMotion to patch lazy-loaded idle motions + track active motion
      const idleGroupName = motionManager.groups.idle
      const originalStartMotion = motionManager.startMotion.bind(motionManager)
      ;(motionManager as any).startMotion = function (group: string, index: number, priority?: number) {
        const result = originalStartMotion(group, index, priority)
        if (group === idleGroupName) {
          Promise.resolve(result).then(() => {
            const motions = motionManager.motionGroups[group]
            if (motions?.[index]) {
              patchEyeBallCurves(motions[index])
            }
          })
        }
        // Track non-idle motion as active
        if (group !== idleGroupName) {
          setActiveMotion({ group, index })
        }
        return result
      }

      // Saccade hook + active motion tracking
      const originalMotionUpdate = motionManager.update.bind(motionManager)
      let prevIsIdle = true
      motionManager.update = function (cm: any, now: number) {
        const result = originalMotionUpdate(cm, now)

        const isIdle = !motionManager.state.currentGroup
          || motionManager.state.currentGroup === idleGroupName
        if (isIdle && controllerRef.current?.autoSaccadeEnabled) {
          idleEyeFocus.update(internalModel, now)
        }

        // Detect transition to idle → clear active motion
        if (isIdle && !prevIsIdle) {
          setActiveMotion(null)
        }
        prevIsIdle = isIdle

        return result
      }

      // Expression system (exp3 Add blend)
      const FADE_SPEED = 4
      const originalCoreUpdate = coreModel.update.bind(coreModel)
      let lastUpdateTime = 0

      coreModel.update = function () {
        const now = performance.now()
        const timeDelta = lastUpdateTime ? (now - lastUpdateTime) / 1000 : 0
        lastUpdateTime = now

        const ctrl = controllerRef.current
        if (ctrl) {
          // Fade expression weight toward target
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

          // Apply expression deltas on top of motion-set values
          if (ctrl.currentExpression && ctrl.currentExpressionWeight > 0) {
            applyExp3Expression(coreModel, ctrl.currentExpression, ctrl.currentExpressionWeight)
          }
        }

        originalCoreUpdate()
      }

      // Extract motion groups
      const defs = (motionManager as any).definitions ?? {}
      const groups: Record<string, number> = {}
      for (const [group, motions] of Object.entries(defs)) {
        groups[group] = (motions as any[]).length
      }
      setMotionGroups(groups)

      // --- Tap / Flick interaction ---
      const FLICK_DIST = 30      // px — minimum drag to count as flick
      const FLICK_TIME = 400     // ms — max duration for flick gesture
      let pointerStart: { x: number; y: number; t: number } | null = null

      function onPointerDown(e: PointerEvent) {
        pointerStart = { x: e.clientX, y: e.clientY, t: performance.now() }
      }

      function onPointerUp(e: PointerEvent) {
        if (!pointerStart || disposed) return

        const dx = e.clientX - pointerStart.x
        const dy = e.clientY - pointerStart.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const elapsed = performance.now() - pointerStart.t
        pointerStart = null

        const rect = canvas!.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const hitAreas = live2DModel.hitTest(sx, sy)
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

      canvas!.addEventListener('pointerdown', onPointerDown)
      canvas!.addEventListener('pointerup', onPointerUp)

      // Resize observer — watch container, not canvas (Pixi overrides canvas size)
      const resizeObserver = new ResizeObserver(() => {
        if (disposed) return
        app.renderer.resize(container.clientWidth, container.clientHeight)
        setScaleAndPosition()
      })
      resizeObserver.observe(container)

      setIsLoaded(true)

      // Cleanup on unmount stored in the dispose closure
      return () => {
        resizeObserver.disconnect()
        canvas!.removeEventListener('pointerdown', onPointerDown)
        canvas!.removeEventListener('pointerup', onPointerUp)
      }
    }

    let cleanupResize: (() => void) | undefined

    init().then(cleanup => {
      cleanupResize = cleanup
    })

    return () => {
      disposed = true
      cleanupResize?.()
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

    isLoaded,
    motionGroups,
    activeMotion,
  }
}
