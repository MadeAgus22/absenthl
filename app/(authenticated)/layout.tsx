"use client"

import { useState, useEffect } from "react";
import type React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Clock, Settings, LogOut, Menu, UserCircle } from "lucide-react";
import Link from "next/link";
import useSWR from 'swr';
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { SessionProvider } from "./session-provider"; // Impor provider yang sudah kita buat

// Fetcher function untuk SWR, pastikan credentials disertakan
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.');
      (error as any).info = res.json();
      (error as any).status = res.status;
      throw error;
    }
    return res.json();
});


export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Pengambilan data sesi tetap di sini sebagai satu-satunya sumber kebenaran
  const { data: session, error, isLoading } = useSWR('/api/auth/session', fetcher, {
    revalidateOnFocus: false, // Bisa diatur true jika ingin re-fetch saat window di-fokus
    shouldRetryOnError: false, // Mencegah SWR mencoba lagi jika error 401
  });

  const user = session?.user;

  // Efek untuk me-redirect jika ada error (misal, token tidak valid/kadaluarsa)
  useEffect(() => {
    if (error) {
        // Redirect ke halaman login jika otentikasi gagal
        window.location.href = "/";
    }
  }, [error]);


  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Gunakan full page reload untuk memastikan semua state di-reset
    window.location.href = "/";
  }

  // Definisikan navigasi di dalam render agar bisa mengakses 'user'
  // Logika untuk menampilkan dashboard berdasarkan localStorage sebaiknya dihindari di server-side rendering
  // karena localStorage hanya ada di client. Cukup andalkan peran pengguna.
  const navigation = user ? [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Absensi", href: "/attendance", icon: Clock },
    { name: "Akun", href: "/account", icon: UserCircle }, 
    ...(user.role === "admin" ? [{ name: "Pengaturan", href: "/settings", icon: Settings }] : []),
  ] : [];
  
  // Menampilkan skeleton loading saat sesi sedang diverifikasi
  if (isLoading) {
      return (
          <div className="flex h-screen bg-background">
              {/* Skeleton untuk Desktop */}
              <div className="hidden lg:flex lg:w-64 flex-col border-r p-4 space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="flex-1 p-6 lg:p-8">
                  <Skeleton className="h-full w-full rounded-xl" />
              </div>
          </div>
      )
  }

  // Jika setelah loading selesai tapi sesi tidak ada (misalnya karena redirect dari error),
  // render null agar tidak ada flash of content yang salah.
  if (!session) {
    return null; 
  }

  return (
    // Membungkus seluruh layout dengan SessionProvider
    <SessionProvider value={session}>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        {/* Mobile menu */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 border-b dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Image src="/rsngoerah.png" alt="Logo" width={32} height={32} />
              <h1 className="text-lg font-semibold">Absensi Online</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu />
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 shadow-lg">
              <div className="p-4 border-b dark:border-neutral-700">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <nav className="flex flex-col py-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium ${
                      pathname === item.href ? "bg-primary/10 text-primary" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 text-sm font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 pt-5">
            <div className="flex flex-shrink-0 items-center gap-2 px-4">
              <Image src="/rsngoerah.png" alt="Logo" width={32} height={32} />
              <h1 className="text-xl font-bold">Sistem Absensi</h1>
            </div>
            <div className="mt-5 flex flex-grow flex-col">
              <nav className="flex-1 space-y-1 px-2 pb-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                      pathname.startsWith(item.href) ? "bg-primary/10 text-primary" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-neutral-800 p-4">
              <div className="flex items-center w-full">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="lg:pl-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </SessionProvider>
  )
}