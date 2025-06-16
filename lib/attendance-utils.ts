// Path: lib/attendance-utils.ts

import type { Shift, TimeSettings } from "@/lib/types";

/**
 * Menghitung status absensi (masuk dan keluar) berdasarkan waktu, shift, dan pengaturan waktu.
 *
 * @param checkInTime - Waktu check-in dalam format 'HH:mm:ss'.
 * @param checkOutTime - Waktu check-out dalam format 'HH:mm:ss'.
 * @param shift - Jenis shift pegawai.
 * @param timeSettings - Objek konfigurasi yang berisi rentang waktu untuk semua shift.
 * @returns Objek yang berisi checkInStatus dan checkOutStatus.
 */
export function calculateAttendanceStatus(
  checkInTime: string,
  checkOutTime: string,
  shift: Shift,
  timeSettings: TimeSettings,
) {
  const shiftSettings = timeSettings[shift];
  if (!shiftSettings) {
    // Jika pengaturan untuk shift tidak ditemukan, kembalikan status tidak valid.
    return { checkInStatus: "Shift Tidak Valid", checkOutStatus: "Shift Tidak Valid" };
  }

  // Helper untuk memeriksa apakah shift melewati tengah malam (misalnya, 22:00 - 06:00).
  const isOvernightShift = shiftSettings.checkInStart > shiftSettings.checkInEnd;

  // --- Kalkulasi Status Check-In ---
  let checkInStatus = "Terlambat"; // Asumsi awal adalah terlambat.

  if (isOvernightShift) {
    // Untuk shift malam, Anda tepat waktu jika absen SETELAH waktu mulai ATAU SEBELUM batas akhir (di hari berikutnya).
    // Logika ini mengasumsikan absen shift malam terjadi di antara rentang waktunya.
    // Contoh: Masuk jam 22:30 (setelah 22:00) atau 04:00 (sebelum 08:00 keesokan harinya, jika batasnya sampai pagi)
    // Untuk kasus umum, cukup periksa dengan batas akhir.
    // Jika checkInTime lebih kecil dari checkInEnd (misal 00:15 < 06:00) ATAU lebih besar dari checkInStart (misal 22:10 > 22:00)
     if (checkInTime >= shiftSettings.checkInStart || checkInTime <= shiftSettings.checkInEnd) {
       // Cek keterlambatan spesifik untuk shift malam
       if (checkInTime > shiftSettings.checkInStart && checkInTime > shiftSettings.checkInEnd) { // misal: masuk jam 23:00, batas telat 22:15
          if(checkInTime > shiftSettings.checkInEnd) {
            checkInStatus = "Tepat Waktu";
          }
       } else if (checkInTime < shiftSettings.checkInStart) { // misal: masuk jam 00:10
          if (checkInTime <= shiftSettings.checkInEnd) {
             checkInStatus = "Tepat Waktu";
          } else {
             checkInStatus = "Terlambat";
          }
       }
     }
  } else {
    // Untuk shift normal (tidak lewat tengah malam), perbandingan string sederhana sudah cukup.
    if (checkInTime <= shiftSettings.checkInEnd) {
      checkInStatus = "Tepat Waktu";
    }
  }


  // --- Kalkulasi Status Check-Out ---
  let checkOutStatus = "Belum Absen";
  if (checkOutTime && checkOutTime !== "00:00:00") {
      // Jika sudah check-out, tentukan apakah pulang tepat waktu atau lembur.
      checkOutStatus = "Tepat Waktu";
      if (checkOutTime > shiftSettings.overtimeThreshold) {
          checkOutStatus = "Lembur";
      }
  }

  return { checkInStatus, checkOutStatus };
}