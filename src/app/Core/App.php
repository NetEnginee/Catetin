<?php

declare(strict_types=1);

namespace App\Core;

use App\Controllers\ApiController;
use App\Controllers\AuthController;
use App\Controllers\HomeController;
use App\Controllers\TransactionsController;
use Throwable;

/**
 * Application Bootstrap and Lifecycle Manager.
 */
class App
{
    private Router $router;

    public function __construct()
    {
        $this->router = new Router();
    }

    /**
     * Bootstrap environment, error handling, session, and routes.
     */
    public function bootstrap(string $rootDir): void
    {
        // 1. Load environment variables
        self::loadEnv($rootDir . '/.env');

        // 2. Set timezone
        $timezone = (string)env('APP_TIMEZONE', 'Asia/Jakarta');
        date_default_timezone_set($timezone);

        // 3. Configure error handling
        $this->setupErrorHandling();

        // 4. Start secure session
        Session::start();

        // 5. Register application routes
        $this->registerRoutes();
    }

    /**
     * Run the application and dispatch request.
     */
    public function run(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        $this->router->dispatch($method, $uri);
    }

    /**
     * Get the router instance.
     */
    public function getRouter(): Router
    {
        return $this->router;
    }

    /**
     * Parse and load .env file into $_ENV and putenv.
     */
    public static function loadEnv(string $envFile): void
    {
        if (!file_exists($envFile)) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);

            // Skip empty lines or comments
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_contains($line, '=')) {
                [$name, $value] = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);

                // Strip quotes if present
                if (
                    (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))
                ) {
                    $value = substr($value, 1, -1);
                }

                if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }

    /**
     * Configure PHP error reporting and exception handling.
     */
    private function setupErrorHandling(): void
    {
        $debug = (bool)env('APP_DEBUG', false);

        if ($debug) {
            error_reporting(E_ALL);
            ini_set('display_errors', '1');
            ini_set('display_startup_errors', '1');
        } else {
            error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
            ini_set('display_errors', '0');
            ini_set('display_startup_errors', '0');
        }

        // Set global exception handler
        set_exception_handler(function (Throwable $e) use ($debug): void {
            error_log((string)$e);

            http_response_code(500);

            if ($debug) {
                echo "<h1>500 Internal Server Error</h1>";
                echo "<p><strong>Pesan:</strong> " . e($e->getMessage()) . "</p>";
                echo "<p><strong>File:</strong> " . e($e->getFile()) . " (Baris " . $e->getLine() . ")</p>";
                echo "<pre>" . e($e->getTraceAsString()) . "</pre>";
            } else {
                View::render('errors/500', [
                    'title'   => '500 Kesalahan Server Internal',
                    'message' => 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.',
                ], 'auth');
            }
            exit;
        });
    }

    /**
     * Register core application routes.
     */
    private function registerRoutes(): void
    {
        // Root route: redirect based on auth status
        $this->router->get('/', [HomeController::class, 'index']);

        // Authentication routes
        $this->router->get('/login', [AuthController::class, 'showLogin'], ['guest']);
        $this->router->post('/login', [AuthController::class, 'login'], ['guest']);
        $this->router->post('/logout', [AuthController::class, 'logout'], ['auth']);

        // Authenticated dashboard placeholder
        $this->router->get('/dashboard', [HomeController::class, 'dashboard'], ['auth']);
        $this->router->get('/transactions', [TransactionsController::class, 'index'], ['auth']);

        // Database-backed JSON API
        $this->router->get('/api/transactions', [ApiController::class, 'transactions'], ['auth']);
        $this->router->get('/api/dashboard', [ApiController::class, 'dashboard'], ['auth']);
        $this->router->post('/api/transactions', [ApiController::class, 'createTransaction'], ['auth']);
        $this->router->post('/api/transactions/update-date', [ApiController::class, 'updateTransactionDate'], ['auth']);
        $this->router->post('/api/transactions/delete', [ApiController::class, 'deleteTransaction'], ['auth']);
        $this->router->post('/api/categories', [ApiController::class, 'createCategory'], ['auth']);
        $this->router->post('/api/categories/delete', [ApiController::class, 'deleteCategory'], ['auth']);
    }
}
