import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js';
import { signToken } from '../utils/jwt.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Handles Google OAuth login.
 * Verifies the Google ID token, then creates or updates the User record.
 * Returns a signed JWT and user info on success.
 */
export async function googleLogin(req, res) {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required.',
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId || process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token.',
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not available from Google account.',
      });
    }

    // Upsert user: try to find by googleId first, then by email
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link existing email-only account with Google
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId,
            name: name || user.name,
            picture: picture || user.picture,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId,
            email,
            name: name || email,
            picture,
            role: 'EMPLOYEE',
            isActive: true,
          },
        });
      }
    } else {
      // Update existing Google-linked user info
      user = await prisma.user.update({
        where: { googleId },
        data: {
          name: name || user.name,
          picture: picture || user.picture,
          updatedAt: new Date(),
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('googleLogin error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during Google login.',
    });
  }
}

/**
 * Handles admin username/password login.
 * Returns a signed JWT with isAdmin:true on success.
 */
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const adminUser = await prisma.adminUser.findUnique({ where: { username } });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = signToken({
      id: adminUser.id,
      username: adminUser.username,
      isAdmin: true,
      role: 'ADMIN',
    });

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
      },
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during admin login.',
    });
  }
}

/**
 * Returns the authenticated user's full profile from the database.
 * Requires auth middleware (populates req.user).
 */
export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user info.',
    });
  }
}

/**
 * Returns the authenticated admin's info.
 * Requires adminAuth middleware (populates req.admin).
 */
export async function getAdminMe(req, res) {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found.',
      });
    }

    return res.status(200).json({
      success: true,
      admin: adminUser,
    });
  } catch (error) {
    console.error('getAdminMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching admin info.',
    });
  }
}
