// app/api/auth/login/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return new NextResponse("Missing username or password", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user || !user.password) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return new NextResponse("Invalid credentials", { status: 401 });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json({ user: userWithoutPassword, token });
    
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Menggunakan 'lax' lebih fleksibel dari 'strict'
        path: '/',
        maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;

  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}