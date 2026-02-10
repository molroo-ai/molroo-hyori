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
    <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 5 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      {!controller.isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#888',
            fontSize: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              border: '2px solid #333',
              borderTop: '2px solid #888',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Loading model…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </div>
  )
}
