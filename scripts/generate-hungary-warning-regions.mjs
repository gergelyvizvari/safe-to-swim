import { writeFile } from 'node:fs/promises'
const source='https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2024_4326_LEVL_2.geojson'
const response=await fetch(source,{signal:AbortSignal.timeout(60000)})
if(!response.ok) throw new Error(`GISCO HTTP ${response.status}`)
const data=await response.json()
const regions=data.features.filter(feature=>feature.properties.CNTR_CODE==='HU')
if(regions.length!==8) throw new Error('Unexpected Hungarian warning region count')
await writeFile(new URL('../server/hungaryRegions.generated.js',import.meta.url),`// Eurostat/GISCO NUTS 2024, 1M, EPSG:4326.\n// ${source}\nexport const HUNGARY_REGIONS = ${JSON.stringify(regions)}\n`)
