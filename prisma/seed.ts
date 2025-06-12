import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding for plaintext password debug...');

  const plainPassword = 'passwordamansuper'; // Password baru tanpa enkripsi

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: plainPassword, // Simpan password sebagai teks biasa
    },
    create: {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: plainPassword, // Simpan password sebagai teks biasa
      role: 'admin',
    },
  });

  console.log(`Admin user password has been set to '${plainPassword}'`);
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