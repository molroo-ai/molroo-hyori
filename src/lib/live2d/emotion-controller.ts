/**
 * Emotion Controller — Maps molroo API emotion data to Live2D expression commands.
 *
 * Three-layer approach:
 * 1. discrete_emotion.primary → expression name (most reliable)
 * 2. VAD coordinates → expression name (fallback)
 * 3. emotion_intensity + body_budget → weight modulation
 */

import type { TurnResultResponse, DiscreteEmotion, VAD } from '../api/types'
import type { Live2DController } from '../../hooks/useLive2D'
import { vadToExpression } from './vad-expression'

/**
 * molroo-core discrete emotion labels → Hyori expression names.
 * Core labels: joy, excitement, contentment, anger, fear, sadness,
 *              anxiety, surprise, disgust, trust, calm, shame, guilt, numbness
 */
const DISCRETE_TO_EXPRESSION: Record<string, string> = {
  joy: 'cheerful',
  excitement: 'excited',
  contentment: 'smile',
  anger: 'angry',
  fear: 'fear',
  sadness: 'sad',
  anxiety: 'frustrated',
  surprise: 'surprised',
  disgust: 'disgust',
  trust: 'smile',
  calm: 'relaxed',
  shame: 'shy',
  guilt: 'sad',
  numbness: 'sleepy',
}

/** Map discrete_emotion intensity string to a weight range */
function intensityToWeight(intensity: string): number {
  switch (intensity) {
    case 'high': return 0.85
    case 'medium': return 0.6
    case 'low': return 0.35
    default: return 0.5
  }
}

/** Modulate expression weight by body_budget (fatigue reduces expression vividness) */
function modulateByBudget(weight: number, bodyBudget: number): number {
  // body_budget [0.05, 1.0] — low budget dampens expression
  if (bodyBudget > 0.5) return weight
  // Linear dampening: budget 0.5 → 1x, budget 0.05 → 0.6x
  const factor = 0.6 + (bodyBudget / 0.5) * 0.4
  return weight * factor
}

export interface EmotionCommand {
  expression: string
  weight: number
  /** Apply sleepy overlay when body_budget is very low */
  fatigueOverlay: number
}

/**
 * Resolve the best expression + weight from a turn response.
 *
 * Priority:
 * 1. discrete_emotion.primary → direct name mapping + intensity weight
 * 2. VAD → vad-expression.ts range mapping (fallback)
 * 3. null if emotion is too neutral
 */
export function resolveExpression(
  discreteEmotion: DiscreteEmotion,
  vad: VAD,
  emotionIntensity: number,
  bodyBudget: number,
): EmotionCommand | null {
  let expressionName: string | null = null
  let weight: number

  // 1. Discrete emotion mapping (primary)
  const mapped = DISCRETE_TO_EXPRESSION[discreteEmotion.primary]
  if (mapped) {
    expressionName = mapped
    weight = intensityToWeight(discreteEmotion.intensity)
  } else {
    // 2. VAD fallback
    const vadResult = vadToExpression(vad)
    if (vadResult) {
      expressionName = vadResult.name
      weight = vadResult.weight
    } else {
      // Too neutral — clear expression
      return null
    }
  }

  // Blend emotion_intensity into weight (API intensity reflects distance from baseline)
  // emotion_intensity is [0, ~1], use it to scale the base weight
  weight = weight * (0.5 + emotionIntensity * 0.5)

  // Modulate by body_budget
  weight = modulateByBudget(weight, bodyBudget)

  // Clamp final weight
  weight = Math.min(1, Math.max(0.15, weight))

  // Fatigue overlay: very low body_budget adds sleepy layer
  const fatigueOverlay = bodyBudget < 0.3
    ? (0.3 - bodyBudget) / 0.25 * 0.4  // 0 at 0.3, 0.4 at 0.05
    : 0

  return { expression: expressionName, weight, fatigueOverlay }
}

/**
 * Apply a turn response to a Live2D controller.
 * Call this after each API turn to update the character's expression.
 */
export function applyEmotionToLive2D(
  controller: Live2DController,
  turnResponse: TurnResultResponse,
): void {
  const cmd = resolveExpression(
    turnResponse.discrete_emotion,
    turnResponse.new_emotion,
    turnResponse.emotion_intensity,
    turnResponse.body_budget,
  )

  if (cmd) {
    controller.setExpression(cmd.expression, cmd.weight)
  } else {
    controller.clearExpression()
  }
}
