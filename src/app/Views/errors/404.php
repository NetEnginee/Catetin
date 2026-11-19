<?php
/** @var string|null $title */
/** @var string|null $message */
use function App\Core\e;
?>
<div class="auth-card error-card">
    <div class="auth-header">
        <h1 class="error-code">404</h1>
        <h2 class="auth-title"><?= e($title ?? 'Halaman Tidak Ditemukan') ?></h2>
        <p class="auth-subtitle"><?= e($message ?? 'Rute atau halaman yang Anda cari tidak tersedia.') ?></p>
    </div>
    <div class="error-action">
        <a href="/" class="btn btn-secondary">Kembali ke Halaman Utama</a>
    </div>
</div>
