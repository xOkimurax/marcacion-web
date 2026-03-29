import pool, { toRow } from '../db.js';

export async function getDashboardToday(req, res) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { rows } = await pool.query(
      `SELECT a.*, u.id as u_id, u.name as u_name, u.email as u_email, u.picture as u_picture, u.role as u_role
       FROM attendances a JOIN users u ON a.user_id = u.id
       WHERE a.timestamp >= $1 AND a.timestamp <= $2
       ORDER BY a.timestamp ASC`,
      [todayStart.toISOString(), todayEnd.toISOString()]
    );

    const userMap = new Map();
    for (const row of rows) {
      const uid = row.user_id;
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          user: { id: row.u_id, name: row.u_name, email: row.u_email, picture: row.u_picture, role: row.u_role },
          records: [],
        });
      }
      const attendance = toRow(row);
      delete attendance.uId;
      delete attendance.uName;
      delete attendance.uEmail;
      delete attendance.uPicture;
      delete attendance.uRole;
      userMap.get(uid).records.push(attendance);
    }

    const summary = Array.from(userMap.values()).map(({ user, records }) => {
      const entries = records.filter((r) => r.type === 'ENTRY');
      const exits = records.filter((r) => r.type === 'EXIT');
      return {
        user,
        firstEntry: entries[0] || null,
        lastExit: exits[exits.length - 1] || null,
        totalRecords: records.length,
        records,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        date: todayStart.toISOString().split('T')[0],
        totalAttendances: rows.length,
        employees: summary,
      },
    });
  } catch (error) {
    console.error('getDashboardToday error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching dashboard data.' });
  }
}

export async function getFullHistory(req, res) {
  try {
    const { userId, startDate, endDate, page = '1', limit = '20', date } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let i = 1;

    if (userId) { conditions.push(`a.user_id = $${i++}`); params.push(userId); }

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      conditions.push(`a.timestamp >= $${i++}`); params.push(start.toISOString());
      conditions.push(`a.timestamp <= $${i++}`); params.push(end.toISOString());
    } else {
      if (startDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        conditions.push(`a.timestamp >= $${i++}`); params.push(start.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        conditions.push(`a.timestamp <= $${i++}`); params.push(end.toISOString());
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, records] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM attendances a JOIN users u ON a.user_id = u.id ${where}`,
        params
      ),
      pool.query(
        `SELECT a.*, u.id as u_id, u.name as u_name, u.email as u_email, u.picture as u_picture
         FROM attendances a JOIN users u ON a.user_id = u.id
         ${where} ORDER BY a.timestamp DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limitNum, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const result = records.rows.map((row) => {
      const att = toRow(row);
      att.user = { id: att.uId, name: att.uName, email: att.uEmail, picture: att.uPicture };
      delete att.uId; delete att.uName; delete att.uEmail; delete att.uPicture;
      return att;
    });

    return res.status(200).json({
      success: true,
      data: {
        records: result,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error('getFullHistory error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching attendance history.' });
  }
}

export async function getEmployees(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users ORDER BY name ASC'
    );
    return res.status(200).json({ success: true, data: rows.map(toRow) });
  } catch (error) {
    console.error('getEmployees error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching employees.' });
  }
}

