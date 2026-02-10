import type { CharacterPackage } from '../types'
import { HYORI_EXPRESSIONS } from './expressions'
import { HYORI_MOTIONS } from './motions'

export const hyoriCharacter: CharacterPackage = {
  name: 'Hyori',
  modelUrl: '/models/hiyori_pro_zh.zip',
  expressions: HYORI_EXPRESSIONS,
  motions: HYORI_MOTIONS,
}
