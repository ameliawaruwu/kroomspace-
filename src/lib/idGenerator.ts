import { prisma } from './prisma';

export async function generateId(model: keyof typeof prisma, idField: string) {
  // Mapping dari nama model/tabel ke awalan huruf
  const prefixMap: { [key: string]: string } = {
    pengguna: 'P',
    proyek: 'PR',
    tugas: 'T',
    templateProyek: 'TP',
    notifikasi: 'AC',
    kolomPapan: 'KB',
    daftarPeriksa: 'CL',
    komentar: 'KM',
    lampiran: 'L',
    dokumentasiTugas: 'DK'
  };
  
  const prefix = prefixMap[model as string] || (model as string).charAt(0).toUpperCase();

  try {
    // Fetch all IDs for this model to find the max numeric suffix for this specific prefix
    const allRecords = await (prisma[model] as any).findMany({
      select: { [idField]: true }
    });

    let maxNumber = 0;
    for (const record of allRecords) {
      const id = record[idField] as string;
      if (!id) continue;
      // Only consider IDs that start exactly with our prefix followed by digits
      if (!id.startsWith(prefix)) continue;
      const afterPrefix = id.slice(prefix.length);
      // Ensure next char is a digit (exact prefix, not a longer prefix like P vs PR)
      if (afterPrefix.length === 0 || !/^\d/.test(afterPrefix)) continue;
      const match = afterPrefix.match(/^\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    return `${prefix}${(maxNumber + 1).toString().padStart(3, '0')}`;
  } catch (error) {
    console.error("Error generating ID:", error);
    return `${prefix}${Math.floor(Math.random() * 9000 + 1000).toString()}`;
  }
}
