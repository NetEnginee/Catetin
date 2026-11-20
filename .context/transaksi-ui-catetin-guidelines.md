# Panduan Implementasi UI Halaman Transaksi — Catetin

## Tujuan

Implementasikan halaman **Transaksi** Catetin dalam bahasa Indonesia (`lang="id"`), responsif untuk desktop 1280px, tablet 820px, dan mobile 390px. Hasil harus interaktif dengan state nyata, bukan gambar statis.

Gunakan PHP Native MVC, Vanilla CSS, dan Vanilla JavaScript sesuai struktur proyek yang sudah ada. Jangan menggunakan framework UI/JS, Composer, atau library tambahan.

## Instruksi awal untuk AI Agent

2. Periksa struktur proyek, route, layout, navigasi, autentikasi, dan aset yang sudah tersedia sebelum mengubah kode.
3. Gunakan kembali layout aplikasi, logo, header, navigasi, tombol akun, dan tab bar yang sudah ada. Jangan menduplikasi komponen bersama.
4. Jika `TransaksiTablet.dc.html` tersedia di workspace, gunakan sebagai referensi visual tambahan untuk tablet. Itu hanya mockup; jangan menyalin runtime React, `support.js`, vendor, atau sintaks khusus Design Component.
5. Fokus pada UI dan interaksi frontend dengan data contoh. Jangan membuat backend atau skema database baru pada tahap ini kecuali pola proyek yang sudah ada memang mengharuskannya.
6. Jangan mengubah Docker, autentikasi, middleware, database, atau modul lain yang tidak diperlukan.
7. Setelah selesai, laporkan file yang diubah dan pengujian yang benar-benar dijalankan.

---

## 1. Gaya visual

### Tipografi

- Space Grotesk 700 untuk judul dan angka besar.
- Inter 400/500/600 untuk teks lainnya.
- Muat dari Google Fonts jika belum tersedia dalam proyek.

### Palet warna

| Elemen                         | Warna                 |
| ------------------------------ | --------------------- |
| Latar halaman                  | `#F7F6F2`             |
| Header/nav dan kartu gelap     | `#0E1B1A`             |
| Teks di latar gelap            | `#E8F3F1`             |
| Teks redup gelap               | `#A9C4C0`, `#8FADA9`  |
| Kartu terang                   | `#FCFCFB`             |
| Border kartu                   | `rgba(11,11,11,0.10)` |
| Teks utama                     | `#14171F`             |
| Teks sekunder                  | `#52514E`             |
| Garis pemisah                  | `#E1E0D9`             |
| Border input                   | `#C3C2B7`             |
| Aksen/tombol                   | `#0F766E`             |
| Hover aksen                    | `#0B5A54`             |
| Fokus/aksen terang             | `#5EEAD4`             |
| Pemasukan                      | `#2a78d6`             |
| Pengeluaran                    | `#eb6834`             |
| Nominal pemasukan pada riwayat | `#006300`             |
| Error/hapus                    | `#d03b3b`             |

Warna biru/oranye hanya untuk titik, batang, atau penanda data kecil. Nominal pemasukan pada daftar riwayat menggunakan hijau; nominal pengeluaran memakai teks utama.

### Aturan umum

- Kartu terang: radius 16px dan border 1px.
- Fokus keyboard: `outline: 3px solid #5EEAD4; outline-offset: 2px`.
- Semua target sentuh minimal 44×44px.
- Gunakan elemen asli `button`, `input`, `select`, `a`, `label`, dan elemen semantik.
- Jangan gunakan `div` atau `span` sebagai tombol.
- Ikon SVG dekoratif memakai `aria-hidden="true"`.
- Hubungkan label dan input dengan `for`/`id`.
- Gunakan atribut ARIA yang sesuai: `aria-label`, `aria-expanded`, `aria-pressed`, `aria-current`, `role="dialog"`, `role="alert"`, dan `role="status"`.
- Jangan menambahkan gradien, bayangan dekoratif, emoji, ilustrasi, atau elemen yang tidak diminta.

## 2. Navigasi

### Desktop dan tablet

Header gelap `#0E1B1A`:

- Kiri: logo Catetin (ikon kotak rounded dengan centang teal `#5EEAD4`, teks “Catetin”).
- Tengah: Dashboard, Transaksi, Produk & Produksi, Titip Jual, Laporan.
- Transaksi aktif: teks putih dengan latar `rgba(94,234,212,0.16)`.
- Kanan: tombol akun bulat 44×44px.

