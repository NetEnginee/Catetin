# Panduan Implementasi UI Dashboard Catetin

> Acuan utama AI Agent untuk mengimplementasikan dashboard Catetin sesuai referensi visual desktop, tablet, dan mobile. Ikuti spesifikasi tanpa improvisasi desain.

## 1. Instruksi sebelum bekerja

1. Baca dokumen ini sampai selesai.
2. Baca dokumentasi relevan di `.context/`, khususnya project overview, technical architecture, MVC, UI/UX, coding standards, security, dan development workflow.
3. Audit struktur project, routing, layout aplikasi, Views, Controllers, CSS, dan JavaScript sebelum mengubah kode.
4. Periksa implementasi login Catetin yang sudah ada agar identitas visual konsisten.
5. Buat rencana singkat file yang akan dibuat/diubah, lalu lanjutkan implementasi. Jangan berhenti pada analisis.

## 2. Batasan teknis

- Gunakan PHP Native MVC, PHP Native Views, Vanilla CSS, dan Vanilla JavaScript.
- Tanpa framework CSS/JS, tanpa library grafik, tanpa Composer atau dependency baru.
- Grafik dibuat dengan SVG inline.
- Pertahankan pretty URL, front controller, PHP Session, autentikasi, middleware, role/authorization, CSRF, dan layout aplikasi yang sudah ada.
- Ikuti struktur direktori asset yang benar-benar digunakan project.
- Dashboard harus tetap dilindungi autentikasi.
- Jangan mengubah Docker, Nginx, database, autentikasi, atau modul lain tanpa kebutuhan yang jelas.
- Data di dokumen ini hanya data contoh untuk UI; jangan menyimpannya sebagai transaksi permanen di database.
- Jangan membuat elemen, filter, tombol, atau fitur visual di luar spesifikasi.

## 3. Cakupan dan urutan halaman

Implementasikan dashboard berbahasa Indonesia (`lang="id"`) untuk:

- Desktop: fluid, lebar acuan 1280px.
- Tablet: acuan 820px.
- Mobile: acuan 390px.

Urutan elemen:

1. Header navigasi.
2. Kepala halaman.
3. Pemilih tanggal.
4. Kartu Total Penjualan, Total Pengeluaran, Estimasi keuntungan.
5. Grafik Penjualan dan pengeluaran.
6. Pengeluaran per kategori.
7. Tab bar bawah khusus mobile.

## 4. Gaya visual

### Font

- Space Grotesk 500/700 untuk logo, judul, dan angka besar.
- Inter 400/500/600 untuk teks lain.
- Muat dari Google Fonts.

### Warna

| Elemen               | Warna                 |
| -------------------- | --------------------- |
| Latar halaman        | `#F7F6F2`             |
| Header/kartu gelap   | `#0E1B1A`             |
| Teks di area gelap   | `#E8F3F1`             |
| Teks menu            | `#A9C4C0`             |
| Aksen teal           | `#5EEAD4`             |
| Tautan               | `#0F766E`             |
| Kartu terang         | `#FCFCFB`             |
| Border kartu         | `rgba(11,11,11,0.10)` |
| Teks utama           | `#14171F`             |
| Teks sekunder        | `#52514E`             |
| Teks sumbu           | `#6B6A66`             |
| Gridline             | `#E1E0D9`             |
| Garis dasar          | `#C3C2B7`             |
| Garis hover          | `#898781`             |
| Penjualan            | `#2a78d6`             |
| Pengeluaran          | `#eb6834`             |
| Perubahan baik       | `#006300`             |
| Perubahan buruk      | `#d03b3b`             |
| Baik di kartu gelap  | `#5EEAD4`             |
| Buruk di kartu gelap | `#ec835a`             |

- Radius kartu 16px.
- Tanpa bayangan kecuali tooltip dan popover kalender.
- Tanpa gradien dan emoji.
- Fokus keyboard: outline `3px solid #5EEAD4`, offset 2px.
- Area sentuh minimum 44px.
- Kontras teks minimum 4.5:1.
- Status naik/turun harus memiliki ikon panah dan keterangan, tidak hanya warna.

