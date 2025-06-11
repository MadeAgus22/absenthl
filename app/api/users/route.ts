import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';

export async function GET() {
    try {
        const users = await db.user.findMany({
            select: { id: true, name: true, username: true, email: true, role: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("[GET_USERS_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, username, email, password, role } = body;

        if (!name || !username || !email || !password) {
            return NextResponse.json({ message: "Semua field wajib diisi" }, { status: 400 });
        }

        const existingUser = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
        if (existingUser) {
            return NextResponse.json({ message: "Username atau email sudah digunakan" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.user.create({
            data: { name, username, email, role, password: hashedPassword }
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error) {
        console.error("[CREATE_USER_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}