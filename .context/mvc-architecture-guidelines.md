# MVC Architecture Guidelines

## Tujuan

Dokumen ini adalah instruksi implementasi bagi AI Agent untuk membangun
fondasi aplikasi manajemen keuangan bisnis rumahan menggunakan PHP
Native MVC sederhana.

Fokus tahap ini adalah fondasi aplikasi, routing, autentikasi, otorisasi
dasar, dan halaman login. Jangan membangun modul bisnis seperti
dashboard, transaksi, produk, produksi, stok, atau laporan pada tahap
ini.

Aplikasi tidak memiliki landing page, halaman preview, atau halaman
beranda publik. Akses ke root aplikasi harus diarahkan ke sistem login
jika pengguna belum terautentikasi.

## 1. Keputusan teknologi dan arsitektur

  Area                 Keputusan
  -------------------- ---------------------------------------
  Bahasa backend       PHP Native
  Pola arsitektur      MVC sederhana
  Web server           Nginx
  Database             MySQL 8.0
  Koneksi database     PDO
  Routing              Pretty URL
  Front controller     `public/index.php`
  Autoloading          Manual
  Dependency manager   Tidak menggunakan Composer
  Authentication       PHP Session
  Authorization        Role-based access sederhana
  View                 PHP Native Template
  Layout               Layout reusable
  Frontend             HTML, Vanilla CSS, Vanilla JavaScript

Jangan menambahkan framework PHP, framework frontend, package manager,
atau dependency pihak ketiga tanpa kebutuhan nyata dan persetujuan
pengguna.

## 2. Pemeriksaan sebelum implementasi

Sebelum mengubah proyek:

1.  Periksa struktur direktori dan file yang sudah ada.
2.  Periksa konfigurasi Docker, Nginx, PHP, dan koneksi database yang
    sudah selesai dibuat.
3.  Identifikasi document root aktual dan pastikan mengarah ke
    `public/`.
4.  Periksa apakah sudah ada file konfigurasi, routing, atau kode
    aplikasi yang dapat digunakan kembali.
5.  Jangan menimpa atau menghapus file yang sudah ada tanpa memahami
    fungsinya.
6.  Jangan membuat ulang konfigurasi Docker yang telah dinyatakan
    selesai.
7.  Jangan mengubah port aplikasi yang sudah ditetapkan, yaitu `8001`.
8.  Jika kondisi proyek berbeda dari target dokumen ini, jelaskan
    perbedaannya dan pilih perubahan minimal yang aman.

Sampaikan ringkasan pemeriksaan dan rencana implementasi sebelum
melakukan perubahan yang berisiko.

## 3. Struktur direktori target

Gunakan struktur sederhana berikut:

``` text
project-root/
├── public/
│   ├── index.php
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
│
├── src/
│   └── app/
│       ├── Controllers/
│       │   ├── AuthController.php
│       │   └── HomeController.php
│       │
│       ├── Models/
│       │   └── User.php
│       │
│       ├── Views/
│       │   ├── layouts/
│       │   │   ├── app.php
│       │   │   └── auth.php
│       │   ├── auth/
│       │   │   └── login.php
│       │   └── errors/
│       │       ├── 403.php
│       │       └── 404.php
│       │
│       └── Core/
│           ├── App.php
│           ├── Router.php
│           ├── Controller.php
│           ├── Model.php
│           ├── Database.php
│           ├── View.php
│           ├── Session.php
│           ├── Auth.php
│           ├── Middleware.php
│           └── Helpers.php
│
├── .env
└── .env.example
```

Struktur ini adalah target konseptual. AI Agent boleh menyesuaikan nama
atau lokasi secara terbatas apabila struktur proyek yang sudah ada
memiliki alasan teknis yang lebih baik. Jangan membuat class kosong yang
tidak memiliki fungsi nyata. Hindari menambah lapisan abstraksi yang
tidak diperlukan.

## 4. Tanggung jawab setiap bagian

### 4.1 Public

`public/` adalah satu-satunya direktori yang boleh diakses langsung oleh
web server.

-   `public/index.php` menjadi front controller.
-   Semua request aplikasi diarahkan melalui front controller, kecuali
    file statis yang memang tersedia di `public/assets/`.
-   Source code, konfigurasi, file `.env`, dan view tidak boleh dapat
    diakses langsung melalui HTTP.

### 4.2 Core

Class di `Core/` menyediakan fondasi minimal aplikasi:

-   `App.php`: bootstrap aplikasi dan menghubungkan proses request
    dengan router.
-   `Router.php`: mendaftarkan dan mencocokkan route berdasarkan HTTP
    method dan URL.
-   `Controller.php`: fungsi dasar yang digunakan controller, misalnya
    render view dan redirect.