### Logo

Ikon SVG 32×32px: persegi bulat `x=2`, `y=2`, lebar 28, `rx=8`, stroke `#5EEAD4` 2.5px, tanpa fill. Tanda centang menggunakan path `M10 16.5l4 4 8-9`, stroke 2.5px, linecap/linejoin round. Teks `Catetin` memakai Space Grotesk 700.

## 5. Header dan navigasi

Menu desktop, urutan persis:

1. Dashboard — aktif, `aria-current="page"`.
2. Transaksi.
3. Produk & Produksi.
4. Titip Jual.
5. Laporan.

Menu: font 14px/500, tinggi minimum 44px, radius 8px. Hover berlatar `rgba(255,255,255,0.08)` dengan teks putih. Aktif berlatar `rgba(94,234,212,0.16)` dengan teks putih. Teks normal `#A9C4C0`.

Gunakan `<nav aria-label="Navigasi utama">`. Tombol akun di kanan: lingkaran 44×44px, latar `rgba(255,255,255,0.08)`, ikon orang stroke 1.8px, `aria-label="Akun saya"`.

### Header desktop

- Isi max-width 1200px.
- Padding `12px 32px`.
- Flex wrap: logo, menu, tombol akun.

### Header tablet

- Padding `12px 24px`.
- Menu padding horizontal 10px.
- Logo dan menu muat satu baris.

### Header mobile

- Padding `10px 16px`.
- Logo ikon 26px dan teks Catetin 19px.
- Tombol akun di kanan.
- Menu utama dipindahkan ke tab bar bawah.

### Tab bar mobile

- Menempel di bawah: `position: sticky; bottom: 0`.
- Latar `#0E1B1A`, border atas `rgba(255,255,255,0.10)`.
- Padding `4px 4px 8px`.
- Lima tab sama lebar, tinggi minimum 56px.
- Ikon 22px, stroke 1.8px, di atas label 11px/500.
- Warna normal `#A9C4C0`, aktif `#5EEAD4`.
- Tab: Dashboard (empat kotak, aktif), Transaksi (struk), Produk (kotak 3D, `aria-label="Produk & Produksi"`), Titip Jual (label harga), Laporan (grafik batang).
- Gunakan SVG inline sederhana, tanpa library ikon.

## 6. Kepala halaman

Judul `Dashboard`, Space Grotesk 700, letter-spacing `-0.02em`:

- Desktop 32px.
- Tablet 30px.
- Mobile 26px.

Ringkasan di bawah judul:

- Hari ini: `{Hari}, {tanggal} {bulan} {tahun} · Ringkasan hari ini`.
- Tanggal lampau: `{Hari}, {tanggal} {bulan} {tahun} · Ringkasan hari yang lalu`.
- Desktop/tablet 15px `#52514E`; mobile 14px.
- Tanggal harus mengikuti tanggal yang dipilih.

## 7. Kalender (satu-satunya pemilih tanggal)

### Tombol pemicu

- Tinggi 48px; mobile 52px dan lebar penuh.
- Padding horizontal 14px, border 1px `#C3C2B7`, radius 12px, latar `#FCFCFB`, font 15px/500.
- Isi: ikon kalender 20px, tanggal awal `19 November 2026`, chevron bawah.
- `aria-haspopup="dialog"` dan `aria-expanded`.

### Popover

- `role="dialog"`, `aria-label="Pilih tanggal"`.
- Jarak 8px di bawah pemicu.
- Lebar 352px; mobile selebar tombol.
- Padding 16px, radius 16px, latar `#FCFCFB`, border hairline.
- Bayangan `0 8px 28px rgba(11,11,11,0.14)`, z-index 20.
- Header: tombol bulan sebelumnya/berikutnya 44×44px, aria-label masing-masing `Bulan sebelumnya` dan `Bulan berikutnya`; judul bulan Space Grotesk 700 17px.
- Hari: Sen, Sel, Rab, Kam, Jum, Sab, Min; minggu dimulai Senin; 12px/500 `#52514E`.
- Grid 7 kolom, gap 2px. Tombol tanggal tinggi 44px, radius 10px, font 15px/500.
- Terpilih: latar `#0E1B1A`, teks putih.
- Hari ini: border 1.5px `#0F766E`.
- Tidak dapat dipilih: teks `#A3A29B`, disabled, cursor not-allowed.
- Setiap tanggal memiliki aria-label lengkap, misalnya `19 November 2026, hari ini`, dan `aria-pressed` sesuai status.
- Footer bergaris atas: tombol `Hari ini` di kiri (teal, 600), `Tutup` di kanan (`#52514E`).

Perilaku kalender:

- Rentang 1 Januari 2026 sampai 19 November 2026.
- Tanggal setelah 19 November 2026 disabled.
- Tombol bulan sebelumnya disabled pada Januari 2026; bulan berikutnya disabled pada November 2026.
- Memilih tanggal menutup popover dan memperbarui seluruh dashboard.
- Escape menutup popover; fokus kembali ke tombol pemicu.
- Perubahan tanggal menutup tooltip grafik.
- Perbarui aria-expanded dengan benar.

## 8. Tiga kartu ringkasan

Urutan: Total Penjualan, Total Pengeluaran, Estimasi keuntungan.

Setiap kartu memuat label, angka rupiah besar, lalu baris perubahan dan sparkline.

- Label 14px/500 `#52514E`.
- Angka Space Grotesk 700, line-height 1.1: desktop 34px, tablet 32px, mobile 30px.
- Baris bawah flex-wrap, align-end, space-between, gap 12px.
- Perubahan 13px/500 dengan ikon panah 14px stroke 2.4px.
- Padding: desktop 22px, tablet 20px, mobile 18px; gap 14px.
- Kartu ketiga berlatar `#0E1B1A`, teks `#E8F3F1`, label `#A9C4C0`, sublabel `Penjualan dikurangi pengeluaran` 12px `#8FADA9`.

Teks perubahan:

- Penjualan: `+9,7% dari kemarin` jika naik atau `−x,x% dari kemarin` jika turun. Naik hijau, turun merah.
- Pengeluaran: `7,3% lebih rendah dari kemarin` jika turun atau `x,x% lebih tinggi dari kemarin` jika naik. Pengeluaran turun = baik; naik = buruk.
- Keuntungan: `+21,8% dari kemarin` atau `−x,x% dari kemarin`. Pada kartu gelap gunakan warna baik `#5EEAD4`, buruk `#ec835a`.
- Untuk tanggal lampau, ganti `kemarin` dengan `sehari sebelumnya`.
- Persentase = `|sekarang − sebelumnya| / sebelumnya × 100`; satu desimal dan koma desimal.
- Jika pembanding nol/tidak tersedia, tangani tanpa NaN/Infinity.

Sparkline:

- SVG 120×40, garis 2px round.
- Sepuluh titik kumulatif per jam.
- Normalisasi min–maks pada tinggi 40px dengan padding atas/bawah 4px.
- Garis `#898781`, pada kartu gelap `#8FADA9`.
- Titik akhir radius 4px dengan ring 2px warna latar kartu.
- Titik akhir: penjualan biru, pengeluaran oranye, keuntungan `#5EEAD4`.

## 9. Grafik Penjualan dan pengeluaran

Judul Space Grotesk 700 20px: `Penjualan dan pengeluaran`.

Subjudul desktop/tablet:
`Kumulatif sejak produk dijual. Selisih kedua garis adalah estimasi keuntungan.`

Subjudul mobile:
`Kumulatif sejak produk dijual, dalam rupiah. Selisih kedua garis adalah estimasi keuntungan.`