### Mobile

- Header hanya logo dan tombol akun.
- Menu pindah ke tab bar bawah yang menempel.
- Tab: Dashboard, Transaksi, Produk, Titip Jual, Laporan.
- Ikon 22px, label 11px.
- Transaksi aktif berwarna `#5EEAD4`.
- Beri ruang bawah konten agar tab bar tidak menutupi konten.

## 3. Judul halaman dan filter tanggal

- H1 `Transaksi`: 32px desktop/tablet, 26px mobile.
- Subjudul menampilkan periode, contoh `Kamis, 19 November 2026 · Hari ini` atau `Semua tanggal`.
- Tombol kalender berisi ikon, tanggal/periode aktif, dan chevron.
- Desktop/tablet: tombol di kanan judul. Mobile: selebar konten di bawah judul.
- Filter tanggal mengatur rekap, rekap kategori, dan riwayat secara bersamaan.

### Kalender

- Header bulan dengan tombol sebelumnya/berikutnya.
- Awal minggu Senin: `Sen, Sel, Rab, Kam, Jum, Sab, Min`.
- Sel tanggal minimal 44×44px.
- Hari ini diberi border teal.
- Tanggal terpilih berlatar `#0E1B1A`, teks putih.
- Tanggal sebelum 1 Januari 2026 dan setelah 19 November 2026 nonaktif.
- Footer: `Hari ini`, `Semua tanggal` (hanya kalender filter halaman), `Tutup`.
- `Escape` menutup kalender.
- Kalender tanggal form/detail tidak menampilkan `Semua tanggal`.
- Di mobile, kalender form terbuka ke atas jika ruang di bawah tidak cukup.
- Pastikan pop-up tidak terpotong parent dan dapat digunakan pada layar sempit.

## 4. Rekap pemasukan, pengeluaran, dan selisih

Tampilkan tiga kartu:

1. **Total pemasukan**: titik biru, nominal besar, jumlah transaksi.
2. **Total pengeluaran**: titik oranye, nominal besar, jumlah transaksi.
3. **Selisih**: kartu gelap, sub-label `Pemasukan dikurangi pengeluaran`, nominal, jumlah seluruh transaksi.

Layout:

- Desktop/tablet: tiga kartu berjajar.
- Mobile: pemasukan dan pengeluaran berdampingan; selisih selebar penuh di bawah.

Format:

- Nominal desktop/tablet: Space Grotesk 700, 28px.
- Nominal mobile: 19px.
- Rupiah: `Rp 6.200.000`, pemisah ribuan titik.
- Nilai negatif memakai tanda `−`, bukan hyphen.
- Selisih negatif berwarna `#ec835a`; jika tidak negatif gunakan `#E8F3F1`.
- Semua angka dihitung dari state transaksi dan filter aktif.

## 5. Rekap per kategori

Kartu **Rekap per kategori** mengikuti periode filter dan berisi dua bagian:

- Pemasukan: batang `#2a78d6`.
- Pengeluaran: batang `#eb6834`.

Setiap kategori menampilkan nama, persentase dari total jenis transaksi, batang horizontal tinggi 14px dengan ujung kanan radius 4px, dan nominal. Panjang batang relatif terhadap kategori terbesar pada bagian yang sama.

Jika kosong, tampilkan:

- `Belum ada pemasukan pada periode ini.`
- `Belum ada pengeluaran pada periode ini.`

Persentase dan panjang batang dihitung dari data terfilter. Jangan tampilkan kategori bernilai nol sebagai baris.

## 6. Formulir “Catat transaksi”

Buat kartu form dengan urutan berikut.

### 6.1 Jenis transaksi

Segmented toggle `Pemasukan` | `Pengeluaran`.

- Wadah `#EFEEE8`.
- Item aktif berlatar putih dan memiliki border.
- Tinggi minimal 44px.
- Saat jenis berubah, reset kategori terpilih dan tampilkan kategori sesuai jenis baru.

### 6.2 Nominal

- Label `Nominal`.
- Input angka dengan prefiks `Rp`.
- Angka Space Grotesk 700, 20px.
- Format ribuan otomatis menggunakan titik.
- Hanya angka, maksimal 11 digit.
- Gunakan `inputmode="numeric"` dan sanitasi input.

### 6.3 Kategori

Chip pill tinggi minimal 44px; satu pilihan. Chip aktif berlatar `#0E1B1A` dan teks putih.

