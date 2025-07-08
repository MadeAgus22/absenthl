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
        
        const activeCheckIn = await db.attendance.findFirst({
            where: {
                userId: decoded.id,
                checkOutTime: null,
            },
            // --- PERUBAHAN DI SINI ---
            include: {
                logbook: { // Sertakan data logbook yang sudah ada
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            },
            // --- AKHIR PERUBAHAN ---
            orderBy: {
                checkInTime: 'desc',
            },
        });

        if (activeCheckIn) {
            return NextResponse.json({
                hasActiveCheckIn: true,
                activeCheckInData: activeCheckIn,
            });
        }

        return NextResponse.json({ hasActiveCheckIn: false });

    } catch (error) {
        console.error("[GET_ATTENDANCE_STATUS_ERROR]", error);
        if (error instanceof jwt.JsonWebTokenError) {
             return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}