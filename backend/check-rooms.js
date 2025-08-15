const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRooms() {
  try {
    console.log('Checking current room data in database...\n');
    
    const rooms = await prisma.room.findMany({
      select: { 
        id: true, 
        name: true, 
        roomNumber: true, 
        images: true,
        isActive: true
      }
    });
    
    rooms.forEach(room => {
      console.log(`Room ${room.roomNumber}: ${room.name}`);
      console.log(`  - Active: ${room.isActive}`);
      console.log(`  - Images: ${JSON.stringify(room.images)}`);
      console.log(`  - First Image: ${room.images[0] || 'NO IMAGE'}`);
      console.log('');
    });
    
    console.log(`Total rooms found: ${rooms.length}`);
    
  } catch (error) {
    console.error('Error checking rooms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRooms();