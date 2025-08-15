const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRoomImages() {
  try {
    console.log('Updating room images to use interior_room_bedroom.png...');
    
    const result = await prisma.room.updateMany({
      where: { isActive: true },
      data: { images: ['interior_room_bedroom.png'] }
    });
    
    console.log(`Successfully updated ${result.count} rooms`);
    
    // Verify the updates
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, roomNumber: true, images: true }
    });
    
    console.log('\nUpdated rooms:');
    rooms.forEach(room => {
      console.log(`- ${room.name} (Room ${room.roomNumber}): ${room.images[0]}`);
    });
    
  } catch (error) {
    console.error('Error updating room images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoomImages();