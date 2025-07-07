// File: lib/excel-utils.ts

import * as XLSX from 'xlsx';

export const exportToExcel = (apiData: any[], fileName: string) => {
  // 1. Buat worksheet dari data JSON
  const worksheet = XLSX.utils.json_to_sheet(apiData);

  // 2. Buat workbook baru
  const workbook = XLSX.utils.book_new();

  // 3. Tambahkan worksheet ke workbook dengan nama "Laporan"
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  // 4. Atur lebar kolom agar lebih mudah dibaca (opsional, tapi sangat direkomendasikan)
  // Atur lebar kolom berdasarkan panjang teks header atau konten
  const colsWidth = Object.keys(apiData[0] || {}).map((key) => {
      // Ambil panjang header
      let maxLength = key.length;
      // Cek panjang setiap sel di kolom tersebut
      apiData.forEach(row => {
          const cellLength = row[key] ? String(row[key]).length : 0;
          if (cellLength > maxLength) {
              maxLength = cellLength;
          }
      });
      return { wch: maxLength + 2 }; // Tambahkan sedikit padding
  });
  worksheet["!cols"] = colsWidth;

  // 5. Memicu proses download file Excel
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};