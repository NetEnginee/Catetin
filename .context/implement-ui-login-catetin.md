# Implementasi UI Halaman Login --- Catetin

## Tujuan

Implementasikan desain halaman login **Catetin** ke dalam project yang
sudah ada dengan mengikuti referensi visual desktop, tablet, dan mobile
serta spesifikasi pada dokumen ini.

Hasil akhir harus menjadi halaman login yang benar-benar terintegrasi
dengan aplikasi, bukan sekadar mockup atau halaman HTML terpisah.

## Instruksi utama untuk AI Agent

Sebelum mengubah kode:

1.  Baca seluruh dokumentasi yang relevan di folder `.context/`, terutama:
    - `mvc-architecture-guidelines.md`
    - `ui-ux-guidelines.md`
    - `docker-setup-guidelines.md`
2.  Periksa struktur project, routing, controller autentikasi, sistem
    session, middleware, layout, dan asset yang sudah tersedia.
3.  Temukan implementasi login saat ini dan pahami alur autentikasinya
    sebelum melakukan perubahan.
4.  Gunakan screenshot desain yang diberikan sebagai referensi visual:
    - `Halaman Login.png` --- desktop
    - `Login Tablet.png` --- tablet
    - `Login Mobile.png` --- mobile
5.  Jika file HTML desain referensi `UI Sistem Login.html` tersedia di
    project, pelajari struktur dan styling-nya sebagai referensi
    tambahan. Jangan menyalin wrapper atau sintaks khusus dari generator
    desain.

**Jangan langsung menulis ulang struktur aplikasi.** Pertahankan
arsitektur dan kode yang sudah berjalan. Lakukan perubahan sekecil
mungkin untuk mencapai hasil yang diminta.

## Batasan teknologi

- PHP Native dengan pola MVC sederhana.
- HTML semantik.
- Vanilla CSS.
- Vanilla JavaScript.
- Tidak menggunakan framework CSS atau JavaScript.
- Tidak menambahkan dependency atau package manager baru.
- Google Fonts digunakan untuk memuat font sesuai spesifikasi.
- Pertahankan penggunaan routing, controller, session, middleware, dan
  mekanisme autentikasi yang sudah ada.

## Integrasi dengan arsitektur aplikasi

Gunakan struktur View dan Layout yang sudah ada. Berdasarkan arsitektur
project, implementasi login seharusnya berada pada area berikut
(sesuaikan dengan struktur aktual, jangan membuat duplikasi jika file
sudah tersedia):

- `src/app/Views/layouts/auth.php` --- layout khusus halaman
  autentikasi.
- `src/app/Views/auth/login.php` --- isi halaman login.
- `public/assets/css/` --- stylesheet halaman login.
- `public/assets/js/` --- JavaScript halaman login.

Ketentuan integrasi:

1.  Halaman login menggunakan layout autentikasi, bukan layout halaman
    internal aplikasi.
2.  Form login mengirim data ke route `POST /login` menggunakan metode
    `POST`.
3.  Gunakan nama field yang sesuai dengan controller autentikasi yang
    sudah ada. Jika controller menggunakan `username` dan `password`,
    pertahankan nama tersebut.
4.  Integrasikan token CSRF sesuai mekanisme keamanan project.
5.  Tampilkan pesan kesalahan autentikasi dari server pada kotak galat
    yang disediakan.
6.  Pertahankan validasi kredensial di backend. JavaScript tidak boleh
    menggantikan autentikasi PHP.
7.  Setelah login berhasil, ikuti redirect yang sudah ditentukan
    aplikasi, yaitu ke `/dashboard`.
8.  Pengguna yang sudah login tidak boleh kembali melihat halaman login;
    ikuti mekanisme redirect yang sudah ada.
9.  Jangan membuat halaman registrasi atau menambahkan tautan daftar.
10. Tautan `Lupa password?` tetap menggunakan `href="#"` sesuai desain.
    Jangan membuat fitur reset password baru.

