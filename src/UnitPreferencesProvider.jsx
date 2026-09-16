import { useState } from 'react'
import { UnitPreferencesContext } from './UnitPreferencesContext.js'
import { normalizeUnitPreferences, readUnitPreferences, saveUnitPreferences } from './unitPreferences.js'

const storage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}

export default function UnitPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => readUnitPreferences(storage))
  const update = (field, value) => {
    const next = normalizeUnitPreferences({ ...preferences, [field]: value })
    setPreferences(next)
    saveUnitPreferences(storage, next)
  }
  return <UnitPreferencesContext.Provider value={{ preferences, update }}>{children}</UnitPreferencesContext.Provider>
}
