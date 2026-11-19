<?php
/**
 * 403 Forbidden Error View - Clean structure ready for final UI/UX design
 * @var string|null $title
 * @var string|null $message
 */
use function App\Core\e;
?>
<div id="error-403">
    <h1>403</h1>
    <h2><?= e($title ?? 'Akses Ditolak') ?></h2>
    <p><?= e($message ?? 'Anda tidak memiliki hak akses untuk mengakses sumber daya ini.') ?></p>
    <a href="/">Kembali ke Halaman Utama</a>
</div>
