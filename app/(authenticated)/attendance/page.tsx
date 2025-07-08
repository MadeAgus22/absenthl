// File: app/(authenticated)/attendance/page.tsx
"use client"

import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CheckInTab from "./components/check-in-tab";
import CheckOutTab from "./components/check-out-tab";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AttendancePage() {
  // Mengambil status absensi pengguna saat ini
  const { data: attendanceStatus, isLoading } = useSWR('/api/attendance/status', fetcher, {
    revalidateOnFocus: true, // Otomatis refresh saat tab di-fokus
    refreshInterval: 30000 // Refresh setiap 30 detik
  });

  const hasActiveCheckIn = attendanceStatus?.hasActiveCheckIn ?? false;
  // Ambil ID unik dari data absensi yang aktif
  const activeCheckInId = attendanceStatus?.activeCheckInData?.id;

  // Jika masih loading, tampilkan skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
          <p className="text-muted-foreground">Memuat status absensi Anda...</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
        <p className="text-muted-foreground">Silakan lakukan absensi masuk atau keluar</p>
      </div>

      {/* Default tab akan disesuaikan berdasarkan status absensi */}
      <Tabs defaultValue={hasActiveCheckIn ? "check-out" : "check-in"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in" disabled={hasActiveCheckIn}>Absen Masuk</TabsTrigger>
          <TabsTrigger value="check-out" disabled={!hasActiveCheckIn}>Absen Keluar</TabsTrigger>
        </TabsList>

        <TabsContent value="check-in">
          {/* Kirim status 'disabled' ke komponen tab */}
          <CheckInTab disabled={hasActiveCheckIn} />
        </TabsContent>

        <TabsContent value="check-out">
          {/* --- PERBAIKAN DI SINI: Tambahkan prop 'key' --- */}
          <CheckOutTab 
            key={activeCheckInId || 'no-session'} // Ini akan mereset komponen saat ID berubah
            disabled={!hasActiveCheckIn}
            activeCheckInData={attendanceStatus?.activeCheckInData} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}