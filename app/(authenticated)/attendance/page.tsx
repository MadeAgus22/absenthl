"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Impor komponen-komponen baru kita
import CheckInTab from "./components/check-in-tab";
import CheckOutTab from "./components/check-out-tab";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("check-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
        <p className="text-muted-foreground">Silakan lakukan absensi masuk atau keluar</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in">Absen Masuk</TabsTrigger>
          <TabsTrigger value="check-out">Absen Keluar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="check-in">
          <CheckInTab />
        </TabsContent>
        
        <TabsContent value="check-out">
          <CheckOutTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}