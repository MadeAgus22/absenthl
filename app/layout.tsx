import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner" // 1. Impor komponen Toaster

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistem Absensi Pegawai",
  description: "Aplikasi absensi pegawai",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/kemenkes-logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem 
          disableTransitionOnChange
        >
          {children}
          {/* 2. Tambahkan komponen Toaster di sini */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}