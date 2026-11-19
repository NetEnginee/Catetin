# Docker Setup Guidelines

## Tujuan

Dokumen ini adalah instruksi kerja untuk AI Agent ketika menyiapkan
lingkungan Docker bagi aplikasi manajemen keuangan bisnis rumahan.

AI Agent harus menyiapkan layanan berikut:

- PHP 8.4 menggunakan PHP-FPM.
- Nginx sebagai web server.
- MySQL 8.0 sebagai database.
- Docker Compose untuk mengelola seluruh layanan.

Aplikasi menggunakan PHP Native dengan pola MVC dan MySQL. Frontend
menggunakan HTML, Vanilla CSS, dan Vanilla JavaScript.

## 1. Keputusan konfigurasi

Gunakan keputusan berikut sebagai konfigurasi awal:

Komponen Keputusan

---

PHP PHP 8.4 FPM
Web server Nginx
Database MySQL 8.0
Orkestrasi Docker Compose
Port aplikasi pada host `8001`
Port Nginx di container `80`
PHP-FPM Hanya di jaringan internal Docker
MySQL Hanya di jaringan internal Docker secara default
Document root Direktori `public/` aplikasi
Lingkungan Development dan production
Persistensi database Named volume Docker
Konfigurasi rahasia Environment file yang tidak masuk Git

Jalankan aplikasi development melalui:

`http://localhost:8001`

Gunakan PHP 8.4 sebagai pilihan konservatif yang stabil dan memiliki
kompatibilitas ekosistem luas. Jangan menaikkan versi PHP atau MySQL
tanpa memeriksa kompatibilitas aplikasi dan meminta persetujuan
pengguna.

## 2. Aturan sebelum melakukan perubahan

Sebelum membuat atau mengubah file:

1.  Periksa struktur direktori proyek dan identifikasi lokasi source
    code, direktori `public`, konfigurasi aplikasi, serta file yang
    sudah ada.
2.  Periksa apakah Dockerfile, file Compose, konfigurasi Nginx, `.env`,
    atau dokumentasi setup sudah tersedia.
3.  Jangan mengasumsikan document root atau lokasi source code tanpa
    memeriksa struktur aktual.
4.  Jangan menimpa, menghapus, atau mengganti file konfigurasi yang
    sudah ada tanpa memahami isinya.
5.  Jangan memindahkan atau mengubah struktur aplikasi MVC hanya demi
    menyesuaikan Docker.
6.  Jika direktori `public/` belum tersedia, jangan membuat struktur
    aplikasi baru secara spekulatif. Laporkan temuan dan minta
    konfirmasi sebelum mengubah struktur aplikasi.
7.  Sebelum mengubah file yang sudah ada, jelaskan perubahan yang
    diperlukan dan alasan teknisnya.
8.  Jangan menjalankan perintah destruktif seperti
    `docker compose down -v`, penghapusan volume, atau penghapusan data
    database tanpa persetujuan eksplisit pengguna.

Setelah pemeriksaan, sampaikan ringkasan kondisi proyek dan rencana
perubahan. Lanjutkan implementasi setup Docker jika tidak ditemukan
konflik atau keputusan yang membutuhkan konfirmasi.

## 3. Struktur file Docker yang dituju

Gunakan struktur berikut sebagai target. Sesuaikan nama atau lokasi file
jika proyek sudah memiliki konvensi yang lebih baik.

```text
project-root/
├── .ai/
│   └── docker-setup-guidelines.md
├── docker/
│   └── nginx/
│       └── default.conf
├── public/
├── src/
├── Dockerfile
├── compose.yaml
├── compose.production.yaml
├── .dockerignore
├── .env.example
├── .env
└── .gitignore
```

Catatan:

- `public/` adalah contoh document root, bukan asumsi bahwa direktori
  tersebut pasti sudah ada.
- Pertahankan direktori aplikasi yang sudah ada.
- File `.env` berisi nilai lokal/rahasia dan tidak boleh masuk version
  control.
- `.env.example` hanya berisi nama variabel dan contoh nilai
  non-rahasia.
- Jangan memasukkan kredensial sungguhan ke Dockerfile, file Compose
  yang dilacak Git, atau dokumentasi.

## 4. Layanan dan konfigurasi

### 4.1 PHP-FPM

Buat Dockerfile berbasis image resmi PHP 8.4 FPM.

Kebutuhan awal:

