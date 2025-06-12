"use client"

import { useState } from "react";
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

type User = { id: string; name: string; role: string; };
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

// Komponen untuk Input Password dengan tombol Show/Hide
function PasswordInput({ id, value, onChange, placeholder }: { id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <Input 
                id={id}
                type={isVisible ? "text" : "password"} 
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
            />
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
        </div>
    );
}

export default function AccountPage() {
    const { data: sessionData, isLoading: isSessionLoading } = useSWR<{ user: User }>('/api/auth/session', fetcher);
    
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Gagal memperbarui password.');
            }

            setMessage({ type: 'success', text: data.message });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Akun Saya</h1>
                <p className="text-muted-foreground">Lihat informasi akun dan perbarui password Anda.</p>
            </div>

            {/* Informasi Akun */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        {isSessionLoading ? (
                             <Skeleton className="h-10 w-full" />
                        ) : (
                            <Input id="fullName" value={sessionData?.user?.name || ''} readOnly disabled />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Form Ganti Password */}
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Ganti Password</CardTitle>
                        <CardDescription>Masukkan password lama dan password baru Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {message && (
                            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 dark:border-green-600 dark:text-green-400' : ''}>
                                {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{message.type === 'success' ? 'Berhasil' : 'Error'}</AlertTitle>
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Password Lama</Label>
                            <PasswordInput id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Masukkan password Anda saat ini" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <PasswordInput id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                            <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ketik ulang password baru" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Perbarui Password"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}