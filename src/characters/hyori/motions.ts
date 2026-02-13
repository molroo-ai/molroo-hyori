import type { MotionDef } from '../types'

export const HYORI_MOTIONS: Record<string, MotionDef> = {
  idle1:     { group: 'Idle',        index: 0, label: 'Idle (default)',     duration: 4.7 },
  idle2:     { group: 'Idle',        index: 1, label: 'Idle (smile)',       duration: 5.93 },
  idle3:     { group: 'Idle',        index: 2, label: 'Idle (lively)',      duration: 8.57 },
  flick:     { group: 'Flick',       index: 0, label: 'Surprise reaction',  duration: 4.2 },
  flickDown: { group: 'FlickDown',   index: 0, label: 'Down reaction',      duration: 4.43 },
  flickUp:   { group: 'FlickUp',     index: 0, label: 'Up reaction',        duration: 5.37 },
  tap1:      { group: 'Tap',         index: 0, label: 'Tap reaction 1',     duration: 1.9 },
  tap2:      { group: 'Tap',         index: 1, label: 'Tap reaction 2',     duration: 1.9 },
  tapBody:   { group: 'Tap@Body',    index: 0, label: 'Body tap',           duration: 1.6 },
  flickBody: { group: 'Flick@Body',  index: 0, label: 'Body flick',         duration: 4.17 },
}
