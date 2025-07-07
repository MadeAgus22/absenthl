// File: app/(authenticated)/reports/components/monthly-report-tab.tsx

"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { format, eachDayOfInterval } from "date-fns";
import { id as localeID } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, Download, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // <-- Pastikan cn diimpor

// ================== PERUBAHAN TIPE DATA ==================
type MonthlyReportData = {
    userId: string;
    userName: string;
    totalActivities: number;
    dates: { [key: string]: { time: string; status: string; } | null };
};
// ========================================================

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal memuat data laporan.");
    return res.json();
});

export default function MonthlyReportTab() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });

    const [sort, setSort] = useState({ column: 'totalActivities', order: 'desc' });
    
    const dateColumns = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    }, [dateRange]);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

    useMemo(() => {
        const initialVisibility: Record<string, boolean> = {};
        dateColumns.forEach(date => {
            initialVisibility[format(date, 'yyyy-MM-dd')] = true;
        });
        setColumnVisibility(initialVisibility);
    }, [dateColumns]);

    const visibleDateColumns = dateColumns.filter(date => columnVisibility[format(date, 'yyyy-MM-dd')]);
    
    const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
    const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";

    const swrUrl = (startDate && endDate) 
        ? `/api/reports/monthly?startDate=${startDate}&endDate=${endDate}&sortBy=${sort.column}&sortOrder=${sort.order}` 
        : null;

    const { data, error, isLoading } = useSWR<MonthlyReportData[]>(swrUrl, fetcher);

    const handleSort = () => {
        setSort(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("Tidak ada data untuk diekspor.");
            return;
        }
        toast.info("Mempersiapkan file Excel...");
        try {
            // ================== PERUBAHAN FORMAT EXPORT ==================
            const formattedData = data.map(row => {
                const newRow: { [key: string]: any } = { 'Nama Pegawai': row.userName };
                visibleDateColumns.forEach(date => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const headerKey = format(date, 'd MMM', { locale: localeID });
                    // Ambil waktunya dari objek
                    newRow[headerKey] = row.dates[dateKey]?.time || '-'; 
                });
                newRow['Total Kegiatan'] = row.totalActivities;
                return newRow;
            });
            // =============================================================
            
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Bulanan");
            XLSX.writeFile(workbook, `Laporan_Bulanan_${startDate}_hingga_${endDate}.xlsx`);
            toast.success("Laporan berhasil diunduh!");
        } catch (e) {
            toast.error("Gagal membuat file Excel.");
            console.error(e);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Laporan Absensi Bulanan</CardTitle>
                <CardDescription>Pilih rentang tanggal untuk melihat rekapitulasi absensi bulanan per pegawai.</CardDescription>
                <div className="pt-4 flex items-center justify-between gap-2">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> Tampilkan Kolom</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Tampilkan/Sembunyikan Tanggal</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-64">
                                {dateColumns.map(date => {
                                    const dateKey = format(date, 'yyyy-MM-dd');
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={dateKey}
                                            checked={columnVisibility[dateKey]}
                                            onCheckedChange={(value) => setColumnVisibility(prev => ({...prev, [dateKey]: !!value}))}
                                        >
                                            {format(date, 'd MMM yy', { locale: localeID })}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleExport} disabled={isLoading || !data || data.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> Download Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10">Nama Pegawai</TableHead>
                                {visibleDateColumns.map(date => (
                                    <TableHead key={date.toString()} className="text-center">{format(date, 'd MMM', { locale: localeID })}</TableHead>
                                ))}
                                <TableHead>
                                    <Button variant="ghost" onClick={handleSort}>
                                        Total Kegiatan
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={visibleDateColumns.length + 2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ))}
                            {error && (
                                <TableRow><TableCell colSpan={visibleDateColumns.length + 2} className="h-24 text-center text-red-500"><AlertCircle className="mx-auto h-6 w-6 mb-2" /> {error.message}</TableCell></TableRow>
                            )}
                            {!isLoading && data?.map((row) => (
                                <TableRow key={row.userId}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">{row.userName}</TableCell>
                                    {visibleDateColumns.map(date => {
                                        const dateKey = format(date, 'yyyy-MM-dd');
                                        const attendance = row.dates[dateKey];
                                        return (
                                            // ================== PERUBAHAN Tampilan Sel ==================
                                            <TableCell 
                                                key={dateKey} 
                                                className={cn(
                                                    "text-center",
                                                    attendance?.status === 'Terlambat' && "text-destructive font-semibold"
                                                )}
                                            >
                                                {attendance?.time || '-'}
                                            </TableCell>
                                            // =============================================================
                                        );
                                    })}
                                    <TableCell className="text-center font-bold">{row.totalActivities}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}