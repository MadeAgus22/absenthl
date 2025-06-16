import type { Shift, TimeSettings } from "@/lib/types";

export function calculateAttendanceStatus(
  checkInTime: string, // Waktu check-in dalam format 'HH:mm:ss'
  checkOutTime: string, // Waktu check-out dalam format 'HH:mm:ss'
  shift: Shift,
  timeSettings: TimeSettings,
) {
  const shiftSettings = timeSettings[shift];
  if (!shiftSettings) {
    return { checkInStatus: "Shift Tidak Valid", checkOutStatus: "Shift Tidak Valid" };
  }

  // Buat tanggal referensi hari ini untuk perbandingan jam saja
  const today = new Date().toISOString().slice(0, 10);

  // Buat objek Date dari string waktu check-in dan batas waktu
  const checkInDateTime = new Date(`<span class="math-inline">\{today\}T</span>{checkInTime}`);
  const checkInEndLimit = new Date(`<span class="math-inline">\{today\}T</span>{shiftSettings.checkInEnd}`);
  const checkOutDateTime = new Date(`<span class="math-inline">\{today\}T</span>{checkOutTime}`);
  const overtimeThreshold = new Date(`<span class="math-inline">\{today\}T</span>{shiftSettings.overtimeThreshold}`);

  let checkInStatus = "Terlambat";
  if (checkInDateTime <= checkInEndLimit) {
    checkInStatus = "Tepat Waktu";
  }

  let checkOutStatus = "Belum Absen";
  if (checkOutTime !== "00:00:00") {
    if (shift === "Malam" && checkOutDateTime < checkInDateTime) {
      // Handle checkout keesokan harinya untuk shift malam
      checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
    }
    checkOutStatus = checkOutDateTime > overtimeThreshold ? "Lembur" : "Tepat Waktu";
  }

  return { checkInStatus, checkOutStatus };
}