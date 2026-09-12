import dataset from '../public/data/shore-orientations.json' with { type: 'json' }

const orientations = new Map(dataset.locations.map(item => [item.locationId, item]))
export function withShoreOrientation(location, record = orientations.get(location.id)) {
  if (!record || record.locationId !== location.id || (location.waterType ?? 'coastal') !== 'coastal'
    || Number.isFinite(location.seaBearing)
    || !Number.isFinite(record.seaBearing) || record.seaBearing < 0 || record.seaBearing >= 360
    || Math.abs(location.latitude - record.latitude) > 0.00001
    || Math.abs(location.longitude - record.longitude) > 0.00001
    || ![location.latitude, location.longitude, record.latitude, record.longitude].every(Number.isFinite)) return location
  return { ...location, seaBearing: record.seaBearing, shoreOrientation: record.shoreOrientation }
}
