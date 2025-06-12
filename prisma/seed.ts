// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Gunakan password yang aman dan hash dengan bcrypt
  const password = 'password'; // atau password default lain yang Anda inginkan
  const hashedPassword = await bcrypt.hash(password, 10);

  // Gunakan upsert: metode ini akan memperbarui user admin jika sudah ada,
  // atau membuatnya jika belum ada. Ini lebih aman untuk dijalankan berulang kali.
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword, // Perbarui password dengan hash yang baru
    },
    create: {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(`Admin user '${adminUser.username}' has been created/updated.`);

  // Membuat atau memeriksa pengaturan aplikasi default
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      allowEmployeeDashboardAccess: true,
      allowEmployeeViewAllRecords: false,
      requirePhotoForCheckIn: true,
      allowLogbookEdit: true,
    }
  });

  console.log('Default app settings have been configured.');

  // Membuat pengaturan waktu default
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

  // Menggunakan loop dan upsert untuk pengaturan waktu
  for (const setting of timeSettings) {
    await prisma.timeSettings.upsert({
        where: { shiftName: setting.shiftName },
        update: setting,
        create: setting,
    });
  }

  console.log('Default time settings have been configured.');

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