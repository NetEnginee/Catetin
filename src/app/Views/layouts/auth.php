<?php
/**
 * Auth Layout - Clean structure ready for final UI/UX design
 * @var string $title
 * @var string $content
 */
use function App\Core\e;
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title ?? 'Catetin') ?></title>
    <link rel="stylesheet" href="/assets/css/auth.css">
</head>
<body>
    <main id="auth-main">
        <?= $content ?>
    </main>
</body>
</html>
