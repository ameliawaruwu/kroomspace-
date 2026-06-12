import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockUsers = [
  { id: 'P001', name: 'Amelia Waruwu', email: 'amelia@kroombox.com', whatsapp: '+6281234567890', password: 'admin', role: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
  { id: 'P002', name: 'Budi Santoso', email: 'budi@kroombox.com', whatsapp: '+6282345678901', password: 'user123', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi' },
  { id: 'P003', name: 'Citra Dewi', email: 'citra@kroombox.com', whatsapp: '+6283456789012', password: 'user', role: 'Member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Citra' },
];

async function main() {
  for (const u of mockUsers) {
    await prisma.pengguna.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id_pengguna: u.id,
        nama: u.name,
        email: u.email,
        whatsapp: u.whatsapp,
        kata_sandi: u.password,
        peran: u.role,
        foto_profil: u.avatar
      }
    });
  }
  console.log("Mock users seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