- Aktifkan ekstensi `pdo_mysql` untuk koneksi MySQL melalui PDO.
- Aktifkan ekstensi umum yang memang diperlukan aplikasi, seperti
  `mbstring`, `intl`, dan `opcache`, setelah memeriksa kebutuhan dan
  dependensinya.
- Hindari memasang ekstensi atau paket yang tidak diperlukan.
- Atur timezone container ke `Asia/Jakarta`.
- Pastikan proses PHP-FPM berjalan di foreground agar dikelola Docker.
- Gunakan konfigurasi PHP yang sesuai untuk development dan
  production; jangan menggunakan pengaturan development di production.
- Jangan menjalankan aplikasi sebagai root jika dapat dihindari.
  Pastikan izin file dan direktori sesuai dengan user proses PHP dan
  kebutuhan web server.

PHP-FPM tidak perlu dipublikasikan ke host. Nginx harus mengaksesnya
melalui nama service Docker pada jaringan internal.

### 4.2 Nginx

Konfigurasikan Nginx sebagai web server yang meneruskan file PHP ke
PHP-FPM.

Ketentuan:

- Petakan port host `8001` ke port container `80`.
- Document root harus mengarah ke direktori `public/` yang benar-benar
  digunakan aplikasi.
- Gunakan `index.php` sebagai salah satu index file.
- File PHP harus diproses oleh PHP-FPM, bukan disajikan sebagai teks.
- Gunakan `try_files` atau aturan routing yang sesuai dengan front
  controller aplikasi setelah memeriksa implementasi MVC yang ada.
- Jangan mengekspos file `.env`, `.git`, dokumentasi internal, file
  konfigurasi, atau source code privat melalui HTTP.
- Atur batas ukuran request secara wajar dan jangan menambahkan aturan
  rewrite yang merusak routing aplikasi.
- Pastikan konfigurasi Nginx lolos pemeriksaan sintaks.

Nginx harus mengakses PHP-FPM menggunakan hostname service Compose,
bukan `localhost`.

### 4.3 MySQL

Gunakan image MySQL 8.0.

Ketentuan:

- Simpan data database pada named volume agar tetap tersedia setelah
  container dibuat ulang.
- Gunakan database, username, dan password melalui environment
  variables.
- Buat database dan user aplikasi dengan hak akses minimum yang
  diperlukan.
- Jangan menggunakan akun `root` sebagai akun koneksi aplikasi.
- Jangan mempublikasikan port MySQL ke host secara default.
- Jika akses database dari host memang diperlukan untuk pengembangan,
  minta persetujuan terlebih dahulu dan batasi binding ke `127.0.0.1`.
- Atur character set dan collation ke `utf8mb4` dengan collation MySQL
  8 yang sesuai.
- Tambahkan health check agar layanan aplikasi dapat menunggu database
  siap.
- Jangan menghapus atau menginisialisasi ulang volume database ketika
  melakukan setup ulang.

Gunakan nama host database berupa nama service Compose, misalnya `db`,
bukan `localhost`.

### 4.4 Jaringan Docker

Buat jaringan internal khusus aplikasi.

- Nginx harus dapat berkomunikasi dengan PHP-FPM.
- PHP-FPM harus dapat berkomunikasi dengan MySQL.
- MySQL tidak perlu dapat diakses langsung dari internet atau host
  secara default.
- Jangan menggunakan alamat IP container secara hard-coded; gunakan
  DNS service Compose.

## 5. Environment variables

Sediakan `.env.example` dengan variabel yang dibutuhkan,
sekurang-kurangnya:

```dotenv
APP_ENV=development
APP_DEBUG=true
APP_TIMEZONE=Asia/Jakarta

APP_PORT=8001

MYSQL_DATABASE=app_database
MYSQL_USER=app_user
MYSQL_PASSWORD=change_this_local_password
MYSQL_ROOT_PASSWORD=change_this_root_password

DB_HOST=db
DB_PORT=3306
DB_DATABASE=app_database
DB_USERNAME=app_user
DB_PASSWORD=change_this_local_password
```

Ketentuan:

- Nilai di atas hanya contoh, bukan kredensial untuk production.
- Buat `.env` lokal dari `.env.example` jika belum ada.
- Jangan menimpa `.env` yang sudah ada.
- Pastikan `.env` tercantum dalam `.gitignore`.
- Pastikan Compose menggunakan variabel yang konsisten dengan
  konfigurasi koneksi database aplikasi.
- Jika nama variabel aplikasi yang sudah ada berbeda, pertahankan nama
  yang digunakan aplikasi dan sesuaikan konfigurasi Compose.
