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
    id: 'brighton-i360', name: 'Brighton i360', latitude: 50.8211, longitude: -0.1495,
    sourceName: 'Brighton CCTV', pageUrl: 'https://www.brightoncctv.co.uk/i360-cams', streams: BRIGHTON_STREAMS,
  },
  {
    id: 'bournemouth-pier', name: 'Bournemouth Pier', latitude: 50.7162, longitude: -1.8751,
    sourceName: 'Bournemouth Tourism', pageUrl: 'https://www.bournemouth.co.uk/visitor-information/bournemouth-web-cam',
  },
  {
    id: 'fistral-beach', name: 'Fistral Beach', latitude: 50.4183, longitude: -5.1003,
    sourceName: 'Fistral Beach', pageUrl: 'https://fistralbeach.co.uk/fistral-beach-webcam/fb-website-webcam-page-2/',
  },
  {
    id: 'blackpool-seafront', name: 'Blackpool seafront', latitude: 53.8116, longitude: -3.0568,
    sourceName: 'Viva Blackpool', pageUrl: 'https://www.vivablackpool.com/webcam/',
  },
  {
    id: 'scarborough-south-bay', name: 'Scarborough South Bay', latitude: 54.2766, longitude: -0.3958,
    sourceName: 'Surf Forecast', pageUrl: 'https://www.surf-forecast.com/breaks/Scarborough-South-Bay/webcams/latest',
  },
  {
    id: 'tynemouth-longsands', name: 'Tynemouth Longsands', latitude: 55.0247, longitude: -1.4268,
    sourceName: 'Longsands Lodge', pageUrl: 'https://longsandslodge.co.uk/abouttynemouth/weather-and-surf/',
  },
  {
    id: 'llandudno-north-parade', name: 'Llandudno North Parade', latitude: 53.3253, longitude: -3.8279,
    sourceName: 'Min y Don Llandudno', pageUrl: 'https://www.minydonllandudno.co.uk/en-GB/llandudno-webcam',
  },
  {
    id: 'tenby-north-beach', name: 'Tenby Harbour & North Beach', latitude: 51.6749, longitude: -4.6998,
    sourceName: 'Stay Pembrokeshire', pageUrl: 'https://stay-pembrokeshire.co.uk/webcams/',
  },
  {
    id: 'st-andrews-east-sands', name: 'St Andrews East Sands', latitude: 56.3348, longitude: -2.7791,
    sourceName: 'St Andrews Sailing Club', pageUrl: 'https://www.standrewssailing.org/page/webcam',
  },
  {
    id: 'aberdeen-beach', name: 'Aberdeen Beach', latitude: 57.1552, longitude: -2.0797,
    sourceName: 'Aberdeen City Council', pageUrl: 'https://online.aberdeencity.gov.uk/services/Webcam/Default.aspx?cam=beach',
  },
  {
    id: 'portrush-east-strand', name: 'Portrush East Strand', latitude: 55.2065, longitude: -6.6533,
    sourceName: 'Surf Forecast', pageUrl: 'https://www.surf-forecast.com/breaks/Portrush_East-Strand/webcams/latest',
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

export function getWebcamForLocation(location, maximumDistanceKm = 20) {
  if (!location) return null

  const nearest = VERIFIED_WEBCAMS
    .map((webcam) => ({ ...webcam, distance: distanceInKm(location, webcam) }))
    .sort((first, second) => first.distance - second.distance)[0]

  return nearest && nearest.distance <= maximumDistanceKm ? nearest : null
}
