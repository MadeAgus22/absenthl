// File: app/api/reports/log/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const searchQuery = searchParams.get("search") || "";
    const limitParam = searchParams.get("limit");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Parameter startDate dan endDate wajib diisi." },
        { status: 400 }
      );
    }

    const whereClause: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      user: {
        name: {
          contains: searchQuery,
          mode: 'insensitive', // Pencarian case-insensitive
        },
      },
      // Hanya ambil data absensi yang memiliki logbook
      logbook: {
        some: {},
      }
    };

    // Jika limit 'all', 'take' akan undefined (ambil semua data)
    // Jika tidak, parse limitnya (default 50)
    const take = limitParam === 'all' ? undefined : parseInt(limitParam || '50', 10);

    const records = await db.attendance.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        user: {
          select: { name: true },
        },
        logbook: {
          select: { content: true },
          orderBy: {
            id: 'asc'
          }
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: take, // Gunakan 'take' untuk limitasi data
    });

    return NextResponse.json(records);

  } catch (error) {
    console.error("[GET_LOG_REPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}