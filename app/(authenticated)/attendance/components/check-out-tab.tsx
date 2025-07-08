"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Camera, Info, Save, Pencil } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Tipe data untuk state logbook
type LogEntry = {
    id: string | number; 
    location: string;
    division: string;
    personAssisted: string;
    activity: string;
    isNew?: boolean; 
};

// Fungsi fetcher universal
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => { if (!res.ok) throw new Error("Gagal memuat data."); return res.json(); });

export default function CheckOutTab({ disabled, activeCheckInData }: { disabled: boolean, activeCheckInData?: any }) {
    const { data: session } = useSWR('/api/auth/session', fetcher);
    const { mutate } = useSWRConfig();
    const router = useRouter();
    const user = session?.user;
    
    const [logbookEntries, setLogbookEntries] = useState<LogEntry[]>([]);
    // PERUBAHAN 1: Kembalikan state untuk melacak mode edit
    const [editingId, setEditingId] = useState<string | number | null>(null);

    const nextTempId = useRef(0);

    // Inisialisasi state dari props, dan atur item baru untuk langsung diedit
    useEffect(() => {
        const initialLogs = activeCheckInData?.logbook || [];
        setLogbookEntries(initialLogs);

        // Jika tidak ada log sama sekali, buat 3 entri baru dan edit yang pertama
        if (initialLogs.length === 0 && !disabled) {
            const firstId = nextTempId.current--;
            const secondId = nextTempId.current--;
            const thirdId = nextTempId.current--;
            const newEntries = [
                { id: firstId, location: '', division: '', personAssisted: '', activity: '', isNew: true },
                { id: secondId, location: '', division: '', personAssisted: '', activity: '', isNew: true },
                { id: thirdId, location: '', division: '', personAssisted: '', activity: '', isNew: true },
            ];
            setLogbookEntries(newEntries);
            setEditingId(firstId); // Langsung edit entri pertama
        }
    }, [activeCheckInData, disabled]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const revalidateStatus = () => mutate('/api/attendance/status');

    const handleAddEntry = () => {
        const tempId = nextTempId.current--;
        const newEntry: LogEntry = {
            id: tempId, location: '', division: '', personAssisted: '', activity: '', isNew: true,
        };
        setLogbookEntries(prev => [...prev, newEntry]);
        setEditingId(tempId); // Entri baru langsung masuk mode edit
    };

    const handleEntryChange = (id: number | string, field: keyof Omit<LogEntry, 'id' | 'isNew'>, value: string) => {
        setLogbookEntries(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };
    
    const handleSaveEntry = async (id: number | string) => {
        const entryToSave = logbookEntries.find(e => e.id === id);
        if (!entryToSave) return;
        if (!entryToSave.location.trim() || !entryToSave.division.trim() || !entryToSave.personAssisted.trim() || !entryToSave.activity.trim()) {
            toast.error("Semua kolom harus diisi untuk menyimpan kegiatan ini.");
            return;
        }

        const isNew = entryToSave.isNew;
        const url = '/api/logbook';
        const method = isNew ? 'POST' : 'PUT';

        const payload = isNew ? {
            attendanceId: activeCheckInData.id, ...entryToSave 
        } : { 
            logId: entryToSave.id, ...entryToSave 
        };
        
        const toastId = toast.loading("Menyimpan kegiatan...");
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Gagal menyimpan logbook');
            }
            toast.success("Kegiatan berhasil disimpan!", { id: toastId });
            setEditingId(null); // Keluar dari mode edit setelah simpan
            revalidateStatus();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    // PERUBAHAN 2: Fungsi untuk masuk ke mode edit
    const handleEditEntry = (id: number | string) => {
        setEditingId(id);
    };

    const handleDeleteEntry = async (id: number | string) => {
        if (typeof id === 'number' && id < 0) {
            setLogbookEntries(prev => prev.filter(e => e.id !== id));
            toast.info("Entri dibatalkan.");
            // Jika membatalkan entri baru, keluar dari mode edit
            if (editingId === id) setEditingId(null);
            return;
        }
        
        const toastId = toast.loading("Menghapus kegiatan...");
        try {
            const res = await fetch(`/api/logbook?logId=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Gagal menghapus logbook');
            }
            toast.success("Kegiatan berhasil dihapus!", { id: toastId });
            revalidateStatus();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };
    
    const stopStream = useCallback(() => { if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; } setIsCameraActive(false); }, []);
    useEffect(() => { return () => stopStream(); }, [stopStream]);
    const startCamera = async () => { stopStream(); if (!videoRef.current) return; try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; setIsCameraActive(true); } } catch (err) { toast.error("Gagal mengakses kamera."); } };
    const captureImage = () => { if (videoRef.current && videoRef.current.readyState >= 2) { const canvas = document.createElement("canvas"); canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight; const ctx = canvas.getContext("2d"); if (ctx) { ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height); } setSelfieImage(canvas.toDataURL("image/jpeg")); stopStream(); } };
    const resetCamera = () => { setSelfieImage(null); stopStream(); };

    const handleCheckOut = async (e: React.FormEvent) => {
        e.preventDefault();
        const savedEntriesCount = logbookEntries.filter(e => !e.isNew).length;
        if (savedEntriesCount < 3) { toast.error("Minimal harus ada 3 kegiatan yang tersimpan di database."); return; }
        if (!selfieImage) { toast.error("Swafoto absen keluar wajib diambil."); return; }
        
        const toastId = toast.loading("Mencatat absen keluar...");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/attendance/check-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, checkOutSelfiePhotoData: selfieImage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal mencatat absen keluar.');
            
            toast.success("Absen keluar berhasil dicatat!", { id: toastId });
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (disabled) {
        return <Card><CardHeader><CardTitle>Absen Keluar</CardTitle></CardHeader><CardContent><Alert variant="destructive"><Info className="h-4 w-4" /><AlertTitle>Tidak Ada Sesi Aktif</AlertTitle><AlertDescription>Silakan lakukan Absen Masuk terlebih dahulu.</AlertDescription></Alert></CardContent></Card>;
    }
    
    const canCheckOut = logbookEntries.filter(e => !e.isNew).length >= 3 && !!selfieImage;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Absen Keluar</CardTitle>
                <CardDescription>Isi dan simpan logbook kegiatan harian Minimal 3 log kegiatan. Isi dengan sesuai judul inputan dengan benar dan jelas, lalu ambil swafoto untuk absen keluar.</CardDescription>
                {activeCheckInData && <div className="pt-2"><Alert variant="default" className="border-sky-200"><Info className="h-4 w-4" /><AlertTitle>Sesi Aktif: Shift <Badge variant="secondary">{activeCheckInData.shift}</Badge></AlertTitle><AlertDescription>Jam masuk tercatat pukul: {new Date(activeCheckInData.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</AlertDescription></Alert></div>}
            </CardHeader>
            <form onSubmit={handleCheckOut}>
                <CardContent className="space-y-6">
                    <div><Label>Nama</Label><Input value={user?.name || ""} disabled /></div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="text-lg font-semibold">Logbook Kegiatan ({logbookEntries.length})</Label>
                            {/* PERUBAHAN 3: Nonaktifkan tombol Tambah Entri saat sedang mengedit */}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddEntry} disabled={!!editingId}><Plus className="h-4 w-4 mr-1" /> Tambah Entri</Button>
                        </div>
                        <div className="space-y-4">
                            {logbookEntries.map((entry, index) => (
                                <Card key={entry.id} className={editingId === entry.id ? "border-primary" : "bg-muted/30"}>
                                    <CardHeader className="p-4 flex flex-row justify-between items-center">
                                       <CardTitle className="text-base">Kegiatan #{index + 1}</CardTitle>
                                       <div className="flex gap-2">
                                            {/* PERUBAHAN 4: Logika Tombol Baru */}
                                            {editingId === entry.id ? (
                                                <>
                                                    <Button type="button" size="sm" variant="default" onClick={() => handleSaveEntry(entry.id)}><Save className="h-4 w-4 mr-2"/>Simpan</Button>
                                                    <Button type="button" size="icon" variant="destructive" onClick={() => handleDeleteEntry(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button type="button" size="icon" variant="outline" onClick={() => handleEditEntry(entry.id)} disabled={!!editingId}><Pencil className="h-4 w-4" /></Button>
                                                    <Button type="button" size="icon" variant="destructive" disabled><Trash2 className="h-4 w-4" /></Button>
                                                </>
                                            )}
                                       </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* PERUBAHAN 5: Logika Input Baru */}
                                        <div className="space-y-1"><Label htmlFor={`location-${entry.id}`}>Lokasi/Gedung</Label><Input id={`location-${entry.id}`} value={entry.location} onChange={e => handleEntryChange(entry.id, 'location', e.target.value)} disabled={editingId !== entry.id} /></div>
                                        <div className="space-y-1"><Label htmlFor={`division-${entry.id}`}>Divisi/Ruangan</Label><Input id={`division-${entry.id}`} value={entry.division} onChange={e => handleEntryChange(entry.id, 'division', e.target.value)} disabled={editingId !== entry.id} /></div>
                                        <div className="space-y-1"><Label htmlFor={`person-${entry.id}`}>Yang Dibantu</Label><Input id={`person-${entry.id}`} value={entry.personAssisted} onChange={e => handleEntryChange(entry.id, 'personAssisted', e.target.value)} disabled={editingId !== entry.id} /></div>
                                        <div className="space-y-1"><Label htmlFor={`activity-${entry.id}`}>Aktivitas</Label><Input id={`activity-${entry.id}`} value={entry.activity} onChange={e => handleEntryChange(entry.id, 'activity', e.target.value)} disabled={editingId !== entry.id} /></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-lg font-semibold">Swafoto Absen Keluar</Label>
                        <div className="border rounded-md p-4 space-y-4">
                            {selfieImage ? (<div className="space-y-2"><div className="relative aspect-video w-full overflow-hidden rounded-md"><img src={selfieImage} alt="Swafoto" className="h-full w-full object-cover" /></div><Button type="button" onClick={resetCamera} variant="outline" className="w-full">Ambil Ulang</Button></div>) : (<><div className={`relative aspect-video w-full overflow-hidden rounded-md bg-black ${!isCameraActive ? 'hidden' : 'block'}`}><video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" /></div><div className="flex justify-center">{isCameraActive ? (<Button type="button" onClick={captureImage} variant="secondary">Ambil Foto</Button>) : (<Button type="button" onClick={startCamera} variant="secondary" className="flex items-center gap-2"><Camera className="h-4 w-4" />Aktifkan Kamera</Button>)}</div></>)}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    {/* PERUBAHAN 6: Nonaktifkan tombol Absen Keluar saat sedang mengedit */}
                    <Button type="submit" className="w-full" disabled={isSubmitting || !canCheckOut || !!editingId}>{isSubmitting ? "Memproses..." : "Absen Keluar"}</Button>
                </CardFooter>
            </form>
        </Card>
    );
}