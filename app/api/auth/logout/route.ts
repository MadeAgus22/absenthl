// app/api/auth/logout/route.ts

import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json({ message: "Logout successful" });
        
        // Hapus cookie dengan mengatur maxAge ke 0 atau masa lalu
        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: -1, // Langsung kedaluwarsa
        });

        return response;
    } catch (error) {
        console.error('[LOGOUT_ERROR]', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}