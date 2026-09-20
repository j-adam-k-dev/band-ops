// Shapes returned by core-api (Postgres) and notes-api (Mongo). These mirror the
// Prisma schema / Mongoose models; they're hand-maintained for now (a shared
// package or generated client would be a stretch goal).

// ---- core-api (Postgres) ----

export interface Band {
  id: string
  name: string
  createdAt: string
  members?: Member[]
}

export interface Member {
  id: string
  bandId: string
  name: string
  role: string | null
  band?: Band
}

export interface Venue {
  id: string
  name: string
  address: string | null
  isOutdoor: boolean
  contact: string | null
  gigs?: Gig[]
}

export interface Song {
  id: string
  title: string
  durationSec: number | null
  musicalKey: string | null
  tempoBpm: number | null
}

export type GigStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed'

export interface Gig {
  id: string
  venueId: string
  date: string
  loadInTime: string | null
  status: GigStatus
  venue?: Venue
  setlist?: Setlist | null
}

export interface SetlistSong {
  setlistId: string
  songId: string
  position: number
  song?: Song
}

export interface Setlist {
  id: string
  gigId: string
  name: string
  songs?: SetlistSong[]
}

// ---- notes-api (Mongo) ----

export interface SongNote {
  _id: string
  songId: string
  bandId: string
  tempoNotes?: string
  pluginChain?: string[]
  drumMapNotes?: string
  freeformText?: string
  createdAt: string
  updatedAt: string
}

export interface RigConfig {
  _id: string
  memberId: string
  instrument: string
  gearList?: string[]
  signalChain?: string[]
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  label: string
  done: boolean
}

export interface GigChecklist {
  _id: string
  gigId: string
  venueType: 'indoor' | 'outdoor'
  items: ChecklistItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// Standard error body shape from both APIs' error handlers.
export interface ApiError {
  error: string
  message?: string
  details?: { path: string; message: string }[]
}