-   `Model.php`: fungsi dasar model jika memang diperlukan; jangan
    memaksakan inheritance yang tidak memberi manfaat.
-   `Database.php`: koneksi PDO terpusat.
-   `View.php`: memuat view dan layout dengan cara yang aman.
-   `Session.php`: memulai dan mengelola session.
-   `Auth.php`: memeriksa status login dan identitas pengguna.
-   `Middleware.php`: menjalankan pemeriksaan autentikasi dan otorisasi
    sebelum controller.
-   `Helpers.php`: fungsi bantuan umum yang benar-benar digunakan.

### 4.3 Controllers

Controller menerima request, memvalidasi input tingkat request,
memanggil model, menentukan respons, dan memilih view.

Controller tidak boleh berisi query SQL yang tersebar atau mencampur
markup HTML dalam logika bisnis.

### 4.4 Models

Model bertanggung jawab terhadap interaksi data dan query database
terkait entitasnya.

-   Gunakan PDO prepared statements.
-   Jangan menyusun query dengan menggabungkan input pengguna secara
    langsung.
-   Hindari model yang menjalankan tanggung jawab tampilan atau routing.

### 4.5 Views

View hanya bertanggung jawab menampilkan data.

-   Gunakan PHP Native Template.
-   Escape nilai dinamis sebelum ditampilkan ke HTML.
-   Jangan menjalankan query database dari view.
-   Jangan menaruh aturan autentikasi atau otorisasi sebagai
    satu-satunya perlindungan di view.

### 4.6 Layout

Gunakan layout terpisah:

-   `layouts/auth.php` untuk halaman autentikasi.
-   `layouts/app.php` untuk halaman internal setelah login.

Layout aplikasi disiapkan sebagai fondasi reusable. Jangan membuat
dashboard atau menu bisnis hanya untuk mengisi layout pada tahap ini.

## 5. Front controller dan routing

### 5.1 Front controller

Buat `public/index.php` sebagai entry point tunggal aplikasi.

Urutan bootstrap yang disarankan:

1.  Memuat konfigurasi environment melalui mekanisme sederhana buatan
    proyek, tanpa Composer.
2.  Memuat autoloader manual.
3.  Memulai session dengan konfigurasi aman.
4.  Memuat dan menjalankan aplikasi.
5.  Mengirim respons yang sesuai.

Jangan menaruh seluruh logika aplikasi di `public/index.php`.

### 5.2 Pretty URL

Gunakan URL yang bersih, misalnya:

``` text
/login
/logout
/dashboard
```

Hindari pola URL berbasis query string seperti `index.php?page=login`.

Gunakan HTTP method yang sesuai:

-   `GET /login` untuk menampilkan form login.
-   `POST /login` untuk memproses login.
-   `POST /logout` untuk mengakhiri session.
-   `GET /dashboard` sebagai route internal yang dilindungi autentikasi.

Route `/dashboard` pada tahap fondasi boleh menampilkan respons
sementara yang sederhana atau halaman placeholder internal setelah
login, tetapi jangan membuat desain dashboard, chart, kartu metrik, data
dummy, maupun modul bisnis. Tujuannya hanya untuk menguji alur
autentikasi dan redirect. Jangan menambahkan halaman preview publik.

### 5.3 Route root

Perilaku route `/`:

-   Jika pengguna belum login, redirect ke `/login`.
-   Jika pengguna sudah login, redirect ke `/dashboard`.

Route yang tidak dikenal harus menghasilkan halaman atau respons 404
yang sesuai.

### 5.4 Nginx

Pastikan konfigurasi Nginx yang sudah ada mendukung pretty URL dan
meneruskan request yang tidak menunjuk ke file statis ke
`public/index.php`.

Jangan mengganti konfigurasi Nginx secara membabi buta. Periksa
konfigurasi aktif dan lakukan perubahan minimal jika routing belum
berjalan.

## 6. Database dan konfigurasi

Gunakan satu pengelola koneksi PDO terpusat.

Konfigurasi koneksi harus dibaca dari environment variables yang sudah
digunakan proyek Docker. Jangan menaruh kredensial database di source
code.

Ketentuan:

-   Host database di dalam jaringan Compose menggunakan nama service
    database, yaitu `db`, kecuali konfigurasi aktual proyek menunjukkan
    nama lain.
-   Port internal MySQL `3306`.
-   Gunakan charset `utf8mb4`.
-   Aktifkan PDO exception mode.
-   Gunakan prepared statements.
-   Jangan menggunakan akun root MySQL untuk koneksi aplikasi.

Jika proyek belum memiliki tabel pengguna, siapkan rancangan tabel
autentikasi minimum yang memuat sekurang-kurangnya:

