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
 * @param now Objek Date yang sudah dikonversi ke zona waktu lokal (WITA).
 * @returns Objek Date baru yang sudah dinormalisasi untuk disimpan ke database.
 */
export function normalizeDateForShift(now: Date, shift: Shift): Date {
    // 'now' adalah objek Date yang komponennya sudah sesuai WITA
    let targetDate = new Date(now);

    // Jika shift adalah "Malam" dan jam (WITA) kurang dari 5 pagi,
    // maka absensi dihitung untuk hari sebelumnya.
    if (shift === "Malam" && now.getHours() < 5) {
        targetDate.setDate(targetDate.getDate() - 1);
    }
    
    // Ambil komponen tanggal dari targetDate yang sudah benar
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // getMonth() 0-11
    const day = targetDate.getDate();

    // Buat tanggal baru di zona waktu UTC pada jam 00:00:00.
    // Ini cara paling andal untuk memastikan tanggalnya tidak bergeser lagi.
    return new Date(Date.UTC(year, month, day));
}