// File: app/api/attendance/check-in/route.ts

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings, normalizeDateForShift } from "./utils";
import { utcToZonedTime } from 'date-fns-tz';

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

        if (!userId || !shift) {
            return NextResponse.json({ message: "User ID dan shift wajib diisi." }, { status: 400 });
        }

        const activeCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null }
        });
        if (activeCheckIn) {
            return NextResponse.json(
                { message: "Anda sudah memiliki sesi absensi yang aktif dan belum melakukan check-out." },
                { status: 409 }
            );
        }

        // ================== SOLUSI PALING ANDAL MENGGUNAKAN date-fns-tz ==================
        const nowUtc = new Date();
        const timeZone = 'Asia/Makassar';

        // Konversi waktu UTC ke zona waktu WITA secara andal
        const nowWita = utcToZonedTime(nowUtc, timeZone);
        // `nowWita` adalah objek Date yang komponennya (hari, jam) sudah 100% benar sesuai WITA.
        // =================================================================================

        let attendanceSheetUrl: string | null = null;
        if (attendanceSheetPhotoData) {
            attendanceSheetUrl = await uploadImage(attendanceSheetPhotoData, 'attendance', userId);
        }
        let selfieUrl: string | null = null;
        if (selfiePhotoData) {
            selfieUrl = await uploadImage(selfiePhotoData, 'selfie', userId);
        }
        
        const attendanceDate = normalizeDateForShift(nowWita, shift as Shift);
        
        const timeSettings = await getDbTimeSettings();
        const { checkInStatus } = calculateAttendanceStatus(
            // Gunakan `toLocaleTimeString` dari `nowWita` yang sudah dikonversi
            nowWita.toLocaleTimeString('en-GB'),
            "00:00:00", 
            shift, 
            timeSettings
        );

        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: attendanceDate,
                checkInTime: nowUtc,
                attendanceSheetPhoto: attendanceSheetUrl,
                selfiePhoto: selfieUrl,
                checkInStatus,
                checkOutStatus: "Belum Absen",
            },
        });

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR]", error);
        if (error instanceof Error) {
             return NextResponse.json({ message: `Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
    }
}