Kategori pemasukan:

- Penjualan langsung
- Titip jual
- Pesanan online
- Pemasukan lain

Kategori pengeluaran:

- Bahan baku
- Gaji harian
- Sewa dan listrik
- Transportasi
- Lain-lain

Chip terakhir `+ Kategori` dengan border teal putus-putus. Saat ditekan, tampilkan input nama dan tombol `Tambah`.

- Tolak nama kosong.
- Tolak duplikat tanpa membedakan kapitalisasi.
- Tampilkan pesan validasi yang jelas jika nama sudah ada.
- Kategori baru ditambahkan ke daftar jenis aktif dan dapat langsung dipilih.

### 6.4 Keterangan

- Label `Keterangan (opsional)`.
- Input teks dengan placeholder `Contoh: beli tepung 10 kg`.
- Jika kosong, gunakan nama kategori sebagai deskripsi transaksi.

### 6.5 Tanggal transaksi

- Tombol kalender dengan tanggal terpilih.
- Default 19 November 2026.
- Tampilkan `Hari ini` jika tanggal sama dengan hari ini.
- Gunakan kalender yang sama tanpa opsi `Semua tanggal`.

### 6.6 Validasi dan status

- Error: `#d03b3b`, `role="alert"`.
- Sukses: `#006300`, `role="status"`.
- Error nominal: `Masukkan nominal lebih dari Rp 0.`
- Error kategori: `Pilih kategori transaksi.`
- Contoh sukses: `Pemasukan Rp 500.000 tersimpan pada 19 November 2026.`
- Pesan duplikat kategori harus jelas.
- Hapus pesan yang tidak relevan ketika input/pilihan berubah.

### 6.7 Tombol simpan

- Lebar penuh, tinggi 52px.
- Latar `#0F766E`, teks putih, radius 12px.
- Label dinamis `Simpan pemasukan` atau `Simpan pengeluaran`.

### 6.8 Perilaku simpan

- Cegah reload halaman.
- Validasi nominal lebih dahulu, lalu kategori.
- Jika valid, buat transaksi berisi jenis, nominal, kategori, deskripsi, tanggal, waktu, dan ID unik.
- Tambahkan transaksi ke state.
- Kosongkan nominal dan keterangan setelah berhasil.
- Pertahankan jenis transaksi dan tanggal form.
- Tampilkan pesan sukses.
- Rekap dan riwayat langsung diperbarui.
- Jika tanggal transaksi sama dengan filter halaman, transaksi langsung muncul. Jika berbeda, transaksi muncul ketika tanggal tersebut dipilih.

## 7. Riwayat transaksi

Kartu **Riwayat transaksi** berisi judul, jumlah hasil, filter jenis segmented `Semua`/`Pemasukan`/`Pengeluaran`, dan select kategori. Select memiliki opsi `Semua kategori` serta kategori sesuai jenis filter. Ketika jenis filter berubah, reset kategori jika kategori lama tidak relevan.

### Pengelompokan

- Urutkan transaksi terbaru terlebih dahulu.
- Kelompokkan berdasarkan tanggal.
- Header contoh: `Kamis, 19 November 2026 · Hari ini`.
- Tampilkan jumlah grup, misalnya `13 transaksi`.

### Baris transaksi

Setiap baris berupa tombol, tinggi minimal 64px:

- Ikon lingkaran 40px; pemasukan memakai panah masuk dan latar `#E4EEFB`; pengeluaran memakai panah keluar dan latar `#FCE9E1`.
- Baris utama: deskripsi.
- Baris kedua: `Kategori · 16.45 WIB`.
- Kanan: pemasukan `+Rp 1.250.000` warna `#006300`; pengeluaran `−Rp 190.000` warna `#14171F`.
- Hover: `#F3F2EC`.
- Terpilih: `#EFEEE8`.
- Pastikan nominal tidak terpotong di mobile.

### Empty state riwayat

Jika tidak ada hasil, tampilkan `Tidak ada transaksi`, penjelasan singkat, dan tombol `Reset filter`. Reset hanya filter jenis dan kategori, jangan mengubah filter tanggal halaman.

## 8. Detail transaksi

Klik baris untuk membuka detail:

- Desktop: panel kanan lebar 420px dengan scrim gelap.
- Tablet: modal tengah maksimum 520px.
- Mobile: layar penuh.
- Tombol tutup X minimal 44×44px.
- `Escape` menutup kalender detail terlebih dahulu; jika kalender tidak terbuka, tutup detail.
- Klik scrim boleh menutup detail jika tidak sedang konfirmasi hapus.

