import { useContext } from 'react'
import { AppModal } from './AppModal.jsx'
import { UnitPreferencesContext } from './UnitPreferencesContext.js'
import { windUnit } from './windUnits.js'

export default function UnitSettings({ locale, t, onClose }) {
  const { preferences, update } = useContext(UnitPreferencesContext)
  return <AppModal className="install-sheet" closeLabel={t('contact.close')} onClose={onClose} titleId="units-title">
    <h2 id="units-title">{t('units.title')}</h2>
    <div className="unit-fields">
      <label>{t('timeline.wind')}
        <select value={preferences.wind} onChange={event => update('wind', event.target.value)}>
          <option value="auto">{t('units.auto')} · {windUnit(locale)}</option>
          <option value="km/h">km/h</option><option value="mph">mph</option>
        </select>
      </label>
      <label>{t('timeline.temperature')}
        <select value={preferences.temperature} onChange={event => update('temperature', event.target.value)}>
          <option value="auto">{t('units.auto')} · °C</option>
          <option value="°C">°C</option><option value="°F">°F</option>
        </select>
      </label>
    </div>
    <button className="install-done" type="button" onClick={onClose}>{t('contact.done')}</button>
  </AppModal>
}
