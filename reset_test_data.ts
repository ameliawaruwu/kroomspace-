import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Mengembalikan status tugas ke kondisi awal pengujian...');

  // 1. Reset Tugas T018 (Membuat Database) ke "To Do"
  await prisma.tugas.update({
    where: { id_tugas: 'T018' },
    data: {
      status: 'To Do',
    }
  });
  console.log('✅ Tugas "Membuat Database" (T018) -> "To Do"');

  // 2. Reset Tugas T017 (Integrasi Payment Gateway) ke "In Progress"
  await prisma.tugas.update({
    where: { id_tugas: 'T017' },
    data: {
      status: 'In Progress',
    }
  });
  console.log('✅ Tugas "Integrasi Payment Gateway" (T017) -> "In Progress"');

  // 3. Reset Tugas T016 (Design UI) ke "To Do"
  await prisma.tugas.update({
    where: { id_tugas: 'T016' },
    data: {
      status: 'To Do',
    }
  });
  console.log('✅ Tugas "Design UI" (T016) -> "To Do"');

  // 4. Hapus Dokumentasi Tugas hasil testing sebelumnya
  const deletedDocs = await prisma.dokumentasiTugas.deleteMany({
    where: {
      id_tugas: { in: ['T016', 'T017', 'T018'] }
    }
  });
  console.log(`✅ Menghapus ${deletedDocs.count} dokumentasi testing sebelumnya.`);

  // 5. Hapus Lampiran hasil testing sebelumnya
  const deletedLampiran = await prisma.lampiran.deleteMany({
    where: {
      id_tugas: { in: ['T016', 'T017', 'T018'] }
    }
  });
  console.log(`✅ Menghapus ${deletedLampiran.count} lampiran testing sebelumnya.`);

  console.log('🎉 Database siap untuk pengujian ulang!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
