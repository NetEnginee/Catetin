<?php
/** @var string $title */
/** @var string $content */
use App\Core\Auth;
use function App\Core\e;
use function App\Core\csrf_field;

$currentUser = Auth::user();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title ?? 'Catetin') ?></title>
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body class="app-body">
    <header class="app-header">
        <div class="header-container">
            <div class="brand">
                <span class="brand-title">Catetin</span>
            </div>
            <div class="user-menu">
                <span class="user-info">
                    <?= e($currentUser['name'] ?? 'Pengguna') ?>
                    <span class="role-badge"><?= e(strtoupper($currentUser['role'] ?? 'OPERATOR')) ?></span>
                </span>
                <form action="/logout" method="POST" class="logout-form">
                    <?= csrf_field() ?>
                    <button type="submit" class="btn-logout">Keluar</button>
                </form>
            </div>
        </div>
    </header>

    <main class="app-main">
        <div class="main-container">
            <?= $content ?>
        </div>
    </main>
</body>
</html>
