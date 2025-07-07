// app/api/users/change-password/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

export async function PUT(req: NextRequest) {
    try {
        // 1. Dapatkan ID pengguna dari token sesi
        const token = req.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Otentikasi gagal' }, { status: 401 });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const userId = decoded.id;

        // 2. Dapatkan data dari body request
        const { oldPassword, newPassword, confirmPassword } = await req.json();

        // 3. Validasi input dasar
        if (!oldPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ message: "Semua field password wajib diisi." }, { status: 400 });
        }
        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: "Password baru dan konfirmasi password tidak cocok." }, { status: 400 });
        }
        if (newPassword.length < 6) {
             return NextResponse.json({ message: "Password baru minimal harus 6 karakter." }, { status: 400 });
        }

        // 4. Ambil data pengguna dari database
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user || !user.password) {
            return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        // 5. Verifikasi password lama
        const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordCorrect) {
            return NextResponse.json({ message: "Password lama yang Anda masukkan salah." }, { status: 403 });
        }

        // 6. Hash dan simpan password baru
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        return NextResponse.json({ message: "Password berhasil diperbarui." });

    } catch (error) {
        console.error("[CHANGE_PASSWORD_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}