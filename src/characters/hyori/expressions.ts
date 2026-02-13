/**
 * Hiyori Expression Presets — exp3 format
 *
 * Based on Natori's exp3.json data, adapted for Hiyori's parameter set.
 * All values use "Add" blend mode (delta on top of motion base values).
 *
 * Hiyori parameter compensation:
 *   - ParamEyeL/RForm (Natori-only) -> compensated via ParamEyeL/ROpen adjustments
 *   - ParamMouthForm2 (Natori-only) -> compensated via ParamMouthOpenY
 *   - ParamTeethOn, ParamGlass*, ParamBrowL/RForm2 -> dropped (no Hiyori equivalent)
 */

import type { Exp3Expression } from '../../lib/live2d/exp3-engine'

// Helper to build an Add-only expression concisely
function addExpr(params: Record<string, number>): Exp3Expression {
  return {
    Type: 'Live2D Expression',
    Parameters: Object.entries(params)
      .filter(([, v]) => v !== 0)
      .map(([Id, Value]) => ({ Id, Value, Blend: 'Add' as const })),
  }
}

// -- Natori-derived expressions (11) --

const normal = addExpr({})

const smile = addExpr({
  ParamEyeLOpen: -1,
  ParamEyeLSmile: 1,
  ParamEyeROpen: -1,
  ParamEyeRSmile: 1,
  ParamBrowLForm: 1,
})

const angry = addExpr({
  ParamEyeLOpen: -0.3,
  ParamEyeROpen: -0.3,
  ParamBrowLX: 0.3,
  ParamBrowRX: 0.3,
  ParamBrowLAngle: -0.4,
  ParamBrowRAngle: -0.4,
  ParamBrowLForm: -1,
  ParamBrowRForm: -1,
  ParamMouthForm: -2,
})

const sad = addExpr({
  ParamEyeLOpen: -0.3,
  ParamEyeROpen: -0.3,
  ParamBrowLForm: -1,
  ParamBrowRForm: -1,
  ParamMouthForm: -1,
})

const surprised = addExpr({
  ParamEyeLOpen: 0.3,
  ParamEyeROpen: 0.3,
  ParamEyeBallForm: -1,
  ParamBrowLY: 0.2,
  ParamBrowRY: 0.2,
  ParamBrowLX: -0.1,
  ParamBrowRX: -0.1,
  ParamBrowLAngle: 0.1,
  ParamBrowRAngle: 0.1,
  ParamMouthForm: -3,
  ParamMouthOpenY: 0.2,
})

const blushing = addExpr({
  ParamBrowLForm: -1,
  ParamBrowRForm: -1,
  ParamMouthForm: -2,
  ParamMouthOpenY: 0.2,
  ParamCheek: 1,
})

const excited = addExpr({
  ParamEyeLOpen: 0.3,
  ParamEyeROpen: 0.3,
  ParamBrowLY: -0.1,
  ParamBrowRY: -0.1,
  ParamMouthForm: 1,
  ParamMouthOpenY: 0.2,
})

const cheerful = addExpr({
  ParamEyeLOpen: 0.1,
  ParamEyeROpen: 0.1,
  ParamBrowLY: 0.1,
  ParamBrowRY: 0.1,
  ParamBrowLAngle: 0.1,
  ParamBrowRAngle: 0.1,
  ParamMouthForm: 1,
})

const frustrated = addExpr({
  ParamBrowLForm: -1,
  ParamBrowRForm: -1,
  ParamMouthForm: -2,
  ParamMouthOpenY: 0.2,
})

const amazed = addExpr({
  ParamEyeLOpen: 0.2,
  ParamEyeROpen: 0.2,
  ParamBrowLY: 0.2,
  ParamBrowRY: 0.2,
  ParamBrowLX: -0.1,
  ParamBrowRX: -0.1,
  ParamBrowLAngle: 0.1,
  ParamBrowRAngle: 0.1,
  ParamMouthForm: -3,
})

const sleepy = addExpr({
  ParamEyeLOpen: -1,
  ParamEyeROpen: -1,
  ParamBrowLForm: 1,
  ParamBrowRForm: 1,
  ParamMouthForm: -3,
  ParamMouthOpenY: 0.2,
})

// -- Custom expressions (9) --

const think = addExpr({
  ParamEyeLOpen: -0.4,
  ParamEyeROpen: -0.4,
  ParamBrowLY: 0.1,
  ParamBrowRY: -0.1,
})

const shy = addExpr({
  ParamEyeLSmile: 0.4,
  ParamEyeRSmile: 0.4,
  ParamEyeLOpen: -0.4,
  ParamEyeROpen: -0.4,
  ParamBrowLY: -0.1,
  ParamBrowRY: -0.1,
  ParamMouthForm: 0.3,
  ParamCheek: 0.8,
})

const smug = addExpr({
  ParamEyeLSmile: 0.5,
  ParamEyeRSmile: 0.5,
  ParamEyeLOpen: -0.3,
  ParamEyeROpen: -0.3,
  ParamBrowLY: 0.2,
  ParamBrowRY: 0.4,
  ParamMouthForm: 0.5,
})

const cry = addExpr({
  ParamEyeLOpen: -0.6,
  ParamEyeROpen: -0.6,
  ParamEyeLSmile: 0.6,
  ParamEyeRSmile: 0.6,
  ParamBrowLY: -0.6,
  ParamBrowRY: -0.6,
  ParamBrowLAngle: -0.5,
  ParamBrowRAngle: -0.5,
  ParamMouthForm: -0.4,
  ParamMouthOpenY: 0.4,
})

const laugh = addExpr({
  ParamEyeLSmile: 1.0,
  ParamEyeRSmile: 1.0,
  ParamBrowLY: 0.4,
  ParamBrowRY: 0.4,
  ParamMouthForm: 1.0,
  ParamMouthOpenY: 0.7,
  ParamCheek: 0.5,
})

const confused = addExpr({
  ParamEyeLOpen: -0.2,
  ParamEyeROpen: -0.4,
  ParamBrowLY: 0.3,
  ParamBrowRY: -0.2,
  ParamMouthForm: -0.2,
})

const fear = addExpr({
  ParamEyeLOpen: 0.3,
  ParamEyeROpen: 0.3,
  ParamBrowLY: 0.5,
  ParamBrowRY: 0.5,
  ParamBrowLAngle: -0.5,
  ParamBrowRAngle: -0.5,
  ParamMouthOpenY: 0.3,
  ParamMouthForm: -0.3,
})

const relaxed = addExpr({
  ParamEyeLOpen: -0.3,
  ParamEyeROpen: -0.3,
  ParamEyeLSmile: 0.3,
  ParamEyeRSmile: 0.3,
  ParamBrowLY: 0.1,
  ParamBrowRY: 0.1,
  ParamMouthForm: 0.2,
})

const disgust = addExpr({
  ParamEyeLOpen: -0.4,
  ParamEyeROpen: -0.4,
  ParamBrowLY: -0.2,
  ParamBrowRY: -0.2,
  ParamBrowLAngle: -0.4,
  ParamBrowRAngle: -0.4,
  ParamMouthForm: -0.7,
  ParamMouthOpenY: 0.2,
})

/** All 20 Hyori expression presets. */
export const HYORI_EXPRESSIONS: Record<string, Exp3Expression> = {
  // Natori-derived (11)
  normal,
  smile,
  angry,
  sad,
  surprised,
  blushing,
  excited,
  cheerful,
  frustrated,
  amazed,
  sleepy,
  // Custom (9)
  think,
  shy,
  smug,
  cry,
  laugh,
  confused,
  fear,
  relaxed,
  disgust,
}