export async function createEmployee(req, res) {
  try {
    const { email, name, isActive = true } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (email, name, is_active, role)
       VALUES ($1, $2, $3, 'EMPLOYEE') RETURNING *`,
      [email, name, Boolean(isActive)]
    );

    return res.status(201).json({ success: true, message: 'Employee created successfully.', data: toRow(rows[0]) });
  } catch (error) {
    console.error('createEmployee error:', error);
    return res.status(500).json({ error: 'An error occurred while creating the employee.' });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { isActive, name, role } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const sets = [];
    const params = [];
    let i = 1;

    if (isActive !== undefined) { sets.push(`is_active = $${i++}`); params.push(Boolean(isActive)); }
    if (name !== undefined) { sets.push(`name = $${i++}`); params.push(name); }
    if (role !== undefined) { sets.push(`role = $${i++}`); params.push(role); }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );

    return res.status(200).json({ success: true, message: 'Employee updated successfully.', data: toRow(rows[0]) });
  } catch (error) {
    console.error('updateEmployee error:', error);
    return res.status(500).json({ error: 'An error occurred while updating the employee.' });
  }
}

export async function getLocation(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM location_config LIMIT 1');
    return res.status(200).json({ success: true, data: rows[0] ? toRow(rows[0]) : null });
  } catch (error) {
    console.error('getLocation error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching location configuration.' });
  }
}

export async function updateLocation(req, res) {
  try {
    const { name, latitude, longitude, radiusMeters } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required.' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = radiusMeters !== undefined ? parseFloat(radiusMeters) : 100;

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
      return res.status(400).json({ error: 'Latitude, longitude, and radiusMeters must be valid numbers.' });
    }

    const existing = await pool.query('SELECT id FROM location_config LIMIT 1');
    let rows;

    if (existing.rows[0]) {
      ({ rows } = await pool.query(
        `UPDATE location_config SET name = $1, latitude = $2, longitude = $3, radius_meters = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [name, lat, lon, radius, existing.rows[0].id]
      ));
    } else {
      ({ rows } = await pool.query(
        `INSERT INTO location_config (name, latitude, longitude, radius_meters)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, lat, lon, radius]
      ));
    }

    return res.status(200).json({ success: true, message: 'Location configuration updated.', data: toRow(rows[0]) });
  } catch (error) {
    console.error('updateLocation error:', error);
    return res.status(500).json({ error: 'An error occurred while updating location configuration.' });
  }
}

export async function getFailedAttempts(req, res) {
  try {
    const { userId, startDate, endDate, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let i = 1;

    if (userId) { conditions.push(`f.user_id = $${i++}`); params.push(userId); }
    if (startDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      conditions.push(`f.timestamp >= $${i++}`); params.push(start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      conditions.push(`f.timestamp <= $${i++}`); params.push(end.toISOString());
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, records] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM failed_attempts f ${where}`, params),
      pool.query(
        `SELECT f.*, u.id as u_id, u.name as u_name, u.email as u_email, u.picture as u_picture
         FROM failed_attempts f LEFT JOIN users u ON f.user_id = u.id
         ${where} ORDER BY f.timestamp DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limitNum, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const result = records.rows.map((row) => {
      const fa = toRow(row);
      fa.user = fa.uId ? { id: fa.uId, name: fa.uName, email: fa.uEmail, picture: fa.uPicture } : null;
      delete fa.uId; delete fa.uName; delete fa.uEmail; delete fa.uPicture;
      return fa;
    });

    return res.status(200).json({
      success: true,
      data: {
        records: result,
        pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error('getFailedAttempts error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching failed attempts.' });
  }
}

export async function exportReport(req, res) {
  try {
    const { startDate, endDate, userId } = req.query;

    const conditions = [];
    const params = [];
    let i = 1;

    if (userId) { conditions.push(`a.user_id = $${i++}`); params.push(userId); }
    if (startDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      conditions.push(`a.timestamp >= $${i++}`); params.push(start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate); end.setHours(23, 59, 59, 999);
      conditions.push(`a.timestamp <= $${i++}`); params.push(end.toISOString());
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT a.*, u.name as u_name, u.email as u_email
       FROM attendances a JOIN users u ON a.user_id = u.id
       ${where} ORDER BY a.timestamp ASC`,
      params
    );

    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = 'ID,User ID,User Name,User Email,Type,Latitude,Longitude,Timestamp,Is Valid,Notes\n';
    const csvRows = rows.map((r) => [
      esc(r.id), esc(r.user_id), esc(r.u_name), esc(r.u_email),
      esc(r.type), esc(r.latitude), esc(r.longitude),
      esc(new Date(r.timestamp).toISOString()), esc(r.is_valid), esc(r.notes),
    ].join(','));

    const filename = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(header + csvRows.join('\n'));
  } catch (error) {
    console.error('exportReport error:', error);
    return res.status(500).json({ error: 'An error occurred while generating the report.' });
  }
}
