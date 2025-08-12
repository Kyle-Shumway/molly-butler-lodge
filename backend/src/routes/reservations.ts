import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth';
// import { sendConfirmationEmail, sendCancellationEmail } from '../utils/emailService';

const router = express.Router();

// Create new reservation
router.post('/', async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, guestInfo, specialRequests } = req.body;

    // Validate required fields
    if (!roomId || !checkIn || !checkOut || !guests || !guestInfo) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    // Check if room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    if (!room || !room.isActive) {
      return res.status(404).json({ message: 'Room not found or not available' });
    }

    // Check room capacity
    if (guests > room.capacity) {
      return res.status(400).json({ message: 'Number of guests exceeds room capacity' });
    }

    // Check availability
    const overlappingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: roomId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } }
            ]
          }
        ]
      }
    });

    if (overlappingReservation) {
      return res.status(400).json({ message: 'Room is not available for the selected dates' });
    }

    // Calculate total amount
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * Number(room.basePrice);

    // Create reservation with confirmation number
    const confirmationNumber = 'MB' + Date.now().toString().slice(-8);
    
    const reservation = await prisma.reservation.create({
      data: {
        guestFirstName: guestInfo.firstName,
        guestLastName: guestInfo.lastName,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        guestStreet: guestInfo.address?.street,
        guestCity: guestInfo.address?.city,
        guestState: guestInfo.address?.state,
        guestZipCode: guestInfo.address?.zipCode,
        roomId: roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalAmount,
        specialRequests: specialRequests || '',
        status: 'PENDING',
        confirmationNumber
      },
      include: { room: true }
    });

    // Send confirmation email
    try {
      // await sendConfirmationEmail(reservation);
      console.log('Confirmation email would be sent to:', reservation.guestEmail);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue without failing the reservation
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
      confirmationNumber: reservation.confirmationNumber
    });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Error creating reservation', error: error.message });
  }
});

// Get reservation by confirmation number
router.get('/confirmation/:confirmationNumber', async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({ 
      where: { confirmationNumber: req.params.confirmationNumber },
      include: { room: true }
    });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reservation', error: error.message });
  }
});

// Update reservation status (guest can only cancel)
router.patch('/confirmation/:confirmationNumber', async (req, res) => {
  try {
    const { status } = req.body;
    const { confirmationNumber } = req.params;

    if (status !== 'cancelled') {
      return res.status(400).json({ message: 'Guests can only cancel reservations' });
    }

    const reservation = await prisma.reservation.findUnique({ 
      where: { confirmationNumber },
      include: { room: true }
    });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Reservation is already cancelled' });
    }

    if (reservation.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot cancel completed reservation' });
    }

    // Check if cancellation is within allowed timeframe (e.g., 24 hours before check-in)
    const hoursBeforeCheckIn = (reservation.checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursBeforeCheckIn < 24) {
      return res.status(400).json({ 
        message: 'Cancellation not allowed within 24 hours of check-in. Please call the lodge.' 
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'CANCELLED' },
      include: { room: true }
    });

    // Send cancellation email
    try {
      // await sendCancellationEmail(updatedReservation);
      console.log('Cancellation email would be sent to:', updatedReservation.guestEmail);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({ message: 'Reservation cancelled successfully', reservation: updatedReservation });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating reservation', error: error.message });
  }
});

// Protected admin routes
router.use(authenticateToken, requireStaffOrAdmin);

// Get all reservations with filtering
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, roomId } = req.query;
    
    let where: any = {};
    
    if (status) {
      where.status = status.toString().toUpperCase();
    }
    
    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = new Date(startDate as string);
      if (endDate) where.checkIn.lte = new Date(endDate as string);
    }
    
    if (roomId) {
      where.roomId = roomId as string;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { room: true },
      orderBy: { checkIn: 'desc' }
    });

    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reservations', error: error.message });
  }
});

// Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { room: true }
    });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reservation', error: error.message });
  }
});

// Update reservation (admin)
router.put('/:id', async (req, res) => {
  try {
    const { status, ...updateData } = req.body;
    const dataToUpdate: any = { ...updateData };
    
    if (status) {
      dataToUpdate.status = status.toString().toUpperCase();
    }

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: dataToUpdate,
      include: { room: true }
    });

    res.json(reservation);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating reservation', error: error.message });
  }
});

// Delete reservation (admin)
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await prisma.reservation.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting reservation', error: error.message });
  }
});

// Get dashboard statistics
router.get('/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalReservations,
      monthlyReservations,
      confirmedReservations,
      totalRevenue,
      monthlyRevenue,
      occupancyData
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ 
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } }
      }),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservation.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true }
      }),
      prisma.reservation.aggregate({
        where: { 
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          checkIn: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { totalAmount: true }
      }),
      prisma.room.count({ where: { isActive: true } })
    ]);

    res.json({
      totalReservations,
      monthlyReservations,
      confirmedReservations,
      totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
      monthlyRevenue: Number(monthlyRevenue._sum.totalAmount) || 0,
      totalRooms: occupancyData,
      occupancyRate: confirmedReservations > 0 ? ((confirmedReservations / occupancyData) * 100).toFixed(1) : 0
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;