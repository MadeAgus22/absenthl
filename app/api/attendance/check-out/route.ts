// File: app/api/attendance/check-out/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings } from "./utils";

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
        // --- PERUBAHAN: Hanya butuh userId dan foto ---
        const { userId, checkOutSelfiePhotoData } = body;

        if (!userId || !checkOutSelfiePhotoData) {
            return NextResponse.json({ message: "User ID dan Swafoto wajib diisi." }, { status: 400 });
        }
        
        const lastCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null },
            include: { _count: { select: { logbook: true } } } // Hitung logbook yang ada
        });

        if (!lastCheckIn) {
            return NextResponse.json({ message: "Tidak ditemukan data absen masuk yang aktif." }, { status: 404 });
        }

        // Validasi jumlah logbook langsung dari database
        if (lastCheckIn._count.logbook < 3) {
            return NextResponse.json({ message: "Minimal 3 kegiatan harus tersimpan di database sebelum check-out." }, { status: 400 });
        }
        
        const checkOutSelfieUrl = await uploadImage(checkOutSelfiePhotoData, 'checkout-selfie', userId);

        const now = new Date();
        const timeSettings = await getDbTimeSettings();
        const shift = lastCheckIn.shift as Shift;

        const { checkOutStatus } = calculateAttendanceStatus(
            lastCheckIn.checkInTime.toLocaleTimeString('en-GB'),
            now.toLocaleTimeString('en-GB'),
            shift,
            timeSettings
        );

        // --- PERUBAHAN: Tidak ada lagi create logbook di sini ---
        const updatedAttendance = await db.attendance.update({
            where: { id: lastCheckIn.id },
            data: {
                checkOutTime: now,
                checkOutStatus: checkOutStatus,
                checkOutSelfiePhoto: checkOutSelfieUrl,
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