// File: app/api/attendance/check-in/route.ts (Versi Final - Mode Debugging)

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";
import { put } from '@vercel/blob';
import { getDbTimeSettings, normalizeDateForShift } from "./utils";
import { toZonedTime } from 'date-fns-tz';

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
        console.log("\n==============================================");
        console.log("API CHECK-IN (VERSI FINAL - DEBUG) DIPANGGIL");
        console.log(`Waktu Panggilan (UTC): ${new Date().toISOString()}`);
        console.log("==============================================");

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

        const nowUtc = new Date();
        const timeZone = 'Asia/Makassar';
        const nowWita = toZonedTime(nowUtc, timeZone);
        
        console.log(`[DEBUG] Waktu UTC Server (nowUtc): ${nowUtc.toISOString()}`);
        console.log(`[DEBUG] Waktu Konversi (nowWita): ${nowWita.toString()}`);

        let attendanceSheetUrl: string | null = null;
        if (attendanceSheetPhotoData) {
            attendanceSheetUrl = await uploadImage(attendanceSheetPhotoData, 'attendance', userId);
        }
        let selfieUrl: string | null = null;
        if (selfiePhotoData) {
            selfieUrl = await uploadImage(selfiePhotoData, 'selfie', userId);
        }

        const attendanceDate = normalizeDateForShift(nowWita, shift as Shift);
        console.log(`[DEBUG] Tanggal yang akan disimpan (attendanceDate): ${attendanceDate.toISOString()}`);

        const timeSettings = await getDbTimeSettings();
        const { checkInStatus } = calculateAttendanceStatus(
            nowWita.toLocaleTimeString('en-GB'),
            "00:00:00", 
            shift, 
            timeSettings
        );
        console.log(`[DEBUG] Status Kehadiran Dihitung: ${checkInStatus}`);

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

        console.log("[DEBUG] Data yang berhasil disimpan ke DB:", attendance);
        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR_DEBUG_FINAL]", error);
        if (error instanceof Error) {
             return NextResponse.json({ message: `Terjadi kesalahan internal: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ message: "Terjadi kesalahan internal." }, { status: 500 });
    }
}