## Spesifikasi visual

### Gaya umum

Gunakan gaya visual datar, bersih, dan minimalis. Jangan menambahkan
elemen yang tidak tercantum dalam spesifikasi atau screenshot.

**Font:**

- `Space Grotesk` bobot 500 dan 700 untuk logo, judul formulir, dan
  headline.
- `Inter` bobot 400, 500, dan 600 untuk teks lainnya.
- Muat font dari Google Fonts.

**Palet warna:**

Penggunaan Warna

---

Panel gelap `#0E1B1A`
Teks panel gelap `#E8F3F1`
Paragraf panel gelap `#A9C4C0`
Footer panel gelap `#8FADA9`
Aksen logo dan fokus `#5EEAD4`
Latar sisi formulir `#F7F6F2`
Teks utama `#14171F`
Teks sekunder `#4B5563`
Tombol utama dan tautan `#0F766E`
Hover tautan `#0B5A54`
Latar input `#FFFFFF`
Border input `#8B93A1`
Ikon mata `#374151`
Latar kotak galat `#FDECEC`
Border kotak galat `#E8A5A5`
Teks kotak galat `#8A1F1F`

Ketentuan visual tambahan:

- Tidak menggunakan gradien.
- Tidak menggunakan bayangan.
- Tidak menggunakan emoji atau ilustrasi.
- Tidak menambahkan dekorasi atau komponen baru.
- Border input memiliki ketebalan `1.5px`.
- Sudut input dan tombol: `10px` desktop, `12px` tablet dan mobile.
- Sudut kotak galat: `10px`.
- Fokus keyboard pada input, tombol, dan tautan:
  `outline: 3px solid #5EEAD4` dengan `outline-offset: 2px`.

### Logo Catetin

Gunakan logo yang sama pada seluruh ukuran layar.

- Ikon SVG berukuran `32 × 32px`.
- Persegi membulat: `x=2`, `y=2`, lebar `28`, `rx=8`.
- Tanpa isi, garis `#5EEAD4`, ketebalan `2.5px`.
- Tanda centang menggunakan path `M10 16.5l4 4 8-9`.
- Garis centang `2.5px`, ujung garis membulat.
- Teks `Catetin` berada di sebelah kanan ikon.
- Font teks logo: Space Grotesk, bobot 700, ukuran `22px`.
- Jarak ikon dan teks `12px`.

### Konten teks

Gunakan teks berikut persis, termasuk kapitalisasi dan tanda baca.

**Headline:**

> Kelola tanpa Drama, tanpa Masalah.

**Paragraf desktop dan tablet:**

> Gunakan dimana saja, kapan saja, tanpa drama dan lebih mudah. Dengan
> catetin, Maksimalkan bisnis anda tanpa batas.

**Paragraf mobile:**

> Gunakan dimana saja, kapan saja. Maksimalkan bisnis anda tanpa batas.

**Footer:**

> © 2026 CATETIN

**Konten formulir:**

- Judul: `Masuk`
- Subjudul: `Masukkan username dan password Anda.`
- Label username: `Username`
- Placeholder username: `contoh: budi.santoso`
- Label password: `Password`
- Placeholder password: `Masukkan password`
- Checkbox: `Ingat saya`
- Tautan: `Lupa password?`
- Tombol: `Masuk`

Jangan menambahkan tautan `Daftar`, `Belum punya akun`, atau elemen lain
yang tidak tercantum.

## Spesifikasi layout responsif

### Desktop --- referensi 1280 × 800

Layout bersifat fluid dan menggunakan baris flex dengan wrap.

- Tinggi minimum halaman: `800px` atau minimal setinggi viewport.
- Latar halaman: `#F7F6F2`.
- Panel kiri:
  - `flex: 1 1 420px`.
  - Padding `56px`.
  - Latar `#0E1B1A`.
  - Kolom flex dengan `justify-content: space-between`.
  - Gap `48px`.
  - Berisi logo di atas, headline dan paragraf di tengah, footer di
    bawah.
