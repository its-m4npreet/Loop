export const IMPORT_CHANNELS = [
  "Support Ticket",
  "App Review",
  "Survey Response",
  "Community Post",
  "Sales Call Note",
] as const

export type ImportChannel = (typeof IMPORT_CHANNELS)[number]
