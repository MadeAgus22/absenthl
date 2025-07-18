import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string };

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const skip = (page - 1) * limit;

        let dateFilter = {};
        if (from && to) {
            dateFilter = {
                date: {
                    gte: new Date(from),
                    lte: new Date(to),
                }
            };
        }

        const userFilter = decoded.role === 'admin' ? {} : { userId: decoded.id };
        const whereClause = { ...userFilter, ...dateFilter };

        const records = await db.attendance.findMany({
            where: whereClause,
            // --- PERBAIKAN DI SINI ---
            include: {
                user: { select: { name: true } },
                logbook: { 
                  select: { 
                    location: true,
                    division: true,
                    personAssisted: true,
                    activity: true
                  },
                  orderBy: { createdAt: 'asc' }
                }
            },
            // --- AKHIR PERBAIKAN ---
            orderBy: { date: 'desc' },
            take: limit,
            skip: skip,
        });

        const total = await db.attendance.count({ where: whereClause });

        return NextResponse.json({ data: records, total });

    } catch (error) {
        console.error("[GET_ATTENDANCE_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}