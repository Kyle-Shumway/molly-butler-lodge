import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth';

const router = express.Router();

// Get all active rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { basePrice: 'asc' }]
    });
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id }
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
});

// Check room availability
router.post('/check-availability', async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Room ID, check-in, and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    // Check for overlapping reservations
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

    const isAvailable = !overlappingReservation;
    res.json({ available: isAvailable });
  } catch (error: any) {
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
});

// Get available rooms for date range
router.post('/available', async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Get all active rooms that meet capacity requirements
    const whereClause: any = { isActive: true };
    if (guests) {
      whereClause.capacity = { gte: guests };
    }

    const allRooms = await prisma.room.findMany({
      where: whereClause
    });

    // Find rooms with overlapping reservations
    const unavailableReservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } }
            ]
          }
        ]
      },
      select: { roomId: true }
    });

    const unavailableRoomIds = unavailableReservations.map(r => r.roomId);
    const availableRooms = allRooms.filter(room => !unavailableRoomIds.includes(room.id));

    res.json(availableRooms);
  } catch (error: any) {
    res.status(500).json({ message: 'Error finding available rooms', error: error.message });
  }
});

// Admin routes (protected)
router.use(authenticateToken, requireStaffOrAdmin);

// Create new room
router.post('/', async (req, res) => {
  try {
    const room = await prisma.room.create({
      data: req.body
    });
    res.status(201).json(room);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Room number already exists' });
    } else {
      res.status(400).json({ message: 'Error creating room', error: error.message });
    }
  }
});

// Update room
router.put('/:id', async (req, res) => {
  try {
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(room);
  } catch (error: any) {
    res.status(400).json({ message: 'Error updating room', error: error.message });
  }
});

// Delete room (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ message: 'Room deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

export default router;