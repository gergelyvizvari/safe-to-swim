// Shape-preserving cubic interpolation: pass through samples without inventing extrema.
export function smoothTidePath(points) {
  if (!points.length) return ''
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x))
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0] ?? 0
    if (index === points.length - 1) return slopes.at(-1) ?? 0
    const before = slopes[index - 1]
    const after = slopes[index]
    if (before * after <= 0) return 0
    const left = points[index].x - points[index - 1].x
    const right = points[index + 1].x - points[index].x
    const w1 = 2 * right + left
    const w2 = right + 2 * left
    return (w1 + w2) / (w1 / before + w2 / after)
  })
  return points.reduce((path, point, index) => {
    if (!index) return `M${point.x},${point.y}`
    const previous = points[index - 1]
    const span = (point.x - previous.x) / 3
    const limit = 3 * Math.abs(slopes[index - 1])
    const clamp = (value) => Math.sign(value) * Math.min(Math.abs(value), limit)
    return `${path} C${previous.x + span},${previous.y + clamp(tangents[index - 1]) * span} ${point.x - span},${point.y - clamp(tangents[index]) * span} ${point.x},${point.y}`
  }, '')
}
