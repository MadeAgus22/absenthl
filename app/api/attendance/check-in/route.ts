// app/api/attendance/check-in/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";

// Asumsi fungsi untuk mendapatkan pengaturan waktu dari DB
async function getTimeSettings() {
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
        const { userId, shift, attendanceSheetPhoto, selfiePhoto } = body;

        // Validasi input
        if (!userId || !shift) {
            return new NextResponse("User ID and shift are required", { status: 400 });
        }
        
        const now = new Date();
        const timeSettings = await getTimeSettings();
        
        const { checkInStatus } = calculateAttendanceStatus(
            now.toTimeString().slice(0, 8), 
            "00:00:00", // Waktu keluar belum ada
            shift, 
            timeSettings
        );

        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: new Date(now.setHours(0, 0, 0, 0)), // Set tanggal ke awal hari
                checkInTime: now,
                attendanceSheetPhoto,
                selfiePhoto,
                checkInStatus,
                checkOutStatus: "Belum Absen",
            },
        });

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("[CHECK_IN_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}