- Jangan mencetak nilai rahasia ke output, log, atau laporan.

## 6. Docker Compose: development

Buat file Compose untuk development yang mengelola service berikut:

- `app`: PHP-FPM.
- `web`: Nginx.
- `db`: MySQL 8.0.

Ketentuan development:

- Source code dapat di-mount agar perubahan kode langsung terlihat
  tanpa membangun ulang image.
- Mount konfigurasi Nginx secara read-only jika sesuai.
- Database menggunakan named volume.
- Port web menggunakan `${APP_PORT:-8001}:80`.
- PHP-FPM dan MySQL tidak dipublikasikan ke host secara default.
- Tambahkan health check untuk MySQL.
- Gunakan `depends_on` dengan kondisi health yang didukung Compose
  agar PHP atau proses terkait tidak mengasumsikan database langsung
  siap.
- Jangan menambahkan service tambahan seperti phpMyAdmin, Redis, atau
  Mailpit kecuali diminta atau memang dibutuhkan dan disetujui.

Pastikan konfigurasi valid menggunakan:

`docker compose config`

## 7. Docker Compose: production

Siapkan konfigurasi production terpisah, misalnya
`compose.production.yaml`, atau mekanisme override Compose yang setara.

Ketentuan production:

- Jangan mount source code host sebagai bind mount untuk menjalankan
  aplikasi.
- Gunakan image aplikasi yang dibangun dan diberi tag secara
  eksplisit.
- Matikan debug dan gunakan pengaturan PHP production.
- Jangan menyertakan kredensial default atau password contoh.
- Rahasia production harus disediakan melalui mekanisme
  environment/secret yang aman di lingkungan deployment.
- Jangan mengaktifkan port database ke publik.
- Pastikan Nginx hanya mengekspos direktori publik.
- Terapkan restart policy yang sesuai.
- Jangan menganggap konfigurasi development otomatis aman untuk
  production.
- Dokumentasikan bahwa TLS/HTTPS, domain, backup database, firewall,
  dan pengelolaan secret harus disiapkan sesuai infrastruktur
  deployment. Jangan mengarang konfigurasi domain atau sertifikat.

Jangan menjalankan deployment production atau mengubah layanan yang
sedang berjalan tanpa instruksi eksplisit pengguna.

## 8. .dockerignore dan .gitignore

Buat atau lengkapi `.dockerignore` agar konteks build tidak menyertakan
file yang tidak diperlukan, seperti:

- `.git/`
- `.env` dan file environment lokal lainnya
- `.ai/` jika dokumentasi tidak diperlukan di dalam image runtime
- cache lokal
- log lokal
- file editor/IDE
- file hasil build yang tidak diperlukan

Jangan mengecualikan source code atau aset runtime yang dibutuhkan
aplikasi.

Pastikan `.gitignore` mengecualikan:

- `.env`
- file rahasia dan kredensial lokal
- log dan cache runtime yang tidak perlu dilacak
- file sementara editor/IDE

Jangan mengubah aturan ignore yang sudah ada tanpa memeriksa dampaknya.

## 9. Konfigurasi koneksi aplikasi ke database

Pastikan konfigurasi aplikasi PHP menggunakan nilai berikut melalui
environment variables atau mekanisme konfigurasi proyek yang sudah
tersedia:

- Host: `db`
- Port: `3306`
- Database: sesuai `DB_DATABASE`
- Username: sesuai `DB_USERNAME`
- Password: sesuai `DB_PASSWORD`
- Charset: `utf8mb4`

Gunakan PDO dengan prepared statements untuk query yang menerima input
pengguna.

Jangan menambahkan framework atau library database baru hanya untuk
menyelesaikan koneksi Docker. Pertahankan pendekatan PHP Native dan pola
MVC yang digunakan proyek.

Jika aplikasi belum memiliki mekanisme membaca environment variables,
periksa implementasi yang ada dan usulkan perubahan minimal. Jangan
membuat ulang sistem konfigurasi aplikasi tanpa persetujuan.

## 10. Perintah operasional yang harus didokumentasikan

Dokumentasikan perintah yang relevan bagi pengembang.

Menjalankan layanan development:

```bash
docker compose up -d --build
```

Melihat status container:

```bash
docker compose ps
```

Melihat log:

```bash
docker compose logs -f
```

Melihat log service tertentu:

```bash
docker compose logs -f web
docker compose logs -f app
docker compose logs -f db
```

Memvalidasi konfigurasi:

