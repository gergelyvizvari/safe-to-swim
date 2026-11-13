import { BALATON_WEBCAMS } from './balatonWebcams.generated.js'
import { isBalaton } from './balaton.js'
const BRIGHTON_STREAMS = [
  {
    id: 'south',
    labelKey: 'webcam.south',
    embedUrl: 'https://g0.ipcamlive.com/player/player.php?alias=60d5c6da841c9',
  },
  {
    id: 'north',
    labelKey: 'webcam.north',
    embedUrl: 'https://g0.ipcamlive.com/player/player.php?alias=60d5c730c91b5',
  },
]

export const VERIFIED_WEBCAMS = [
  {
    id: 'de-trassenheide-rettungsturm', name: 'Trassenheide · Hauptstrand',
    latitude: 54.0963628, longitude: 13.8807766,
    sourceName: 'Ostseebad Trassenheide',
    pageUrl: 'https://www.wetter-trassenheide.de/template/trassenheide/webcamstrand/webcam_strand/index.php',
    verifiedOn: '2026-11-08', coverage: 'beach', waterType: 'coastal',
    locationIds: ['eea-DEMV_PR_1_0701'],
  },
  {
    id: 'nl-callantsoog-de-toko', name: 'Callantsoog · De Toko',
    latitude: 52.8349531, longitude: 4.6896647,
    sourceName: 'Strandpaviljoen De Toko', pageUrl: 'https://www.strandpaviljoendetoko.nl/webcam/',
    verifiedOn: '2026-10-16', coverage: 'nearby-shore', waterType: 'coastal',
    // Operator map coordinates locate the pavilion, not the exact camera mount.
    // Timestamped North Sea beach view; retain external link, no embed permission assumed.
    locationIds: ['eea-NLBW95_CALLOBSD'],
  },
  {
    id: 'se-apelviken-solviken', name: 'Destination Apelviken · Solviken',
    latitude: 57.084444, longitude: 12.248611,
    sourceName: 'Destination Apelviken', pageUrl: 'https://www.apelviken.se/webbkamera',
    verifiedOn: '2026-10-08', coverage: 'nearby-shore', waterType: 'coastal',
    // Operator map gives camera coordinates and a view southeast across this bay.
    // External player only: no capture timestamp or permission for our own embed.
    locationIds: ['eea-SE0A11383000000633', 'eea-SE0A11383000000634'],
  },
  {
    id: 'fr-annecy-albigny-panorama', name: "Annecy · Presqu’île d’Albigny",
    latitude: 45.90371, longitude: 6.144743,
    sourceName: 'Lac Annecy Tourisme', pageUrl: 'https://app.webcam-hd.com/annecy-tourisme/annecy-lac',
    verifiedOn: '2026-10-07', coverage: 'nearby-shore', waterType: 'lake',
    // Timestamped lake panorama, not a direct view of either bathing area.
    // Exact IDs prevent assignment to the separate nearby inland lakes.
    locationIds: ['eea-FRK2874010D074220', 'eea-FRK2874010D074212'],
  },
  {
    id: 'alte-donau-yachtclub-seewind', name: 'Yachtclub Seewind · Obere Alte Donau',
    latitude: 48.248083, longitude: 16.4125604,
    sourceName: 'Yachtclub Seewind', pageUrl: 'https://www.yachtclub-seewind.at/main/wetter/webcam/',
    verifiedOn: '2026-09-24', coverage: 'nearby-shore', waterType: 'lake',
    // Upper Old Danube shore view, not a direct view of either bathing site.
    // The lower Old Danube and Neue Donau are deliberately not assigned.
    locationIds: ['eea-AT1300002100010010', 'eea-AT1300002200010060'],
  },
  ...BALATON_WEBCAMS,
  // Approximate mounts, independently reviewed against the operator's views.
  // Distances are marked approximate; these links never promise a fixed PTZ view.
  {
    id: 'uk-sidmouth-esplanade', name: 'Sidmouth · Esplanade',
    latitude: 50.6781, longitude: -3.2379, approximateCoordinates: true,
    sourceName: 'Sidmouth Town Council', pageUrl: 'https://sidmouth.gov.uk/webcams/the-esplanade-webcam/',
    waterType: 'coastal', coverage: 'nearby-shore', locationIds: ['ea-ukk4301-21800'],
    verification: 'verified', verifiedOn: '2026-11-13',
  },
  {
    id: 'uk-sidmouth-jacobs-ladder', name: 'Sidmouth · Jacobs Ladder',
    latitude: 50.6756, longitude: -3.2473, approximateCoordinates: true,
    sourceName: 'Sidmouth Town Council', pageUrl: 'https://sidmouth.gov.uk/webcams/jacobs-ladder/',
    waterType: 'coastal', coverage: 'nearby-shore', locationIds: ['ea-ukk4301-21900'],
    verification: 'verified', verifiedOn: '2026-11-13',
  },
  {
    id: 'uk-sidmouth-port-royal', name: 'Sidmouth · Port Royal',
    latitude: 50.67887, longitude: -3.2350, approximateCoordinates: true,
    sourceName: 'Sidmouth Town Council / Sidmouth Sailing Club', pageUrl: 'https://sidmouth.gov.uk/webcams/port-royal/',
    waterType: 'coastal', coverage: 'nearby-shore', locationIds: ['ea-ukk4301-21800'],
    verification: 'verified', verifiedOn: '2026-11-13',
  },
  {
    id: 'brighton-i360', name: 'Brighton i360', latitude: 50.8211, longitude: -0.1495,
    sourceName: 'Brighton CCTV', pageUrl: 'https://www.brightoncctv.co.uk/i360-cams', streams: BRIGHTON_STREAMS,
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['brighton', 'ea-ukj2100-14950'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'bournemouth-pier', name: 'Bournemouth Pier', latitude: 50.7162, longitude: -1.8751,
    sourceName: 'Bournemouth Tourism', pageUrl: 'https://www.bournemouth.co.uk/visitor-information/bournemouth-web-cam',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['bournemouth', 'ea-ukk2101-19100'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'fistral-beach', name: 'Fistral Beach', latitude: 50.4183, longitude: -5.1003,
    sourceName: 'Fistral Beach', pageUrl: 'https://fistralbeach.co.uk/fistral-beach-webcam/',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['fistral', 'ea-ukk3106-32200', 'ea-ukk3106-32150'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'blackpool-seafront', name: 'Blackpool seafront', latitude: 53.8116, longitude: -3.0568,
    sourceName: 'Viva Blackpool', pageUrl: 'https://www.vivablackpool.com/webcam/',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['blackpool', 'ea-ukd4200-42300', 'ea-ukd4200-42500'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'scarborough-south-bay', name: 'Scarborough South Bay', latitude: 54.2766, longitude: -0.3958,
    sourceName: 'Surf Forecast', pageUrl: 'https://www.surf-forecast.com/breaks/Scarborough-South-Bay/webcams/latest',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['scarborough-south', 'ea-uke2206-07400'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'tynemouth-longsands', name: 'Tynemouth Longsands', latitude: 55.0247, longitude: -1.4268,
    sourceName: 'Longsands Lodge', pageUrl: 'https://longsandslodge.co.uk/abouttynemouth/weather-and-surf/',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['ea-ukc2203-05000', 'ea-ukc2203-05100'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'llandudno-north-parade', name: 'Llandudno North Parade', latitude: 53.3253, longitude: -3.8279,
    sourceName: 'Min y Don Llandudno', pageUrl: 'https://www.minydonllandudno.co.uk/en-GB/llandudno-webcam',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['llandudno-north', 'nrw-ukl1301-40300'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'tenby-north-beach', name: 'Tenby Harbour & North Beach', latitude: 51.6749, longitude: -4.6998,
    sourceName: 'Stay Pembrokeshire', pageUrl: 'https://stay-pembrokeshire.co.uk/webcams/',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['tenby-north', 'nrw-ukl1403-38100'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
  {
    id: 'st-andrews-east-sands', name: 'St Andrews East Sands', latitude: 56.3348, longitude: -2.7791,
    sourceName: 'St Andrews Sailing Club', pageUrl: 'https://www.standrewssailing.org/page/webcam',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['sepa-9318'],
    verification: 'verified', checkedOn: '2026-11-13', verifiedOn: '2026-11-13',
  },
  {
    id: 'aberdeen-beach', name: 'Aberdeen Beach', latitude: 57.1552, longitude: -2.0797,
    sourceName: 'Aberdeen City Council', pageUrl: 'https://online.aberdeencity.gov.uk/services/Webcam/Default.aspx?cam=beach',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['aberdeen', 'sepa-233616'],
    verification: 'verified', checkedOn: '2026-11-13', verifiedOn: '2026-11-13',
  },
  {
    id: 'portrush-east-strand', name: 'Portrush East Strand', latitude: 55.2065, longitude: -6.6533,
    sourceName: 'Surf Forecast', pageUrl: 'https://www.surf-forecast.com/breaks/Portrush_East-Strand/webcams/latest',
    waterType: 'coastal', coverage: 'nearby-shore',
    locationIds: ['daera-30047'],
    verification: 'unconfirmed', checkedOn: '2026-11-13',
  },
]

function distanceInKm(first, second) {
  const radius = 6371
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(second.latitude - first.latitude)
  const longitudeDelta = radians(second.longitude - first.longitude)
  const firstLatitude = radians(first.latitude)
  const secondLatitude = radians(second.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function getWebcamsForLocation(location, maximumDistanceKm = 20) {
  if (!location) return []
  // Legacy UK detail responses carry the type on their matched official site.
  const waterType = location.waterType ?? location.waterQuality?.site?.waterType
  return VERIFIED_WEBCAMS.filter(webcam => (!webcam.locationIds || webcam.locationIds.includes(location.id) && waterType === webcam.waterType))
    .filter(webcam => !webcam.waterBodyId || webcam.waterBodyId === 'balaton' && (location.waterBodyId === 'balaton' || isBalaton(location)))
    .map(webcam => ({ ...webcam, distance: distanceInKm(location, webcam) }))
    .filter(webcam => webcam.distance <= maximumDistanceKm)
    .sort((first, second) => first.distance - second.distance)
}
export function getWebcamForLocation(location, maximumDistanceKm = 20) {
  return getWebcamsForLocation(location, maximumDistanceKm)[0] ?? null
}
