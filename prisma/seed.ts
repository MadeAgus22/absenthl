// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const hashedPassword = await bcrypt.hash('password', 10);

  // Buat user admin
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(`Created admin user: ${adminUser.username}`);

  // Buat pengaturan aplikasi default
  const appSettings = await prisma.appSettings.create({
    data: {
      id: "singleton", // ID tetap untuk pengaturan
      allowEmployeeDashboardAccess: true,
      allowEmployeeViewAllRecords: false,
      requirePhotoForCheckIn: true,
      allowLogbookEdit: true,
    }
  });

  console.log('Created default app settings.');

  // Buat pengaturan waktu default
  const timeSettings = [
    {
        shiftName: "Reguler",
        checkInStart: "08:00", checkInEnd: "08:15",
        checkOutStart: "17:00", checkOutEnd: "17:30",
        overtimeThreshold: "17:30",
    },
    {
        shiftName: "Pagi",
        checkInStart: "06:00", checkInEnd: "06:15",
        checkOutStart: "14:00", checkOutEnd: "14:30",
        overtimeThreshold: "14:30",
    },
    {
        shiftName: "Siang",
        checkInStart: "14:00", checkInEnd: "14:15",
        checkOutStart: "22:00", checkOutEnd: "22:30",
        overtimeThreshold: "22:30",
    },
    {
        shiftName: "Malam",
        checkInStart: "22:00", checkInEnd: "22:15",
        checkOutStart: "06:00", checkOutEnd: "06:30",
        overtimeThreshold: "06:30",
    }
  ];

  for (const setting of timeSettings) {
    await prisma.timeSettings.create({ data: setting });
  }

  console.log('Created default time settings.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });