"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shift } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { addDays, format as formatDateFns } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";

// Tipe data dari API
type AttendanceRecord = { id: string; date: string; checkInTime: string; checkOutTime: string | null; shift: Shift; checkInStatus: string; checkOutStatus: string | null; attendanceSheetPhoto: string | null; selfiePhoto: string | null; checkOutSelfiePhoto: string | null; user: { id: string; name: string; }; logbook: { content: string }[]; };
type User = { id: string; name: string; role: string; };

// Fetcher function untuk SWR dengan credentials
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => {
    if (!res.ok) throw new Error("Gagal memuat data.");
    return res.json();
});

export default function Dashboard() {
    const router = useRouter();
    const { data: sessionData } = useSWR<{ user: User }>('/api/auth/session', fetcher, {
        onError: () => router.push('/')
    });
    const user = sessionData?.user;

    // State untuk filter dan paginasi
    const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });
    const [limit, setLimit] = useState<number>(10);
    const [page, setPage] = useState<number>(1);

    // Membuat URL dinamis untuk SWR agar data di-fetch ulang saat filter berubah
    const fromDate = date?.from ? formatDateFns(date.from, 'yyyy-MM-dd') : '';
    const toDate = date?.to ? formatDateFns(date.to, 'yyyy-MM-dd') : fromDate;
    const swrUrl = fromDate ? `/api/attendance?page=${page}&limit=${limit}&from=${fromDate}&to=${toDate}` : null;

    const { data, error, isLoading } = useSWR<{ data: AttendanceRecord[], total: number }>(swrUrl, fetcher);
    
    const attendanceData = data?.data ?? [];
    const totalRecords = data?.total ?? 0;
    const totalPages = Math.ceil(totalRecords / limit);

    // State untuk dialog
    const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
    const [logbookViewerOpen, setLogbookViewerOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string; date: string; name: string } | null>(null);
    const [selectedLogbook, setSelectedLogbook] = useState<AttendanceRecord | null>(null);

    // Fungsi pembantu
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const formatTime = (timeString: string | null) => timeString ? new Date(timeString).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-";

    const openPhotoViewer = (photoUrl: string | null, title: string, date: string, name: string) => {
        if (!photoUrl) return;
        setSelectedPhoto({ url: photoUrl, title, date, name });
        setPhotoViewerOpen(true);
    }

    const openLogbookViewer = (item: AttendanceRecord) => {
        setSelectedLogbook(item);
        setLogbookViewerOpen(true);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Selamat datang, {user?.name || "..."}! Berikut adalah riwayat absensi.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Absen</CardTitle><CalendarIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalRecords}</div>}<p className="text-xs text-muted-foreground">Dalam rentang tanggal</p></CardContent></Card>
                {/* Anda bisa menambahkan kartu statistik lain jika diperlukan */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Absensi</CardTitle>
                    <div className="flex flex-col space-y-2 pt-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <DateRangePicker date={date} onDateChange={setDate} />
                        <div className="flex items-center space-x-2">
                            <Label>Tampilkan:</Label>
                            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
                                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead className="min-w-[180px]">Tanggal</TableHead><TableHead>Jam Masuk</TableHead><TableHead>Jam Keluar</TableHead>{user?.role === "admin" && <TableHead className="min-w-[150px]">Nama</TableHead>}<TableHead>Shift</TableHead><TableHead>Status Masuk</TableHead><TableHead>Status Keluar</TableHead><TableHead>Foto Absen</TableHead><TableHead>Swafoto</TableHead><TableHead>Logbook</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: limit }).map((_, i) => (<TableRow key={i}><TableCell colSpan={user?.role === "admin" ? 10 : 9}><Skeleton className="h-8 w-full" /></TableCell></TableRow>))
                                ) : error ? (
                                    <TableRow><TableCell colSpan={user?.role === 'admin' ? 10 : 9} className="text-center text-red-500">Gagal memuat data.</TableCell></TableRow>
                                ) : attendanceData.length > 0 ? (
                                    attendanceData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                                            <TableCell>{formatTime(item.checkInTime)}</TableCell>
                                            <TableCell>{formatTime(item.checkOutTime)}</TableCell>
                                            {user?.role === "admin" && <TableCell>{item.user.name}</TableCell>}
                                            <TableCell><Badge variant="outline">{item.shift}</Badge></TableCell>
                                            <TableCell><Badge variant={item.checkInStatus === "Tepat Waktu" ? "default" : "destructive"}>{item.checkInStatus}</Badge></TableCell>
                                            <TableCell><Badge variant={item.checkOutStatus === "Lembur" ? "secondary" : "default"}>{item.checkOutStatus ?? '-'}</Badge></TableCell>
                                            <TableCell><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openPhotoViewer(item.attendanceSheetPhoto, "Foto Lembar Absensi", item.date, item.user.name)} disabled={!item.attendanceSheetPhoto}><Eye className="h-4 w-4" /></Button></TableCell>
                                            <TableCell><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openPhotoViewer(item.selfiePhoto, "Swafoto", item.date, item.user.name)} disabled={!item.selfiePhoto}><Eye className="h-4 w-4" /></Button></TableCell>
                                            <TableCell><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openLogbookViewer(item)} disabled={!item.logbook || item.logbook.length === 0}><FileText className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={user?.role === 'admin' ? 10 : 9} className="text-center">Tidak ada data absensi pada rentang tanggal ini.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /> Sebelumnya</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /> Berikutnya</Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
                <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selectedPhoto?.title}</DialogTitle><DialogDescription>{selectedPhoto?.name} - {selectedPhoto?.date && formatDate(selectedPhoto.date)}</DialogDescription></DialogHeader><div className="flex justify-center p-4">{selectedPhoto && <img src={selectedPhoto.url} alt={selectedPhoto.title} className="max-w-full max-h-[70vh] object-contain rounded-md" />}</div><DialogFooter><Button onClick={() => setPhotoViewerOpen(false)}>Tutup</Button></DialogFooter></DialogContent>
            </Dialog>

            <Dialog open={logbookViewerOpen} onOpenChange={setLogbookViewerOpen}>
                <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Logbook Kegiatan</DialogTitle>{selectedLogbook && <DialogDescription>{selectedLogbook.user.name} - {formatDate(selectedLogbook.date)}</DialogDescription>}</DialogHeader>
                {selectedLogbook && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div><p className="text-sm font-medium text-muted-foreground">Shift</p><Badge variant="outline">{selectedLogbook.shift}</Badge></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Jam Masuk</p><p className="font-semibold">{formatTime(selectedLogbook.checkInTime)}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Jam Keluar</p><p className="font-semibold">{formatTime(selectedLogbook.checkOutTime)}</p></div>
                            <div><p className="text-sm font-medium text-muted-foreground">Total Kegiatan</p><p className="font-semibold">{selectedLogbook.logbook.length} item</p></div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3">Daftar Kegiatan:</h4>
                            <ScrollArea className="h-[300px] w-full rounded-md border p-2">
                                <div className="space-y-3 p-2">
                                    {selectedLogbook.logbook.map((entry, index) => (
                                        <div key={index} className="flex gap-3 items-start p-3 bg-background rounded-lg">
                                            <div className="flex-shrink-0 mt-1 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                                            <p className="flex-1 text-sm text-foreground/80 leading-relaxed">{entry.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}
                <DialogFooter><Button onClick={() => setLogbookViewerOpen(false)}>Tutup</Button></DialogFooter></DialogContent>
            </Dialog>
        </div>
    );
}