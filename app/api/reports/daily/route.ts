// File: app/api/reports/daily/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const sortBy = searchParams.get("sortBy") || "checkInTime";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    if (!date) {
      return NextResponse.json(
        { message: "Parameter tanggal wajib diisi." },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const records = await db.attendance.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      // ================== PASTIKAN BAGIAN INI SUDAH BENAR ==================
      include: {
        user: {
          select: { name: true },
        },
        // Kita harus mengambil 'content' dari logbook agar tidak kosong
        logbook: {
          select: {
            content: true,
          },
        },
      },
      // ====================================================================
      orderBy: {
        ...(sortBy === 'checkInTime' && { checkInTime: sortOrder as 'asc' | 'desc' }),
      }
    });

    let data = records.map(record => ({
        ...record,
        logbookCount: record.logbook.length,
    }));

    if (sortBy === 'logbookCount') {
        data.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.logbookCount - b.logbookCount;
            } else {
                return b.logbookCount - a.logbookCount;
            }
        });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("[GET_DAILY_REPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}