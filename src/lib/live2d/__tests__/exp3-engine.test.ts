import { describe, expect, it } from 'vitest'
import type { Exp3Expression } from '../exp3-engine'
import { applyExp3Expression } from '../exp3-engine'

function createMockCoreModel(params: Record<string, number>) {
  const values = { ...params }
  return {
    getParameterValueById(id: string): number | undefined {
      return values[id]
    },
    setParameterValueById(id: string, value: number) {
      values[id] = value
    },
    _values: values,
  }
}

describe('applyExp3Expression', () => {
  describe('Add blend', () => {
    it('adds weighted delta to current value', () => {
      const model = createMockCoreModel({ ParamEyeLOpen: 0.8 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamEyeLOpen', Value: 0.5, Blend: 'Add' }],
      }

      applyExp3Expression(model, expr, 1.0)

      expect(model._values.ParamEyeLOpen).toBeCloseTo(1.3)
    })

    it('applies weight to delta', () => {
      const model = createMockCoreModel({ ParamEyeLOpen: 0.8 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamEyeLOpen', Value: 1.0, Blend: 'Add' }],
      }

      applyExp3Expression(model, expr, 0.5)

      expect(model._values.ParamEyeLOpen).toBeCloseTo(1.3)
    })

    it('skips Add with value 0 (no-op optimization)', () => {
      const model = createMockCoreModel({ ParamX: 5.0 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 0, Blend: 'Add' }],
      }

      applyExp3Expression(model, expr, 1.0)

      expect(model._values.ParamX).toBe(5.0)
    })
  })

  describe('Multiply blend', () => {
    it('scales current value by weighted factor', () => {
      const model = createMockCoreModel({ ParamX: 10 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 2.0, Blend: 'Multiply' }],
      }

      applyExp3Expression(model, expr, 1.0)

      // current * (1 + (2 - 1) * 1) = 10 * 2 = 20
      expect(model._values.ParamX).toBeCloseTo(20)
    })

    it('applies partial weight', () => {
      const model = createMockCoreModel({ ParamX: 10 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 2.0, Blend: 'Multiply' }],
      }

      applyExp3Expression(model, expr, 0.5)

      // current * (1 + (2 - 1) * 0.5) = 10 * 1.5 = 15
      expect(model._values.ParamX).toBeCloseTo(15)
    })

    it('skips Multiply with value 1 (no-op optimization)', () => {
      const model = createMockCoreModel({ ParamX: 10 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 1, Blend: 'Multiply' }],
      }

      applyExp3Expression(model, expr, 1.0)

      expect(model._values.ParamX).toBe(10)
    })
  })

  describe('Overwrite blend', () => {
    it('lerps toward target value at full weight', () => {
      const model = createMockCoreModel({ ParamX: 0 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 10, Blend: 'Overwrite' }],
      }

      applyExp3Expression(model, expr, 1.0)

      // current + (10 - 0) * 1 = 10
      expect(model._values.ParamX).toBeCloseTo(10)
    })

    it('partially lerps at half weight', () => {
      const model = createMockCoreModel({ ParamX: 0 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 10, Blend: 'Overwrite' }],
      }

      applyExp3Expression(model, expr, 0.5)

      // current + (10 - 0) * 0.5 = 5
      expect(model._values.ParamX).toBeCloseTo(5)
    })
  })

  describe('edge cases', () => {
    it('skips unknown parameter IDs', () => {
      const model = createMockCoreModel({})
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'NonExistent', Value: 5, Blend: 'Add' }],
      }

      expect(() => applyExp3Expression(model, expr, 1.0)).not.toThrow()
    })

    it('handles multiple parameters in one expression', () => {
      const model = createMockCoreModel({ A: 1, B: 10 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [
          { Id: 'A', Value: 2, Blend: 'Add' },
          { Id: 'B', Value: 0.5, Blend: 'Multiply' },
        ],
      }

      applyExp3Expression(model, expr, 1.0)

      expect(model._values.A).toBeCloseTo(3)     // 1 + 2
      expect(model._values.B).toBeCloseTo(5)     // 10 * 0.5
    })

    it('does nothing at weight 0', () => {
      const model = createMockCoreModel({ ParamX: 5 })
      const expr: Exp3Expression = {
        Type: 'Live2D Expression',
        Parameters: [{ Id: 'ParamX', Value: 100, Blend: 'Add' }],
      }

      applyExp3Expression(model, expr, 0)

      expect(model._values.ParamX).toBeCloseTo(5)
    })
  })
})
