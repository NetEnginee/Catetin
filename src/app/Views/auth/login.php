<?php
/**
 * Login View - Clean structure ready for final UI/UX design
 * @var string|null $error
 */
use function App\Core\e;
use function App\Core\csrf_field;
use function App\Core\old;
?>
<div id="login-container">
    <?php if (!empty($error)): ?>
        <div role="alert" class="error-alert">
            <?= e($error) ?>
        </div>
    <?php endif; ?>

    <form action="/login" method="POST" autocomplete="off">
        <?= csrf_field() ?>

        <div>
            <label for="username">Nama Pengguna</label>
            <input 
                type="text" 
                id="username" 
                name="username" 
                value="<?= e(old('username')) ?>" 
                required 
                autofocus
            >
        </div>

        <div>
            <label for="password">Kata Sandi</label>
            <input 
                type="password" 
                id="password" 
                name="password" 
                required
            >
        </div>

        <button type="submit">Masuk</button>
    </form>
</div>
