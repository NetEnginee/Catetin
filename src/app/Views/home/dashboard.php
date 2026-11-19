<?php
/** @var array{id: int, username: string, name: string, role: string} $user */
use function App\Core\e;
?>
<div class="card dashboard-placeholder">
    <div class="card-header">
        <h1 class="card-title">Fondasi Aplikasi MVC</h1>
    </div>
    <div class="card-body">
        <p class="welcome-text">
            Selamat datang, <strong><?= e($user['name'] ?? $user['username'] ?? 'Pengguna') ?></strong>.
        </p>
        <p class="desc-text">
            Sistem autentikasi dan routing aplikasi berhasil diverifikasi. Akun Anda teridentifikasi dengan peran:
            <span class="role-tag"><?= e(strtoupper($user['role'] ?? 'OPERATOR')) ?></span>.
        </p>
        <div class="status-box">
            <p><strong>Status Sistem:</strong> Sesi aktif, middleware berjalan normal.</p>
        </div>
    </div>
</div>