-   ID pengguna.
-   Nama pengguna atau identitas login yang unik.
-   Password hash.
-   Nama tampilan.
-   Role.
-   Status aktif.
-   Timestamp pembuatan dan pembaruan.

Gunakan role `admin` dan `operator`. Orang tua dan kakak menggunakan
role `operator` dengan tingkat akses yang sama.

Jangan membuat akun administrator dengan password default yang ditanam
di source code. Sediakan mekanisme provisioning awal yang aman, misalnya
perintah CLI atau proses setup satu kali yang meminta kredensial secara
eksplisit. Jangan membuka registrasi publik.

Jangan membuat tabel modul bisnis lain pada tahap ini.

## 7. Autentikasi

Implementasikan autentikasi menggunakan PHP Session.

### 7.1 Login

-   `GET /login` menampilkan form login.
-   `POST /login` memvalidasi input dan memeriksa kredensial pengguna.
-   Verifikasi password menggunakan `password_verify()`.
-   Password harus disimpan menggunakan `password_hash()` dengan
    algoritma bawaan PHP yang sesuai.
-   Setelah login berhasil, regenerasi session ID menggunakan
    `session_regenerate_id(true)`.
-   Simpan hanya informasi identitas dan role yang diperlukan di
    session.
-   Jangan pernah menyimpan password atau password hash ke session.
-   Berikan pesan kegagalan login yang tidak membocorkan apakah username
    atau password yang salah.
-   Validasi status aktif pengguna sebelum mengizinkan login.

### 7.2 Redirect

-   Pengguna yang belum login dan mengakses route internal harus
    diarahkan ke `/login`.
-   Pengguna yang sudah login dan mengakses `/login` harus diarahkan ke
    `/dashboard`.
-   Setelah login berhasil, arahkan pengguna ke `/dashboard`.
-   Setelah logout berhasil, arahkan pengguna ke `/login`.

### 7.3 Logout

-   Gunakan `POST /logout`, bukan GET.
-   Lindungi proses logout dengan CSRF token.
-   Hapus data session dan cookie session secara benar.
-   Pastikan session lama tidak dapat digunakan kembali.

### 7.4 Session security

-   Aktifkan cookie-only session.
-   Aktifkan strict session mode.
-   Gunakan HttpOnly.
-   Gunakan SameSite yang sesuai.
-   Aktifkan Secure ketika aplikasi berjalan melalui HTTPS.
-   Jangan menetapkan Secure secara keliru untuk lingkungan HTTP lokal
    jika hal itu membuat cookie tidak terkirim.
-   Terapkan timeout idle yang wajar dan konsisten.
-   Jangan mengekspos session ID di URL atau log.

## 8. Middleware dan otorisasi

Buat mekanisme sederhana untuk melindungi route.

Minimal sediakan pemeriksaan:

-   `guest`: hanya pengguna yang belum login.
-   `auth`: hanya pengguna yang sudah login.
-   `role`: membatasi akses berdasarkan role.

Aturan awal:

  Kemampuan                      Admin   Operator
  ------------------------------ ------- ----------
  Mengakses halaman internal     Ya      Ya
  Mengakses dashboard            Ya      Ya
  Mengelola pengguna             Ya      Tidak
  Mengelola konfigurasi sistem   Ya      Tidak

Pada tahap ini, jangan membuat halaman manajemen pengguna atau
konfigurasi sistem. Cukup siapkan mekanisme pemeriksaan role yang dapat
digunakan ketika modul tersebut dikembangkan.

Otorisasi wajib dilakukan di sisi server. Menyembunyikan tombol atau
menu di view bukan pengganti pemeriksaan akses.

Jika pengguna tidak memiliki izin, berikan respons 403.

## 9. Keamanan dasar aplikasi

Implementasikan perlindungan berikut sejak awal:

1.  CSRF token untuk form yang mengubah state, termasuk login dan
    logout.
2.  Output escaping untuk data dinamis HTML.
3.  PDO prepared statements untuk query database.
4.  Validasi HTTP method dan input.
5.  Password hashing yang benar.
6.  Session ID regeneration setelah autentikasi.
7.  Pembatasan akses ke route berdasarkan status login dan role.
8.  Error produksi tidak menampilkan stack trace, kredensial, atau
    detail internal.
9.  File `.env` dan source code privat tidak dapat diakses melalui web.
10. Jangan mencatat password, token, atau rahasia ke log.

Jangan menganggap validasi frontend cukup untuk melindungi aplikasi.

## 10. Error handling

Sediakan penanganan dasar untuk:

-   403 Forbidden.
-   404 Not Found.
-   405 Method Not Allowed jika diperlukan.
-   500 Internal Server Error.

Gunakan tampilan error yang sederhana dan konsisten. Detail teknis hanya
boleh dicatat di log server pada lingkungan development atau log
internal yang aman, bukan ditampilkan kepada pengguna pada production.

