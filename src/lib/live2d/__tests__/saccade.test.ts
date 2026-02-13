import { describe, expect, it, vi } from 'vitest'
import { createLive2DIdleEyeFocus } from '../saccade'

function createMockModel() {
  const params: Record<string, number> = {
    ParamEyeBallX: 0,
    ParamEyeBallY: 0,
  }

  return {
    focusController: {
      focus: vi.fn(),
      update: vi.fn(),
    },
    coreModel: {
      getParameterValueById(id: string) {
        return params[id] ?? 0
      },
      setParameterValueById(id: string, value: number) {
        params[id] = value
      },
    },
    _params: params,
  } as any
}

describe('createLive2DIdleEyeFocus', () => {
  it('triggers saccade on first update', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)

    expect(model.focusController.focus).toHaveBeenCalled()
    expect(model.focusController.update).toHaveBeenCalled()
  })

  it('does not trigger new saccade before interval expires', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)
    const firstCallCount = model.focusController.focus.mock.calls.length

    saccade.update(model, 1000.001)
    expect(model.focusController.focus.mock.calls.length).toBe(firstCallCount)
  })

  it('triggers new saccade after sufficient time passes', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)
    const firstCallCount = model.focusController.focus.mock.calls.length

    saccade.update(model, 1000 + 10)
    expect(model.focusController.focus.mock.calls.length).toBeGreaterThan(firstCallCount)
  })
})
