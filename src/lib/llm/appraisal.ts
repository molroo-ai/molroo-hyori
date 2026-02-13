/**
 * Appraisal evaluation — dedicated LLM call for emotional appraisal.
 *
 * Instead of mixing appraisal into the conversational response,
 * this makes a separate, focused LLM call that returns ONLY a JSON object.
 * Runs in parallel with the conversational response for no added latency.
 */

import type { AppraisalVector } from '../api/types'
import type { LlmConfig } from './chat'
import { callChatCompletion } from './chat'

const APPRAISAL_SYSTEM = `You evaluate how a character emotionally reacts to a user's message.
Given the character context and user message, rate each dimension from 0.0 to 1.0.
Respond with ONLY a JSON object. No explanation, no markdown, no other text.

Dimensions:
- goal_relevance: How much does this matter to the character? (0=irrelevant, 1=critical)
- goal_congruence: Does it help or threaten the character's goals? (0=threatening, 1=supportive)
- expectedness: How predictable was this message? (0=shocking, 1=fully expected)
- controllability: How much control does the character feel? (0=helpless, 1=in control)
- agency: Who drives the interaction? (0=user drives, 1=character leads)
- norm_compatibility: How socially appropriate is the exchange? (0=inappropriate, 1=normal)

Example for an insult: {"goal_relevance":0.8,"goal_congruence":0.1,"expectedness":0.3,"controllability":0.3,"agency":0.2,"norm_compatibility":0.2}
Example for a compliment: {"goal_relevance":0.7,"goal_congruence":0.9,"expectedness":0.5,"controllability":0.7,"agency":0.5,"norm_compatibility":0.9}`

const DEFAULT_APPRAISAL: AppraisalVector = {
  goal_relevance: 0.5,
  goal_congruence: 0.5,
  expectedness: 0.5,
  controllability: 0.5,
  agency: 0.5,
  norm_compatibility: 0.5,
}

const APPRAISAL_KEYS: (keyof AppraisalVector)[] = [
  'goal_relevance', 'goal_congruence', 'expectedness',
  'controllability', 'agency', 'norm_compatibility',
]

/** Extract JSON from LLM response (handles markdown fences, whitespace, etc.) */
function parseJsonResponse(raw: string): AppraisalVector {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()

  // Find first { ... } block
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return DEFAULT_APPRAISAL

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
    const appraisal = { ...DEFAULT_APPRAISAL }
    for (const key of APPRAISAL_KEYS) {
      const v = parsed[key]
      if (typeof v === 'number' && v >= 0 && v <= 1) {
        appraisal[key] = v
      }
    }
    return appraisal
  } catch {
    return DEFAULT_APPRAISAL
  }
}

/**
 * Evaluate emotional appraisal via a dedicated LLM call.
 * Returns AppraisalVector (defaults to 0.5 on failure).
 */
export async function evaluateAppraisal(
  config: LlmConfig,
  characterContext: string,
  userMessage: string,
): Promise<AppraisalVector> {
  if (config.provider === 'none') return DEFAULT_APPRAISAL

  const system = characterContext
    ? `${APPRAISAL_SYSTEM}\n\nCharacter context:\n${characterContext}`
    : APPRAISAL_SYSTEM

  try {
    const raw = await callChatCompletion(
      config,
      [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.3, maxOutputTokens: 120 },
    )
    return parseJsonResponse(raw)
  } catch {
    return DEFAULT_APPRAISAL
  }
}
