import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings, normalizeDateForShift } from "./utils"; // PERBAIKAN: Impor fungsi helper

// Fungsi untuk upload gambar, dibuat terpisah agar lebih rapi
async function uploadImage(base64Data: string, prefix: string, userId: string): Promise<string> {
    const filename = `${prefix}-${userId}-${Date.now()}.jpeg`;
    // Konversi base64 ke Buffer
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    
    const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
    });
    
    return blob.url;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, shift, attendanceSheetPhotoData, selfiePhotoData } = body;

        // Validasi input
        if (!userId || !shift) {
            return NextResponse.json({ message: "User ID dan shift wajib diisi." }, { status: 400 });
        }

        // 1. Validasi Sesi Aktif
        const activeCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null }
        });

        if (activeCheckIn) {
            return NextResponse.json(
                { message: "Anda sudah memiliki sesi absensi yang aktif dan belum melakukan check-out." },
                { status: 409 } // 409 Conflict
            );
        }

        // 2. Upload gambar (jika ada)
        let attendanceSheetUrl: string | null = null;
        if (attendanceSheetPhotoData) {
            attendanceSheetUrl = await uploadImage(attendanceSheetPhotoData, 'attendance', userId);
        }

        let selfieUrl: string | null = null;
        if (selfiePhotoData) {
            selfieUrl = await uploadImage(selfiePhotoData, 'selfie', userId);
        }
        
        // 3. Logika Tanggal dan Status
        const now = new Date(); // Waktu aktual server (WITA)
        
        // Menggunakan fungsi helper untuk menentukan tanggal absensi yang benar
        const attendanceDate = normalizeDateForShift(now, shift);
        
        const timeSettings = await getDbTimeSettings();
        const { checkInStatus } = calculateAttendanceStatus(
            now.toLocaleTimeString('en-GB'),
            "00:00:00",
            shift, 
            timeSettings
        );

        // 4. Buat record di database
        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: attendanceDate,
                checkInTime: now,
                attendanceSheetPhoto: attendanceSheetUrl,
                selfiePhoto: selfieUrl,
                checkInStatus,
                checkOutStatus: "Belum Absen",
            },
        });

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR]", error);
        // Memberikan pesan error yang lebih spesifik jika terjadi kesalahan
        if (error instanceof Error) {
             return NextResponse.json({ message: `Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
    }
}