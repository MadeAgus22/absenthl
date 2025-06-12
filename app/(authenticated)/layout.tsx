"use client"

// --- PERBAIKAN DI SINI ---
// Mengimpor fungsi useState dan useEffect dari React
import { useState, useEffect } from "react";
import type React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
// PERBAIKAN: Impor ikon UserCircle untuk menu Akun
import { LayoutDashboard, Clock, Settings, LogOut, Menu, UserCircle } from "lucide-react";
import Link from "next/link";
import useSWR from 'swr';
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

// Fetcher function untuk SWR
const fetcher = (url: string) => fetch(url).then(res => {
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

  const { data: session, error, isLoading } = useSWR('/api/auth/session', fetcher, {
    revalidateOnFocus: false,
  });

  const user = session?.user;

  useEffect(() => {
    if (error) {
        router.push("/");
    }
  }, [error, router]);


  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await router.push("/");
  }

  // Definisikan navigation di dalam render agar bisa mengakses 'user'
  const navigation = user ? [
    ...(user.role === "admin" || (typeof window !== 'undefined' && JSON.parse(localStorage.getItem("accessSettings") || '{"allowEmployeeDashboardAccess": true}').allowEmployeeDashboardAccess)
      ? [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]
      : []),
    { name: "Absensi", href: "/attendance", icon: Clock },
    // PERBAIKAN: Tambahkan item menu Akun di sini untuk semua role
    { name: "Akun", href: "/account", icon: UserCircle }, 
    ...(user.role === "admin" ? [{ name: "Pengaturan", href: "/settings", icon: Settings }] : []),
  ] : [];
  
  // Menampilkan skeleton loading saat sesi sedang diverifikasi
  if (isLoading) {
      return (
          <div className="flex h-screen">
              <div className="hidden lg:flex lg:w-64 flex-col border-r p-4 space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex-1 p-8">
                  <Skeleton className="h-full w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 shadow">
          <Image src="/rsngoerah.png" alt="Logo" width={32} height={32} />
          <h1 className="text-xl font-bold">Sistem Absensi</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu />
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 shadow-lg">
            <div className="p-4 border-b dark:border-neutral-700">
              <p className="font-medium">{user?.name}</p>
            </div>
            <nav className="flex flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm ${
                    pathname === item.href ? "bg-gray-100 dark:bg-neutral-700 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
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
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <Image src="/rsngoerah.png" alt="Logo" width={32} height={32} />
            <h1 className="text-xl font-bold">Sistem Absensi</h1>
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    pathname.startsWith(item.href) ? "bg-gray-100 dark:bg-neutral-700 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-neutral-700 p-4">
            <div className="flex items-center w-full">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === "admin" ? "Administrator" : "Pegawai"}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}