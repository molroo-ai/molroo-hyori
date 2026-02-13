/**
 * Live2D Saccade — Idle eye focus animation
 *
 * Adapted from Project AIRI (https://github.com/moeru-ai/airi)
 * MIT License - Copyright (c) 2024-PRESENT Neko Ayaka
 */

import type { InternalModel } from 'pixi-live2d-display/cubism4'

import { lerp } from './math'
import { randomSaccadeInterval } from './saccade-timing'

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export interface Live2DSaccadeController {
  update(model: InternalModel, now: number): void
}

export function createLive2DIdleEyeFocus(): Live2DSaccadeController {
  let nextSaccadeAfter = -1
  let focusTarget: [number, number] | undefined
  let lastSaccadeAt = -1

  function update(model: InternalModel, now: number) {
    if (now >= nextSaccadeAfter || now < lastSaccadeAt) {
      focusTarget = [randFloat(-1, 1), randFloat(-1, 0.7)]
      lastSaccadeAt = now
      nextSaccadeAfter = now + (randomSaccadeInterval() / 1000)
      model.focusController.focus(focusTarget[0] * 0.5, focusTarget[1] * 0.5, false)
    }

    model.focusController.update(now - lastSaccadeAt)
    const coreModel = model.coreModel as any
    coreModel.setParameterValueById('ParamEyeBallX', lerp(coreModel.getParameterValueById('ParamEyeBallX'), focusTarget![0], 0.3))
    coreModel.setParameterValueById('ParamEyeBallY', lerp(coreModel.getParameterValueById('ParamEyeBallY'), focusTarget![1], 0.3))
  }

  return { update }
}
