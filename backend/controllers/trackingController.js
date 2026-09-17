const LocationPing = require('../models/LocationPing');
const User = require('../models/User');
const { routeDistanceKm } = require('../utils/haversine');

const OVERSIGHT_ROLES = new Set([
  'Super Admin',
  'Admin',
  'Manager',
  'Executive Manager',
  'Coordinator',
  'Senior Coordinator',
  'Finance Manager',
]);

const canSeeAll = (user) => OVERSIGHT_ROLES.has(String(user?.role || '').trim());

/** Start/end of a calendar day (server timezone). */
const dayRange = (dateStr) => {
  const start = dateStr ? new Date(dateStr) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Record GPS ping(s) from the mobile app. Accepts one or a batch.
// @route   POST /api/tracking/ping
// @access  Private
const recordPing = async (req, res) => {
  try {
    const body = req.body || {};
    const incoming = Array.isArray(body.pings) ? body.pings : [body];

    const docs = incoming
      .filter((p) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
      .map((p) => ({
        employeeId: req.user._id,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        accuracy: p.accuracy,
        speed: p.speed,
        batteryLevel: p.batteryLevel,
        recordedAt: p.recordedAt ? new Date(p.recordedAt) : new Date(),
        isOffline: Boolean(p.isOffline),
        source: p.source || 'background',
      }));

    if (!docs.length) {
      return res.status(400).json({ message: 'No valid coordinates supplied' });
    }

    await LocationPing.insertMany(docs, { ordered: false });
    res.status(201).json({ saved: docs.length });
  } catch (error) {
    console.error('Error recording location ping:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee Tracking report — last known position per employee
// @route   GET /api/tracking/latest
// @access  Private
const getLatestPositions = async (req, res) => {
  try {
    if (!canSeeAll(req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { zone } = req.query;
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // last 7 days

    const latest = await LocationPing.aggregate([
      { $match: { recordedAt: { $gte: since } } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$employeeId',
          latitude: { $first: '$latitude' },
          longitude: { $first: '$longitude' },
          lastUsed: { $first: '$recordedAt' },
          started: { $last: '$recordedAt' },
          pings: { $sum: 1 },
        },
      },
    ]);

    const users = await User.find({ _id: { $in: latest.map((l) => l._id) } })
      .select('name email phone mobile zone role')
      .lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));

    let rows = latest.map((l) => {
      const u = byId.get(String(l._id)) || {};
      return {
        employeeId: l._id,
        name: u.name,
        mobile: u.mobile || u.phone,
        zone: u.zone,
        role: u.role,
        started: l.started,
        lastUsed: l.lastUsed,
        lastLocation: { latitude: l.latitude, longitude: l.longitude },
        pings: l.pings,
      };
    });

    if (zone && zone !== 'all') rows = rows.filter((r) => r.zone === zone);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching latest positions:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    One employee's route for a day (for map replay) + distance travelled
// @route   GET /api/tracking/:employeeId/route
// @access  Private
const getEmployeeRoute = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!canSeeAll(req.user) && String(employeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { start, end } = dayRange(req.query.date);

    const pings = await LocationPing.find({
      employeeId,
      recordedAt: { $gte: start, $lte: end },
    })
      .select('latitude longitude recordedAt accuracy speed')
      .sort({ recordedAt: 1 })
      .lean();

    const distanceKm = routeDistanceKm(pings);

    res.json({
      employeeId,
      date: start,
      points: pings,
      pointCount: pings.length,
      distanceKm: Number(distanceKm.toFixed(2)),
      firstPingAt: pings[0]?.recordedAt || null,
      lastPingAt: pings[pings.length - 1]?.recordedAt || null,
    });
  } catch (error) {
    console.error('Error fetching employee route:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Distance travelled per day over a range — backs the expense GPS check
// @route   GET /api/tracking/:employeeId/distance
// @access  Private
const getEmployeeDistance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!canSeeAll(req.user) && String(employeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { fromDate, toDate } = req.query;
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    from.setHours(0, 0, 0, 0);
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);

    const pings = await LocationPing.find({
      employeeId,
      recordedAt: { $gte: from, $lte: to },
    })
      .select('latitude longitude recordedAt')
      .sort({ recordedAt: 1 })
      .lean();

    // Group by calendar day, then measure each day's route separately.
    const byDay = new Map();
    pings.forEach((p) => {
      const key = new Date(p.recordedAt).toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(p);
    });

    const days = [...byDay.entries()]
      .map(([date, points]) => ({
        date,
        distanceKm: Number(routeDistanceKm(points).toFixed(2)),
        pointCount: points.length,
      }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    res.json({
      employeeId,
      fromDate: from,
      toDate: to,
      totalDistanceKm: Number(days.reduce((s, d) => s + d.distanceKm, 0).toFixed(2)),
      days,
    });
  } catch (error) {
    console.error('Error computing employee distance:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  recordPing,
  getLatestPositions,
  getEmployeeRoute,
  getEmployeeDistance,
};