Jangan menampilkan halaman debug atau informasi konfigurasi sensitif
kepada pengunjung.

## 11. Batasan tahap implementasi

Pada tahap ini, AI Agent hanya boleh membangun:

-   Struktur direktori MVC.
-   Bootstrap dan autoloading manual.
-   Router dan pretty URL.
-   Koneksi database PDO.
-   Session manager.
-   Authentication.
-   Middleware dan authorization dasar.
-   Layout autentikasi dan layout aplikasi.
-   Halaman login.
-   Halaman error dasar.
-   Route internal minimal untuk memverifikasi login dan redirect.
-   Mekanisme provisioning akun awal yang aman jika diperlukan.

Jangan membangun:

-   Landing page.
-   Halaman preview.
-   Dashboard dengan desain final.
-   Data dummy atau chart dummy.
-   Modul transaksi.
-   Modul produk dan produksi.
-   Modul stok bahan baku.
-   Modul pesanan khusus.
-   Laporan keuangan.
-   Fitur registrasi publik.
-   Fitur bisnis lain yang belum diminta.

## 12. Verifikasi implementasi

Setelah implementasi, lakukan pengujian berikut:

1.  Akses `http://localhost:8001/` saat belum login dan pastikan
    diarahkan ke `/login`.
2.  Akses `/login` dan pastikan form tampil.
3.  Uji login dengan kredensial salah dan pastikan akses ditolak tanpa
    membocorkan detail akun.
4.  Uji login dengan akun valid dan pastikan diarahkan ke `/dashboard`.
5.  Akses `/dashboard` tanpa login dan pastikan diarahkan ke `/login`.
6.  Akses `/login` setelah login dan pastikan diarahkan ke `/dashboard`.
7.  Uji logout melalui POST dan pastikan session berakhir.
8.  Setelah logout, pastikan route internal kembali terlindungi.
9.  Uji role `operator` dan pastikan tidak dapat mengakses kemampuan
    khusus admin.
10. Uji token CSRF yang valid dan tidak valid.
11. Uji route yang tidak dikenal dan pastikan respons 404.
12. Pastikan file `.env`, source code, dan direktori internal tidak
    dapat diakses melalui HTTP.
13. Periksa log PHP dan Nginx untuk error yang muncul selama pengujian.

Jangan membuat akun atau password uji yang diketahui publik. Gunakan
akun yang dibuat melalui provisioning aman.

Jangan menyatakan implementasi berhasil jika pengujian penting belum
dijalankan. Sebutkan pengujian yang belum dapat dilakukan.

## 13. Kriteria selesai

-   [ ] Struktur MVC sederhana tersedia.
-   [ ] Tidak ada Composer atau framework PHP yang ditambahkan.
-   [ ] Front controller berjalan melalui `public/index.php`.
-   [ ] Pretty URL berjalan.
-   [ ] Root aplikasi mengarahkan pengguna sesuai status login.
-   [ ] Login dan logout berfungsi.
-   [ ] Session dikelola dengan aman.
-   [ ] Koneksi database menggunakan PDO.
-   [ ] Middleware autentikasi dan role berjalan.
-   [ ] Layout autentikasi dan layout aplikasi terpisah.
-   [ ] Halaman 403 dan 404 tersedia.
-   [ ] Tidak ada landing page atau halaman preview.
-   [ ] Tidak ada modul bisnis atau data dummy yang dibuat.
-   [ ] Source code privat tidak terekspos melalui web.
-   [ ] Pengujian dan hasilnya didokumentasikan.

## 14. Format laporan akhir AI Agent

Setelah selesai, laporkan:

1.  Ringkasan struktur MVC yang dibuat.
2.  Daftar file yang dibuat atau diubah.
3.  Daftar route dan HTTP method yang tersedia.
4.  Penjelasan alur login, logout, dan middleware.
5.  Cara membuat akun administrator pertama secara aman.
6.  Hasil pengujian yang berhasil dan gagal.
7.  Masalah atau keputusan yang masih membutuhkan konfirmasi.

Jangan menyatakan pekerjaan selesai jika kriteria penting belum
terpenuhi.

## Prinsip utama

Bangun fondasi yang sederhana, eksplisit, aman, dan mudah dipahami.

Jangan membuat abstraksi atau lapisan tambahan hanya demi terlihat
canggih. Jangan mengembangkan fitur bisnis sebelum fondasi MVC dan
autentikasi selesai serta diverifikasi.

Pertahankan konfigurasi Docker yang telah selesai. Jika menemukan
konflik dengan kondisi aktual proyek, jelaskan terlebih dahulu dan minta
konfirmasi sebelum melakukan perubahan berisiko.
