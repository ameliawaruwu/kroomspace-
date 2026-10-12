import fs from "fs";
import path from "path";

export interface OtpRecord {
  otp: string;
  previousOtp?: string;
  expiresAt: number;
  attempts: number;
}

const CACHE_FILE = path.join(process.cwd(), ".otp_store.json");

class PersistentOtpStore {
  private map = new Map<string, OtpRecord>();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        const data: Record<string, OtpRecord> = JSON.parse(raw);
        const now = Date.now();
        let loaded = 0;
        for (const [key, val] of Object.entries(data)) {
          if (val && val.expiresAt > now) {
            this.map.set(key, val);
            loaded++;
          }
        }
        if (loaded > 0) {
          console.log(`[OTP Store] Memulihkan ${loaded} sesi OTP aktif dari penyimpanan persistent.`);
        }
      }
    } catch (e) {
      console.warn("[OTP Store] Gagal memuat OTP dari disk, menggunakan memory store.", e);
    }
  }

  private saveToDisk() {
    try {
      const obj: Record<string, OtpRecord> = {};
      const now = Date.now();
      for (const [key, val] of this.map.entries()) {
        if (val.expiresAt > now) {
          obj[key] = val;
        }
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), "utf-8");
    } catch {
      // Ignore disk write errors silently to prevent app crash
    }
  }

  get(key: string): OtpRecord | undefined {
    const record = this.map.get(key);
    if (!record) return undefined;
    if (Date.now() > record.expiresAt) {
      this.delete(key);
      return undefined;
    }
    return record;
  }

  set(key: string, value: OtpRecord): void {
    this.map.set(key, value);
    this.saveToDisk();
  }

  delete(key: string): boolean {
    const res = this.map.delete(key);
    this.saveToDisk();
    return res;
  }

  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of this.map.entries()) {
      if (now > value.expiresAt) {
        this.map.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      this.saveToDisk();
    }
    return cleanedCount;
  }
}

export const otpStore = new PersistentOtpStore();

// Cleanup expired OTP setiap 1 menit
setInterval(() => {
  const count = otpStore.cleanup();
  if (count > 0) {
    console.log(`[OTP Cleanup] Hapus ${count} OTP expired`);
  }
}, 60 * 1000);
