// File: app/api/attendance/check-in/route.ts (Versi Debugging)

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { toZonedTime } from 'date-fns-tz';

export async function POST(req: Request) {
    try {
        // --- LOG PEMBUKTIAN 1 ---
        console.log("=================================================");
        console.log("API CHECK-IN DENGAN KODE DEBUGGING DIPANGGIL");
        console.log(`Waktu Panggilan (UTC): ${new Date().toISOString()}`);
        console.log("=================================================");

        const body = await req.json();
        const { userId, shift } = body;

        const nowUtc = new Date();
        const timeZone = 'Asia/Makassar';
        const nowWita = toZonedTime(nowUtc, timeZone);

        // --- LOG PEMBUKTIAN 2 ---
        console.log(`[DEBUG] Nilai nowUtc: ${nowUtc.toISOString()}`);
        console.log(`[DEBUG] Nilai nowWita setelah konversi: ${nowWita.toString()}`);
        console.log(`[DEBUG] Hari dari nowWita.getDate(): ${nowWita.getDate()}`);

        // --- TES HARDCODE ---
        // Kita akan paksa tanggal menjadi 1 Jan 2099 untuk melihat apakah perubahan ini masuk.
        const testDate = new Date('2099-01-01T00:00:00Z');
        console.log(`[DEBUG] Tanggal yang akan disimpan (paksa): ${testDate.toISOString()}`);

        const attendance = await db.attendance.create({
            data: {
                userId,
                shift,
                date: testDate, // Menggunakan tanggal yang dipaksa
                checkInTime: nowUtc,
                checkInStatus: "Debugging",
                checkOutStatus: "Debugging",
            },
        });

        console.log("[DEBUG] Data berhasil disimpan ke DB:", attendance);
        return NextResponse.json({ message: "Debugging success", data: attendance });

    } catch (error) {
        console.error("[CHECK_IN_ERROR_DEBUG]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}