// File: app/(authenticated)/reports/components/performance-report-tab.tsx

"use client";

import React, { useState, useRef } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import html2canvas from 'html2canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download } from "lucide-react";
import { Bar, BarChart, Pie, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type PerformanceData = {
  activitiesPerDay: { date: string; totalActivities: number }[];
  activitiesPerEmployee: { name: string; totalActivities: number }[];
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal memuat data laporan.");
    return res.json();
});

// ================== FIX 1: PERBAIKI PALET WARNA ==================
// Menggunakan daftar warna konkret yang bisa dibaca oleh Recharts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", 
  "#775DD0", "#546E7A", "#26a69a", "#D10CE8", "#f48024", "#69d2e7"
];
// =================================================================

export default function PerformanceReportTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

  const swrUrl = (startDate && endDate) 
      ? `/api/reports/performance?startDate=${startDate}&endDate=${endDate}` 
      : null;

  const { data, error, isLoading } = useSWR<PerformanceData>(swrUrl, fetcher);

  const handleDownloadImage = async (element: HTMLDivElement, fileName: string) => {
    if (!element) {
        toast.error("Elemen chart tidak ditemukan.");
        return;
    }
    toast.info("Membuat gambar...");
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${fileName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Chart berhasil diunduh!");
    } catch (e) {
        toast.error("Gagal mengunduh chart.");
        console.error(e);
    }
  };

  const barChartConfig = {
    totalActivities: { label: "Total Kegiatan", color: COLORS[0] },
  } satisfies ChartConfig;
  
  const pieChartData = data?.activitiesPerEmployee || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Kinerja Pegawai</CardTitle>
        <CardDescription>
          Dasbor analitik untuk total kegiatan harian dan rekapitulasi per pegawai.
        </CardDescription>
        <div className="pt-4">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )}
        {error && (
            <div className="text-red-500 flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error.message}</p>
            </div>
        )}
        {data && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card ref={barChartRef} className="bg-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Total Kegiatan Harian</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => barChartRef.current && handleDownloadImage(barChartRef.current, 'total-kegiatan-harian')}>
                            <Download className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                            <BarChart data={data.activitiesPerDay} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "d MMM")} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="totalActivities" fill="var(--color-totalActivities)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card ref={pieChartRef} className="bg-card">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Distribusi Kegiatan per Pegawai</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => pieChartRef.current && handleDownloadImage(pieChartRef.current, 'distribusi-kegiatan-pegawai')}>
                            <Download className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="w-full md:w-1/2">
                            <ChartContainer config={{}} className="h-[250px] w-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                    {/* ================== FIX 2: HAPUS innerRadius ================== */}
                                    <Pie data={pieChartData} dataKey="totalActivities" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false}>
                                        {pieChartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-2">
                            <h4 className="font-medium text-sm">Legenda</h4>
                            <ScrollArea className="h-48">
                                {pieChartData.map((entry, index) => (
                                    <div key={`legend-${index}`} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/50">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm text-muted-foreground flex-1">{entry.name}</span>
                                        <span className="text-sm font-semibold">{`(${entry.totalActivities})`}</span>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
      </CardContent>
    </Card>
  );
}