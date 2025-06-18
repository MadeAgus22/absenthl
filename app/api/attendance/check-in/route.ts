// File: app/api/attendance/check-in/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings, normalizeDateForShift } from "./utils";

// Fungsi uploadImage tetap sama
async function uploadImage(base64Data: string, prefix: string, userId: string): Promise<string> {
    const filename = `${prefix}-${userId}-${Date.now()}.jpeg`;
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

        // Validasi input (tetap sama)
        if (!userId || !shift) {
            return NextResponse.json({ message: "User ID dan shift wajib diisi." }, { status: 400 });
        }

        // Validasi Sesi Aktif (tetap sama)
        const activeCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null }
        });
        if (activeCheckIn) {
            return NextResponse.json(
                { message: "Anda sudah memiliki sesi absensi yang aktif dan belum melakukan check-out." },
                { status: 409 }
            );
        }

        // ================== PERUBAHAN UTAMA DIMULAI DI SINI ==================

        // 1. Dapatkan waktu UTC saat ini dari server. Ini adalah timestamp yang akurat.
        const nowUtc = new Date();

        // 2. Buat objek Date baru yang komponen tanggal dan waktunya sesuai dengan zona waktu WITA.
        //    Ini adalah trik untuk mendapatkan "tampilan" waktu WITA tanpa mengubah timezone server.
        const nowWita = new Date(nowUtc.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));

        // Upload gambar (tetap sama)
        let attendanceSheetUrl: string | null = null;
        if (attendanceSheetPhotoData) {
            attendanceSheetUrl = await uploadImage(attendanceSheetPhotoData, 'attendance', userId);
        }
        let selfieUrl: string | null = null;
        if (selfiePhotoData) {
            selfieUrl = await uploadImage(selfiePhotoData, 'selfie', userId);
        }
        
        // 3. Logika Tanggal dan Status menggunakan `nowWita`
        // `normalizeDateForShift` sekarang akan bekerja dengan benar karena menerima Date dengan komponen hari yang sesuai WITA.
        const attendanceDate = normalizeDateForShift(nowWita, shift as Shift);
        
        const timeSettings = await getDbTimeSettings();
        
        // Gunakan `nowWita` juga untuk kalkulasi status agar konsisten.
        const { checkInStatus } = calculateAttendanceStatus(
            nowWita.toLocaleTimeString('en-GB'), // Ambil string waktu dari `nowWita`
            "00:00:00", 
            shift, 
            timeSettings
        );

        // 4. Buat record di database
        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: attendanceDate,         // <-- ✅ Ini sekarang tanggal WITA yang benar
                checkInTime: nowUtc,          // <-- ✅ Ini tetap timestamp UTC yang presisi
                attendanceSheetPhoto: attendanceSheetUrl,
                selfiePhoto: selfieUrl,
                checkInStatus,
                checkOutStatus: "Belum Absen",
            },
        });

        // ================== AKHIR PERUBAHAN UTAMA ==================

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR]", error);
        if (error instanceof Error) {
             return NextResponse.json({ message: `Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
    }
}