```bash
docker compose config
```

Menghentikan container tanpa menghapus data:

```bash
docker compose down
```

Membangun ulang image:

```bash
docker compose build --no-cache
```

Jangan menjadikan `docker compose down -v` sebagai perintah rutin.
Perintah tersebut dapat menghapus named volume dan data database.

## 11. Verifikasi setelah setup

AI Agent wajib melakukan pemeriksaan berikut setelah implementasi:

1.  Validasi file Compose dengan `docker compose config`.
2.  Build image tanpa error.
3.  Jalankan seluruh service development.
4.  Periksa status container menggunakan `docker compose ps`.
5.  Pastikan MySQL berstatus healthy.
6.  Pastikan Nginx dapat menjangkau PHP-FPM.
7.  Pastikan PHP memiliki ekstensi `pdo_mysql`.
8.  Uji koneksi PHP ke MySQL menggunakan konfigurasi aplikasi.
9.  Pastikan aplikasi dapat diakses melalui `http://localhost:8001`.
10. Pastikan request PHP diproses, bukan diunduh atau ditampilkan
    sebagai source code.
11. Pastikan URL atau request ke file `.env` dan file privat tidak dapat
    diakses.
12. Periksa log Nginx, PHP, dan MySQL untuk error yang relevan.

Jika aplikasi belum memiliki halaman atau endpoint yang dapat digunakan
untuk pengujian HTTP, jangan membuat endpoint diagnostik publik tanpa
persetujuan. Gunakan pemeriksaan sementara dari dalam container atau
metode verifikasi lain yang aman.

Jangan menyatakan setup berhasil sebelum pemeriksaan yang relevan
benar-benar selesai. Jika ada pemeriksaan yang tidak dapat dilakukan,
sebutkan dengan jelas.

## 12. Penanganan masalah

Jika setup gagal:

1.  Identifikasi service dan pesan error yang tepat.
2.  Periksa log terkait.
3.  Cari akar masalah sebelum mengubah konfigurasi.
4.  Lakukan perubahan sekecil mungkin.
5.  Jangan menghapus volume database sebagai upaya pertama.
6.  Jangan mengganti versi PHP atau MySQL secara spontan.
7.  Laporkan perubahan dan hasil pengujian setelah perbaikan.

Jika port `8001` sudah digunakan, jangan mengganti port secara
diam-diam. Laporkan konflik dan minta keputusan pengguna.

## 13. Kriteria selesai

Setup Docker dianggap selesai apabila:

- [ ] PHP 8.4 FPM berjalan.
- [ ] Nginx berjalan dan melayani aplikasi melalui port host `8001`.
- [ ] MySQL 8.0 berjalan dan menggunakan persistent volume.
- [ ] Nginx dapat berkomunikasi dengan PHP-FPM.
- [ ] PHP dapat terhubung ke MySQL.
- [ ] Document root mengarah ke direktori publik aplikasi yang benar.
- [ ] File rahasia dan source code privat tidak terekspos melalui
      HTTP.
- [ ] Konfigurasi development dan production dipisahkan.
- [ ] Environment variables dan aturan Git ignore sudah benar.
- [ ] Konfigurasi Compose valid.
- [ ] Hasil pengujian dan perintah operasional telah didokumentasikan.

## 14. Format laporan akhir AI Agent

Setelah pekerjaan selesai, berikan laporan ringkas dengan format:

1.  **Ringkasan perubahan:** file yang dibuat atau diubah.
2.  **Konfigurasi layanan:** versi PHP, Nginx, MySQL, dan port.
3.  **Perintah menjalankan aplikasi:** perintah yang dapat langsung
    digunakan.
4.  **Hasil verifikasi:** pemeriksaan yang berhasil dan gagal.
5.  **Catatan:** keputusan yang belum diterapkan, keterbatasan, atau
    tindakan lanjutan.

Jangan mengklaim pekerjaan selesai jika masih ada kriteria penting yang
belum terpenuhi.

---

## Prinsip utama

AI Agent harus memprioritaskan keamanan, konsistensi, kesederhanaan, dan
kemudahan pemeliharaan.

Docker berfungsi sebagai lingkungan untuk menjalankan aplikasi, bukan
alasan untuk mengubah arsitektur bisnis atau struktur aplikasi yang
sudah ditentukan.

Jika terdapat konflik antara instruksi ini dan kondisi aktual proyek,
periksa konteks proyek, jelaskan konflik, dan minta konfirmasi sebelum
melakukan perubahan yang berisiko.
