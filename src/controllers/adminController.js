import { prisma } from '../server.js';

/**
 * Returns today's attendance records with user info, sorted by timestamp.
 */
export async function getDashboardToday(req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Build a summary: for each user, get their first ENTRY and last EXIT of the day
    const userMap = new Map();
    for (const record of attendances) {
      const uid = record.userId;
      if (!userMap.has(uid)) {
        userMap.set(uid, { user: record.user, records: [] });
      }
      userMap.get(uid).records.push(record);
    }

    const summary = Array.from(userMap.values()).map(({ user, records }) => {
      const entries = records.filter((r) => r.type === 'ENTRY');
      const exits = records.filter((r) => r.type === 'EXIT');
      return {
        user,
        firstEntry: entries.length > 0 ? entries[0] : null,
        lastExit: exits.length > 0 ? exits[exits.length - 1] : null,
        totalRecords: records.length,
        records,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        date: startOfToday.toISOString().split('T')[0],
        totalAttendances: attendances.length,
        employees: summary,
      },
    });
  } catch (error) {
    console.error('getDashboardToday error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching dashboard data.',
    });
  }
}

/**
 * Returns all attendance records with filters and pagination.
 * Query params: userId, startDate, endDate, page, limit.
 */
export async function getFullHistory(req, res) {
  try {
    const {
      userId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

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
    console.error('getFullHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching attendance history.',
    });
  }
}

/**
 * Returns all users with role EMPLOYEE.
 */
export async function getEmployees(req, res) {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('getEmployees error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching employees.',
    });
  }
}

/**
 * Creates a new User with role EMPLOYEE.
 * Body: { email, name, isActive }
 */
export async function createEmployee(req, res) {
  try {
    const { email, name, isActive = true } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required.',
      });
    }

    // Check for existing user with the same email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const employee = await prisma.user.create({
      data: {
        email,
        name,
        isActive: Boolean(isActive),
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee,
    });
  } catch (error) {
    console.error('createEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the employee.',
    });
  }
}

/**
 * Updates a user's isActive and/or name by id.
 * Body: { isActive?, name? }
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { isActive, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.',
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('updateEmployee error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the employee.',
    });
  }
}

/**
 * Returns the current LocationConfig (first record), or a default placeholder.
 */
export async function getLocation(req, res) {
  try {
    const config = await prisma.locationConfig.findFirst();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No location configured yet.',
      });
    }

    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('getLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the location configuration.',
    });
  }
}

/**
 * Upserts the LocationConfig record.
 * Body: { name, latitude, longitude, radiusMeters }
 */
export async function updateLocation(req, res) {
  try {
    const { name, latitude, longitude, radiusMeters } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, latitude, and longitude are required.',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = radiusMeters !== undefined ? parseFloat(radiusMeters) : 100;

    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and radiusMeters must be valid numbers.',
      });
    }

    // Find the existing config to determine whether to create or update
    const existing = await prisma.locationConfig.findFirst();

    let config;
    if (existing) {
      config = await prisma.locationConfig.update({
        where: { id: existing.id },
        data: { name, latitude: lat, longitude: lon, radiusMeters: radius },
      });
    } else {
      config = await prisma.locationConfig.create({
        data: { name, latitude: lat, longitude: lon, radiusMeters: radius },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Location configuration updated successfully.',
      data: config,
    });
  } catch (error) {
    console.error('updateLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the location configuration.',
    });
  }
}

/**
 * Returns FailedAttempt records with user info.
 * Query params: userId, startDate, endDate, page, limit.
 */
export async function getFailedAttempts(req, res) {
  try {
    const {
      userId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

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
      prisma.failedAttempt.count({ where }),
      prisma.failedAttempt.findMany({
        where,
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
    console.error('getFailedAttempts error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching failed attempts.',
    });
  }
}

/**
 * Exports attendance data as a CSV file.
 * Query params: startDate, endDate, userId.
 * Sets Content-Type to text/csv.
 */
export async function exportReport(req, res) {
  try {
    const { startDate, endDate, userId } = req.query;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

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

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Build CSV content
    const csvHeader = 'ID,User ID,User Name,User Email,Type,Latitude,Longitude,Timestamp,Is Valid,Notes\n';

    const csvRows = records.map((record) => {
      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(record.id),
        escapeCsv(record.userId),
        escapeCsv(record.user?.name),
        escapeCsv(record.user?.email),
        escapeCsv(record.type),
        escapeCsv(record.latitude),
        escapeCsv(record.longitude),
        escapeCsv(record.timestamp.toISOString()),
        escapeCsv(record.isValid),
        escapeCsv(record.notes),
      ].join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');

    const filename = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating the report.',
    });
  }
}
