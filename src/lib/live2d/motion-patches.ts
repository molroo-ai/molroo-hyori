/**
 * Motion manager patches for Live2D.
 *
 * - Disables EyeBall curves in idle motions so saccade/gaze can override
 * - Intercepts startMotion to patch lazy-loaded motions and track active state
 */

export function patchEyeBallCurves(motion: any): void {
  if (!motion?._motionData?.curves) return
  for (const curve of motion._motionData.curves) {
    if (!curve.id || curve.id.startsWith('_')) continue
    if (curve.id === 'ParamEyeBallX' || curve.id === 'ParamEyeBallY') {
      curve._originalId = curve.id
      curve.id = `_${curve.id}`
    }
  }
}

export function patchIdleMotions(motionManager: any): void {
  const idleGroup = motionManager.groups.idle
  if (!idleGroup) return
  motionManager.motionGroups[idleGroup]?.forEach(patchEyeBallCurves)
}

export function interceptStartMotion(
  motionManager: any,
  onNonIdleMotion: (group: string, index: number) => void,
): void {
  const idleGroupName = motionManager.groups.idle
  const original = motionManager.startMotion.bind(motionManager)

  ;(motionManager as any).startMotion = function (group: string, index: number, priority?: number) {
    const result = original(group, index, priority)

    if (group === idleGroupName) {
      Promise.resolve(result).then(() => {
        const motions = motionManager.motionGroups[group]
        if (motions?.[index]) patchEyeBallCurves(motions[index])
      })
    }

    if (group !== idleGroupName) {
      onNonIdleMotion(group, index)
    }

    return result
  }
}
