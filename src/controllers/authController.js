import fetch from 'node-fetch';
import pool, { toRow } from '../db.js';
import { signToken } from '../utils/jwt.js';

const INSFORGE_URL = process.env.INSFORGE_URL || 'https://9bc8pwrr.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_6fff462b006815d5836170080d3122c3';

// Almacén temporal de codeVerifiers (en memoria, TTL 10 minutos)
const codeVerifierStore = new Map();
const CODE_VERIFIER_TTL = 10 * 60 * 1000;

function storeCodeVerifier(codeChallenge, codeVerifier) {
  codeVerifierStore.set(codeChallenge, { codeVerifier, expiresAt: Date.now() + CODE_VERIFIER_TTL });
  // Limpiar entradas expiradas
  for (const [k, v] of codeVerifierStore) {
    if (v.expiresAt < Date.now()) codeVerifierStore.delete(k);
  }
}

function getCodeVerifier(codeChallenge) {
  const entry = codeVerifierStore.get(codeChallenge);
  if (!entry || entry.expiresAt < Date.now()) return null;
  codeVerifierStore.delete(codeChallenge);
  return entry.codeVerifier;
}

// GET /api/auth/oauth/google/url
export async function getGoogleOAuthUrl(req, res) {
  try {
    const redirectUri = process.env.FRONTEND_URL + '/auth/callback';
    const crypto = await import('crypto');
    const codeVerifier = crypto.randomBytes(48).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // Guardar codeVerifier indexado por codeChallenge
    storeCodeVerifier(codeChallenge, codeVerifier);

    const insforgeUrl = `${INSFORGE_URL}/api/auth/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${codeChallenge}`;

    const insforgeRes = await fetch(insforgeUrl, {
      headers: { 'x-api-key': INSFORGE_API_KEY },
    });

    if (!insforgeRes.ok) throw new Error(`InsForge responded with ${insforgeRes.status}`);

    const data = await insforgeRes.json();
    const finalUrl = data.authUrl || data.url;
    if (!finalUrl) throw new Error('InsForge did not return an auth URL');

    return res.json({ url: finalUrl });
  } catch (error) {
    console.error('getGoogleOAuthUrl error:', error);
    return res.status(500).json({ error: 'Error generating OAuth URL.' });
  }
}

// POST /api/auth/exchange — intercambia insforge_code por token propio
export async function exchangeCode(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required.' });

    // Buscar todos los codeVerifiers disponibles e intentar con cada uno
    // InsForge manda el codeChallenge en el state del callback
    let codeVerifier = null;
    
    // Intentar obtener el state del request (si el frontend lo manda)
    const { state } = req.body;
    if (state) {
      codeVerifier = getCodeVerifier(state);
    }
    
    // Si no, tomar el primero disponible (solo hay uno activo a la vez por usuario)
    if (!codeVerifier && codeVerifierStore.size > 0) {
      const [firstKey, firstVal] = codeVerifierStore.entries().next().value;
      codeVerifier = firstVal.codeVerifier;
      codeVerifierStore.delete(firstKey);
    }

    if (!codeVerifier) {
      return res.status(400).json({ error: 'Session expired. Please try logging in again.' });
    }

    // Exchange con InsForge
    const exchangeRes = await fetch(`${INSFORGE_URL}/api/auth/oauth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INSFORGE_API_KEY,
      },
      body: JSON.stringify({ insforge_code: code, code, code_verifier: codeVerifier }),
    });

    if (!exchangeRes.ok) {
      const errData = await exchangeRes.json().catch(() => ({}));
      console.error('InsForge exchange error:', errData);
      return res.status(401).json({ error: 'Failed to exchange code.', detail: errData });
    }

    const exchangeData = await exchangeRes.json();
    const insforgeToken = exchangeData.access_token || exchangeData.token;
    if (!insforgeToken) {
      return res.status(401).json({ error: 'No token in exchange response.', detail: exchangeData });
    }

    req.body.token = insforgeToken;
    return verifyInsforgeToken(req, res);
  } catch (error) {
    console.error('exchangeCode error:', error);
    return res.status(500).json({ error: 'Error exchanging code.' });
  }
}

// POST /api/auth/verify
export async function verifyInsforgeToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required.' });

    const meRes = await fetch(`${INSFORGE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': INSFORGE_API_KEY,
      },
    });

    if (!meRes.ok) return res.status(401).json({ error: 'Invalid InsForge token.' });

    const meData = await meRes.json();
    const { id: insforgeId, email, name, avatarUrl: picture } = meData.user || meData;
    if (!email) return res.status(400).json({ error: 'Email not available.' });

    let { rows } = await pool.query('SELECT * FROM users WHERE insforge_id = $1 OR email = $2', [insforgeId, email]);
    let user = rows[0];

    if (!user) {
      const created = await pool.query(
        `INSERT INTO users (insforge_id, email, name, picture, role, is_active)
         VALUES ($1, $2, $3, $4, 'EMPLOYEE', true) RETURNING *`,
        [insforgeId, email, name || email, picture]
      );
      user = created.rows[0];
    } else {
      const updated = await pool.query(
        `UPDATE users SET insforge_id = $1, name = $2, picture = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [insforgeId, name || user.name, picture || user.picture, user.id]
      );
      user = updated.rows[0];
    }

    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated.' });

    const u = toRow(user);
    const jwtToken = signToken({ userId: u.id, email: u.email, name: u.name, role: u.role });
    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: { id: u.id, email: u.email, name: u.name, picture: u.picture, role: u.role, isActive: u.isActive },
    });
  } catch (error) {
    console.error('verifyInsforgeToken error:', error);
    return res.status(500).json({ error: 'An error occurred during authentication.' });
  }
}

export async function googleLogin(req, res) {
  const { token, insforgeToken } = req.body;
  req.body.token = token || insforgeToken;
  return verifyInsforgeToken(req, res);
}

export async function getMe(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    const u = toRow(rows[0]);
    return res.status(200).json({ success: true, user: u });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'An error occurred.' });
  }
}
