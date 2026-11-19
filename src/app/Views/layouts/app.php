<?php
/**
 * Application Layout - Clean structure ready for final UI/UX design
 * @var string $title
 * @var string $content
 */
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
<body>
    <div id="app">
        <!-- Structural navigation/logout action placeholder -->
        <nav id="app-nav">
            <form action="/logout" method="POST">
                <?= csrf_field() ?>
                <button type="submit">Keluar</button>
            </form>
        </nav>

        <main id="app-main">
            <?= $content ?>
        </main>
    </div>
</body>
</html>
