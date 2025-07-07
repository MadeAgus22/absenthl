// File: app/api/attendance/check-out/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings } from "./utils"; // Impor fungsi helper yang sudah ada

// Fungsi untuk upload gambar
async function uploadImage(base64Data: string, prefix: string, userId: string): Promise<string> {
    const filename = `${prefix}-${userId}-${Date.now()}.jpeg`;
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    
    const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
    });
    
    return blob.url;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, logbookEntries, checkOutSelfiePhotoData } = body;

        // Validasi input
        if (!userId || !logbookEntries ) {
            return NextResponse.json({ message: "User ID dan Logbook wajib diisi." }, { status: 400 });
        }
        if (!Array.isArray(logbookEntries) || logbookEntries.length < 3) {
            return NextResponse.json({ message: "Minimal 3 Kegiatan y gais." }, { status: 400 });
        }
        if (!checkOutSelfiePhotoData) {
            return NextResponse.json({ message: "Swafoto/selfie absen keluar wajib diisi." }, { status: 400 });
        }

        // 1. Cari data absen masuk yang aktif
        const lastCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null },
            orderBy: { checkInTime: 'desc' },
        });

        if (!lastCheckIn) {
            return NextResponse.json({ message: "Tidak ditemukan data absen masuk yang aktif." }, { status: 404 });
        }
        
        // 2. Upload foto
        const checkOutSelfieUrl = await uploadImage(checkOutSelfiePhotoData, 'checkout-selfie', userId);

        // 3. Logika status dan waktu
        const now = new Date(); // Waktu aktual server (WITA)
        const timeSettings = await getDbTimeSettings();
        const shift = lastCheckIn.shift as Shift;

        // Gunakan objek Date langsung untuk konsistensi, bukan string
        const { checkOutStatus } = calculateAttendanceStatus(
            lastCheckIn.checkInTime.toLocaleTimeString('en-GB'),
            now.toLocaleTimeString('en-GB'),
            shift,
            timeSettings
        );

        // 4. Update record di database
        const updatedAttendance = await db.attendance.update({
            where: { id: lastCheckIn.id },
            data: {
                checkOutTime: now, // Langsung simpan objek Date saat ini
                checkOutStatus: checkOutStatus,
                checkOutSelfiePhoto: checkOutSelfieUrl,
                logbook: {
                    create: logbookEntries.map((entry: string) => ({ content: entry })),
                },
            },
        });

        return NextResponse.json(updatedAttendance);

    } catch (error) {
        console.error("[CHECK_OUT_ERROR]", error);
        if (error instanceof Error) {
             return NextResponse.json({ message: `Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
    }
}