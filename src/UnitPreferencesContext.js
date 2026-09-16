import { createContext, useContext } from 'react'
import { DEFAULT_UNIT_PREFERENCES, formatTemperature, formatTemperatureValue, temperatureDisplayValue, temperatureUnit } from './unitPreferences.js'
import * as wind from './windUnits.js'
import { getSafety, formatWindReadings } from './safety.js'

export const UnitPreferencesContext = createContext({ preferences: DEFAULT_UNIT_PREFERENCES })

export function useUnitFormatting() {
  const { preferences } = useContext(UnitPreferencesContext)
  return {
    windUnit: locale => wind.windUnit(locale, preferences.wind),
    windDisplayValue: (value, locale) => wind.windDisplayValue(value, locale, preferences.wind),
    formatWindValue: (value, locale) => wind.formatWindValue(value, locale, preferences.wind),
    formatWindSpeed: (value, locale) => wind.formatWindSpeed(value, locale, preferences.wind),
    formatStationWind: (value, locale) => wind.formatStationWind(value, locale, preferences.wind),
    temperatureUnit: temperatureUnit(preferences.temperature),
    temperatureDisplayValue: value => temperatureDisplayValue(value, preferences.temperature),
    formatTemperatureValue: (value, locale) => formatTemperatureValue(value, locale, preferences.temperature),
    formatTemperature: (value, locale) => formatTemperature(value, locale, preferences.temperature),
    getSafety: (conditions, location, t, locale, options) => getSafety(conditions, location, t, locale, { ...options, windUnit: preferences.wind }),
    formatWindReadings: (readings, t, locale) => formatWindReadings(readings, t, locale, preferences.wind),
  }
}
