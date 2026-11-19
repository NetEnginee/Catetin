<?php

declare(strict_types=1);

/**
 * Catetin - Single Front Controller Entry Point
 */

// 1. Register manual autoloader (No Composer)
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/app/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// 2. Load core global helpers
require_once __DIR__ . '/../src/app/Core/Helpers.php';

use App\Core\App;

// 3. Bootstrap application lifecycle
$app = new App();
$app->bootstrap(dirname(__DIR__));

// 4. Run application and handle HTTP request
$app->run();