- Blok headline dan paragraf:
  - Lebar maksimum `440px`.
  - Layout kolom.
  - Gap `20px`.
- Headline:
  - Space Grotesk 700.
  - Ukuran `44px`.
  - Line-height `1.1`.
  - Letter-spacing `-0.02em`.
- Paragraf:
  - Ukuran `17px`.
  - Line-height `1.6`.
- Footer:
  - Ukuran `13px`.
- Area formulir kanan:
  - `flex: 1.2 1 460px`.
  - Padding `48px 24px`.
  - Form berada di tengah secara horizontal dan vertikal.
  - Latar `#F7F6F2`.
- Formulir:
  - Lebar `100%`.
  - Lebar maksimum `400px`.
  - Layout kolom dengan gap `24px`.
- Judul formulir:
  - Space Grotesk 700.
  - Ukuran `32px`.
  - Letter-spacing `-0.02em`.
- Subjudul: `15px`.
- Input:
  - Tinggi `48px`.
  - Padding horizontal `14px`.
  - Ukuran font `16px`.
- Tombol:
  - Tinggi `50px`.
  - Ukuran font `16px`, bobot 600.
  - Teks putih.

Pada viewport yang lebih sempit, biarkan panel dan area formulir
menumpuk melalui perilaku `flex-wrap`. Jangan membuat layout desktop
meluber secara horizontal.

### Tablet --- referensi 820 × 1180

Layout tablet menggunakan ukuran tetap sesuai referensi.

- Halaman menggunakan layout kolom.
- Latar utama `#0E1B1A`.
- `overflow: hidden`.
- Bagian atas:
  - Padding `64px 72px 96px`.
  - Gap `48px`.
  - Berisi logo dan blok headline/paragraf.
- Headline:
  - Ukuran `48px`.
  - Line-height `1.1`.
- Paragraf:
  - Ukuran `18px`.
  - Lebar maksimum `560px`.
  - Line-height `1.6`.
- Blok headline/paragraf memiliki gap `16px`.
- Bagian bawah:
  - Latar `#F7F6F2`.
  - Margin atas `-32px`.
  - Sudut atas `36px`.
  - Padding `56px 72px 32px`.
  - Menggunakan layout kolom.
  - Isi rata tengah dengan `justify-content: space-between`.
  - Gap `32px`.
- Formulir memiliki lebar maksimum `440px`.
- Footer berada di bagian bawah kartu terang:
  - Ukuran `13px`.
  - Warna `#4B5563`.
- Judul formulir `30px`.
- Input tinggi `52px`.
- Tombol tinggi `54px`.

### Mobile --- referensi 390 × 844

Layout mobile menggunakan ukuran tetap sesuai referensi.

- Halaman menggunakan layout kolom.
- Latar utama `#0E1B1A`.
- `overflow: hidden`.
- Bagian atas:
  - Padding `40px 24px 56px`.
  - Gap `28px`.
  - Berisi logo dan blok headline/paragraf.
- Headline:
  - Ukuran `30px`.
  - Line-height `1.15`.
- Paragraf:
  - Menggunakan versi ringkas khusus mobile.
  - Ukuran `15px`.
  - Line-height `1.55`.
- Blok headline/paragraf memiliki gap `12px`.
- Bagian formulir:
  - Mengisi sisa tinggi layar.
  - Margin atas `-24px`.
  - Sudut atas `28px`.
  - Padding `32px 24px`.
  - Latar `#F7F6F2`.
  - Formulir rata tengah.
  - Lebar maksimum `440px`.
- Tidak menampilkan footer.
- Judul formulir `30px`.
- Input tinggi `52px`.
- Tombol tinggi `54px`.

## Spesifikasi komponen formulir

Urutan komponen harus dipertahankan.

