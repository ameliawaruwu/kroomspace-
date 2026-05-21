import { PrismaClient } from '@prisma/client';
import { mockUsers, mockProjects, mockTasks, mockNotifications, mockTemplates } from './src/services/apiService';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.komentar.deleteMany();
  await prisma.kontributorTugas.deleteMany();
  await prisma.lampiran.deleteMany();
  await prisma.daftarPeriksa.deleteMany();
  await prisma.notifikasi.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.kolomPapan.deleteMany();
  await prisma.proyek.deleteMany();
  await prisma.templateTugas.deleteMany();
  await prisma.pengguna.deleteMany();

  console.log('Seeding data...');

  // 1. Seed Users
  for (const user of mockUsers) {
    await prisma.pengguna.create({
      data: {
        id_pengguna: user.id,
        nama: user.name,
        email: user.email,
        whatsapp: user.whatsapp || null,
        kata_sandi: user.password,
        peran: user.role,
        foto_profil: user.avatar,
      },
    });
  }
  console.log('Users seeded');

  // 2. Seed Projects
  for (const project of mockProjects) {
    await prisma.proyek.create({
      data: {
        id_proyek: project.id,
        nama_proyek: project.name,
        deskripsi: project.description || null,
        tipe_tugas: project.type,
        mode_kanban: project.mode,
        dibuat_pada: new Date(project.createdAt),
        kolom_papan: {
          create: project.columns.map((c: any) => ({
            id_kolom: `${project.id}-${c.id}`,
            judul_kolom: c.title,
            status_tugas: c.status,
            urutan: c.order,
          })),
        },
      },
    });
  }
  console.log('Projects seeded');

  // 3. Seed Templates
  for (const template of mockTemplates) {
    await prisma.templateTugas.create({
      data: {
        id_template: template.id,
        nama_template: template.name,
        kategori: template.category,
        deskripsi: template.description || null,
        prioritas: template.priority,
        estimasi_jam: template.estimatedHours,
      },
    });
  }
  console.log('Templates seeded');

  // 4. Seed Tasks
  for (const task of mockTasks) {
    await prisma.tugas.create({
      data: {
        id_tugas: task.id,
        id_proyek: task.projectId,
        id_penanggung_jawab: task.assignee || null,
        judul_tugas: task.title,
        deskripsi: task.description || null,
        status: task.status,
        prioritas: task.priority,
        tipe: task.type,
        dibuat_pada: task.createdAt ? new Date(task.createdAt) : new Date(),
        batas_waktu: task.deadline ? new Date(task.deadline) : null,
        komentar: task.comments ? {
          create: task.comments.map((c: any) => ({
            id_komentar: c.id,
            id_pengguna: c.userId,
            isi_komentar: c.text,
            dibuat_pada: new Date(c.createdAt || Date.now()),
          }))
        } : undefined,
        kontributor: task.contributors ? {
          create: task.contributors.map((c: string) => ({
            pengguna: { connect: { id_pengguna: c } }
          }))
        } : undefined,
      },
    });
  }
  console.log('Tasks seeded');

  // 5. Seed Notifications
  for (const notif of mockNotifications) {
    await prisma.notifikasi.create({
      data: {
        id_notifikasi: notif.id,
        id_pengguna: notif.userId,
        id_tugas: notif.taskId || null,
        pesan: notif.message,
        tipe: notif.type,
        sudah_dibaca: notif.read,
        waktu: new Date(notif.timestamp),
      },
    });
  }
  console.log('Notifications seeded');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
