import LoginForm from "@/components/login-form"
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            src="/rsngoerah.png"
            alt="Logo Sistem Absensi"
            width={210} // Anda bisa sesuaikan ukurannya
            height={210} // Anda bisa sesuaikan ukurannya
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Absensi Implementor RSUP Prof. Ngoerah</h1>
          <p className="mt-2 text-sm text-gray-600">Silahkan login untuk melanjutkan bree..</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
