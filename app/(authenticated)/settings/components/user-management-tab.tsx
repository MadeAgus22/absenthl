"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Trash2, UserPlus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type User = { id: string; name: string; username: string; role: string; email: string };
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UserManagementTab() {
    const { data: session } = useSWR('/api/auth/session', fetcher);
    const { data: users, mutate: mutateUsers, isLoading: areUsersLoading } = useSWR<User[]>('/api/users', fetcher);
  
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", username: "", email: "", password: "", role: "user" });
    const [editUser, setEditUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    }

    const handleAddUser = async () => {
        setIsSaving(true);
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        if (res.ok) {
            showMessage('success', 'Pengguna berhasil ditambahkan.');
            mutateUsers();
            setIsAddDialogOpen(false);
            setNewUser({ name: "", username: "", email: "", password: "", role: "user" });
        } else {
            const err = await res.json();
            showMessage('error', err.message || 'Gagal menambahkan pengguna.');
        }
        setIsSaving(false);
    }
  
    const handleEditUser = async () => {
        if (!editUser) return;
        setIsSaving(true);
        const payload: any = { name: editUser.name, username: editUser.username, email: editUser.email, role: editUser.role };
        if (newPassword.trim() !== "") {
            payload.password = newPassword;
        }
        
        const res = await fetch(`/api/users/${editUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            showMessage('success', 'Data pengguna berhasil diperbarui.');
            mutateUsers();
            setIsEditDialogOpen(false);
            setNewPassword("");
        } else {
            showMessage('error', 'Gagal memperbarui data pengguna.');
        }
        setIsSaving(false);
    }
  
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsSaving(true);
        const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
        if (res.ok) {
            showMessage('success', `Pengguna ${userToDelete.name} berhasil dihapus.`);
            mutateUsers();
        } else {
            showMessage('error', 'Gagal menghapus pengguna.');
        }
        setUserToDelete(null);
        setIsSaving(false);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daftar Pengguna</CardTitle>
                    <CardDescription>Kelola semua pengguna yang terdaftar di sistem.</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2 h-4 w-4" />Tambah Pengguna</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Tambah Pengguna Baru</DialogTitle><DialogDescription>Isi detail di bawah ini untuk membuat akun baru.</DialogDescription></DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2"><Label htmlFor="add-name">Nama</Label><Input id="add-name" placeholder="Contoh: John Doe" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="add-username">Username</Label><Input id="add-username" placeholder="Contoh: johndoe" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="add-email">Email</Label><Input id="add-email" type="email" placeholder="Contoh: john@example.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="add-password">Password</Label><Input id="add-password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="add-role">Role</Label><Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}><SelectTrigger id="add-role"><SelectValue placeholder="Pilih role" /></SelectTrigger><SelectContent><SelectItem value="admin">Administrator</SelectItem><SelectItem value="user">Pegawai</SelectItem></SelectContent></Select></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                            <Button onClick={handleAddUser} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Tambah Pengguna'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {message && <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={`my-4 ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900 border-green-200' : ''}`}><AlertDescription>{message.text}</AlertDescription></Alert>}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {areUsersLoading ? (
                            Array.from({length: 3}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                        ) : users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell className="flex gap-1 justify-end">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditUser(user); setNewPassword(""); setIsEditDialogOpen(true); }}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <AlertDialog open={!!userToDelete && userToDelete.id === user.id} onOpenChange={(open) => !open && setUserToDelete(null)}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={user.id === session?.user?.id} onClick={() => setUserToDelete(user)}>
                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>Aksi ini akan menghapus pengguna **{userToDelete?.name}** secara permanen.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteUser} disabled={isSaving}>{isSaving ? 'Menghapus...' : 'Hapus'}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* Dialog Edit Pengguna */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Pengguna</DialogTitle></DialogHeader>
                    {editUser && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2"><Label>Nama</Label><Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Username</Label><Input value={editUser.username} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="new-password">Password Baru (Opsional)</Label><Input id="new-password" type="password" placeholder="Kosongkan jika tidak ingin diubah" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Role</Label><Select value={editUser.role} onValueChange={(value) => setEditUser(prev => prev ? { ...prev, role: value } : null)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="admin">Administrator</SelectItem><SelectItem value="user">Pegawai</SelectItem></SelectContent></Select></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleEditUser} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}