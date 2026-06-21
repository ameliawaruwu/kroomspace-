import { prisma } from './src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function analyze() {
  console.log("=== ANALISIS DUPLIKAT DATABASE ===");
  try {
    // 1. Pengguna
    const users = await prisma.pengguna.findMany();
    console.log(`\nPengguna: ${users.length} record(s)`);
    console.log("Daftar Pengguna:", users.map(u => ({ id: u.id_pengguna, nama: u.nama, email: u.email, peran: u.peran })));
    const emailCounts: Record<string, number> = {};
    const nameCounts: Record<string, number> = {};
    users.forEach(u => {
      emailCounts[u.email] = (emailCounts[u.email] || 0) + 1;
      nameCounts[u.nama] = (nameCounts[u.nama] || 0) + 1;
    });
    console.log("Duplicate emails:", Object.entries(emailCounts).filter(([_, c]) => c > 1));
    console.log("Duplicate names:", Object.entries(nameCounts).filter(([_, c]) => c > 1));

    // 2. Proyek
    const projects = await prisma.proyek.findMany();
    console.log(`\nProyek: ${projects.length} record(s)`);
    console.log("Daftar Proyek:", projects.map(p => ({ id: p.id_proyek, nama: p.nama_proyek, dibuat_oleh: p.id_pengguna })));
    const projectNames: Record<string, number> = {};
    projects.forEach(p => {
      projectNames[p.nama_proyek] = (projectNames[p.nama_proyek] || 0) + 1;
    });
    console.log("Duplicate project names:", Object.entries(projectNames).filter(([_, c]) => c > 1));

    // 3. KolomPapan
    const columns = await prisma.kolomPapan.findMany();
    console.log(`\nKolomPapan: ${columns.length} record(s)`);
    const colDuplicates: string[] = [];
    const projColMap: Record<string, Set<string>> = {};
    columns.forEach(c => {
      if (!projColMap[c.id_proyek]) projColMap[c.id_proyek] = new Set();
      const key = `${c.judul_kolom}_${c.status_tugas}`;
      if (projColMap[c.id_proyek].has(key)) {
        colDuplicates.push(`Project ${c.id_proyek}: Duplicate col ${c.judul_kolom} / ${c.status_tugas} (ID: ${c.id_kolom})`);
      }
      projColMap[c.id_proyek].add(key);
    });
    console.log("Duplicate columns in same project:", colDuplicates);

    // 4. Tugas
    const tasks = await prisma.tugas.findMany();
    console.log(`\nTugas: ${tasks.length} record(s)`);
    const taskDuplicates: string[] = [];
    const projTaskMap: Record<string, Set<string>> = {};
    tasks.forEach(t => {
      if (!projTaskMap[t.id_proyek]) projTaskMap[t.id_proyek] = new Set();
      if (projTaskMap[t.id_proyek].has(t.judul_tugas)) {
        taskDuplicates.push(`Project ${t.id_proyek}: Duplicate task title "${t.judul_tugas}" (ID: ${t.id_tugas})`);
      }
      projTaskMap[t.id_proyek].add(t.judul_tugas);
    });
    console.log("Duplicate task titles in same project:", taskDuplicates);

    // 5. TemplateProyek (JSON-based single table)
    try {
      const templates = await prisma.templateProyek.findMany();
      console.log(`\nTemplateProyek: ${templates.length} record(s)`);
      for (const t of templates) {
        const kolom = JSON.parse(t.kolom_papan_json || '[]');
        const tugas = JSON.parse(t.tugas_json || '[]');
        console.log(`- Template: ${t.nama_template} (ID: ${t.id_template})`);
        console.log(`  Columns (${kolom.length}):`, kolom.map((c: any) => c.title));
        console.log(`  Tasks (${tugas.length}):`, tugas.map((tsk: any) => `${tsk.title} (${(tsk.checklist || []).length} checklists)`));
      }
      const templateNames: Record<string, number> = {};
      templates.forEach(t => {
        templateNames[t.nama_template] = (templateNames[t.nama_template] || 0) + 1;
      });
      console.log("Duplicate template names:", Object.entries(templateNames).filter(([_, c]) => c > 1));
    } catch (e: any) {
      console.log("\nError fetching TemplateProyek:", e.message);
    }

    // 6. AnggotaProyek
    const members = await prisma.anggotaProyek.findMany();
    console.log(`\nAnggotaProyek: ${members.length} record(s)`);

    // 7. Notifikasi
    const notifications = await prisma.notifikasi.findMany();
    console.log(`\nNotifikasi: ${notifications.length} record(s)`);
    const notifDuplicates: string[] = [];
    const notifSet = new Set<string>();
    notifications.forEach(n => {
      const key = `${n.id_pengguna}_${n.id_tugas}_${n.pesan}_${n.tipe}`;
      if (notifSet.has(key)) {
        notifDuplicates.push(`Duplicate notification: User ${n.id_pengguna}, Message: "${n.pesan}" (ID: ${n.id_notifikasi})`);
      }
      notifSet.add(key);
    });
    console.log("Duplicate notifications:", notifDuplicates);

    // 8. Komentar
    const comments = await prisma.komentar.findMany();
    console.log(`\nKomentar: ${comments.length} record(s)`);

  } catch (error) {
    console.error("Error analyzing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
