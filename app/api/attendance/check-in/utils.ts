// File: app/api/attendance/check-in/utils.ts

import { db } from "@/lib/db";
import type { Shift, TimeSettings } from "@/lib/types";

/**
 * Mengambil dan memformat pengaturan waktu dari database.
 */
export async function getDbTimeSettings(): Promise<TimeSettings> {
    const settings = await db.timeSettings.findMany();
    const formattedSettings: any = {};
    settings.forEach(s => {
        formattedSettings[s.shiftName] = s;
    });
    return formattedSettings;
}

/**
 * Menentukan tanggal yang benar untuk absensi, dengan mempertimbangkan shift malam.
 * @param now Objek Date saat ini.
 * @param shift Tipe shift.
 * @returns Objek Date yang sudah dinormalisasi untuk kolom 'date' di database.
 */
export function normalizeDateForShift(now: Date, shift: Shift): Date {
    let dateForDb = new Date(now);

    // Jika shift adalah "Malam" dan absen dilakukan setelah tengah malam (sebelum jam 5 pagi),
    // maka absensi tersebut dihitung untuk hari sebelumnya.
    if (shift === "Malam" && now.getHours() < 5) {
        dateForDb.setDate(dateForDb.getDate() - 1);
    }
    
    // Atur waktu ke awal hari (00:00:00) sesuai zona waktu server
    dateForDb.setHours(0, 0, 0, 0);

    return dateForDb;
}