Isi:

- Pill jenis transaksi.
- Judul berupa deskripsi.
- Nominal 34px dengan tanda `+` untuk pemasukan dan `−` untuk pengeluaran.
- Baris Kategori, Tanggal, Waktu, dan ID transaksi.
- ID format `TRX-20261119-038`.
- Pada tanggal, sediakan tombol `Ubah tanggal` yang membuka kalender di panel.
- Perubahan tanggal langsung memperbarui detail, pengelompokan riwayat, dan rekap.

### Hapus transaksi

- Tombol awal `Hapus transaksi`, outline merah.
- Setelah ditekan, tampilkan konfirmasi `Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan.`
- Tombol `Ya, hapus` berlatar `#d03b3b`; tombol `Batal`.
- `Batal` membatalkan konfirmasi.
- `Ya, hapus` menghapus transaksi dari state, menutup detail, dan memperbarui rekap serta riwayat.
- Jangan menghapus transaksi sebelum konfirmasi.

## 9. Tata letak responsif

### Desktop — 1280px

- Konten maksimum 1200px dan berada di tengah.
- Judul dan filter di atas.
- Tiga kartu rekap berjajar.
- Grid dua kolom setelah rekap: kiri 360px berisi form lalu rekap kategori; kanan berisi riwayat.
- Jarak antar kolom 24px.
- Navigasi horizontal lengkap.

### Tablet — 820px

- Padding konten 24px.
- Tiga kartu rekap berjajar.
- Form dan rekap kategori berdampingan dengan rasio `1.1fr : 0.9fr`.
- Riwayat selebar penuh di bawah.
- Gunakan `TransaksiTablet.dc.html` sebagai referensi visual tambahan jika tersedia, bukan sebagai kode produksi.
- Pastikan halaman dapat discroll tanpa konten terpotong.

### Mobile — 390px

- Satu kolom, padding 16px.
- Urutan: judul, filter tanggal, rekap, form, rekap kategori, riwayat.
- Dua kartu rekap pertama berdampingan, selisih selebar penuh.
- Header hanya logo dan akun; tab bar menempel di bawah.
- Kalender form membuka ke atas jika diperlukan.
- Detail transaksi layar penuh.
- Tidak boleh ada horizontal overflow.

## 10. Data contoh prototipe

Hari ini: **19 November 2026**. Rentang kalender: **1 Januari–19 November 2026**.

### 19 November 2026

Pemasukan total **Rp 6.200.000**:

- 16.45 — Penjualan langsung — Kasir sore — Rp 1.250.000
- 15.10 — Pesanan online — Pesanan online #1042 — Rp 860.000
- 13.30 — Titip jual — Titip jual Toko Sinar — Rp 1.400.000
- 12.15 — Penjualan langsung — Kasir siang — Rp 1.150.000
- 10.40 — Pesanan online — Pesanan online #1038 — Rp 640.000
- 09.20 — Titip jual — Titip jual Bu Rina — Rp 520.000
- 08.30 — Penjualan langsung — Kasir pagi — Rp 380.000

Pengeluaran total **Rp 2.170.000**:

- 15.40 — Transportasi — Ongkir — Rp 190.000
- 14.10 — Bahan baku — Tepung dan gula — Rp 600.000
- 11.30 — Sewa dan listrik — Token listrik — Rp 240.000
- 10.05 — Gaji harian — Gaji harian — Rp 520.000
- 09.15 — Bahan baku — Belanja bahan baku — Rp 450.000
- 08.10 — Lain-lain — Plastik kemasan — Rp 170.000

### 18 November 2026

- Pemasukan Rp 5.650.000.
- Pengeluaran Rp 2.340.000.
- Gunakan pola transaksi serupa: kasir pagi/siang/sore, titip jual, pesanan online; bahan baku, gaji harian, listrik/air, transportasi.

### 17 November 2026

- Pemasukan Rp 5.160.000.
- Pengeluaran Rp 2.100.000.
- Gunakan pola transaksi serupa seperti tanggal sebelumnya.

### Konsistensi data

