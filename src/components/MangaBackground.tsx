/**
 * Diagonal repeating text background — manga/showcase aesthetic.
 * Slow infinite scroll animation for visual dynamism.
 * Pure decorative layer, no interactivity.
 */

interface Row {
  text: string
  size: number
  opacity: number
  spacing: string
  color: string
  speed: number       // animation duration in seconds
  reverse: boolean
}

const ROWS: Row[] = [
  { text: 'molroo', size: 56, opacity: 0.07, spacing: '0.15em', color: '255,255,255', speed: 80, reverse: false },
  { text: 'EMOTION ENGINE', size: 18, opacity: 0.08, spacing: '0.5em', color: '255,255,255', speed: 60, reverse: true },
  { text: 'molroo', size: 40, opacity: 0.05, spacing: '0.12em', color: '255,255,255', speed: 90, reverse: false },
  { text: 'COMING SOON', size: 22, opacity: 0.06, spacing: '0.4em', color: '233,69,96', speed: 50, reverse: true },
]

const TILE_COUNT = 6  // rows per pattern cycle
const REPEAT = 20     // text repeats per row

export function MangaBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <style>{keyframes}</style>
      <div
        style={{
          position: 'absolute',
          top: '-60%',
          left: '-60%',
          width: '220%',
          height: '220%',
          transform: 'rotate(-18deg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        {Array.from({ length: TILE_COUNT * ROWS.length }, (_, i) => {
          const row = ROWS[i % ROWS.length]
          return (
            <div
              key={i}
              style={{
                whiteSpace: 'nowrap',
                fontSize: row.size,
                fontWeight: 900,
                fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
                fontStyle: 'italic',
                color: `rgba(${row.color}, ${row.opacity})`,
                letterSpacing: row.spacing,
                textTransform: 'uppercase',
                userSelect: 'none',
                animation: `manga-scroll-${row.reverse ? 'r' : 'l'} ${row.speed}s linear infinite`,
              }}
            >
              {`${row.text}  \u00B7  `.repeat(REPEAT)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const keyframes = `
@keyframes manga-scroll-l {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes manga-scroll-r {
  from { transform: translateX(-50%); }
  to   { transform: translateX(0); }
}
`
