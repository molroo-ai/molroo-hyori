// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the internal parseJsonResponse logic via evaluateAppraisal
// by mocking the LLM call to return various formats.

// Mock chat module
vi.mock('../chat', () => ({
  callChatCompletion: vi.fn(),
}))
vi.mock('../providers', () => ({
  getProvider: () => ({
    id: 'test',
    name: 'Test',
    baseUrl: 'https://test.api',
    defaultModel: 'test-model',
    models: ['test-model'],
    apiKeyPlaceholder: '',
    apiKeyRequired: true,
  }),
}))

import { evaluateAppraisal } from '../appraisal'
import { callChatCompletion } from '../chat'

const mockCall = vi.mocked(callChatCompletion)
const config = { provider: 'test', apiKey: 'key123' }

beforeEach(() => {
  mockCall.mockReset()
})

describe('evaluateAppraisal', () => {
  it('parses clean JSON response', async () => {
    mockCall.mockResolvedValue('{"goal_relevance":0.9,"goal_congruence":0.1,"expectedness":0.3,"controllability":0.2,"agency":0.3,"norm_compatibility":0.2}')
    const result = await evaluateAppraisal(config, 'context', 'insult')

    expect(result.goal_relevance).toBe(0.9)
    expect(result.goal_congruence).toBe(0.1)
    expect(result.controllability).toBe(0.2)
  })

  it('parses JSON wrapped in markdown code fence', async () => {
    mockCall.mockResolvedValue('```json\n{"goal_relevance":0.8,"goal_congruence":0.7,"expectedness":0.5,"controllability":0.6,"agency":0.5,"norm_compatibility":0.9}\n```')
    const result = await evaluateAppraisal(config, 'context', 'hello')

    expect(result.goal_relevance).toBe(0.8)
    expect(result.goal_congruence).toBe(0.7)
  })

  it('returns defaults when LLM returns non-JSON', async () => {
    mockCall.mockResolvedValue('I cannot evaluate this message.')
    const result = await evaluateAppraisal(config, 'context', 'test')

    expect(result.goal_relevance).toBe(0.5)
    expect(result.goal_congruence).toBe(0.5)
  })

  it('returns defaults when LLM call fails', async () => {
    mockCall.mockRejectedValue(new Error('Network error'))
    const result = await evaluateAppraisal(config, 'context', 'test')

    expect(result.goal_relevance).toBe(0.5)
  })

  it('returns defaults when provider is none', async () => {
    const result = await evaluateAppraisal({ provider: 'none', apiKey: '' }, '', 'test')
    expect(result.goal_relevance).toBe(0.5)
    expect(mockCall).not.toHaveBeenCalled()
  })

  it('clamps out-of-range values to defaults', async () => {
    mockCall.mockResolvedValue('{"goal_relevance":1.5,"goal_congruence":-0.1,"expectedness":0.3,"controllability":0.5,"agency":0.5,"norm_compatibility":0.5}')
    const result = await evaluateAppraisal(config, 'context', 'test')

    expect(result.goal_relevance).toBe(0.5) // 1.5 out of range → default
    expect(result.goal_congruence).toBe(0.5) // -0.1 out of range → default
    expect(result.expectedness).toBe(0.3) // valid
  })

  it('handles partial JSON (missing keys)', async () => {
    mockCall.mockResolvedValue('{"goal_relevance":0.9}')
    const result = await evaluateAppraisal(config, 'context', 'test')

    expect(result.goal_relevance).toBe(0.9)
    expect(result.goal_congruence).toBe(0.5) // missing → default
  })

  it('extracts JSON from response with surrounding text', async () => {
    mockCall.mockResolvedValue('Here is my evaluation:\n{"goal_relevance":0.8,"goal_congruence":0.2,"expectedness":0.4,"controllability":0.3,"agency":0.2,"norm_compatibility":0.3}\nHope this helps!')
    const result = await evaluateAppraisal(config, 'context', 'test')

    expect(result.goal_relevance).toBe(0.8)
    expect(result.goal_congruence).toBe(0.2)
  })
})
