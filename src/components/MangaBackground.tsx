/**
 * Diagonal repeating text background — manga/showcase aesthetic.
 * Pure decorative layer, no interactivity.
 */

const LINES = [
  'molroo',
  'EMOTION ENGINE',
  'molroo',
  'COMING SOON',
]

const ROW_COUNT = 24
const REPEAT = 12

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
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          transform: 'rotate(-18deg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 48,
        }}
      >
        {Array.from({ length: ROW_COUNT }, (_, i) => {
          const line = LINES[i % LINES.length]
          const isAccent = line === 'COMING SOON'
          return (
            <div
              key={i}
              style={{
                whiteSpace: 'nowrap',
                fontSize: isAccent ? 20 : 32,
                fontWeight: 900,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                color: isAccent
                  ? 'rgba(233, 69, 96, 0.04)'
                  : 'rgba(255, 255, 255, 0.025)',
                letterSpacing: isAccent ? '0.3em' : '0.08em',
                textTransform: 'uppercase',
                userSelect: 'none',
                // Alternate row offset for staggered look
                paddingLeft: i % 2 === 0 ? 0 : 80,
              }}
            >
              {`${line}  \u00B7  `.repeat(REPEAT)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