- Pastikan rincian 19 November berjumlah tepat Rp 6.200.000 pemasukan dan Rp 2.170.000 pengeluaran.
- Pastikan rincian 17 dan 18 November juga tepat sesuai total target. Jika rincian yang disusun tidak cocok, sesuaikan nominal satu atau lebih transaksi secara wajar tanpa mengubah total target.
- Gunakan ID transaksi unik dan stabil.
- Urutkan riwayat berdasarkan tanggal dan waktu terbaru.

## 11. State dan interaksi frontend

Gunakan Vanilla JavaScript dengan satu sumber data transaksi. Simpan state untuk:

- Filter tanggal halaman (tanggal tertentu/semua tanggal).
- Bulan yang terlihat pada kalender.
- Tanggal transaksi form.
- Jenis transaksi form.
- Nominal, kategori, kategori baru, keterangan.
- Pesan error dan sukses.
- Filter jenis dan kategori riwayat.
- Detail transaksi yang terbuka.
- Status konfirmasi hapus.
- Kalender yang sedang terbuka.

Semua kartu, kategori, dan riwayat harus dihitung dari sumber transaksi yang sama agar konsisten.

Interaksi wajib:

- Buka/tutup kalender dan navigasi bulan.
- Pilih tanggal, hari ini, dan semua tanggal.
- Perubahan filter memperbarui rekap, kategori, dan riwayat.
- Ganti jenis transaksi dan kategori.
- Format nominal saat diketik.
- Tambah kategori dan tolak duplikat.
- Simpan transaksi.
- Filter/reset riwayat.
- Buka/tutup detail.
- Ubah tanggal transaksi.
- Konfirmasi/batalkan hapus.
- Dukungan Escape sesuai urutan overlay.

Data contoh boleh berada di JavaScript untuk prototipe. Jangan mengklaim data tersimpan permanen di database. Gunakan `localStorage` hanya jika sesuai pola proyek dan jelaskan bahwa itu penyimpanan sementara browser, bukan backend.

## 12. Integrasi dengan proyek

- Ikuti PHP Native MVC dan routing yang sudah ada.
- Render melalui PHP View, bukan halaman HTML mandiri yang tidak terhubung ke MVC.
- Gunakan layout aplikasi yang sudah ada.
- Pisahkan CSS/JS mengikuti pola proyek; contoh nama bila sesuai:
  - `public/assets/css/transactions.css`
  - `public/assets/js/transactions.js`
- Jangan membuat folder duplikat jika struktur aset sudah ada.
- Jangan menduplikasi header, logo, navigasi, tab bar, atau layout bersama.
- Jangan menambahkan framework CSS/JS.
- Jangan mengubah Dashboard, Login, Produk, Titip Jual, Laporan, autentikasi, atau Docker.
- Jangan menghapus kode yang masih digunakan halaman lain.
- Pastikan route tetap dilindungi middleware autentikasi.

## 13. Kriteria penerimaan

- [ ] Halaman terintegrasi dengan MVC dan layout aplikasi.
- [ ] Gaya visual, palet, tipografi, border, radius, dan fokus sesuai spesifikasi.
- [ ] Navigasi desktop/tablet dan tab bar mobile tampil benar.
- [ ] Layout diuji pada 1280px, 820px, dan 390px.
- [ ] Tidak ada horizontal overflow di mobile.
- [ ] Kalender dan filter tanggal berfungsi.
- [ ] Rekap dan kategori konsisten dengan data.
- [ ] Form memvalidasi nominal dan kategori.
- [ ] Format nominal dan batas 11 digit bekerja.
- [ ] Kategori baru dapat ditambah dan duplikat ditolak.
- [ ] Transaksi baru langsung memperbarui tampilan yang relevan.
- [ ] Filter riwayat dan reset filter bekerja.
- [ ] Detail dapat dibuka dan ditutup.
- [ ] Ubah tanggal memperbarui rekap dan riwayat.
- [ ] Hapus memerlukan konfirmasi.
- [ ] Escape menutup overlay sesuai urutan.
- [ ] Kontrol dapat digunakan dengan keyboard dan memiliki label aksesibel.
- [ ] Tidak ada error PHP/JavaScript.
- [ ] Fitur yang sudah ada tetap berjalan.

## 14. Laporan akhir

Setelah implementasi, laporkan:

1. File yang dibuat/diubah.
2. Komponen UI yang selesai.
3. Interaksi yang diuji.
4. Hasil pengujian desktop 1280px, tablet 820px, dan mobile 390px.
5. Kekurangan atau bagian yang menunggu integrasi backend.

Jangan menyatakan pengujian berhasil jika belum benar-benar dijalankan.
