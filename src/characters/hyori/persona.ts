/**
 * Hyori character definition.
 *
 * The MD file is the single source of truth for the character.
 * At session creation, the guide → LLM → persona flow transforms this
 * natural language description into structured API data.
 */
import characterMd from './character.md?raw'

/** Raw character description — fed to LLM with the persona guide */
export const hyoriCharacterMd = characterMd

/** Display metadata (not used for API calls) */
export const hyoriMeta = {
  name: '효리',
} as const
