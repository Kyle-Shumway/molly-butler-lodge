import express from 'express';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken, requireStaffOrAdmin);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalRooms,
      activeRooms,
      todayCheckIns,
      todayCheckOuts,
      currentGuests,
      monthlyReservations,
      monthlyRevenue,
      recentReservations
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { isActive: true } }),
      prisma.reservation.count({
        where: {
          checkIn: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CONFIRMED', 'PENDING'] }
        }
      }),
      prisma.reservation.count({
        where: {
          checkOut: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      }),
      prisma.reservation.count({
        where: {
          checkIn: { lte: today },
          checkOut: { gt: today },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      }),
      prisma.reservation.count({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.reservation.aggregate({
        where: {
          checkIn: { gte: startOfMonth },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      }),
      prisma.reservation.findMany({
        include: { room: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate occupancy rate
    const occupancyRate = activeRooms > 0 ? ((currentGuests / activeRooms) * 100).toFixed(1) : '0';

    res.json({
      overview: {
        totalRooms,
        activeRooms,
        currentGuests,
        occupancyRate: `${occupancyRate}%`
      },
      today: {
        checkIns: todayCheckIns,
        checkOuts: todayCheckOuts
      },
      monthly: {
        reservations: monthlyReservations,
        revenue: Number(monthlyRevenue._sum.totalAmount) || 0
      },
      recentReservations
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get calendar data for a specific month
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } },
          { AND: [{ checkIn: { lte: startDate } }, { checkOut: { gte: endDate } }] }
        ],
        status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
      },
      include: { room: true }
    });

    // Group reservations by date
    const calendarData: any = {};
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      calendarData[dateStr] = {
        checkIns: [],
        checkOuts: [],
        currentGuests: []
      };
    }

    reservations.forEach((reservation: any) => {
      const checkInDate = reservation.checkIn.toISOString().split('T')[0];
      const checkOutDate = reservation.checkOut.toISOString().split('T')[0];

      // Add to check-ins
      if (calendarData[checkInDate]) {
        calendarData[checkInDate].checkIns.push(reservation);
      }

      // Add to check-outs
      if (calendarData[checkOutDate]) {
        calendarData[checkOutDate].checkOuts.push(reservation);
      }

      // Add to current guests for dates in between
      for (let d = new Date(reservation.checkIn); d < reservation.checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (calendarData[dateStr]) {
          calendarData[dateStr].currentGuests.push(reservation);
        }
      }
    });

    res.json(calendarData);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching calendar data', error: error.message });
  }
});

// Get reservation reports
router.get('/reports/reservations', async (req, res) => {
  try {
    const { startDate, endDate, status, roomType } = req.query;
    
    let whereConditions: any = {};
    
    if (startDate || endDate) {
      whereConditions.checkIn = {};
      if (startDate) whereConditions.checkIn.gte = new Date(startDate as string);
      if (endDate) whereConditions.checkIn.lte = new Date(endDate as string);
    }
    
    if (status) {
      whereConditions.status = status.toString().toUpperCase();
    }

    if (roomType) {
      whereConditions.room = { type: roomType };
    }

    const reservations = await prisma.reservation.findMany({
      where: whereConditions,
      include: { room: true },
      orderBy: { checkIn: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalReservations: reservations.length,
      totalRevenue: reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0),
      averageStay: reservations.length > 0 
        ? (reservations.reduce((sum, r) => {
            const nights = Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24));
            return sum + nights;
          }, 0) / reservations.length).toFixed(1)
        : 0,
      statusBreakdown: reservations.reduce((acc: any, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      reservations,
      summary
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating reservation report', error: error.message });
  }
});

// Get financial reports
router.get('/reports/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereConditions: any = {
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    };
    
    if (startDate || endDate) {
      whereConditions.checkIn = {};
      if (startDate) whereConditions.checkIn.gte = new Date(startDate as string);
      if (endDate) whereConditions.checkIn.lte = new Date(endDate as string);
    }

    const [totalRevenue, revenueByRoomType] = await Promise.all([
      prisma.reservation.aggregate({
        where: whereConditions,
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.reservation.groupBy({
        by: ['roomId'],
        where: whereConditions,
        _sum: { totalAmount: true },
        _count: { id: true }
      }).then(async (results) => {
        const roomIds = results.map(r => r.roomId);
        const rooms = await prisma.room.findMany({
          where: { id: { in: roomIds } },
          select: { id: true, type: true }
        });
        
        const roomTypeMap = rooms.reduce((acc: any, room) => {
          acc[room.id] = room.type;
          return acc;
        }, {});
        
        const grouped = results.reduce((acc: any, result) => {
          const roomType = roomTypeMap[result.roomId];
          if (!acc[roomType]) {
            acc[roomType] = { revenue: 0, reservations: 0 };
          }
          acc[roomType].revenue += Number(result._sum.totalAmount || 0);
          acc[roomType].reservations += result._count.id;
          return acc;
        }, {});
        
        return Object.entries(grouped).map(([type, data]: [string, any]) => ({
          _id: type,
          revenue: data.revenue,
          reservations: data.reservations
        }));
      })
    ]);

    // Revenue by month - simplified for now
    const revenueByMonth: any[] = [];

    res.json({
      totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
      totalReservations: totalRevenue._count.id || 0,
      averageReservationValue: totalRevenue._sum.totalAmount && totalRevenue._count.id
        ? (Number(totalRevenue._sum.totalAmount) / totalRevenue._count.id).toFixed(2)
        : 0,
      revenueByMonth,
      revenueByRoomType
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error generating financial report', error: error.message });
  }
});

export default router;