Legenda wajib: kunci garis 18×2px dan teks 13px `#52514E` untuk Penjualan dan Pengeluaran. Tidak ada tombol Grafik/Tabel dan tidak ada tampilan tabel.

Grafik:

- Garis kumulatif per jam pukul 08.00–17.00, 10 titik per seri.
- Satu sumbu, tanpa sumbu ganda.
- Teks sumbu tidak memakai warna seri.
- Desktop/tablet SVG `viewBox="0 0 720 320"`, lebar 100%.
- Area plot x=56–600, y=16–280.
- Sumbu Y 0–7.000 ribu rupiah.
- Gridline di 2, 4, 6 juta; garis dasar y=280.
- Label Y 12px, rata kanan x=46: `Rp 0`, `Rp 2 jt`, `Rp 4 jt`, `Rp 6 jt`.
- Label X 12px untuk seluruh jam pada y=302.
- Garis 2px round; titik ujung radius 4px, ring 2px `#FCFCFB`.
- Label kanan ujung garis pada x=616: nama seri 12px `#52514E`; nilai 13px/600 `#14171F` (misalnya `Rp 6,2 jt`, `Rp 2,2 jt`), nama 4px di atas dan nilai 13px di bawah ujung.
- Mobile SVG `viewBox="0 0 308 216"`, area plot x=40–296, y=10–180.
- Label Y 11px, rata kanan x=32: `0`, `2 jt`, `4 jt`, `6 jt`.
- Label X 11px hanya 08.00, 11.00, 14.00, 17.00 pada y=200.
- Mobile tidak menampilkan label langsung di ujung garis; titik ujung tetap ada.
- Padding kartu mobile 16px.

Hover:

- Garis vertikal 1px `#898781` pada jam terdekat.
- Titik radius 4px dengan ring 2px di kedua garis.
- Tooltip latar `#FCFCFB`, border hairline, radius 12px, bayangan `0 4px 16px rgba(11,11,11,0.10)`, padding 12px 14px, min-width 180–190px.
- Isi: `Pukul {jam}`, baris Penjualan, baris Pengeluaran, garis pemisah, baris Keuntungan.
- Baris seri: kunci garis 12×2px, nama 12px `#52514E`, nilai 14px/600.
- Untuk empat titik terakhir tooltip berada di kiri garis.
- Area hover setiap titik selebar jarak antar titik dan setinggi area plot.
- Tooltip ditutup saat pointer keluar atau tanggal berubah.
- Jangan menjadikan hover satu-satunya cara memperoleh informasi penting; jaga aksesibilitas keyboard.
- SVG memiliki aria-label yang menyebut tanggal, total penjualan, dan total pengeluaran.

## 10. Pengeluaran per kategori

Judul Space Grotesk 700 20px: `Pengeluaran per kategori`.
Subjudul hari ini: `Total Rp 2.170.000 hari ini`.
Tanggal lampau: `Total Rp {nilai} pada {tanggal} {bulan}`.

Urutan kategori tetap:

1. Bahan baku.
2. Gaji harian.
3. Sewa dan listrik.
4. Transportasi.
5. Lain-lain.

Setiap baris:

- Nama 14px `#14171F`, persentase 14px `#52514E` pada baris yang sama.
- Batang di bawahnya, tinggi 16px, warna `#eb6834`, radius `0 4px 4px 0`, rata di dasar.
- Lebar = nilai kategori ÷ kategori terbesar × 72% lebar baris.
- Nilai rupiah 13px/600 di ujung batang, tanpa wrap.
- Gap elemen 6px; gap antarbaris 20px.
- Hover batang `brightness(1.08)`.
- `title="{nama}: Rp x (y%)"`.
- Padding desktop 22px; tablet/mobile 20px.
- Persentase dihitung terhadap total pengeluaran tanggal terpilih. Jumlah nilai kategori wajib sama dengan total pengeluaran.

## 11. Data contoh dan logika tanggal

Satuan array adalah ribu rupiah. Data per jam adalah penambahan per jam; grafik dan sparkline menampilkan nilai kumulatif.

