/**
 * exp3 Expression Blending Engine
 *
 * Implements Cubism SDK's official exp3.json blending modes:
 * - Add: delta applied on top of current value (motion base + expression delta)
 * - Multiply: scale the current value
 * - Overwrite: lerp toward absolute target
 *
 * This engine is model-agnostic — it works with any Cubism model and any exp3 preset.
 *
 * IMPORTANT: Apply AFTER motionManager.update() but BEFORE coreModel.update().
 * This way the motion sets the base parameters, and the expression adds deltas on top.
 */

export interface Exp3Parameter {
  Id: string
  Value: number
  Blend: 'Add' | 'Multiply' | 'Overwrite'
}

export interface Exp3Expression {
  Type: 'Live2D Expression'
  Parameters: Exp3Parameter[]
}

/**
 * Apply an exp3 expression to a Cubism core model.
 *
 * @param coreModel - Cubism coreModel instance (from internalModel.coreModel)
 * @param expression - The exp3 expression to apply
 * @param weight - Blend weight 0..1 (for fade-in/out transitions)
 */
export function applyExp3Expression(
  coreModel: any,
  expression: Exp3Expression,
  weight: number,
): void {
  for (const param of expression.Parameters) {
    if (param.Value === 0 && param.Blend === 'Add') continue
    if (param.Value === 1 && param.Blend === 'Multiply') continue

    const current = coreModel.getParameterValueById(param.Id)
    if (current === undefined || current === null) continue

    let next: number
    switch (param.Blend) {
      case 'Add':
        next = current + param.Value * weight
        break
      case 'Multiply':
        next = current * (1 + (param.Value - 1) * weight)
        break
      case 'Overwrite':
      default:
        next = current + (param.Value - current) * weight
        break
    }

    coreModel.setParameterValueById(param.Id, next)
  }
}
