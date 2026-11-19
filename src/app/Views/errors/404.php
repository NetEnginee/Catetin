<?php
/**
 * 404 Not Found Error View - Clean structure ready for final UI/UX design
 * @var string|null $title
 * @var string|null $message
 */
use function App\Core\e;
?>
<div id="error-404">
    <h1>404</h1>
    <h2><?= e($title ?? 'Halaman Tidak Ditemukan') ?></h2>
    <p><?= e($message ?? 'Rute atau halaman yang Anda cari tidak tersedia.') ?></p>
    <a href="/">Kembali ke Halaman Utama</a>
</div>
