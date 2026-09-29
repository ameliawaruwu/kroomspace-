export interface OtpRecord {
  otp: string;
  previousOtp?: string;
  expiresAt: number;
  attempts: number;
}

export const otpStore = new Map<string, OtpRecord>();

// Cleanup expired OTP setiap 1 menit
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  otpStore.forEach((value, key) => {
    if (now > value.expiresAt) {
      otpStore.delete(key);
      cleanedCount++;
    }
  });
  if (cleanedCount > 0) {
    console.log(`[OTP Cleanup] Hapus ${cleanedCount} OTP expired`);
  }
}, 60 * 1000);
