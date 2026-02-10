import { useEffect, useRef } from 'react'
import type { CharacterPackage } from '../characters/types'
import type { ActiveMotion, Live2DController } from '../hooks/useLive2D'
import { useLive2D } from '../hooks/useLive2D'

interface Live2DViewerProps {
  character: CharacterPackage
  onReady?: (controller: Live2DController) => void
  onActiveMotionChange?: (motion: ActiveMotion | null) => void
}

export function Live2DViewer({ character, onReady, onActiveMotionChange }: Live2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controller = useLive2D(canvasRef, character)
  const notifiedRef = useRef(false)

  if (controller.isLoaded && !notifiedRef.current) {
    notifiedRef.current = true
    onReady?.(controller)
  }

  useEffect(() => {
    onActiveMotionChange?.(controller.activeMotion)
  }, [controller.activeMotion])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
