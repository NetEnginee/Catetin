<?php
/**
 * 500 Server Error View - Clean structure ready for final UI/UX design
 * @var string|null $title
 * @var string|null $message
 */
use function App\Core\e;
?>
<div id="error-500">
    <h1>500</h1>
    <h2><?= e($title ?? 'Kesalahan Server') ?></h2>
    <p><?= e($message ?? 'Terjadi kesalahan sistem internal. Silakan coba kembali nanti.') ?></p>
    <a href="/">Kembali ke Halaman Utama</a>
</div>
