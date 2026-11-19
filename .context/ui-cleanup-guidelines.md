# UI Cleanup Guidelines

## 1. Tujuan

Bersihkan seluruh tampilan sementara/overview yang sudah dibuat sebelumnya sebelum desain UI/UX final diterapkan. Tahap ini hanya berfokus pada cleanup dan persiapan struktur frontend. **Jangan membuat desain baru atau menerapkan desain final pada tahap ini.**

Target:
- Menghapus UI sementara dari seluruh halaman yang termasuk ruang lingkup.
- Mempertahankan fondasi MVC, routing, backend, autentikasi, dan otorisasi.
- Menghapus tampilan visual login lama, tetapi mempertahankan fungsi login.
- Mengaudit CSS, JavaScript, dan aset sebelum menghapusnya.
- Menyiapkan struktur View, Layout, CSS, dan JavaScript untuk penerapan desain final berikutnya.

## 2. Keputusan ruang lingkup

| Area | Keputusan |
|---|---|
| Cakupan | Semua tampilan sementara, termasuk dashboard, sidebar, navbar, dan komponen UI lama |
| Login | Hapus tampilan visual lama sebagai persiapan desain baru; pertahankan fungsi autentikasi |
| CSS/JavaScript | Audit penggunaan dan dependensi terlebih dahulu; hapus hanya kode yang terbukti tidak diperlukan |
| Setelah cleanup | Login tetap tersedia untuk guest; halaman internal menampilkan struktur kosong/minimal tanpa UI lama |
| Persiapan | Rapikan View, Layout, CSS, dan JavaScript tanpa membangun sistem komponen visual baru |

## 3. Audit wajib sebelum perubahan

Sebelum mengubah kode:

1. Periksa struktur direktori dan file proyek terkini.
2. Periksa route, controller, View, Layout, partial, dan komponen UI.
3. Telusuri pemanggilan CSS, JavaScript, font, ikon, gambar, serta aset lainnya.
4. Identifikasi hubungan tampilan dengan route, autentikasi, middleware, session, dan backend.
5. Catat file yang akan dipertahankan, diubah, dirapikan, atau dihapus beserta alasannya.

**Jangan menghapus file hanya berdasarkan nama, lokasi, atau dugaan.** Telusuri seluruh referensi dan penggunaannya. Jika masih ada keraguan apakah suatu file diperlukan, pertahankan dan laporkan.

## 4. Pembersihan tampilan

### 4.1 Seluruh UI sementara

Bersihkan UI lama yang memang termasuk cakupan, antara lain:
- Dashboard overview atau preview sementara.
- Sidebar dan menu navigasi lama.
- Navbar/header lama.
- Kartu statistik, grafik, tabel, dan widget placeholder.
- Komponen visual demonstrasi.
- Dummy content atau data contoh yang hanya digunakan untuk menampilkan UI.
- Tampilan halaman internal lama lainnya yang akan digantikan desain final.

Pembersihan markup tidak boleh menghilangkan route, validasi, proses backend, autentikasi, atau fungsi aplikasi lainnya.

### 4.2 Halaman login

- Hapus markup dan styling visual login lama.
- Pertahankan endpoint, route, dan proses login yang sudah berjalan.
- Pertahankan form, method, action, dan field yang dibutuhkan untuk mengirim kredensial.
- Pertahankan validasi, penanganan login gagal, dan pesan kesalahan yang diperlukan.
- Jangan mengubah password hashing/verifikasi, session, atau mekanisme keamanan.
- Siapkan View login yang bersih dan minimal untuk menerima desain final nanti.
- Jangan menonaktifkan atau menghapus fungsi login.

### 4.3 Halaman internal

- Pertahankan route dan controller halaman internal.
- Setelah login, halaman internal yang termasuk cakupan menampilkan struktur kosong atau respons minimal yang valid.
- Hilangkan komponen dashboard, sidebar, navbar, kartu, grafik, tabel, dan UI lama.
- Jangan menambahkan desain pengganti, dummy data, atau placeholder demonstrasi.
- Pastikan request tetap ditangani dengan benar tanpa error PHP/HTTP yang tidak disengaja.

## 5. Audit CSS, JavaScript, dan aset

### CSS
- Telusuri stylesheet yang dimuat oleh setiap View dan Layout.
- Identifikasi aturan yang hanya digunakan oleh UI lama.
- Hapus aturan yang terbukti tidak lagi digunakan setelah markup dibersihkan.
- Pertahankan aturan yang masih dibutuhkan oleh form login minimal atau fungsi aplikasi.
- Jangan menghapus seluruh stylesheet secara membabi buta dan jangan membuat design system baru.

### JavaScript
- Telusuri setiap file JavaScript dan lokasi pemanggilannya.
- Bedakan script interaksi UI lama dari script yang mendukung fungsi aplikasi.
- Hapus script UI lama hanya jika sudah dipastikan tidak digunakan.
- Pertahankan script yang masih dibutuhkan oleh form, validasi, atau proses aktif lainnya.

### Aset lainnya
Audit font, ikon, gambar, dan aset statis. Hapus hanya aset yang terbukti tidak digunakan. Jika status penggunaan belum jelas, pertahankan.

## 6. Persiapan struktur frontend

Rapikan struktur yang sudah ada agar mudah menerima desain final. Ikuti arsitektur proyek saat ini dan hindari perubahan struktur yang tidak diperlukan.

