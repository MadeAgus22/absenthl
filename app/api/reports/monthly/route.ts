// File: app/api/reports/monthly/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") || "desc";

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
      // ================== PERUBAHAN DI SINI ==================
      // Tambahkan checkInStatus ke dalam data yang diambil
      select: {
        userId: true,
        date: true,
        checkInTime: true,
        checkInStatus: true, // <-- MINTA DATA STATUS
        user: {
          select: { name: true },
        },
        _count: {
          select: { logbook: true },
        },
      },
      // =======================================================
      orderBy: {
        user: { name: 'asc' }
      }
    });

    // Proses data mentah menjadi laporan terstruktur per pegawai
    const reportData = new Map<string, {
      userId: string;
      userName: string;
      totalActivities: number;
      // Ubah tipe data dates untuk menampung objek { time, status }
      dates: { [key: string]: { time: string; status: string; } | null };
    }>();

    for (const record of records) {
      if (!reportData.has(record.userId)) {
        reportData.set(record.userId, {
          userId: record.userId,
          userName: record.user.name,
          totalActivities: 0,
          dates: {},
        });
      }

      const userReport = reportData.get(record.userId)!;
      const formattedDate = format(record.date, 'yyyy-MM-dd');
      
      // ================== PERUBAHAN DI SINI ==================
      userReport.dates[formattedDate] = {
        time: record.checkInTime.toLocaleTimeString('en-GB', { 
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit' 
        }),
        status: record.checkInStatus
      };
      // =======================================================

      userReport.totalActivities += record._count.logbook;
    }

    let finalData = Array.from(reportData.values());

    if (sortBy === 'totalActivities') {
      finalData.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.totalActivities - b.totalActivities
          : b.totalActivities - a.totalActivities;
      });
    }

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("[GET_MONTHLY_REPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}