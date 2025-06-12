// app/api/attendance/check-out/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";

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
        // Ambil checkOutSelfiePhotoUrl dari body
        const { userId, logbookEntries, checkOutSelfiePhotoUrl } = body;

        if (!userId || !logbookEntries || logbookEntries.length === 0) {
            return NextResponse.json({ message: "User ID dan Logbook wajib diisi." }, { status: 400 });
        }
        
        // Tambahan: Validasi untuk foto absen keluar
        if (!checkOutSelfiePhotoUrl) {
             return NextResponse.json({ message: "Swafoto absen keluar wajib diisi." }, { status: 400 });
        }

        const lastCheckIn = await db.attendance.findFirst({
            where: { userId: userId, checkOutTime: null },
            orderBy: { checkInTime: 'desc' },
        });

        if (!lastCheckIn) {
            return NextResponse.json({ message: "Tidak ditemukan data absen masuk yang aktif." }, { status: 404 });
        }
        
        const now = new Date();
        const timeSettings = await getDbTimeSettings();
        const shift = lastCheckIn.shift as Shift;
        const { checkOutStatus } = calculateAttendanceStatus(lastCheckIn.checkInTime.toLocaleTimeString('en-GB'), now.toLocaleTimeString('en-GB'), shift, timeSettings);

        const updatedAttendance = await db.attendance.update({
            where: { id: lastCheckIn.id },
            data: {
                checkOutTime: now,
                checkOutStatus: checkOutStatus,
                // PERBAIKAN: Simpan URL foto absen keluar ke kolom checkOutSelfiePhoto
                checkOutSelfiePhoto: checkOutSelfiePhotoUrl,
                logbook: {
                    create: logbookEntries.map((entry: string) => ({ content: entry })),
                },
            },
        });

        return NextResponse.json(updatedAttendance);
    } catch (error) {
        console.error("[CHECK_OUT_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}