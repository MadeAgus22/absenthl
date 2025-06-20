"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => { if (!res.ok) throw new Error("Gagal memuat data."); return res.json(); });

export default function CheckOutTab() {
    const { data: session, isLoading: isSessionLoading } = useSWR('/api/auth/session', fetcher);
    const router = useRouter();
    const user = session?.user;

    const [logbookEntries, setLogbookEntries] = useState(["", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // --- State & Ref untuk Kamera ---
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Logika Kamera ---
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    }, []);

    useEffect(() => {
        // Cleanup function untuk mematikan kamera saat komponen dilepas
        return () => stopStream();
    }, [stopStream]);

    const startCamera = async () => {
        stopStream(); // Hentikan stream yang mungkin aktif
        setErrorMessage("");
        if (!videoRef.current) {
            setErrorMessage("Elemen video tidak siap. Coba refresh halaman.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (err: any) {
            let message = `Gagal mengakses kamera. Error: ${err.name}.`;
            if (err.name === 'NotAllowedError') message = 'Izin kamera tidak diberikan. Silakan cek pengaturan browser.';
            else if (err.name === 'NotFoundError') message = 'Kamera tidak ditemukan di perangkat ini.';
            setErrorMessage(message);
        }
    };
    
    const captureImage = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                setSelfieImage(canvas.toDataURL("image/jpeg"));
            }
            stopStream();
        }
    };

    const resetCamera = () => {
        setSelfieImage(null);
        stopStream();
    };

    const uploadImage = async (image: string | null): Promise<string | null> => {
        if (!image) return null;
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `checkout-selfie-${user?.id}-${Date.now()}.jpg`;
        const uploadResponse = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: blob });
        if (!uploadResponse.ok) throw new Error(`Gagal mengunggah foto.`);
        const newBlob = await uploadResponse.json();
        return newBlob.url;
    };
    
    // --- Logika Form ---
    const handleLogbookChange = (index: number, value: string) => { const newEntries = [...logbookEntries]; newEntries[index] = value; setLogbookEntries(newEntries); };
    const addLogbookEntry = () => { setLogbookEntries([...logbookEntries, ""]); };
    const removeLogbookEntry = (index: number) => {
        if (logbookEntries.length <= 1) { setErrorMessage("Minimal harus ada 1 entri logbook."); setTimeout(() => setErrorMessage(""), 3000); return; }
        setLogbookEntries(logbookEntries.filter((_, i) => i !== index));
    };

    const handleCheckOut = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(""); setSuccessMessage("");
        if (logbookEntries.some(entry => entry.trim() === '')) return setErrorMessage("Semua entri logbook harus diisi.");
        if (!selfieImage) return setErrorMessage("Swafoto saat absen keluar wajib diambil.");
        
        setIsSubmitting(true);
        try {
            const selfieUrl = await uploadImage(selfieImage);
            const res = await fetch('/api/attendance/check-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user?.id, 
                    logbookEntries: logbookEntries.filter(e => e.trim()),
                    checkOutSelfiePhotoUrl: selfieUrl
                }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Gagal mencatat absen keluar.'); }
            setSuccessMessage("Absen keluar berhasil dicatat!");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err: any) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Absen Keluar</CardTitle>
                <CardDescription>Isi logbook dan ambil swafoto untuk absen keluar.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCheckOut}>
                <CardContent className="space-y-4">
                    {successMessage && <Alert className="bg-green-100 dark:bg-green-800/20 text-green-800 dark:text-green-300 border-green-200"><AlertDescription>{successMessage}</AlertDescription></Alert>}
                    {errorMessage && <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>}

                    {isSessionLoading ? <Skeleton className="h-10 w-full" /> : <div className="space-y-2"><Label htmlFor="name-checkout">Nama</Label><Input id="name-checkout" value={user?.name || ""} disabled /></div>}
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between"><Label>Logbook Kegiatan</Label><Button type="button" variant="outline" size="sm" onClick={addLogbookEntry}><Plus className="h-4 w-4 mr-1" /> Tambah Entri</Button></div>
                        <div className="space-y-3">{logbookEntries.map((entry, index) => (<div key={index} className="flex items-start gap-2"><Textarea placeholder={`Kegiatan ${index + 1}`} value={entry} onChange={(e) => handleLogbookChange(index, e.target.value)} className="flex-1" required />{logbookEntries.length > 1 && (<Button type="button" variant="ghost" size="icon" onClick={() => removeLogbookEntry(index)}><Trash2 className="h-4 w-4" /></Button>)}</div>))}</div>
                    </div>

                    {/* --- UI KAMERA DITAMBAHKAN DI SINI --- */}
                    <div className="space-y-2">
                        <Label>Swafoto Absen Keluar</Label>
                        <div className="border rounded-md p-4 space-y-4">
                            {selfieImage ? (
                                <div className="space-y-2">
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                        <img src={selfieImage} alt="Swafoto" className="h-full w-full object-cover" />
                                    </div>
                                    <Button type="button" onClick={resetCamera} variant="outline" className="w-full">Ambil Ulang</Button>
                                </div>
                            ) : (
                                <>
                                    <div className={`relative aspect-video w-full overflow-hidden rounded-md bg-black ${!isCameraActive ? 'hidden' : 'block'}`}>
                                        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex justify-center">
                                        {isCameraActive ? (
                                            <Button type="button" onClick={captureImage} variant="secondary">Ambil Foto</Button>
                                        ) : (
                                            <Button type="button" onClick={startCamera} variant="secondary" className="flex items-center gap-2">
                                                <Camera className="h-4 w-4" />Aktifkan Kamera
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
                        {isSubmitting ? "Memproses..." : "Absen Keluar"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}