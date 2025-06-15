// File: app/api/attendance/check-out/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';

// Fungsi ini tidak perlu diubah
async function getDbTimeSettings() {
    const settings = await db.timeSettings.findMany();
    const formattedSettings = settings.reduce((acc, s) => {
        acc[s.shiftName as Shift] = s;
        return acc;
    }, {} as Partial<TimeSettings>);
    return formattedSettings as TimeSettings;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Terima data gambar mentah (base64) dari frontend
        const { userId, logbookEntries, checkOutSelfiePhotoData } = body;

        // Validasi input dasar
        if (!userId || !logbookEntries || logbookEntries.length === 0) {
            return NextResponse.json({ message: "User ID dan Logbook wajib diisi." }, { status: 400 });
        }
        
        // Validasi wajib foto
        if (!checkOutSelfiePhotoData) {
             return NextResponse.json({ message: "Swafoto absen keluar wajib diisi." }, { status: 400 });
        }

        // 1. Validasi Sesi Aktif TERLEBIH DAHULU
        const lastCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null },
            orderBy: { checkInTime: 'desc' },
        });

        if (!lastCheckIn) {
            return NextResponse.json({ message: "Tidak ditemukan data absen masuk yang aktif. Silakan lakukan absen masuk terlebih dahulu." }, { status: 404 });
        }
        
        // 2. Hanya jika validasi lolos, lanjutkan proses upload foto
        const filename = `checkout-selfie-${userId}-${Date.now()}.jpg`;
        const buffer = Buffer.from(checkOutSelfiePhotoData.split(',')[1], 'base64');
        const blob = await put(filename, buffer, { access: 'public', contentType: 'image/jpeg' });
        
        // 3. Lanjutkan dengan logika pembuatan data absensi keluar
        const now = new Date();
        const timeSettings = await getDbTimeSettings();
        const shift = lastCheckIn.shift as Shift;
        const { checkOutStatus } = calculateAttendanceStatus(lastCheckIn.checkInTime.toLocaleTimeString('en-GB'), now.toLocaleTimeString('en-GB'), shift, timeSettings);

         const checkOutTimeForDb = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));

        const updatedAttendance = await db.attendance.update({
            where: { id: lastCheckIn.id },
            data: {
                checkOutTime: checkOutTimeForDb, // Kirim sebagai objek Date yang sudah disesuaikan
                checkOutStatus: checkOutStatus,
                checkOutSelfiePhoto: blob.url,
                logbook: {
                    create: logbookEntries.map((entry: string) => ({ content: entry })),
                },
            },
        });

        return NextResponse.json(updatedAttendance);

    } catch (error) {
        console.error("[CHECK_OUT_ERROR]", error);
        if (error instanceof Error && 'message' in error) {
            return NextResponse.json({ message: `Internal Server Error: ${error.message}`}, { status: 500 });
        }
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}