import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { Shift, TimeSettings } from "@/lib/types";

// GET handler untuk mengambil semua pengaturan
export async function GET() {
    try {
        let accessSettings = await db.appSettings.findUnique({
            where: { id: "singleton" },
        });

        // Jika tidak ada pengaturan akses, buat default
        if (!accessSettings) {
            accessSettings = await db.appSettings.create({
                data: { id: "singleton" }
            });
        }

        const timeSettingsData = await db.timeSettings.findMany();
        
        // Jika tidak ada pengaturan waktu, buat default dari seed (atau bisa juga dihandle di sini)
        if (timeSettingsData.length === 0) {
            // Seharusnya ini sudah ditangani oleh seed, tapi sebagai fallback:
            console.log("No time settings found, please seed the database.");
        }

        // Format data waktu untuk frontend
        const timeSettings: Partial<TimeSettings> = {};
        timeSettingsData.forEach(s => {
            timeSettings[s.shiftName as Shift] = {
                checkInStart: s.checkInStart,
                checkInEnd: s.checkInEnd,
                checkOutStart: s.checkOutStart,
                checkOutEnd: s.checkOutEnd,
                overtimeThreshold: s.overtimeThreshold,
            };
        });

        return NextResponse.json({ access: accessSettings, time: timeSettings });

    } catch (error) {
        console.error("[GET_SETTINGS_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST handler untuk menyimpan pengaturan
export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Dapatkan data dari body, misalnya:
        const { accessSettings, timeSettings } = body;

        // Logika untuk menyimpan ke database...
        // (Ini adalah contoh, Anda bisa kembangkan lebih lanjut)
        if (accessSettings) {
             await db.appSettings.update({
                where: { id: "singleton" },
                data: accessSettings
            });
        }
        
        if (timeSettings) {
             for (const shiftName in timeSettings) {
                const shiftData = timeSettings[shiftName as Shift];
                await db.timeSettings.upsert({
                    where: { shiftName },
                    update: shiftData,
                    create: {
                        shiftName,
                        ...shiftData
                    }
                });
            }
        }

        return NextResponse.json({ message: "Pengaturan berhasil disimpan" });

    } catch (error) {
        console.error("[SAVE_SETTINGS_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}