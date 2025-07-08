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
          mode: 'insensitive',
        },
      },
      logbook: {
        some: {},
      }
    };

    const take = limitParam === 'all' ? undefined : parseInt(limitParam || '50', 10);

    const records = await db.attendance.findMany({
      where: whereClause,
      select: {
        id: true,
        user: {
          select: { name: true },
        },
        // --- PERUBAHAN DI SINI: Ambil semua field dari logbook ---
        logbook: {
          select: { 
            location: true,
            division: true,
            personAssisted: true,
            activity: true,
            createdAt: true // Ambil timestamp
          },
          orderBy: {
            createdAt: 'asc' // Urutkan log berdasarkan waktu dibuat
          }
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: take,
    });

    return NextResponse.json(records);

  } catch (error) {
    console.error("[GET_LOG_REPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}