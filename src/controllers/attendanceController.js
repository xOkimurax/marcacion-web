import pool, { toRow } from '../db.js';
import { calculateDistance } from '../utils/haversine.js';

export async function markAttendance(req, res) {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.userId;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Latitude and longitude must be valid numbers.' });
    }

    const { rows: configs } = await pool.query('SELECT * FROM location_config LIMIT 1');
    const locationConfig = configs[0] ? toRow(configs[0]) : null;

    if (!locationConfig) {
      return res.status(503).json({ error: 'Location configuration not set. Contact an administrator.' });
    }

    const distance = calculateDistance(lat, lon, locationConfig.latitude, locationConfig.longitude);

    if (distance > locationConfig.radiusMeters) {
      await pool.query(
        `INSERT INTO failed_attempts (user_id, user_email, latitude, longitude, reason, distance_meters)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          req.user.email,
          lat,
          lon,
          `User is ${Math.round(distance)}m away. Max allowed: ${locationConfig.radiusMeters}m.`,
          distance,
        ]
      );
      return res.status(403).json({
        error: 'You are outside the allowed attendance location.',
        data: { distanceMeters: Math.round(distance), radiusMeters: locationConfig.radiusMeters, locationName: locationConfig.name },
      });
    }

    // Determine ENTRY or EXIT based on last attendance today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { rows: lastRows } = await pool.query(
      `SELECT * FROM attendances
       WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3 AND is_valid = true
       ORDER BY timestamp DESC LIMIT 1`,
      [userId, todayStart.toISOString(), todayEnd.toISOString()]
    );

    const last = lastRows[0] ? toRow(lastRows[0]) : null;
    const attendanceType = !last || last.type === 'EXIT' ? 'ENTRY' : 'EXIT';

    const { rows: created } = await pool.query(
      `INSERT INTO attendances (user_id, type, latitude, longitude, is_valid)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [userId, attendanceType, lat, lon]
    );

    const { rows: userRows } = await pool.query(
      'SELECT id, name, email, picture FROM users WHERE id = $1',
      [userId]
    );

    const attendance = toRow(created[0]);
    attendance.user = toRow(userRows[0]) || null;

    return res.status(201).json({
      success: true,
      message: `${attendanceType === 'ENTRY' ? 'Entry' : 'Exit'} marked successfully.`,
      data: attendance,
    });
  } catch (error) {
    console.error('markAttendance error:', error);
    return res.status(500).json({ error: 'An error occurred while marking attendance.' });
  }
}

export async function getMyHistory(req, res) {
  try {
    const userId = req.user.userId;
    const { page = '1', limit = '20', startDate, endDate } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['user_id = $1'];
    const params = [userId];
    let i = 2;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(`timestamp >= $${i++}`);
      params.push(start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(`timestamp <= $${i++}`);
      params.push(end.toISOString());
    }

    const where = conditions.join(' AND ');

    const [countResult, records] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM attendances WHERE ${where}`, params),
      pool.query(
        `SELECT * FROM attendances WHERE ${where} ORDER BY timestamp DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limitNum, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return res.status(200).json({
      success: true,
      data: {
        records: records.rows.map(toRow),
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error('getMyHistory error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching attendance history.' });
  }
}

export async function getAttendanceStatus(req, res) {
  try {
    const userId = req.user.userId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { rows } = await pool.query(
      `SELECT * FROM attendances
       WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3 AND is_valid = true
       ORDER BY timestamp DESC LIMIT 1`,
      [userId, todayStart.toISOString(), todayEnd.toISOString()]
    );

    const last = rows[0] ? toRow(rows[0]) : null;
    const nextType = !last || last.type === 'EXIT' ? 'ENTRY' : 'EXIT';

    return res.status(200).json({
      success: true,
      data: { lastAttendance: last, nextType },
    });
  } catch (error) {
    console.error('getAttendanceStatus error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching status.' });
  }
}
