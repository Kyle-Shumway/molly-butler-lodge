import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/auth';

async function main() {
  console.log('Starting database seed...');

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { roomNumber: '101' },
      update: {
        images: ['interior_room_bedroom.png']
      },
      create: {
        name: 'Historic Room 101',
        type: 'HISTORIC',
        description: 'A charming historic room with original lodge character and modern amenities.',
        capacity: 2,
        basePrice: 149.00,
        amenities: ['Private Bath', 'Historic Charm', 'WiFi', 'Heating'],
        images: ['interior_room_bedroom.png'],
        roomNumber: '101',
        isActive: true
      }
    }),
    prisma.room.upsert({
      where: { roomNumber: '201' },
      update: {
        images: ['interior_room_bedroom.png']
      },
      create: {
        name: 'Mountain View Suite 201',
        type: 'MOUNTAIN_VIEW',
        description: 'Spacious suite with stunning mountain views and premium amenities.',
        capacity: 4,
        basePrice: 199.00,
        amenities: ['Mountain View', 'Private Bath', 'Sitting Area', 'WiFi', 'Mini Fridge'],
        images: ['interior_room_bedroom.png'],
        roomNumber: '201',
        isActive: true
      }
    }),
    prisma.room.upsert({
      where: { roomNumber: '301' },
      update: {
        images: ['interior_room_bedroom.png']
      },
      create: {
        name: 'Family Cabin 301',
        type: 'FAMILY_CABIN',
        description: 'Large family cabin perfect for groups, with separate sleeping areas.',
        capacity: 8,
        basePrice: 249.00,
        amenities: ['Separate Bedrooms', 'Full Kitchen', 'Living Area', 'WiFi', 'Fireplace'],
        images: ['interior_room_bedroom.png'],
        roomNumber: '301',
        isActive: true
      }
    })
  ]);

  console.log(`Created ${rooms.length} rooms`);

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });