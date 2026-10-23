// Pure helpers for the lab bench: which setting values were filmed alongside
// the current choices, and which take a full choice resolves to. Values are
// compared as strings because they round-trip through URL search params.
import type { Lab, LabTake, Selection } from './types'

function takeMatches(take: LabTake, selection: Selection, ignoreKey?: string): boolean {
  return Object.entries(selection).every(
    ([key, value]) => key === ignoreKey || String(take.settingValues[key]) === value,
  )
}

/** Whether some take has `key = value` and agrees with every *other* chosen setting. */
export function isValueAvailable(
  lab: Lab,
  selection: Selection,
  key: string,
  value: string,
): boolean {
  return lab.takes.some(
    (take) => String(take.settingValues[key]) === value && takeMatches(take, selection, key),
  )
}

/**
 * Turns a possibly partial or stale choice (e.g. from a shared link) into a
 * complete one that matches a real take. Settings are resolved in order: a
 * chosen value is kept if it was filmed alongside the earlier settings,
 * otherwise the first value that was is used.
 */
export function resolveSelection(
  lab: Lab,
  selection: Selection,
): { selection: Selection; take: LabTake | null } {
  if (lab.takes.length === 0) return { selection: {}, take: null }

  const resolved: Selection = {}
  for (const setting of lab.settings) {
    const candidates = lab.takes.filter((take) => takeMatches(take, resolved))
    const filmed = setting.values
      .map(String)
      .filter((v) => candidates.some((take) => String(take.settingValues[setting.key]) === v))
    const wanted = selection[setting.key]
    const value = wanted !== undefined && filmed.includes(wanted) ? wanted : filmed[0]
    if (value !== undefined) resolved[setting.key] = value
  }

  const take = lab.takes.find((t) => takeMatches(t, resolved)) ?? null
  return { selection: resolved, take }
}

/** A random filmed combination — so neighbors get different scenes and different answers. */
export function randomSelection(lab: Lab, random: () => number = Math.random): Selection {
  const take = lab.takes[Math.floor(random() * lab.takes.length)]
  if (!take) return {}
  return Object.fromEntries(lab.settings.map((s) => [s.key, String(take.settingValues[s.key])]))
}

export function formatSettingValue(value: string | number, unit?: string): string {
  if (!unit) return String(value)
  return unit === '°' ? `${value}°` : `${value} ${unit}`
}
