declare const require: (path: string) => any
declare const module: { exports: unknown }

const wisdomNotes = require("../data/wisdom-notes-data")

interface WisdomNote {
  id: string
  category: string
  categoryLabel: string
  title: string
  source: string
  principle: string
  interpretation: string
  reflection: string
  action: string
}

function getAllWisdomNotes(): WisdomNote[] {
  return Array.isArray(wisdomNotes) ? wisdomNotes.map((item) => ({ ...item })) : []
}

function getWisdomOfDay(dateKey: string): WisdomNote | null {
  const notes = getAllWisdomNotes()
  if (!notes.length) return null
  const hash = String(dateKey || "today")
    .split("")
    .reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 17)
  return notes[hash % notes.length]
}

module.exports = {
  getAllWisdomNotes,
  getWisdomOfDay
}
