<?php
/** @var string|null $error */
use function App\Core\e;
use function App\Core\csrf_field;
use function App\Core\old;
?>
<div class="auth-card">
    <div class="auth-header">
        <h1 class="auth-title">Catetin</h1>
        <p class="auth-subtitle">Manajemen Keuangan Bisnis Rumahan</p>
    </div>

    <?php if (!empty($error)): ?>
        <div class="alert alert-danger" role="alert">
            <?= e($error) ?>
        </div>
    <?php endif; ?>

    <form action="/login" method="POST" class="auth-form" autocomplete="off">
        <?= csrf_field() ?>

        <div class="form-group">
            <label for="username" class="form-label">Nama Pengguna</label>
            <input 
                type="text" 
                id="username" 
                name="username" 
                class="form-control" 
                value="<?= e(old('username')) ?>" 
                required 
                autofocus
            >
        </div>

        <div class="form-group">
            <label for="password" class="form-label">Kata Sandi</label>
            <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-control" 
                required
            >
        </div>

        <button type="submit" class="btn btn-primary">Masuk</button>
    </form>
</div>
