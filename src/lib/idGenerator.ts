import { prisma } from './prisma';

export async function generateId(model: keyof typeof prisma, prefix: string, idField: string) {
  try {
    const lastRecord = await (prisma[model] as any).findFirst({
      orderBy: { [idField]: 'desc' },
      select: { [idField]: true }
    });

    if (!lastRecord || !lastRecord[idField]) {
      return `${prefix}001`;
    }

    const lastIdStr = lastRecord[idField] as string;
    // Hapus prefix untuk mendapatkan angka (misal: "P001" menjadi "001")
    const numberPart = lastIdStr.replace(prefix, '');
    const nextNumber = parseInt(numberPart, 10) + 1;
    
    if (isNaN(nextNumber)) {
      const count = await (prisma[model] as any).count();
      return `${prefix}${(count + 1).toString().padStart(3, '0')}`;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error("Error generating ID:", error);
    // Fallback sederhana jika gagal
    return `${prefix}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
}
