declare const module: { exports: unknown }

interface GesturePoint {
  x: number
  y: number
  time: number
}

/** 仅接受方向清楚、距离足够且时长合理的上滑，过滤轻触和横向滚动。 */
function isUpwardCoinGesture(start: GesturePoint, end: GesturePoint): boolean {
  const deltaX = Math.abs(end.x - start.x)
  const deltaY = start.y - end.y
  const duration = end.time - start.time
  return duration >= 60 &&
    duration <= 1200 &&
    deltaY >= 70 &&
    deltaY >= deltaX * 1.25
}

module.exports = {
  isUpwardCoinGesture
}
