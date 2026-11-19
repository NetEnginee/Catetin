<?php
/**
 * Application Layout
 * @var string $title
 * @var string $content
 */
use App\Core\Auth;
use function App\Core\e;
use function App\Core\csrf_field;

$currentUser = Auth::user();
$navigation = [
    ['label' => 'Dashboard', 'href' => '/dashboard', 'icon' => 'dashboard'],
    ['label' => 'Transaksi', 'href' => '/transactions', 'icon' => 'transactions'],
    ['label' => 'Produk & Produksi', 'href' => '/products', 'icon' => 'products'],
    ['label' => 'Titip Jual', 'href' => '/consignment', 'icon' => 'consignment'],
    ['label' => 'Laporan', 'href' => '/reports', 'icon' => 'reports'],
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0E1B1A">
    <title><?= e($title ?? 'Dashboard — Catetin') ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body>
    <div class="app-shell">
        <header class="app-header">
            <div class="app-header-inner">
                <a class="brand-logo" href="/dashboard" aria-label="Catetin, Dashboard">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <rect x="2" y="2" width="28" height="28" rx="8"></rect>
                        <path d="M10 16.5l4 4 8-9"></path>
                    </svg>
                    <span>Catetin</span>
                </a>
                <nav class="primary-navigation" aria-label="Navigasi utama">
                    <?php foreach ($navigation as $item): ?>
                        <a
                            class="navigation-link<?= $item['icon'] === 'dashboard' ? ' is-active' : '' ?>"
                            href="<?= e($item['href']) ?>"
                            <?= $item['icon'] === 'dashboard' ? 'aria-current="page"' : '' ?>>
                            <?= e($item['label']) ?>
                        </a>
                    <?php endforeach; ?>
                </nav>
                <div class="account-control">
                    <button
                        class="account-button"
                        id="accountButton"
                        type="button"
                        aria-label="Akun saya"
                        aria-expanded="false"
                        aria-controls="accountMenu">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="8" r="3.5"></circle>
                            <path d="M5 20c.7-3.5 3.2-5.5 7-5.5s6.3 2 7 5.5"></path>
                        </svg>
                    </button>
                    <div class="account-menu" id="accountMenu" hidden>
                        <?php if ($currentUser): ?>
                            <p><?= e($currentUser['name']) ?></p>
                        <?php endif; ?>
                        <form action="/logout" method="POST">
                            <?= csrf_field() ?>
                            <button type="submit">Keluar</button>
                        </form>
                    </div>
                </div>
            </div>
        </header>

        <main class="app-main" id="app-main">
            <?= $content ?>
        </main>

        <nav class="mobile-tab-bar" aria-label="Navigasi utama">
            <?php foreach ($navigation as $item): ?>
                <a
                    class="mobile-tab<?= $item['icon'] === 'dashboard' ? ' is-active' : '' ?>"
                    href="<?= e($item['href']) ?>"
                    <?= $item['icon'] === 'dashboard' ? 'aria-current="page"' : '' ?>
                    <?= $item['icon'] === 'products' ? 'aria-label="Produk & Produksi"' : '' ?>>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <?php if ($item['icon'] === 'dashboard'): ?>
                            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                        <?php elseif ($item['icon'] === 'transactions'): ?>
                            <path d="M6 3h12v18l-2.5-1.6L12 21l-3.5-1.6L6 21z"></path>
                            <path d="M9 8h6M9 12h6M9 16h4"></path>
                        <?php elseif ($item['icon'] === 'products'): ?>
                            <path d="m12 3 9 5-9 5-9-5 9-5Z"></path>
                            <path d="M3 8v9l9 5 9-5V8M12 13v9"></path>
                        <?php elseif ($item['icon'] === 'consignment'): ?>
                            <path d="M3 7h18v13H3zM7 7V4h10v3"></path>
                            <path d="M8 12h8M8 16h5"></path>
                        <?php else: ?>
                            <path d="M4 20V12h4v8zM10 20V4h4v16zM16 20V8h4v12z"></path>
                        <?php endif; ?>
                    </svg>
                    <span><?= $item['icon'] === 'products' ? 'Produk' : e($item['label']) ?></span>
                </a>
            <?php endforeach; ?>
        </nav>
    </div>
    <script src="/assets/js/dashboard.js" defer></script>
</body>
</html>
