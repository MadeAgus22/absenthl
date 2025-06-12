// app/api/attendance/check-in/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { calculateAttendanceStatus } from "@/lib/attendance-utils";
import type { Shift, TimeSettings } from "@/lib/types";

// Asumsi fungsi untuk mendapatkan pengaturan waktu dari DB
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
        const { userId, shift, attendanceSheetPhoto, selfiePhoto } = body;

        // Validasi input
        if (!userId || !shift) {
            return new NextResponse("User ID and shift are required", { status: 400 });
        }
        
        // --- PERBAIKAN UTAMA DI SINI ---
        const now = new Date(); // Waktu saat ini dengan jam, menit, detik yang benar
        
        // Buat objek baru khusus untuk kolom 'date' tanpa mengubah 'now'
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0); // Atur waktu ke tengah malam untuk tanggal saja
        
        const timeSettings = await getDbTimeSettings();
        
        const { checkInStatus } = calculateAttendanceStatus(
            now.toLocaleTimeString('en-GB', { hour12: false }), // Gunakan waktu dari 'now' yang asli
            "00:00:00", // Waktu keluar belum ada
            shift, 
            timeSettings
        );

        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: startOfDay, // Gunakan objek tanggal yang sudah direset
                checkInTime: now, // Gunakan 'now' yang asli dengan waktu yang benar
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