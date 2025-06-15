// File: app/api/attendance/check-in/route.ts

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';

// Fungsi ini tidak perlu diubah
async function getDbTimeSettings(): Promise<TimeSettings> {
    const settings = await db.timeSettings.findMany();
    const formattedSettings: any = {};
    settings.forEach(s => {
        formattedSettings[s.shiftName] = s;
    });
    return formattedSettings;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Terima data gambar mentah (base64) dari frontend
        const { userId, shift, attendanceSheetPhotoData, selfiePhotoData } = body;

        // Validasi input dasar
        if (!userId || !shift) {
            return NextResponse.json({ message: "User ID dan shift wajib diisi" }, { status: 400 });
        }
        
        // 1. Validasi Sesi Aktif TERLEBIH DAHULU
        const activeCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null }
        });

        if (activeCheckIn) {
            return NextResponse.json(
                { message: "Tidak dapat absen masuk karena Anda sudah memiliki sesi absensi yang aktif." },
                { status: 409 } // 409 Conflict
            );
        }

        // 2. Hanya jika validasi lolos, lanjutkan proses upload
        let attendanceSheetUrl: string | null = null;
        if (attendanceSheetPhotoData) {
            const filename = `attendance-${userId}-${Date.now()}.jpg`;
            // Konversi data base64 menjadi Buffer yang bisa diupload
            const buffer = Buffer.from(attendanceSheetPhotoData.split(',')[1], 'base64');
            const blob = await put(filename, buffer, { access: 'public', contentType: 'image/jpeg' });
            attendanceSheetUrl = blob.url;
        }

        let selfieUrl: string | null = null;
        if (selfiePhotoData) {
            const filename = `selfie-${userId}-${Date.now()}.jpg`;
            const buffer = Buffer.from(selfiePhotoData.split(',')[1], 'base64');
            const blob = await put(filename, buffer, { access: 'public', contentType: 'image/jpeg' });
            selfieUrl = blob.url;
        }
        
        // 3. Lanjutkan dengan logika pembuatan data absensi
        const now = new Date(); // Waktu aktual dari server (sudah diset WITA)
        
        let dateForDb = new Date(now);
        
        // Penanganan khusus untuk shift malam yang melewati tengah malam
        if (shift === "Malam" && now.getHours() < 5) {
            dateForDb.setDate(dateForDb.getDate() - 1);
        }
        
        // Atur waktu ke tengah malam (00:00:00) untuk kolom 'date'
        dateForDb.setHours(0, 0, 0, 0);
        
        const timeSettings = await getDbTimeSettings();
        const { checkInStatus } = calculateAttendanceStatus(
            now.toLocaleTimeString('en-GB', { hour12: false }), // Gunakan waktu aktual untuk kalkulasi status
            "00:00:00",
            shift, 
            timeSettings
        );

        // 4. Buat record di database dengan URL foto yang sudah diupload
        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: dateForDb,               // Tanggal yang sudah dinormalisasi
                checkInTime: now,              // Waktu aktual saat absen
                attendanceSheetPhoto: attendanceSheetUrl, // URL dari hasil upload
                selfiePhoto: selfieUrl,                   // URL dari hasil upload
                checkInStatus,
                checkOutStatus: "Belum Absen",
            },
        });

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR]", error);
        // Memberikan pesan error yang lebih spesifik jika memungkinkan
        if (error instanceof Error && 'message' in error) {
             return NextResponse.json({ message: `Internal Server Error: ${error.message}`}, { status: 500 });
        }
        return NextResponse.json({ message: "Internal Server Error"}, { status: 500 });
    }
}