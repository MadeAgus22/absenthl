// File: app/api/reports/performance/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Parameter startDate dan endDate wajib diisi." },
        { status: 400 }
      );
    }

    const records = await db.attendance.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        userId: true,
        date: true,
        user: {
          select: { name: true },
        },
        _count: {
          select: { logbook: true },
        },
      },
    });

    // 1. Agregasi untuk Pie Chart (Total Kegiatan per Pegawai)
    const activitiesPerEmployeeMap = new Map<string, { name: string, totalActivities: number }>();
    for (const record of records) {
        const existing = activitiesPerEmployeeMap.get(record.userId);
        if (existing) {
            existing.totalActivities += record._count.logbook;
        } else {
            activitiesPerEmployeeMap.set(record.userId, {
                name: record.user.name,
                totalActivities: record._count.logbook,
            });
        }
    }

    // 2. Agregasi untuk Bar Chart (Total Kegiatan per Hari)
    const activitiesPerDayMap = new Map<string, { date: string, totalActivities: number }>();
    for (const record of records) {
        const dateKey = format(record.date, 'yyyy-MM-dd');
        const existing = activitiesPerDayMap.get(dateKey);
        if (existing) {
            existing.totalActivities += record._count.logbook;
        } else {
            activitiesPerDayMap.set(dateKey, {
                date: dateKey,
                totalActivities: record._count.logbook,
            });
        }
    }

    const activitiesPerEmployee = Array.from(activitiesPerEmployeeMap.values())
        .filter(item => item.totalActivities > 0) // Hanya tampilkan yang ada kegiatan
        .sort((a, b) => b.totalActivities - a.totalActivities);

    const activitiesPerDay = Array.from(activitiesPerDayMap.values())
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return NextResponse.json({
        activitiesPerDay,
        activitiesPerEmployee,
    });

  } catch (error) {
    console.error("[GET_PERFORMANCE_REPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}