- Pisahkan View autentikasi dari View halaman internal.
- Pertahankan pemisahan Layout autentikasi dan Layout aplikasi jika memang digunakan atau diperlukan.
- Pastikan tanggung jawab View dan Layout jelas.
- Hindari duplikasi markup.
- Tempatkan CSS dan JavaScript secara konsisten sesuai struktur proyek.
- Jangan membuat sistem komponen UI generik atau component framework baru.
- Jangan menambahkan framework, library, atau dependency baru.
- Tetap gunakan Vanilla CSS dan Vanilla JavaScript.

Persiapan ini bukan izin untuk membangun ulang seluruh frontend.

## 7. Fondasi aplikasi yang wajib dipertahankan

Jangan merusak atau mengubah tanpa alasan teknis yang kuat:
- Routing dan pretty URL.
- Front controller.
- Controller dan pemisahan tanggung jawab MVC.
- Model, koneksi database, dan konfigurasi PDO.
- Autentikasi berbasis PHP Session.
- Middleware autentikasi dan otorisasi.
- Pemeriksaan role admin dan operator.
- Proteksi route internal.
- Proses login dan logout.
- Password hashing dan verifikasi.
- Regenerasi session ID setelah login.
- CSRF protection yang sudah diterapkan.
- Penanganan error HTTP 403, 404, 405, dan 500.
- Konfigurasi Docker, Nginx, PHP, MySQL, dan environment.

Jangan mengubah skema database, konfigurasi Docker, atau arsitektur MVC sebagai bagian dari cleanup UI.

## 8. Perilaku aplikasi yang wajib tetap berjalan

Verifikasi bahwa:
1. Guest yang membuka route internal diarahkan ke `/login`.
2. Guest dapat membuka `/login` dan mengirim form login.
3. Kredensial valid menghasilkan autentikasi dan session yang benar.
4. Kredensial tidak valid ditangani dengan aman.
5. Setelah login, pengguna diarahkan ke `/dashboard`.
6. Pengguna yang sudah login dan membuka `/login` diarahkan ke `/dashboard`.
7. Logout mengakhiri session dan mengarahkan pengguna ke `/login`.
8. Route internal tetap terlindungi.
9. Tidak ada UI sementara lama yang masih muncul pada halaman yang dibersihkan.

Halaman internal boleh kosong secara visual, tetapi request harus tetap ditangani dengan benar.

## 9. Larangan

- Jangan membuat desain dashboard atau halaman baru.
- Jangan menerapkan desain final pada tahap cleanup ini.
- Jangan menambahkan fitur bisnis atau backend baru.
- Jangan mengubah autentikasi/otorisasi tanpa kebutuhan yang terbukti.
- Jangan menghapus file berdasarkan nama atau dugaan.
- Jangan menghapus CSS/JavaScript secara massal tanpa audit.
- Jangan menghapus route/controller hanya karena tampilan terkait dikosongkan.
- Jangan menambahkan dummy data atau konten demonstrasi baru.
- Jangan mengganti teknologi yang sudah disepakati.
- Jangan melakukan refactor besar di luar ruang lingkup.

Jika menemukan masalah di luar cakupan, dokumentasikan dan laporkan; jangan memperluas pekerjaan secara sepihak.

## 10. Urutan pengerjaan

1. Inspeksi struktur dan kondisi implementasi terkini.
2. Petakan halaman, route, View, Layout, dan aset terkait.
3. Identifikasi UI sementara dan dependensinya.
4. Tentukan file yang aman untuk dihapus, dipertahankan, atau dirapikan.
5. Bersihkan View dan Layout dari UI lama.
6. Bersihkan CSS, JavaScript, dan aset yang terbukti tidak digunakan.
7. Siapkan struktur minimal untuk desain final.
8. Jalankan pemeriksaan syntax PHP dan pemeriksaan relevan lainnya.
9. Uji alur autentikasi dan akses route.
10. Pastikan tidak ada UI lama, referensi aset rusak, atau error akibat cleanup.

Lakukan perubahan bertahap dan periksa hasil setiap kelompok perubahan sebelum melanjutkan.

## 11. Kriteria keberhasilan

Pekerjaan selesai jika:
- Seluruh UI sementara dalam cakupan sudah dibersihkan.
- Tampilan visual login lama sudah dihapus, tetapi login tetap berfungsi.
- Halaman internal tidak lagi menampilkan UI lama.
- CSS, JavaScript, dan aset telah diaudit sebelum penghapusan.
- Struktur View, Layout, dan aset siap menerima desain final.
- Routing, MVC, autentikasi, otorisasi, session, dan backend tetap berfungsi.
- Tidak ada file penting yang terhapus karena asumsi.
- Tidak ada error PHP, route rusak, atau referensi aset gagal akibat perubahan.
- Tidak ada desain atau fitur baru di luar ruang lingkup.

## 12. Laporan setelah pengerjaan

Minta AI Agent memberikan laporan:
1. Ringkasan pekerjaan.
2. Daftar file yang diubah beserta alasannya.
3. Daftar file yang dihapus beserta bukti bahwa file tidak lagi digunakan.
4. Daftar file penting yang dipertahankan.
5. Struktur View, Layout, CSS, dan JavaScript yang disiapkan.
6. Pengujian yang benar-benar dijalankan beserta hasil aktual.
7. Temuan di luar ruang lingkup atau file yang masih perlu ditinjau.

Jangan mengklaim pengujian berhasil jika tidak benar-benar dijalankan. Jika pengujian tidak dapat dilakukan, nyatakan dengan jelas.

---

**Instruksi utama:** bersihkan tampilan lama secara hati-hati, pertahankan fondasi aplikasi yang sudah berfungsi, dan siapkan struktur frontend untuk menerima desain final pada tahap berikutnya. Jangan mendahului tahap desain ulang.
