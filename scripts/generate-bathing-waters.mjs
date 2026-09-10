import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const SOURCES = {
  england: 'https://environment.data.gov.uk/doc/bathing-water.json?_pageSize=1000',
  wales: 'https://environment.data.gov.uk/wales/bathing-waters/doc/bathing-water.json?_view=bathing-water&_pageSize=1000&_lang=en%2Ccy%2Cnone',
  scotland: 'https://map.sepa.org.uk/server/rest/services/Open/Environmental_Monitoring/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
  northernIreland: 'https://services-eu1.arcgis.com/kswen6BYexuc1SUk/arcgis/rest/services/Bathing_Water_Monitoring_Points_Public_View_PRD/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
}

function englishValue(value) {
  if (Array.isArray(value)) {
    return value.find((item) => item?._lang === 'en')?._value ?? value[0]?._value ?? ''
  }
  return value?._value ?? value ?? ''
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function districtName(item) {
  const district = Array.isArray(item.district) ? item.district.find((entry) => typeof entry === 'object') : item.district
  return englishValue(district?.name) || englishValue(item.regionalOrganization?.name) || 'Coastal UK'
}

function linkedDataItems(document) {
  return document.result?.items ?? document.items ?? []
}

export function fromLinkedData(item, nation, prefix) {
  const latitude = Number(item.samplingPoint?.lat)
  const longitude = Number(item.samplingPoint?.long)
  const name = englishValue(item.name)
  const type = Array.isArray(item.type) ? item.type.join(' ') : String(item.type ?? '')
  const waterType = type.includes('LakeBathingWater') ? 'lake' : type.includes('CoastalBathingWater') ? 'coastal' : null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name || !waterType) return null

  return {
    id: `${prefix}-${slug(item.eubwidNotation || name)}`,
    officialId: item.eubwidNotation || null,
    name,
    area: districtName(item),
    nation,
    latitude,
    longitude,
    seaBearing: null,
    waterType,
    classification: englishValue(item.latestComplianceAssessment?.complianceClassification?.name) || 'Unclassified',
    classificationYear: Number(item.latestComplianceAssessment?._about?.match(/\/year\/(\d{4})/)?.[1]) || null,
    riskLevel: englishValue(item.latestRiskPrediction?.riskLevel?.name) || null,
    heavyRainRisk: item.waterQualityImpactedByHeavyRain === true,
    source: prefix,
    sourceUrl: nation === 'England'
      ? 'https://environment.data.gov.uk/bwq/profiles/'
      : 'https://environment.data.gov.uk/wales/bathing-waters/profiles/',
  }
}

function fromScotland(feature) {
  const [longitude, latitude] = feature.geometry?.coordinates ?? []
  const name = feature.properties?.description
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) return null
  return {
    id: `sepa-${feature.properties.bw_url?.match(/[?&]location=(\d+)/)?.[1] ?? feature.properties.objectid}`,
    officialId: String(feature.properties.objectid),
    name,
    area: 'Scotland',
    nation: 'Scotland',
    latitude,
    longitude,
    seaBearing: null,
    classification: feature.properties.class_description || 'Unclassified',
    classificationYear: Number(feature.properties.year) || null,
    riskLevel: null,
    heavyRainRisk: null,
    source: 'sepa',
    sourceUrl: feature.properties.bw_url || 'https://bathingwaters.sepa.org.uk/locations-and-results/',
  }
}

export function fromNorthernIreland(feature) {
  const [longitude, latitude] = feature.geometry?.coordinates ?? []
  const properties = feature.properties ?? {}
  const name = properties.Site_name || properties.Bathing_Water_Site
  // Verified inland site on Lough Neagh; do not assume all future Inland sites are lakes.
  const reasWood = String(properties.Unique_Site_ID_Code) === '30203' && properties.Type === 'Inland'
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name || (!reasWood && properties.Type !== 'Coastal')) return null
  return {
    id: `daera-${properties.Unique_Site_ID_Code}`,
    officialId: String(properties.Unique_Site_ID_Code),
    name,
    area: properties.Region || 'Northern Ireland',
    nation: 'Northern Ireland',
    latitude,
    longitude,
    seaBearing: null,
    waterType: reasWood ? 'lake' : 'coastal',
    // The live NoBathing indicator is not an annual classification.
    // DAERA's 5 Nov 2025 results list Rea's Wood as Poor:
    // https://www.daera-ni.gov.uk/news/muir-announces-results-northern-irelands-bathing-waters
    classification: reasWood ? 'Poor' : properties.water_quality_indicator || 'Unclassified',
    classificationYear: 2025,
    riskLevel: null,
    heavyRainRisk: null,
    source: 'daera',
    sourceUrl: properties.Profile__URL || 'https://www.daera-ni.gov.uk/articles/about-bathing-water-quality',
  }
}

async function getJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return response.json()
}

async function generate() {
const [england, wales, scotland, northernIreland] = await Promise.all(Object.values(SOURCES).map(getJson))
const locations = [
  ...linkedDataItems(england).map((item) => fromLinkedData(item, 'England', 'ea')),
  ...linkedDataItems(wales).map((item) => fromLinkedData(item, 'Wales', 'nrw')),
  ...(scotland.features ?? []).map(fromScotland),
  ...(northernIreland.features ?? []).map(fromNorthernIreland),
]
  .filter(Boolean)
  .sort((first, second) => first.nation.localeCompare(second.nation) || first.name.localeCompare(second.name))

const rows = locations.map((location) => [
  location.id,
  location.name,
  location.area,
  location.nation,
  location.latitude,
  location.longitude,
  location.classification,
  location.classificationYear,
  location.riskLevel,
  location.heavyRainRisk,
  location.source,
  location.waterType ?? null,
])
const header = `// Generated from official UK bathing-water sources by scripts/generate-bathing-waters.mjs.\n// Do not edit this file by hand. Generated: ${new Date().toISOString().slice(0, 10)}.\n\n`
const generatedOn = new Date().toISOString().slice(0, 10)
const moduleBody = `export const CATALOG_UPDATED_ON = '${generatedOn}'\n\nconst ROWS = ${JSON.stringify(rows)}\n\nexport const OFFICIAL_BATHING_WATERS = ROWS.map(([id, name, area, nation, latitude, longitude, classification, classificationYear, riskLevel, heavyRainRisk, source, waterType]) => ({\n  id, name, area, nation, latitude, longitude, seaBearing: null, classification, classificationYear, riskLevel, heavyRainRisk, source, waterType,\n}))\n`
await writeFile(new URL('../src/bathingWaters.generated.js', import.meta.url), header + moduleBody)
await writeFile(new URL('../src/catalogMetadata.js', import.meta.url), `export const CATALOG_UPDATED_ON = '${generatedOn}'\n`)

const counts = Object.groupBy(locations, (location) => location.nation)
console.log(Object.fromEntries(Object.entries(counts).map(([nation, items]) => [nation, items.length])))
console.log(`Generated ${locations.length} coastal and lake bathing-water locations.`)

}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await generate()
