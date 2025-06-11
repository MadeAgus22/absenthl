"use client"

import { useState, useEffect } from "react";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AccessSettings = {
    allowEmployeeDashboardAccess: boolean;
    allowEmployeeViewAllRecords: boolean;
    requirePhotoForCheckIn: boolean;
    allowLogbookEdit: boolean;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AccessSettingsTab() {
    const { data: settingsData, mutate, isLoading } = useSWR('/api/settings', fetcher);
    
    const [accessSettings, setAccessSettings] = useState<AccessSettings | null>(null);
    const [isChanged, setIsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (settingsData?.access) {
            setAccessSettings(settingsData.access);
            setIsChanged(false);
        }
    }, [settingsData]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    }

    const handleChange = (key: keyof AccessSettings, value: boolean) => {
    // Gunakan 'updater function' dari useState untuk mendapatkan state sebelumnya (prev)
    setAccessSettings(prev => {
        // Jika state sebelumnya null, jangan lakukan apa-apa
        if (!prev) return null;

        // Buat objek baru dengan menyalin semua properti dari state sebelumnya (...prev),
        // lalu timpa properti yang berubah ([key]: value)
        return { ...prev, [key]: value };
    });
    setIsChanged(true);
}

    const handleSave = async () => {
        setIsSaving(true);
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessSettings }),
        });
        if (res.ok) {
            showMessage('success', 'Pengaturan hak akses berhasil disimpan.');
            mutate(); // Re-fetch data untuk sinkronisasi
        } else {
            showMessage('error', 'Gagal menyimpan pengaturan.');
        }
        setIsSaving(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Hak Akses</CardTitle>
                <CardDescription>Kelola hak akses untuk peran pegawai.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {message && <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${message.type === 'success' ? 'bg-green-100' : ''}`}><AlertDescription>{message.text}</AlertDescription></Alert>}
                {isLoading || !accessSettings ? (
                    <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)}</div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-0.5"><Label className="text-base font-medium">Akses Dashboard Pegawai</Label><p className="text-sm text-muted-foreground">Izinkan pegawai mengakses halaman dashboard.</p></div><Switch checked={accessSettings.allowEmployeeDashboardAccess} onCheckedChange={(c) => handleChange('allowEmployeeDashboardAccess', c)} /></div>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-0.5"><Label className="text-base font-medium">Lihat Semua Riwayat</Label><p className="text-sm text-muted-foreground">Izinkan pegawai melihat riwayat absensi semua karyawan.</p></div><Switch checked={accessSettings.allowEmployeeViewAllRecords} onCheckedChange={(c) => handleChange('allowEmployeeViewAllRecords', c)} /></div>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-0.5"><Label className="text-base font-medium">Wajib Foto Absen Masuk</Label><p className="text-sm text-muted-foreground">Wajibkan foto lembar absensi dan swafoto.</p></div><Switch checked={accessSettings.requirePhotoForCheckIn} onCheckedChange={(c) => handleChange('requirePhotoForCheckIn', c)} /></div>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div className="space-y-0.5"><Label className="text-base font-medium">Boleh Edit Logbook</Label><p className="text-sm text-muted-foreground">Izinkan pegawai mengedit logbook setelah absen keluar.</p></div><Switch checked={accessSettings.allowLogbookEdit} onCheckedChange={(c) => handleChange('allowLogbookEdit', c)} /></div>
                    </div>
                )}
            </CardContent>
            {isChanged && <CardFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Akses'}</Button></CardFooter>}
        </Card>
    );
}