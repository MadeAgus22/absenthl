// app/api/attendance/status/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        
        // Cari data absensi terakhir yang BELUM ada checkOutTime-nya
        const activeCheckIn = await db.attendance.findFirst({
            where: {
                userId: decoded.id,
                checkOutTime: null,
            },
            orderBy: {
                checkInTime: 'desc',
            },
        });

        if (activeCheckIn) {
            // Jika ditemukan, kirim status bahwa ada absensi aktif
            return NextResponse.json({
                hasActiveCheckIn: true,
                activeCheckInData: activeCheckIn,
            });
        }

        // Jika tidak ada, kirim status bahwa tidak ada absensi aktif
        return NextResponse.json({ hasActiveCheckIn: false });

    } catch (error) {
        console.error("[GET_ATTENDANCE_STATUS_ERROR]", error);
        // Jika token tidak valid atau ada error lain
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}