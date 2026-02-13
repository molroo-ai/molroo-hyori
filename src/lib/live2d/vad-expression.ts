import type { VAD } from '../api/types'

interface ExpressionRange {
  name: string
  V: [number, number]
  A: [number, number]  // Arousal: [0, 1] in molroo-core
  D: [number, number]
}

/**
 * VAD region → Hyori expression name mapping.
 *
 * molroo-core VAD ranges: V [-1,1], A [0,1], D [-1,1]
 * Ranges overlap intentionally — first match wins, so order matters.
 * More specific/intense emotions come first.
 */
const EXPRESSION_MAP: ExpressionRange[] = [
  // High-arousal negative
  { name: 'angry',      V: [-1, -0.1],  A: [0.5, 1],   D: [0.3, 1]   },
  { name: 'fear',       V: [-1, -0.1],  A: [0.5, 1],   D: [-1, 0.3]  },
  { name: 'frustrated', V: [-1, -0.1],  A: [0.3, 0.6], D: [-1, 0.5]  },
  { name: 'disgust',    V: [-1, -0.2],  A: [0.2, 0.5], D: [0, 1]     },
  // Sadness (low V, low A)
  { name: 'cry',        V: [-1, -0.5],  A: [0, 0.3],   D: [-1, 0]    },
  { name: 'sad',        V: [-1, -0.2],  A: [0, 0.3],   D: [-1, 0.3]  },
  // Surprise (mid V, high A)
  { name: 'surprised',  V: [-0.5, 0.5], A: [0.6, 1],   D: [-1, 0.3]  },
  { name: 'amazed',     V: [0.2, 1],    A: [0.6, 1],   D: [-1, 0.3]  },
  { name: 'confused',   V: [-0.4, 0.2], A: [0.3, 0.6], D: [-1, 0]    },
  // Positive high-arousal
  { name: 'excited',    V: [0.3, 1],    A: [0.6, 1],   D: [0.2, 1]   },
  { name: 'laugh',      V: [0.5, 1],    A: [0.5, 1],   D: [0, 1]     },
  // Positive moderate
  { name: 'cheerful',   V: [0.2, 0.7],  A: [0.3, 0.6], D: [0, 1]     },
  { name: 'smile',      V: [0.2, 1],    A: [0, 0.4],   D: [-1, 1]    },
  // Social/self-conscious
  { name: 'shy',        V: [0, 0.5],    A: [0.3, 0.6], D: [-1, -0.2] },
  { name: 'blushing',   V: [-0.1, 0.4], A: [0.3, 0.6], D: [-1, 0]   },
  { name: 'smug',       V: [0.2, 0.8],  A: [0.1, 0.4], D: [0.5, 1]   },
  // Low-arousal states
  { name: 'relaxed',    V: [0.1, 0.6],  A: [0, 0.2],   D: [0, 1]     },
  { name: 'sleepy',     V: [-0.2, 0.3], A: [0, 0.15],  D: [-1, 0.3]  },
  { name: 'think',      V: [-0.2, 0.3], A: [0.1, 0.35], D: [-0.5, 0.5] },
]

function inRange(val: number, [lo, hi]: [number, number]): boolean {
  return val >= lo && val <= hi
}

/**
 * Map VAD coordinates to a Hyori expression name + weight.
 * Used as fallback when discrete_emotion mapping isn't available.
 */
export function vadToExpression(vad: VAD): { name: string; weight: number } | null {
  for (const entry of EXPRESSION_MAP) {
    if (inRange(vad.V, entry.V) && inRange(vad.A, entry.A) && inRange(vad.D, entry.D)) {
      // Weight = distance from neutral, clamped to [0.3, 1]
      const dist = Math.sqrt(vad.V * vad.V + vad.A * vad.A + vad.D * vad.D)
      const weight = Math.min(1, Math.max(0.3, dist / 1.2))
      return { name: entry.name, weight }
    }
  }
  return null
}
