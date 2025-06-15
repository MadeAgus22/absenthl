-- File: prisma/migrations/xxxxxxxx_ubah_ke_timestamp_lokal/migration.sql

-- AlterTable
-- Perintah ini akan mengubah tipe kolom sambil mengkonversi data lama ke zona waktu WITA
ALTER TABLE "Attendance" 
ALTER COLUMN "checkInTime" TYPE TIMESTAMP(3) WITHOUT TIME ZONE USING "checkInTime" AT TIME ZONE 'Asia/Makassar',
ALTER COLUMN "checkOutTime" TYPE TIMESTAMP(3) WITHOUT TIME ZONE USING "checkOutTime" AT TIME ZONE 'Asia/Makassar';