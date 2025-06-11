import type { Shift, TimeSettings } from "@/lib/types";

export function calculateAttendanceStatus(
  checkInTime: string,
  checkOutTime: string,
  shift: Shift,
  timeSettings: TimeSettings,
) {
  const shiftSettings = timeSettings[shift];
  if (!shiftSettings) {
    return { checkInStatus: "Shift Tidak Valid", checkOutStatus: "Shift Tidak Valid" };
  }

  const checkIn = new Date(`2000-01-01T${checkInTime}`);
  const checkOut = new Date(`2000-01-01T${checkOutTime}`);
  const checkInEndLimit = new Date(`2000-01-01T${shiftSettings.checkInEnd}`);
  const overtimeThreshold = new Date(`2000-01-01T${shiftSettings.overtimeThreshold}`);

  if (shift === "Malam") {
    const checkOutNextDay = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
    const overtimeThresholdNextDay = new Date(overtimeThreshold.getTime() + 24 * 60 * 60 * 1000);
    return {
      checkInStatus: checkIn <= checkInEndLimit ? "Tepat Waktu" : "Terlambat",
      checkOutStatus: checkOutTime === "00:00:00" ? "Belum Absen" : (checkOutNextDay > overtimeThresholdNextDay ? "Lembur" : "Tepat Waktu"),
    };
  }

  return {
    checkInStatus: checkIn <= checkInEndLimit ? "Tepat Waktu" : "Terlambat",
    checkOutStatus: checkOutTime === "00:00:00" ? "Belum Absen" : (checkOut > overtimeThreshold ? "Lembur" : "Tepat Waktu"),
  };
}

// Fungsi ini bisa tetap ada jika masih digunakan di frontend
export function getTimeRangeDisplay(shift: Shift, timeSettings: TimeSettings) {
  const settings = timeSettings[shift];
  return {
    checkInRange: `${settings.checkInStart} - ${settings.checkInEnd}`,
    lateAfter: settings.checkInEnd,
    normalCheckOut: `${settings.checkOutStart} - ${settings.checkOutEnd}`,
    overtimeAfter: settings.overtimeThreshold,
  };
}