/**
 * Great-circle distance helpers for GPS trails.
 *
 * Used to turn a day's location pings into a travelled-distance figure, which
 * is what a manager checks a travel expense claim against.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Distance in kilometres between two {latitude, longitude} points. */
const distanceKm = (a, b) => {
  if (!a || !b) return 0;
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);
  if ([lat1, lon1, lat2, lon2].some((n) => !Number.isFinite(n))) return 0;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * Total distance along an ordered list of pings.
 *
 * `maxJumpKm` discards GPS glitches (a sudden teleport across the map would
 * otherwise inflate the claim); `minStepKm` discards jitter while stationary.
 */
const routeDistanceKm = (points, { maxJumpKm = 50, minStepKm = 0.02 } = {}) => {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const step = distanceKm(points[i - 1], points[i]);
    if (step >= minStepKm && step <= maxJumpKm) total += step;
  }
  return total;
};

module.exports = { distanceKm, routeDistanceKm };
