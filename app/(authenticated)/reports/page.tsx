// File: app/(authenticated)/reports/page.tsx

"use client"

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Impor semua komponen tab
import DailyReportTab from "./components/daily-report-tab";
import MonthlyReportTab from "./components/monthly-report-tab";
import PerformanceReportTab from "./components/performance-report-tab";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ReportsPage() {
    // Ambil sesi untuk memeriksa peran pengguna
    const { data: session, isLoading: isSessionLoading } = useSWR('/api/auth/session', fetcher);

    // Tampilkan skeleton saat sesi sedang dimuat
    if (isSessionLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
  
    // Blokir akses jika pengguna bukan admin
    if (session?.user?.role !== "admin") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Akses Terbatas</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </CardContent>
        </Card>
      );
    }

    // Tampilan untuk admin dengan semua tab
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
                <p className="text-muted-foreground">Analisis data absensi dan kinerja pegawai.</p>
            </div>
            
            <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Laporan Harian</TabsTrigger>
                    <TabsTrigger value="monthly">Laporan Bulanan</TabsTrigger>
                    <TabsTrigger value="performance">Laporan Kinerja</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                    <DailyReportTab />
                </TabsContent>
                
                <TabsContent value="monthly">
                    <MonthlyReportTab />
                </TabsContent>

                <TabsContent value="performance">
                    <PerformanceReportTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}