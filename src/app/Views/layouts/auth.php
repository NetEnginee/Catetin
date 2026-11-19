<?php
/**
 * Auth Layout - Catetin
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
  <meta name="theme-color" content="#0E1B1A">
  <title><?= e($title ?? 'Masuk — Catetin') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/auth.css">
</head>
<body>
  <?= $content ?>
  <script src="/assets/js/login.js" defer></script>
</body>
</html>
