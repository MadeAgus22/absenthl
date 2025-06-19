// File: app/(authenticated)/reports/components/daily-report-tab.tsx

"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, CalendarIcon, AlertCircle, Eye, FileText, Download } from "lucide-react";
import { toast } from "sonner";

type DailyReportData = {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    checkInStatus: string;
    selfiePhoto: string | null;
    checkOutSelfiePhoto: string | null;
    user: { name: string };
    logbook: { content: string }[];
    logbookCount: number;
};

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Gagal memuat data laporan.");
    return res.json();
});

const SortableHeader = ({ children, column, currentSort, setSort } : { children: React.ReactNode, column: string, currentSort: any, setSort: any }) => {
    const isActive = currentSort.column === column;
    const order = isActive ? currentSort.order : 'asc';
    const handleClick = () => {
        if (isActive) {
            setSort({ column, order: order === 'asc' ? 'desc' : 'asc' });
        } else {
            setSort({ column, order: 'asc' });
        }
    };
    return (
        <TableHead>
            <Button variant="ghost" onClick={handleClick}>
                {children}
                <ArrowUpDown className={`ml-2 h-4 w-4 ${!isActive && "text-muted-foreground"}`} />
            </Button>
        </TableHead>
    );
};

export default function DailyReportTab() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [sort, setSort] = useState({ column: 'checkInTime', order: 'asc' });
    
    const [logbookViewerOpen, setLogbookViewerOpen] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState<DailyReportData | null>(null);

    // ================== STATE YANG HILANG SEBELUMNYA ADA DI SINI ==================
    const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; name: string } | null>(null);
    // =============================================================================

    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    const swrUrl = formattedDate ? `/api/reports/daily?date=${formattedDate}&sortBy=${sort.column}&sortOrder=${sort.order}` : null;
    const { data, error, isLoading } = useSWR<DailyReportData[]>(swrUrl, fetcher);

    const formatTime = (timeString: string | null) => {
        if (!timeString) return "-";
        const dateUTC = new Date(timeString);
        return dateUTC.toLocaleTimeString("en-GB", { timeZone: "Asia/Makassar" });
    };

    const openLogbookViewer = (item: DailyReportData) => {
        setSelectedLogbook(item);
        setLogbookViewerOpen(true);
    };

    const openPhotoViewer = (url: string | null, title: string, name: string) => {
        if (!url) return;
        setSelectedPhoto({ url, title, name });
        setPhotoViewerOpen(true);
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("Tidak ada data untuk diekspor.");
            return;
        }
        toast.info("Mempersiapkan file Excel...");
        try {
            const formattedDataForExcel = data.map(item => ({
                "Nama Pegawai": item.user.name,
                "Jam Masuk": formatTime(item.checkInTime),
                "Jam Keluar": formatTime(item.checkOutTime),
                "Status Masuk": item.checkInStatus,
                "Jumlah Aktivitas": item.logbookCount,
                "Link Swafoto Masuk": item.selfiePhoto || "Tidak Ada",
                "Link Swafoto Keluar": item.checkOutSelfiePhoto || "Tidak Ada",
            }));
            const fileName = `Laporan_Harian_${formattedDate}`;
            const worksheet = XLSX.utils.json_to_sheet(formattedDataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
            const colsWidth = Object.keys(formattedDataForExcel[0] || {}).map(key => ({ wch: String(key).length + 5 }));
            worksheet["!cols"] = colsWidth;
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            toast.success("Laporan berhasil diunduh!");
        } catch (exportError) {
            console.error("Export to Excel error:", exportError);
            toast.error("Terjadi kesalahan saat membuat file Excel.");
        }
    };

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Laporan Absensi Harian</CardTitle>
                <CardDescription>
                    Pilih tanggal untuk melihat rekapitulasi absensi harian seluruh pegawai.
                </CardDescription>
                <div className="pt-4 flex items-center justify-between">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleExport} disabled={isLoading || !data || data.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Pegawai</TableHead>
                                <SortableHeader column="checkInTime" currentSort={sort} setSort={setSort}>Jam Masuk</SortableHeader>
                                <TableHead>Jam Keluar</TableHead>
                                <TableHead>Status Masuk</TableHead>
                                <TableHead>Swafoto Masuk</TableHead>
                                <TableHead>Swafoto Keluar</TableHead>
                                <SortableHeader column="logbookCount" currentSort={sort} setSort={setSort}>Jml Aktivitas</SortableHeader>
                                <TableHead>Log Aktivitas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {(isLoading || !data) && (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ))
                        )}
                        {error && (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center text-red-500"><AlertCircle className="mx-auto h-6 w-6 mb-2" /> {error.message}</TableCell></TableRow>
                        )}
                        {!isLoading && !error && data?.length === 0 && (
                            <TableRow><TableCell colSpan={8} className="h-24 text-center">Tidak ada data absensi pada tanggal yang dipilih.</TableCell></TableRow>
                        )}
                        {data?.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.user.name}</TableCell>
                                <TableCell>{formatTime(item.checkInTime)}</TableCell>
                                <TableCell>{formatTime(item.checkOutTime)}</TableCell>
                                <TableCell><Badge variant={item.checkInStatus === 'Terlambat' ? 'destructive' : 'default'}>{item.checkInStatus}</Badge></TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={!item.selfiePhoto} onClick={() => openPhotoViewer(item.selfiePhoto, 'Swafoto Masuk', item.user.name)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={!item.checkOutSelfiePhoto} onClick={() => openPhotoViewer(item.checkOutSelfiePhoto, 'Swafoto Keluar', item.user.name)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                <TableCell className="text-center">{item.logbookCount}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openLogbookViewer(item)} disabled={item.logbookCount === 0}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <Dialog open={logbookViewerOpen} onOpenChange={setLogbookViewerOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Log Aktivitas</DialogTitle>
                    {selectedLogbook && 
                        <DialogDescription>
                            {selectedLogbook.user.name} - {date ? format(date, "PPP", { locale: localeID }) : ''}
                        </DialogDescription>
                    }
                </DialogHeader>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                    {selectedLogbook?.logbook.map((entry, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className="flex-shrink-0 mt-1 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                            <p className="text-sm text-foreground/80">{entry.content}</p>
                        </div>
                    ))}
                    {selectedLogbook?.logbookCount === 0 && <p className="text-sm text-muted-foreground text-center">Tidak ada log aktivitas.</p>}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setLogbookViewerOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedPhoto?.title}</DialogTitle>
                    <DialogDescription>
                        {selectedPhoto?.name} - {date ? format(date, "PPP", { locale: localeID }) : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center p-2">
                    {selectedPhoto?.url && 
                        <Image 
                            src={selectedPhoto.url} 
                            alt={selectedPhoto.title}
                            width={500}
                            height={500}
                            className="max-w-full max-h-[70vh] rounded-md object-contain"
                        />
                    }
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPhotoViewerOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}