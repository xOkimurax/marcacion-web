import { OAuth2Client } from 'google-auth-library';
import pool, { toRow } from '../db.js';
import { signToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  try {
    const { googleToken, credential } = req.body;
    const idToken = googleToken || credential;

    if (!idToken) {
      return res.status(400).json({ error: 'googleToken is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token.' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not available from Google account.' });
    }

    // Find by google_id or email, then upsert
    let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = rows[0];

    if (!user) {
      const byEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (byEmail.rows[0]) {
        // Link existing user
        const updated = await pool.query(
          `UPDATE users SET google_id = $1, name = $2, picture = $3, updated_at = NOW()
           WHERE email = $4 RETURNING *`,
          [googleId, name || byEmail.rows[0].name, picture || byEmail.rows[0].picture, email]
        );
        user = updated.rows[0];
      } else {
        // Create new user
        const created = await pool.query(
          `INSERT INTO users (google_id, email, name, picture, role, is_active)
           VALUES ($1, $2, $3, $4, 'EMPLOYEE', true) RETURNING *`,
          [googleId, email, name || email, picture]
        );
        user = created.rows[0];
      }
    } else {
      const updated = await pool.query(
        `UPDATE users SET name = $1, picture = $2, updated_at = NOW()
         WHERE google_id = $3 RETURNING *`,
        [name || user.name, picture || user.picture, googleId]
      );
      user = updated.rows[0];
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact an administrator.' });
    }

    const u = toRow(user);
    const token = signToken({ userId: u.id, email: u.email, name: u.name, role: u.role });

    return res.status(200).json({
      success: true,
      token,
      user: { id: u.id, email: u.email, name: u.name, picture: u.picture, role: u.role, isActive: u.isActive },
    });
  } catch (error) {
    console.error('googleLogin error:', error);
    return res.status(500).json({ error: 'An error occurred during Google login.' });
  }
}

export async function getMe(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    const u = toRow(rows[0]);
    return res.status(200).json({ success: true, user: u });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'An error occurred while fetching user info.' });
  }
}