### 19 November 2026

- Penjualan `[180,420,650,540,880,760,520,610,940,700]`, total 6.200.
- Pengeluaran `[900,120,80,60,450,90,70,300,60,40]`, total 2.170.
- Kategori `[1050,520,240,190,170]`.
- Keuntungan = penjualan − pengeluaran = 4.030.

### 13–18 November 2026

13 Nov:

- Penjualan `[140,360,590,500,760,680,450,520,780,620]`
- Pengeluaran `[820,110,90,80,470,100,70,250,90,60]`
- Kategori `[1030,510,240,190,170]`

14 Nov:

- Penjualan `[185,480,700,620,900,820,600,670,960,750]`
- Pengeluaran `[900,130,100,90,480,100,80,300,70,60]`
- Kategori `[1120,560,260,200,170]`

15 Nov:

- Penjualan `[180,480,700,620,900,820,600,680,980,760]`
- Pengeluaran `[950,140,110,80,500,100,90,320,70,50]`
- Kategori `[1180,590,270,210,160]`

16 Nov:

- Penjualan `[100,300,480,420,640,560,380,450,680,540]`
- Pengeluaran `[780,90,70,60,420,80,60,220,80,50]`
- Kategori `[900,460,220,170,160]`

17 Nov:

- Penjualan `[130,340,560,480,720,640,430,500,760,600]`
- Pengeluaran `[800,100,90,70,480,100,70,240,90,60]`
- Kategori `[1010,500,230,190,170]`

18 Nov:

- Penjualan `[150,380,600,520,800,700,480,540,820,660]`
- Pengeluaran `[850,150,100,90,520,110,80,260,100,80]`
- Kategori `[1130,560,250,200,200]`

Tanggal lain dibuat deterministik dengan PRNG yang di-seed oleh tanggal:

- Total penjualan 4.300–6.600.
- Total pengeluaran 1.800–2.550.
- Bobot penjualan `[.03,.07,.10,.09,.14,.12,.09,.10,.15,.11]`, masing-masing ±15%.
- Bobot pengeluaran `[.40,.06,.04,.03,.21,.04,.03,.14,.03,.02]`, masing-masing ±15%.
- Bobot kategori `[.485,.24,.11,.09,.075]`, masing-masing ±10%.
- Normalisasi bobot sehingga total tepat.
- Jumlah kategori harus sama dengan total pengeluaran.
- Semua nilai kumulatif ≤ 7.000.
- Pembanding perubahan memakai data tanggal sebelumnya.
- Format rupiah Indonesia, misalnya `Rp 6.200.000`.
- Hindari NaN/Infinity dan koreksi pembulatan pada elemen terakhir agar total tepat.
- Jangan tampilkan label `Data contoh` pada UI.

## 12. Layout desktop — fluid

- Latar `#F7F6F2`, min-height 1120px.
- Header isi max-width 1200px, padding `12px 32px`, flex wrap.
- Main max-width 1200px, padding 32px, kolom gap 24px.
- Urutan: kepala halaman, kalender, tiga kartu, baris grafik/kategori.
- Kartu ringkasan flex-wrap, gap 16px, masing-masing `flex: 1 1 260px`.
- Baris bawah gap 16px, kartu rata tinggi.
- Grafik `flex: 2 1 560px`.
- Kategori `flex: 1 1 320px`.
- Pada layar sempit, kartu dan baris menumpuk tanpa overflow horizontal.

## 13. Layout tablet — 820px

- Header padding `12px 24px`; menu horizontal padding 10px; logo dan menu satu baris.
- Main padding `28px 24px 40px`, gap 20px.
- Kepala halaman dan kalender sebaris, flex-wrap, align-end, space-between.
- Kartu Penjualan dan Pengeluaran berdampingan (`flex: 1 1 300px`).
- Kartu keuntungan di bawah dan selebar penuh.
- Padding kartu 20px; nilai 32px.
- Grafik selebar penuh dengan geometri SVG desktop/tablet.
- Kategori selebar penuh.
- Judul halaman 30px.

