export const BALATON_SOURCES = {
  quality: 'https://www.nnk.gov.hu/index.php/kozegeszsegugyi-laboratoriumi-foosztaly/terkepes-informaciok/furdovizminosegi-terkep',
  temperature: 'https://mobil.met.hu/vizhomersekletek',
  wind: 'https://www.met.hu/idojaras/tavaink/balaton/mert_adatok/main.php',
  storm: 'https://www.met.hu/idojaras/tavaink/balaton/viharjelzes/main.php',
  windForecast: 'https://www.met.hu/idojaras/tavaink/balaton/medencek/',
  waveForecast: 'https://www.met.hu/idojaras/tavaink/balaton/hullammagassag/',
}

export function isBalaton(location) {
  return location?.countryCode === 'HU' && location.waterType === 'lake' && /^BALATON(?:\s|FURED\b)/i.test(location.name)
}

export function isObservationStale(time, maxAgeMs, now = Date.now()) {
  const timestamp = Date.parse(time)
  return !Number.isFinite(timestamp) || timestamp > now + 5 * 60000 || now - timestamp > maxAgeMs
}
