// OSM directed coastlines have land on the left and water on the right.
export const normalizeBearing = value => ((value % 360) + 360) % 360
const delta = (a, b) => Math.abs(normalizeBearing(a - b + 180) - 180)
export function estimateSeaBearing(site, elements, { radius = 60, maxDistance = 150, maxSpread = 40 } = {}) {
  if ((site.waterType ?? 'coastal') !== 'coastal') return { reason: 'not-coastal' }
  if (![site.latitude,site.longitude].every(Number.isFinite) || Math.abs(site.latitude) >= 85 || Math.abs(site.longitude) > 180) return { reason: 'invalid-coordinate' }
  const sx = 111320 * Math.cos(site.latitude * Math.PI / 180), sy = 111320
  const segments = []
  for (const way of elements ?? []) {
    if (way.type !== 'way' || way.tags?.natural !== 'coastline' || !Array.isArray(way.geometry)) continue
    for (let i = 1; i < way.geometry.length; i++) {
      const a = way.geometry[i-1], b = way.geometry[i]
      if (![a?.lon,a?.lat,b?.lon,b?.lat].every(Number.isFinite)) continue
      const x=(a.lon-site.longitude)*sx,y=(a.lat-site.latitude)*sy, dx=(b.lon-a.lon)*sx,dy=(b.lat-a.lat)*sy
      const length=Math.hypot(dx,dy)
      if (length < 1 || length > 1000) continue
      const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(length*length)))
      segments.push({x,y,dx,dy,length,px:x+t*dx,py:y+t*dy,distance:Math.hypot(x+t*dx,y+t*dy),wayId:way.id,version:way.version,index:i-1,bearing:normalizeBearing(Math.atan2(dx,dy)*180/Math.PI+90)})
    }
  }
  segments.sort((a,b)=>a.distance-b.distance)
  const nearest=segments[0]
  if (!nearest || nearest.distance > maxDistance) return {reason:'no-local-coastline'}
  // Clip segments to a local circle around the nearest shoreline point. Sharp
  // turns and competing harbour/island shores stay unresolved for map review.
  const local=[]
  for(const s of segments) {
    const ax=s.x-nearest.px,ay=s.y-nearest.py
    const mid=-(ax*s.dx+ay*s.dy)/(s.length*s.length)
    const perp2=ax*ax+ay*ay-mid*mid*s.length*s.length
    if(perp2>radius*radius)continue
    const half=Math.sqrt(Math.max(0,radius*radius-perp2))/s.length
    const extent=Math.min(1,mid+half)-Math.max(0,mid-half)
    if(extent>0)local.push({...s,weight:extent*s.length})
  }
  if(local.some(a=>local.some(b=>delta(a.bearing,b.bearing)>maxSpread)))return {reason:'complex-local-coastline',distanceMetres:Math.round(nearest.distance),wayIds:[...new Set(local.map(s=>s.wayId))]}
  const length=local.reduce((sum,s)=>sum+s.weight,0)
  if(length<radius)return {reason:'insufficient-local-coastline'}
  const east=local.reduce((sum,s)=>sum+s.dx/s.length*s.weight,0),north=local.reduce((sum,s)=>sum+s.dy/s.length*s.weight,0)
  return {seaBearing:normalizeBearing(Math.round(normalizeBearing(Math.atan2(east,north)*180/Math.PI+90))),distanceMetres:Math.round(nearest.distance),radiusMetres:radius,wayIds:[...new Set(local.map(s=>s.wayId))],nearestSegment:nearest.index,nearestWayId:nearest.wayId,shorePoint:{latitude:site.latitude+nearest.py/sy,longitude:site.longitude+nearest.px/sx},method:'length-weighted-local-coastline-right-normal',precision:'estimated'}
}
