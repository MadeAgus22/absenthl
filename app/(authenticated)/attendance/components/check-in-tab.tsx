"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Shift, TimeSettings, AccessSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

type User = { id: string; name: string; role: string; };
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => { if (!res.ok) throw new Error("Gagal memuat data."); return res.json(); });

export default function CheckInTab() {
    const { data: session, isLoading: isSessionLoading } = useSWR('/api/auth/session', fetcher);
    const { data: settingsData, isLoading: areSettingsLoading } = useSWR('/api/settings', fetcher);
    const router = useRouter();
    const user = session?.user;

    const [shift, setShift] = useState<Shift | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    const [backCameraActive, setBackCameraActive] = useState(false);
    const [frontCameraActive, setFrontCameraActive] = useState(false);
    const [backCameraImage, setBackCameraImage] = useState<string | null>(null);
    const [frontCameraImage, setFrontCameraImage] = useState<string | null>(null);
    
    const videoRefs = {
        user: useRef<HTMLVideoElement>(null),
        environment: useRef<HTMLVideoElement>(null)
    };
    const streamRefs = {
        user: useRef<MediaStream | null>(null),
        environment: useRef<MediaStream | null>(null)
    };

    const accessSettings = settingsData?.access;
    const timeSettings = settingsData?.time;
    
    const stopAllStreams = useCallback(() => {
        Object.values(streamRefs).forEach(streamRef => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        });
        setFrontCameraActive(false);
        setBackCameraActive(false);
    }, []);

    useEffect(() => {
        return () => {
            stopAllStreams();
        }
    }, [stopAllStreams]);

    const startCamera = async (facingMode: 'user' | 'environment') => {
        stopAllStreams();
        setErrorMessage("");

        const videoRef = videoRefs[facingMode];
        const streamRef = streamRefs[facingMode];
        const setActive = facingMode === 'user' ? setFrontCameraActive : setBackCameraActive;

        if (!videoRef.current) {
            console.error(`Elemen video untuk ${facingMode} tidak ditemukan.`);
            setErrorMessage(`Gagal menemukan elemen video. Coba refresh halaman.`);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setActive(true);
            }
        } catch (err: any) {
            console.error(`Error mengakses kamera ${facingMode}:`, err);
            let message = `Gagal mengakses kamera. Error: ${err.name}.`;
            if (err.name === 'NotAllowedError') {
                message = 'Izin untuk mengakses kamera tidak diberikan. Silakan izinkan akses di pengaturan browser Anda.';
            } else if (err.name === 'NotFoundError') {
                message = 'Tidak ada kamera yang ditemukan di perangkat ini.';
            }
            setErrorMessage(message);
        }
    };
    
    const captureImage = (facingMode: 'user' | 'environment') => {
        const videoRef = videoRefs[facingMode];
        const setImage = facingMode === 'user' ? setFrontCameraImage : setBackCameraImage;
        if (videoRef.current && videoRef.current.readyState >= 2) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            setImage(canvas.toDataURL("image/jpeg"));
            stopAllStreams();
        }
    };

    const resetCamera = (facingMode: 'user' | 'environment') => {
        const setImage = facingMode === 'user' ? setFrontCameraImage : setBackCameraImage;
        setImage(null);
        stopAllStreams();
    };
    
    const uploadImage = async (image: string | null, type: 'attendance' | 'selfie'): Promise<string | null> => {
        if (!image) return null;
        const response = await fetch(image);
        const blob = await response.blob();
        const filename = `${type}-${user?.id}-${Date.now()}.jpg`;
        const uploadResponse = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: blob });
        if (!uploadResponse.ok) throw new Error(`Gagal mengunggah foto ${type}.`);
        const newBlob = await uploadResponse.json();
        return newBlob.url;
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(""); setSuccessMessage("");
        if (!shift) return setErrorMessage("Silakan pilih shift.");
        if (accessSettings?.requirePhotoForCheckIn && (!backCameraImage || !frontCameraImage)) {
            return setErrorMessage("Foto lembar absensi dan swafoto wajib diambil.");
        }
        setIsSubmitting(true);
        try {
            const attendanceSheetUrl = accessSettings?.requirePhotoForCheckIn ? await uploadImage(backCameraImage, 'attendance') : null;
            const selfieUrl = accessSettings?.requirePhotoForCheckIn ? await uploadImage(frontCameraImage, 'selfie') : null;
            const res = await fetch('/api/attendance/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.id, shift, attendanceSheetPhoto: attendanceSheetUrl, selfiePhoto: selfieUrl }) });
            if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Gagal mencatat absen masuk.'); }
            setSuccessMessage("Absen masuk berhasil dicatat!");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (err: any) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const renderCameraUI = (facingMode: 'user' | 'environment') => {
        const isActive = facingMode === 'user' ? frontCameraActive : backCameraActive;
        const image = facingMode === 'user' ? frontCameraImage : backCameraImage;
        const videoRef = videoRefs[facingMode];
        const label = facingMode === 'user' ? 'Swafoto (Kamera Depan)' : 'Foto Lembar Absensi (Kamera Belakang)';

        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="border rounded-md p-4 space-y-4">
                    {image ? (
                        <div className="space-y-2">
                            <div className="relative aspect-video w-full overflow-hidden rounded-md"><img src={image} alt={label} className="h-full w-full object-cover" /></div>
                            <Button type="button" onClick={() => resetCamera(facingMode)} variant="outline" className="w-full">Ambil Ulang</Button>
                        </div>
                    ) : (
                        <>
                            <div className={`relative aspect-video w-full overflow-hidden rounded-md bg-black ${!isActive ? 'hidden' : 'block'}`}>
                                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                            </div>
                            <div className="flex justify-center">
                                {isActive ? (
                                    <Button type="button" onClick={() => captureImage(facingMode)} variant="secondary">Ambil Foto</Button>
                                ) : (
                                    <Button type="button" onClick={() => startCamera(facingMode)} variant="secondary" className="flex items-center gap-2"><Camera className="h-4 w-4" />Aktifkan Kamera</Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };
    
    if (isSessionLoading || areSettingsLoading) {
        return <Card><CardHeader><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="w-full h-96" /></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader><CardTitle>Absen Masuk</CardTitle><CardDescription>Isi form berikut untuk melakukan absen masuk.</CardDescription></CardHeader>
            <form onSubmit={handleCheckIn}>
                <CardContent className="space-y-4">
                    {successMessage && <Alert className="bg-green-100 text-green-800 border-green-200"><AlertDescription>{successMessage}</AlertDescription></Alert>}
                    {errorMessage && <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
                    <div className="space-y-2"><Label htmlFor="name">Nama</Label><Input id="name" value={user?.name || ""} disabled /></div>
                    <div className="space-y-2"><Label htmlFor="shift">Shift</Label><Select value={shift} onValueChange={(v) => setShift(v as Shift)}><SelectTrigger id="shift"><SelectValue placeholder="Pilih shift" /></SelectTrigger><SelectContent><SelectItem value="Reguler">Reguler</SelectItem><SelectItem value="Pagi">Pagi</SelectItem><SelectItem value="Siang">Siang</SelectItem><SelectItem value="Malam">Malam</SelectItem></SelectContent></Select></div>
                    {shift && timeSettings?.[shift] && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Informasi Waktu Shift {shift}</h4>
                            <p><span className="font-medium">Tepat Waktu Masuk:</span> {timeSettings[shift].checkInStart} - {timeSettings[shift].checkInEnd}</p>
                            <p><span className="font-medium">Terlambat Setelah:</span> {timeSettings[shift].checkInEnd}</p>
                        </div>
                    )}
                    {accessSettings?.requirePhotoForCheckIn && (<>{renderCameraUI('environment')}{renderCameraUI('user')}</>)}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
                        {isSubmitting ? "Memproses..." : "Absen Masuk"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}