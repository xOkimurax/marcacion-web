import { prisma } from '../server.js';
import { calculateDistance } from '../utils/haversine.js';

/**
 * Marks an attendance record (ENTRY or EXIT) for the authenticated user.
 * Validates that the user is within the configured location radius.
 * Automatically determines type based on last attendance today.
 */
export async function markAttendance(req, res) {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required.',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers.',
      });
    }

    // Fetch location configuration
    const locationConfig = await prisma.locationConfig.findFirst();

    if (!locationConfig) {
      return res.status(503).json({
        success: false,
        message: 'Location configuration not set. Please contact an administrator.',
      });
    }

    // Calculate distance from the configured location
    const distance = calculateDistance(
      lat,
      lon,
      locationConfig.latitude,
      locationConfig.longitude
    );

    // Check if user is within radius
    if (distance > locationConfig.radiusMeters) {
      // Save failed attempt record
      await prisma.failedAttempt.create({
        data: {
          userId,
          userEmail: req.user.email,
          latitude: lat,
          longitude: lon,
          reason: `User is ${Math.round(distance)} meters away from the allowed location. Maximum allowed radius is ${locationConfig.radiusMeters} meters.`,
          distanceMeters: distance,
        },
      });

      return res.status(403).json({
        success: false,
        message: 'You are outside the allowed attendance location.',
        data: {
          distanceMeters: Math.round(distance),
          radiusMeters: locationConfig.radiusMeters,
          locationName: locationConfig.name,
        },
      });
    }

    // Determine attendance type: check the last attendance today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const lastAttendanceToday = await prisma.attendance.findFirst({
      where: {
        userId,
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
        isValid: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // If no attendance today or last was EXIT, mark as ENTRY; otherwise mark as EXIT
    const attendanceType =
      !lastAttendanceToday || lastAttendanceToday.type === 'EXIT' ? 'ENTRY' : 'EXIT';

    // Save the attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        type: attendanceType,
        latitude: lat,
        longitude: lon,
        isValid: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `${attendanceType === 'ENTRY' ? 'Entry' : 'Exit'} marked successfully.`,
      data: attendance,
    });
  } catch (error) {
    console.error('markAttendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while marking attendance.',
    });
  }
}

/**
 * Returns paginated attendance history for the authenticated user.
 * Supports query params: page, limit, startDate, endDate.
 */
export async function getMyHistory(req, res) {
  try {
    const userId = req.user.id;
    const {
      page = '1',
      limit = '20',
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.timestamp.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('getMyHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching attendance history.',
    });
  }
}