1.  Judul dan subjudul dengan jarak `8px`.
2.  Kotak galat, hanya tampil ketika terdapat pesan galat:
    - `role="alert"`.
    - Padding `12px 14px`.
    - Ukuran font `14px`.
    - Line-height `1.4`.
3.  Field username:
    - Label berada di atas input.
    - Ukuran label `14px`, bobot 600.
    - Jarak label dan input `8px`.
4.  Field password:
    - Label berada di atas input.
    - Input memiliki padding kanan `52–56px`.
    - Tombol ikon mata berada di dalam area input.
    - Tombol ikon berukuran `44 × 44px`.
    - Posisi absolut di kanan dan atas, berjarak `2–4px` dari tepi.
    - Latar transparan, tanpa border.
    - Ikon SVG `22 × 22px`, garis `1.8px`, ujung membulat.
    - Password tersembunyi menggunakan ikon mata dicoret.
    - Password terlihat menggunakan ikon mata terbuka.
5.  Baris pilihan:
    - Flex dengan wrap.
    - `justify-content: space-between`.
    - Rata tengah vertikal.
    - Checkbox `18 × 18px`, `accent-color: #0F766E`.
    - Label checkbox `14px`.
    - Tautan `14px`, bobot 500.
    - Tinggi minimum area sentuh masing-masing item `44px`.
6.  Tombol submit:
    - Lebar penuh.
    - Latar `#0F766E`.
    - Teks putih.
    - Tinggi mengikuti breakpoint.

## Perilaku JavaScript

Implementasikan perilaku berikut menggunakan Vanilla JavaScript:

### Toggle password

- Tombol mata mengganti tipe input antara `password` dan `text`.
- Tombol menggunakan `aria-pressed`.
- Saat password tersembunyi:
  - `aria-pressed="false"`.
  - `aria-label="Tampilkan password"`.
  - Ikon mata dicoret.
- Saat password terlihat:
  - `aria-pressed="true"`.
  - `aria-label="Sembunyikan password"`.
  - Ikon mata terbuka.

### Pesan galat dan submit

Spesifikasi perilaku tampilan frontend:

- Form menggunakan `novalidate`.
- Saat submit, cegah perilaku submit default hanya jika proses
  tersebut memang diperlukan untuk validasi frontend.
- Jika username setelah `trim()` kosong atau password kosong,
  tampilkan:

> Username dan password wajib diisi.

- Jika kedua field terisi, untuk simulasi frontend tampilkan:

> Username atau password salah. Silakan coba lagi.

- Pesan galat hilang ketika pengguna mulai mengetik pada salah satu
  field.

**Penting untuk integrasi aplikasi:** perilaku simulasi di atas adalah
acuan tampilan mockup, bukan pengganti autentikasi backend. Pada
implementasi project sebenarnya:

- Form harus tetap mengirim kredensial ke `POST /login`.
- Controller PHP tetap melakukan verifikasi kredensial.
- Pesan galat autentikasi yang berasal dari server ditampilkan di
  kotak galat yang sama.
- Jangan selalu menampilkan pesan salah ketika username dan password
  terisi, karena hal itu akan menghalangi login yang valid.
- Jangan menghapus atau melewati CSRF, session, middleware,
  `password_verify()`, atau mekanisme keamanan yang sudah ada.
- Jika validasi frontend dilakukan dengan JavaScript, jangan
  menghalangi pengiriman form yang valid ke backend.

### Atribut autocomplete

- Username: `autocomplete="username"`.
- Password: `autocomplete="current-password"`.

## Aksesibilitas

- Gunakan elemen HTML asli dan semantik.
- Gunakan `<label for="...">` yang terhubung dengan input terkait.
- Gunakan `<input>`, `<button>`, dan `<a href>` untuk fungsi
  masing-masing.
- Jangan menggunakan `div` atau `span` sebagai tombol.
- Ikon dekoratif menggunakan `aria-hidden="true"`.
- Tombol ikon mata wajib memiliki `aria-label`.
- Area sentuh minimal `44px`.
- Pertahankan fokus keyboard yang terlihat.
- Pastikan kontras teks minimal `4.5:1`.
- Pastikan seluruh kontrol dapat digunakan dengan keyboard.

