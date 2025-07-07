// app/(authenticated)/reports/components/log-report-tab.tsx

"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Download } from "lucide-react";
import { toast } from "sonner"; // <-- Impor toast

// Tipe data untuk laporan log
type LogReportData = {
  id: string;
  date: string;
  user: {
    name: string;
  };
  logbook: {
    content: string;
  }[];
};

type UserData = {
    id: string;
    name: string;
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal memuat data.");
    return res.json();
});

export default function LogReportTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [limit, setLimit] = useState("50");
  const [isDownloading, setIsDownloading] = useState(false); // State untuk proses download

  const { data: employees } = useSWR<UserData[]>('/api/users', fetcher);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
  
  const searchParam = selectedEmployee === 'all' ? '' : selectedEmployee;

  const swrUrl = (startDate && endDate) 
      ? `/api/reports/log?startDate=${startDate}&endDate=${endDate}&search=${searchParam}&limit=${limit}` 
      : null;

  const { data, error, isLoading } = useSWR<LogReportData[]>(swrUrl, fetcher);

  // Fungsi untuk handle download menggunakan XLSX
  const handleExport = async () => {
    if (!startDate || !endDate) {
        toast.error("Silakan pilih rentang tanggal terlebih dahulu.");
        return;
    }

    setIsDownloading(true);
    toast.info("Mempersiapkan data untuk diunduh...");

    try {
        // Ambil SEMUA data untuk di-export (abaikan limit)
        const exportUrl = `/api/reports/log?startDate=${startDate}&endDate=${endDate}&search=${searchParam}&limit=all`;
        const res = await fetch(exportUrl);
        if (!res.ok) throw new Error("Gagal mengambil data lengkap untuk ekspor.");
        
        const allData: LogReportData[] = await res.json();

        if (allData.length === 0) {
            toast.warning("Tidak ada data untuk diekspor pada filter yang dipilih.");
            return;
        }

        // Format data untuk sheet Excel
        const formattedData = allData.flatMap(item => 
            item.logbook.map(log => ({
                'Tanggal': format(new Date(item.date), 'd MMM yyyy', { locale: localeID }),
                'Nama Pegawai': item.user.name,
                'Log Kegiatan': log.content,
            }))
        );

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        // Atur lebar kolom (opsional)
        worksheet['!cols'] = [
            { wch: 20 }, // Tanggal
            { wch: 30 }, // Nama Pegawai
            { wch: 70 }, // Log Kegiatan
        ];
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Log Kegiatan");

        // Buat file dan trigger download
        XLSX.writeFile(workbook, `Laporan_Log_${startDate}_hingga_${endDate}.xlsx`);
        toast.success("Laporan berhasil diunduh!");

    } catch (e: any) {
        toast.error(e.message || "Terjadi kesalahan saat membuat file Excel.");
        console.error(e);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Laporan Log Kegiatan Pegawai</CardTitle>
                <CardDescription className="mt-1">
                  Lihat, filter, dan unduh log kegiatan pegawai.
                </CardDescription>
            </div>
            {/* Tombol Download */}
            <Button onClick={handleExport} disabled={isDownloading || isLoading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Mengunduh..." : "Unduh Excel"}
            </Button>
        </div>
        <div className="pt-4 flex flex-col md:flex-row gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <div className="flex-1 flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Pilih Pegawai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pegawai</SelectItem>
                {employees?.map(emp => (
                  <SelectItem key={emp.id} value={emp.name}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Jumlah data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Tanggal</TableHead>
                <TableHead className="w-[200px]">Nama Pegawai</TableHead>
                <TableHead>Log Kegiatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-red-500">
                    <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                    Gagal memuat data log kegiatan.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Tidak ada data log kegiatan untuk filter yang dipilih.
                  </TableCell>
                </TableRow>
              )}
              {data?.map((item) => (
                item.logbook.map((log, logIndex) => (
                  <TableRow key={`${item.id}-${logIndex}`}>
                    {logIndex === 0 && (
                      <>
                        <TableCell rowSpan={item.logbook.length} className="font-medium align-top">
                          {format(new Date(item.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell rowSpan={item.logbook.length} className="align-top">
                          {item.user.name}
                        </TableCell>
                      </>
                    )}
                    <TableCell>{log.content}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}