// app/api/users/[userId]/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';

// PERBAIKAN: Tambahkan parameter kedua { params } untuk menangkap segmen dinamis
export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params; // Ambil userId dari params

        if (!userId) {
            return NextResponse.json({ message: "User ID tidak ditemukan di URL." }, { status: 400 });
        }

        const body = await req.json();
        const { name, username, email, role, password } = body;

        const updateData: { [key: string]: any } = { name, username, email, role };
        
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData
        });
        
        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("[UPDATE_USER_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PERBAIKAN: Tambahkan parameter kedua { params }
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const { userId } = params; // Ambil userId dari params

        if (!userId) {
            return NextResponse.json({ message: "User ID tidak ditemukan di URL." }, { status: 400 });
        }
        
        await db.user.delete({ where: { id: userId } });
        return new NextResponse(null, { status: 204 });
        
    } catch (error) {
        console.error("[DELETE_USER_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}