## 14. Layout mobile — 390px

- Header padding `10px 16px`; logo ikon 26px dan teks 19px; tombol akun di kanan.
- Menu utama berada di tab bar bawah.
- Main padding `20px 16px 28px`, gap 16px, satu kolom.
- Urutan: judul/tanggal, kalender lebar penuh, tiga kartu bertumpuk (gap 12px), grafik, kategori.
- Grafik padding 16px; kategori padding 20px.
- Judul halaman 26px; nilai kartu 30px; kalender tinggi 52px.
- Tab bar mengikuti spesifikasi Navigasi mobile.

## 15. Aksesibilitas

- Gunakan elemen asli: `button`, `a`, `nav`, `main`, `h1`, `h2`.
- Ikon dekoratif `aria-hidden="true"`.
- Tombol ikon wajib punya `aria-label`.
- Navigasi memakai `nav aria-label="Navigasi utama"`.
- Status naik/turun selalu memiliki ikon panah dan teks.
- Pastikan fokus keyboard terlihat dan kontras teks minimal 4.5:1.
- Kalender dan tooltip harus dapat digunakan tanpa mengandalkan warna saja.
- Jangan menggunakan elemen non-interaktif sebagai tombol.

## 16. Kriteria penerimaan

### Tampilan

- [ ] Desktop sesuai referensi pada 1280px.
- [ ] Tablet sesuai referensi pada 820px.
- [ ] Mobile sesuai referensi pada 390px.
- [ ] Tidak ada horizontal overflow.
- [ ] Urutan, warna, tipografi, radius, dan jarak sesuai spesifikasi.
- [ ] Header desktop/tablet dan tab bar mobile tampil sesuai breakpoint.

### Kalender

- [ ] Buka/tutup, navigasi bulan, batas tanggal, tombol Hari ini, dan Escape berfungsi.
- [ ] Tanggal setelah 19 November 2026 disabled.
- [ ] Memilih tanggal memperbarui seluruh dashboard.
- [ ] ARIA dan pengembalian fokus bekerja.

### Data dan grafik

- [ ] Total dan persentase sesuai data.
- [ ] Pembanding menggunakan tanggal sebelumnya.
- [ ] Sparkline memiliki 10 titik.
- [ ] Jumlah kategori sama dengan pengeluaran.
- [ ] Grafik kumulatif memakai SVG inline.
- [ ] Label sumbu desktop/tablet/mobile sesuai.
- [ ] Tooltip menampilkan jam, penjualan, pengeluaran, dan keuntungan.
- [ ] Tooltip ditutup ketika tanggal berubah.
- [ ] SVG memiliki aria-label informatif.

### Integrasi

- [ ] Route dashboard tetap dilindungi autentikasi.
- [ ] Tidak ada framework atau library baru.
- [ ] Tidak ada perubahan tidak perlu pada Docker/database/auth.
- [ ] Login dan route lain tetap berfungsi.
- [ ] Tidak ada error PHP/JavaScript.
- [ ] Data contoh tidak disimpan sebagai transaksi bisnis permanen.

## 17. Laporan akhir

Setelah implementasi, laporkan:

1. File yang dibuat dan diubah.
2. Ringkasan perubahan per komponen.
3. Cara data contoh dihasilkan dan berubah berdasarkan tanggal.
4. Viewport yang benar-benar diuji.
5. Hasil uji kalender, grafik, tooltip, responsivitas, dan aksesibilitas.
6. Hasil pemeriksaan regresi autentikasi dan route lain.
7. Kendala atau bagian yang belum selesai.

Jangan mengklaim pengujian berhasil jika belum dijalankan. Jika pengujian tidak dapat dilakukan, jelaskan secara eksplisit.

**Prioritas:** kesesuaian visual dengan referensi, interaksi yang benar, aksesibilitas, responsivitas, dan kompatibilitas dengan arsitektur Catetin yang sudah ada.
