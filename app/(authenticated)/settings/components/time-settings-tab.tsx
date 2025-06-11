"use client"

import { useState, useEffect } from "react";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Shift, TimeSettings as TimeSettingsType } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TimeSettingsTab() {
    const { data: settingsData, mutate, isLoading } = useSWR('/api/settings', fetcher);

    const [timeSettings, setTimeSettings] = useState<TimeSettingsType | null>(null);
    const [isChanged, setIsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (settingsData?.time) {
            setTimeSettings(settingsData.time);
            setIsChanged(false);
        }
    }, [settingsData]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    }

    const handleChange = (shift: Shift, field: keyof TimeSettingsType[Shift], value: string) => {
        setTimeSettings((prev: any) => ({ ...prev, [shift]: { ...prev[shift], [field]: value } }));
        setIsChanged(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeSettings }),
        });
        if (res.ok) {
            showMessage('success', 'Pengaturan waktu berhasil disimpan.');
            mutate();
        } else {
            showMessage('error', 'Gagal menyimpan pengaturan.');
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Pengaturan Waktu Absensi</CardTitle>
                <CardDescription>Atur rentang waktu untuk setiap shift.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {message && <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${message.type === 'success' ? 'bg-green-100' : ''}`}><AlertDescription>{message.text}</AlertDescription></Alert>}
                {isLoading || !timeSettings ? <div className="space-y-6">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="w-full h-40"/>)}</div> :
                    <div className="space-y-6">
                        {(Object.keys(timeSettings) as Shift[]).map((shift) => (
                            <Card key={shift} className="border-l-4 border-l-blue-500">
                                <CardHeader><CardTitle className="text-lg">Shift {shift}</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-4"><h4 className="font-medium text-green-700">Absen Masuk</h4><div className="space-y-2"><Label>Waktu Mulai</Label><Input type="time" value={timeSettings[shift].checkInStart} onChange={(e) => handleChange(shift, 'checkInStart', e.target.value)}/></div><div className="space-y-2"><Label>Batas Tepat Waktu</Label><Input type="time" value={timeSettings[shift].checkInEnd} onChange={(e) => handleChange(shift, 'checkInEnd', e.target.value)}/></div></div>
                                        <div className="space-y-4"><h4 className="font-medium text-blue-700">Absen Keluar</h4><div className="space-y-2"><Label>Waktu Mulai Pulang</Label><Input type="time" value={timeSettings[shift].checkOutStart} onChange={(e) => handleChange(shift, 'checkOutStart', e.target.value)}/></div><div className="space-y-2"><Label>Batas Normal Pulang</Label><Input type="time" value={timeSettings[shift].checkOutEnd} onChange={(e) => handleChange(shift, 'checkOutEnd', e.target.value)}/></div><div className="space-y-2"><Label>Batas Lembur</Label><Input type="time" value={timeSettings[shift].overtimeThreshold} onChange={(e) => handleChange(shift, 'overtimeThreshold', e.target.value)}/></div></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                }
            </CardContent>
            {isChanged && <CardFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Waktu'}</Button></CardFooter>}
        </Card>
    );
}