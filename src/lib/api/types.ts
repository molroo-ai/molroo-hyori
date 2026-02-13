/**
 * Re-export SDK types used throughout the app.
 * Source of truth: api-types.ts (auto-generated from molroo-api OpenAPI spec)
 */
import type { components } from './api-types'

type S = components['schemas']

export type VAD = S['VAD']
export type AppraisalVector = S['AppraisalVector']
export type DiscreteEmotion = S['DiscreteEmotionDetail']
export type BlendRatio = S['BlendRatio']
export type RegulationSnapshot = S['RegulationSnapshot']
export type TurnResultResponse = S['TurnResultResponse']
export type StateResponse = S['StateResponse']
export type CreatePersonaRequest = S['CreatePersonaRequest']
export type CreatePersonaResponse = S['CreatePersonaResponse']
export type ProcessAppraisalRequest = S['ProcessAppraisalRequest']
export type PromptDataSystem = S['PromptDataSystem']
export type TurnPromptData = S['TurnPromptData']
export type ErrorResponse = S['ErrorResponse']

export type PersonaIdentity = S['CreatePersonaRequest']['persona']['identity']
export type SoulStage = S['StateResponse']['soul_stage']
