import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

// Pastikan Anda mengekspor fungsi dengan nama metode HTTP, seperti GET
export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        // Ambil data user terbaru dari database untuk keamanan
        const user = await db.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
            }
        });
        
        if (!user) {
             return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Kirim kembali data user
        return NextResponse.json({ user });

    } catch (error) {
        // Token tidak valid atau kedaluwarsa
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
}