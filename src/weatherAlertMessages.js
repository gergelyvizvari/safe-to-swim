import { getMessages } from './languagePacks.js'
export const weatherAlertMessages = language => getMessages(language).weatherAlerts
export function activeWeatherWarning(state, time, now = Date.now()) {
  if (state?.status !== 'available' || state.error || state.loading || !Number.isFinite(Date.parse(state.checkedAt)) || now - Date.parse(state.checkedAt) > 10 * 60000) return null
  const timestamp = typeof time === 'number' ? time : Date.parse(time)
  return state.items?.filter(item => Date.parse(item.startsAt) <= timestamp && Date.parse(item.expiresAt) > timestamp).sort((a,b) => Number(b.hazard === 3)-Number(a.hazard === 3) || b.level-a.level)[0] ?? null
}
export function weatherWarningDuringInterval(state, startsAt, endsAt, now = Date.now()) {
  const start=Date.parse(startsAt), end=Date.parse(endsAt)
  return state?.items?.some(item => Date.parse(item.startsAt)<end && Date.parse(item.expiresAt)>start
    && activeWeatherWarning(state,Math.max(start,Date.parse(item.startsAt)),now)) ?? false
}

export function weatherWarningsAt(items, time) {
  const timestamp = typeof time === 'number' ? time : Date.parse(time)
  return (items ?? []).filter(item => Date.parse(item.startsAt) <= timestamp && Date.parse(item.expiresAt) > timestamp)
}
