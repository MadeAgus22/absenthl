import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// FUNGSI UNTUK MEMBUAT LOGBOOK BARU
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { attendanceId, location, division, personAssisted, activity } = body;

        if (!attendanceId || !location || !division || !personAssisted || !activity) {
            return NextResponse.json({ message: "Semua field logbook wajib diisi." }, { status: 400 });
        }

        const newLogEntry = await db.logbookEntry.create({
            data: {
                attendanceId,
                location,
                division,
                personAssisted,
                activity,
            }
        });

        return NextResponse.json(newLogEntry, { status: 201 });

    } catch (error) {
        console.error("[CREATE_LOGBOOK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// FUNGSI UNTUK MENGUBAH LOGBOOK
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { logId, location, division, personAssisted, activity } = body;

        if (!logId) {
            return NextResponse.json({ message: "Log ID wajib diisi." }, { status: 400 });
        }

        const updatedLogEntry = await db.logbookEntry.update({
            where: { id: logId },
            data: {
                location,
                division,
                personAssisted,
                activity,
            }
        });

        return NextResponse.json(updatedLogEntry);

    } catch (error) {
        console.error("[UPDATE_LOGBOOK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


// FUNGSI UNTUK MENGHAPUS LOGBOOK
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const logId = searchParams.get('logId');

        if (!logId) {
            return NextResponse.json({ message: "Parameter logId wajib diisi." }, { status: 400 });
        }

        await db.logbookEntry.delete({
            where: { id: logId },
        });

        return new NextResponse(null, { status: 204 }); // 204 No Content

    } catch (error) {
        console.error("[DELETE_LOGBOOK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}