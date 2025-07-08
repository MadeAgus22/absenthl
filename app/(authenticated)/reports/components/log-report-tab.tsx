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
import { toast } from "sonner";

// --- PERUBAHAN TIPE DATA 1: Sesuaikan dengan skema baru ---
type LogbookEntry = {
  location: string;
  division: string;
  personAssisted: string;
  activity: string;
  createdAt: string; // Timestamp
};

type LogReportData = {
  id: string;
  user: {
    name: string;
  };
  logbook: LogbookEntry[];
};

type UserData = {
    id: string;
    name: string;
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal memuat data log kegiatan.");
    return res.json();
});

export default function LogReportTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [limit, setLimit] = useState("50");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: employees } = useSWR<UserData[]>('/api/users', fetcher);

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
  const searchParam = selectedEmployee === 'all' ? '' : selectedEmployee;
  const swrUrl = (startDate && endDate) 
      ? `/api/reports/log?startDate=${startDate}&endDate=${endDate}&search=${searchParam}&limit=${limit}` 
      : null;

  const { data, error, isLoading } = useSWR<LogReportData[]>(swrUrl, fetcher);

  // Fungsi untuk memformat timestamp
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "dd/MM/yyyy HH:mm", { locale: localeID });
  }

  const handleExport = async () => {
    if (!startDate || !endDate) {
        toast.error("Silakan pilih rentang tanggal terlebih dahulu.");
        return;
    }
    setIsDownloading(true);
    toast.info("Mempersiapkan data untuk diunduh...");
    try {
        const exportUrl = `/api/reports/log?startDate=${startDate}&endDate=${endDate}&search=${searchParam}&limit=all`;
        const res = await fetch(exportUrl);
        if (!res.ok) throw new Error("Gagal mengambil data lengkap untuk ekspor.");
        const allData: LogReportData[] = await res.json();
        if (allData.length === 0) {
            toast.warning("Tidak ada data untuk diekspor pada filter yang dipilih.");
            return;
        }

        // --- PERUBAHAN TIPE DATA 2: Sesuaikan format Excel ---
        const formattedData = allData.flatMap(item => 
            item.logbook.map(log => ({
                'Timestamp': formatTimestamp(log.createdAt),
                'Nama Pegawai': item.user.name,
                'Lokasi/Gedung': log.location,
                'Divisi/Ruangan': log.division,
                'Yang Dibantu': log.personAssisted,
                'Aktivitas': log.activity,
            }))
        );

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        worksheet['!cols'] = [ { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 50 } ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Log Kegiatan");
        XLSX.writeFile(workbook, `Laporan_Log_Terstruktur_${startDate}_hingga_${endDate}.xlsx`);
        toast.success("Laporan berhasil diunduh!");

    } catch (e: any) {
        toast.error(e.message || "Terjadi kesalahan saat membuat file Excel.");
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
                <CardDescription className="mt-1">Lihat, filter, dan unduh log kegiatan pegawai.</CardDescription>
            </div>
            <Button onClick={handleExport} disabled={isDownloading || isLoading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Mengunduh..." : "Unduh Excel"}
            </Button>
        </div>
        <div className="pt-4 flex flex-col md:flex-row gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <div className="flex-1 flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full md:w-[250px]"><SelectValue placeholder="Pilih Pegawai" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pegawai</SelectItem>
                {employees?.map(emp => (<SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Jumlah data" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem><SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            {/* --- PERUBAHAN Tampilan 3: Ubah Header Tabel --- */}
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[200px]">Nama Pegawai</TableHead>
                <TableHead>Lokasi/Gedung</TableHead>
                <TableHead>Divisi/Ruangan</TableHead>
                <TableHead>Yang Dibantu</TableHead>
                <TableHead>Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {error && (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-red-500"><AlertCircle className="mx-auto h-6 w-6 mb-2" />{error.message}</TableCell></TableRow>
              )}
              {!isLoading && data?.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Tidak ada data untuk filter yang dipilih.</TableCell></TableRow>
              )}
              {/* --- PERUBAHAN Tampilan 4: Ubah Body Tabel --- */}
              {data?.map((item) => (
                item.logbook.map((log, logIndex) => (
                  <TableRow key={`${item.id}-${logIndex}`}>
                    <TableCell>{formatTimestamp(log.createdAt)}</TableCell>
                    <TableCell>{item.user.name}</TableCell>
                    <TableCell>{log.location}</TableCell>
                    <TableCell>{log.division}</TableCell>
                    <TableCell>{log.personAssisted}</TableCell>
                    <TableCell>{log.activity}</TableCell>
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