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
      // --- INI BAGIAN YANG DIPERBAIKI ---
      include: {
        user: {
          select: { name: true },
        },
        // Ambil semua data logbook yang terstruktur sesuai skema baru
        logbook: {
          select: {
            location: true,
            division: true,
            personAssisted: true,
            activity: true,
            createdAt: true,
          },
           orderBy: {
            createdAt: 'asc'
          }
        },
      },
      // --- AKHIR PERBAIKAN ---
      orderBy: {
        ...(sortBy === 'checkInTime' && { checkInTime: sortOrder as 'asc' | 'desc' }),
      }
    });

    // Kode di bawah ini sudah benar dan tidak perlu diubah
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