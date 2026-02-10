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
  it('returns an object with an update method', () => {
    const saccade = createLive2DIdleEyeFocus()
    expect(typeof saccade.update).toBe('function')
  })

  it('triggers saccade on first update', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)

    expect(model.focusController.focus).toHaveBeenCalled()
    expect(model.focusController.update).toHaveBeenCalled()
  })

  it('sets eye parameters after update', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)

    // Eye parameters should have been modified by lerp
    const x = model._params.ParamEyeBallX
    const y = model._params.ParamEyeBallY
    expect(typeof x).toBe('number')
    expect(typeof y).toBe('number')
  })

  it('does not trigger new saccade before interval expires', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)
    const firstCallCount = model.focusController.focus.mock.calls.length

    // Very small time increment — should not trigger new saccade
    saccade.update(model, 1000.001)
    expect(model.focusController.focus.mock.calls.length).toBe(firstCallCount)
  })

  it('triggers new saccade after sufficient time passes', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    saccade.update(model, 1000)
    const firstCallCount = model.focusController.focus.mock.calls.length

    // Jump far into the future (well beyond max saccade interval)
    saccade.update(model, 1000 + 10)
    expect(model.focusController.focus.mock.calls.length).toBeGreaterThan(firstCallCount)
  })

  it('keeps eye values within reasonable range across multiple updates', () => {
    const saccade = createLive2DIdleEyeFocus()
    const model = createMockModel()

    // Run many updates
    for (let t = 0; t < 100; t += 0.5) {
      saccade.update(model, t)
    }

    const x = model._params.ParamEyeBallX
    const y = model._params.ParamEyeBallY
    expect(x).toBeGreaterThanOrEqual(-2)
    expect(x).toBeLessThanOrEqual(2)
    expect(y).toBeGreaterThanOrEqual(-2)
    expect(y).toBeLessThanOrEqual(2)
  })
})