## Ketentuan implementasi

1.  Pisahkan HTML/PHP View, CSS, dan JavaScript sesuai struktur project.
    Jangan menumpuk seluruh kode dalam satu file jika arsitektur
    aplikasi sudah memisahkan asset.
2.  Gunakan class yang jelas dan konsisten. Hindari selector global yang
    dapat merusak halaman internal.
3.  Scope styling halaman login menggunakan class pembungkus khusus,
    misalnya `.login-page`.
4.  Jangan mengubah layout halaman internal aplikasi.
5.  Jangan mengubah skema database atau logika autentikasi kecuali
    memang diperlukan untuk menghubungkan form dengan sistem yang sudah
    ada.
6.  Jangan membuat data dummy, akun default, atau kredensial hardcoded.
7.  Jangan menambahkan fitur baru di luar cakupan desain.
8.  Jangan menghapus file atau asset sebelum memastikan tidak digunakan
    oleh halaman lain.
9.  Jangan mengubah konfigurasi Docker, Nginx, database, atau routing
    yang tidak berkaitan dengan kebutuhan ini.
10. Pastikan halaman tetap berfungsi pada ukuran layar di antara
    breakpoint, bukan hanya tepat pada ukuran screenshot.

## Kriteria penerimaan

Implementasi dianggap selesai apabila:

- [ ] Tampilan desktop sesuai referensi `Halaman Login.png`.
- [ ] Tampilan tablet sesuai referensi `Login Tablet.png`.
- [ ] Tampilan mobile sesuai referensi `Login Mobile.png`.
- [ ] Logo, warna, font, ukuran, jarak, dan teks mengikuti
      spesifikasi.
- [ ] Paragraf mobile menggunakan versi ringkas.
- [ ] Footer hanya tampil pada desktop dan tablet.
- [ ] Tidak ada tautan daftar atau elemen tambahan.
- [ ] Input username dan password memiliki label dan autocomplete yang
      benar.
- [ ] Tombol mata berfungsi dan atribut ARIA berubah sesuai kondisi.
- [ ] Kotak galat tampil dengan benar dan hilang saat pengguna
      mengetik.
- [ ] Form terhubung ke route backend `POST /login`.
- [ ] Login valid tetap dapat berhasil melalui mekanisme autentikasi
      PHP yang sudah ada.
- [ ] CSRF dan keamanan session tetap berfungsi.
- [ ] Redirect setelah login tetap menuju `/dashboard`.
- [ ] Halaman login responsif dan tidak mengalami overflow horizontal.
- [ ] Halaman internal dan fitur lain tidak mengalami regresi.

## Pengujian dan laporan akhir

Setelah implementasi:

1.  Uji halaman pada viewport desktop `1280 × 800`.
2.  Uji halaman pada viewport tablet `820 × 1180`.
3.  Uji halaman pada viewport mobile `390 × 844`.
4.  Uji juga ukuran di antara breakpoint untuk memastikan layout fluid.
5.  Uji toggle password, checkbox, pesan galat, dan fokus keyboard.
6.  Uji login dengan kredensial valid dan tidak valid melalui backend
    yang sudah ada.
7.  Pastikan halaman internal tetap terlindungi dan redirect autentikasi
    tidak berubah.
8.  Jalankan pemeriksaan atau test yang tersedia di project.

Dalam laporan akhir, jelaskan:

- File yang dibuat atau diubah.
- Ringkasan implementasi.
- Perilaku yang sudah diuji.
- Hasil pengujian yang benar-benar dijalankan.
- Kendala atau bagian yang belum dapat diselesaikan.

Jangan menyatakan pengujian berhasil jika belum benar-benar dijalankan.
Jangan melakukan perubahan tambahan di luar cakupan tanpa persetujuan.
