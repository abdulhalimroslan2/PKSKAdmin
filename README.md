# 🛡️ PKSK Admin & License Monitor Hub

Aplikasi web papan pemuka pentadbir (*Admin Dashboard*) rasmi untuk memantau, mengawal, dan menguruskan 500+ Kunci Lesen Komersial **PKSK Simulator (Tingkatan 1)** secara langsung melalui pangkalan data awan **Supabase**.

---

## ✨ Ciri-Ciri Utama PKSK Admin:
- 📊 **Pemantauan Metrik Langsung (*Real-time Analytics*)**:
  - Jumlah keseluruhan kunci lesen.
  - Kunci tersedia (*Ready for sale*).
  - Kunci yang telah diaktifkan oleh pembeli (*Active users*).
  - Kunci yang telah tamat tempoh (*Expired* 6 bulan).
  - Kunci yang disekat (*Blocked*).
- 🔍 **Carian Pantas & Penapisan Pelbagai Dimensi**:
  - Carian mengikut Kunci (`PKSK-XXXX`), Nama Pembeli, No. Kad Pengenalan, atau ID Peranti.
  - Penapisan mengikut status (*Tersedia, Diaktifkan, Tamat, Disekat*).
- 📋 **Tindakan 1-Klik Untuk Jualan Pantas**:
  - **Salin 1 Kunci Tersedia** untuk dihantar terus kepada pembeli WhatsApp/Shopee.
  - **Salin 10 Kunci Batch** sekali gus.
  - **Eksport CSV** untuk pengurusan inventori atau muat naik pukal.
- ⚙️ **Operasi Khas Pengurusan Lesen**:
  - **Reset Kunci**: Memadamkan perkaitan peranti dan menukar status kembali kepada `ACTIVE` supaya kunci boleh diaktifkan pada peranti baharu.
  - **Sekat / Nyahaktif Kunci**: Menyekat akses serta-merta bagi mengelakkan perkongsian tanpa kebenaran.
  - **Lanjut Tempoh Sah**: Menambah +30 Hari, +180 Hari (6 Bulan), atau +1 Tahun secara fleksibel.
  - **Jana Kunci Baharu Pukal**: Menjana 1, 5, 10, 25, 50, atau 100 kunci baharu dan menyimpannya terus ke Supabase.

---

## 🚀 Pemasangan & Penggunaan:
1. Buka fail `index.html` pada pelayar web anda (atau jalankan melalui pelayan tempatan seperti `live-server` / `npx serve`).
2. Sambungan ke Supabase telah diprapasang secara automatik.

---

## 🔒 Sambungan Pangkalan Data:
- **Supabase Project:** `https://rvslrscgbhgdcktdtfrl.supabase.co`
- **Jadual:** `pksk_licenses`
