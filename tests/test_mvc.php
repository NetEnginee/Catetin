<?php

declare(strict_types=1);

/**
 * Catetin MVC Automated Test Suite
 * Tests all core components: Autoloader, Router, Session, Auth, Middleware, Views, and Helpers.
 */

// Register manual autoloader
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

require_once __DIR__ . '/../src/app/Core/Helpers.php';

use App\Core\App;
use App\Core\Auth;
use App\Core\Middleware;
use App\Core\Router;
use App\Core\Session;
use App\Core\View;
use App\Models\User;
use function App\Core\csrf_field;
use function App\Core\csrf_token;
use function App\Core\e;
use function App\Core\env;
use function App\Core\url;

// Start session before sending any output
Session::start();

$passed = 0;
$failed = 0;

function assertTest(string $description, bool $condition, string $failureDetails = ''): void
{
    global $passed, $failed;
    if ($condition) {
        echo "  [PASS] {$description}\n";
        $passed++;
    } else {
        echo "  [FAIL] {$description} - {$failureDetails}\n";
        $failed++;
    }
}

echo "=====================================================\n";
echo " Running Catetin PHP Native MVC Test Suite\n";
echo "=====================================================\n\n";

// --- 1. TEST ENVIRONMENT LOADER & HELPERS ---
echo "1. Testing Helpers and Environment Loader:\n";
App::loadEnv(__DIR__ . '/../.env');

assertTest("env() reads APP_ENV", env('APP_ENV') === 'development', "Got " . var_export(env('APP_ENV'), true));
assertTest("env() boolean casting", env('APP_DEBUG') === true, "Got " . var_export(env('APP_DEBUG'), true));
assertTest("env() default value fallback", env('NON_EXISTENT_KEY', 'default_val') === 'default_val');
assertTest("e() escapes XSS characters", e('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
assertTest("url() normalizes paths", url('login') === '/login' && url('/dashboard') === '/dashboard');

// --- 2. TEST SESSION & CSRF ---
echo "\n2. Testing Session Security and CSRF Tokens:\n";
Session::start();

assertTest("Session started and active", session_status() === PHP_SESSION_ACTIVE);
assertTest("ini session.use_only_cookies is enabled", ini_get('session.use_only_cookies') === '1');
assertTest("ini session.use_strict_mode is enabled", ini_get('session.use_strict_mode') === '1');

$token = csrf_token();
assertTest("CSRF token is generated (64 hex chars)", strlen($token) === 64);
assertTest("csrf_field() renders hidden input", str_contains(csrf_field(), 'name="_csrf_token"') && str_contains(csrf_field(), $token));
assertTest("validateCsrfToken succeeds with valid token", Session::validateCsrfToken($token));
assertTest("validateCsrfToken fails with invalid token", !Session::validateCsrfToken('invalid_token_123'));
assertTest("validateCsrfToken fails with null/empty token", !Session::validateCsrfToken(''));

// Flash message testing
Session::setFlash('test_flash', 'Success message');
// Flash data is available in the subsequent request cycle
assertTest("Flash message saved", isset($_SESSION['_flash']['new']['test_flash']));

// --- 3. TEST AUTHENTICATION & SECURITY ---
echo "\n3. Testing Auth Service and Password Security:\n";

// Create a mock User repository
class MockUser extends User
{
    private array $users = [];

    public function __construct()
    {
        // Don't call parent PDO constructor for test isolation
        $this->users = [
            'admin_user' => [
                'id'            => 1,
                'username'      => 'admin_user',
                'password_hash' => password_hash('AdminPass123!', PASSWORD_DEFAULT),
                'name'          => 'Super Administrator',
                'role'          => 'admin',
                'is_active'     => 1,
            ],
            'operator_user' => [
                'id'            => 2,
                'username'      => 'operator_user',
                'password_hash' => password_hash('OperatorPass123!', PASSWORD_DEFAULT),
                'name'          => 'Staff Operator',
                'role'          => 'operator',
                'is_active'     => 1,
            ],
            'inactive_user' => [
                'id'            => 3,
                'username'      => 'inactive_user',
                'password_hash' => password_hash('InactivePass123!', PASSWORD_DEFAULT),
                'name'          => 'Inactive User',
                'role'          => 'operator',
                'is_active'     => 0, // Inactive!
            ],
        ];
    }

    public function findByUsername(string $username): ?array
    {
        return $this->users[$username] ?? null;
    }

    public function findById(int $id): ?array
    {
        foreach ($this->users as $u) {
            if ($u['id'] === $id) {
                return $u;
            }
        }
        return null;
    }
}

$mockUser = new MockUser();

// Test failed attempts
assertTest("Auth fails with wrong password", !Auth::attempt('admin_user', 'WrongPass!', $mockUser));
assertTest("Auth fails with non-existent user", !Auth::attempt('unknown_user', 'SomePass!', $mockUser));
assertTest("Auth fails with inactive user", !Auth::attempt('inactive_user', 'InactivePass123!', $mockUser));
assertTest("Auth::check() is false before login", !Auth::check());

// Test successful attempt (admin)
$loginSuccess = Auth::attempt('admin_user', 'AdminPass123!', $mockUser);
assertTest("Auth::attempt succeeds with correct credentials", $loginSuccess);
assertTest("Auth::check() is true after login", Auth::check());
assertTest("Auth::user() returns user identity", Auth::user()['username'] === 'admin_user');
assertTest("Auth::role() returns 'admin'", Auth::role() === 'admin');
assertTest("Auth::hasRole('admin') returns true", Auth::hasRole('admin'));
assertTest("Auth::hasRole('operator') returns false for admin", !Auth::hasRole('operator'));
assertTest("Password or hash NEVER stored in session", !isset($_SESSION['auth_user']['password']) && !isset($_SESSION['auth_user']['password_hash']));

// Test operator role
Auth::attempt('operator_user', 'OperatorPass123!', $mockUser);
assertTest("Operator Auth::role() returns 'operator'", Auth::role() === 'operator');
assertTest("Operator Auth::hasRole('operator') is true", Auth::hasRole('operator'));
assertTest("Operator Auth::hasRole('admin') is false", !Auth::hasRole('admin'));

// Test logout
Auth::logout();
assertTest("Auth::check() is false after logout", !Auth::check());
assertTest("Auth::user() is null after logout", Auth::user() === null);

// --- 4. TEST MIDDLEWARE PERMISSIONS ---
echo "\n4. Testing Middleware Checks (Guest, Auth, Role):\n";

// When guest (not logged in):
assertTest("Middleware: guest check allowed for unauthenticated", Middleware::checkAccess('guest'));
assertTest("Middleware: auth check blocked for unauthenticated", !Middleware::checkAccess('auth'));
assertTest("Middleware: role:admin blocked for unauthenticated", !Middleware::checkAccess('role:admin'));

// When logged in as operator:
Auth::attempt('operator_user', 'OperatorPass123!', $mockUser);
assertTest("Middleware: guest check blocked for logged in user", !Middleware::checkAccess('guest'));
assertTest("Middleware: auth check allowed for operator", Middleware::checkAccess('auth'));
assertTest("Middleware: role:operator allowed for operator", Middleware::checkAccess('role:operator'));
assertTest("Middleware: role:admin BLOCKED for operator", !Middleware::checkAccess('role:admin'));

// When logged in as admin:
Auth::attempt('admin_user', 'AdminPass123!', $mockUser);
assertTest("Middleware: role:admin allowed for admin", Middleware::checkAccess('role:admin'));
assertTest("Middleware: multi-role allowed for admin", Middleware::checkAccess('role:admin,operator'));

Auth::logout();

// --- 5. TEST ROUTER & PRETTY URLS ---
echo "\n5. Testing Router & Dispatching:\n";

$router = new Router();
$routeLog = [];

$router->get('/', function () use (&$routeLog) {
    $routeLog[] = 'GET /';
});
$router->get('/login', function () use (&$routeLog) {
    $routeLog[] = 'GET /login';
});
$router->post('/login', function () use (&$routeLog) {
    $routeLog[] = 'POST /login';
});
$router->post('/logout', function () use (&$routeLog) {
    $routeLog[] = 'POST /logout';
});
$router->get('/dashboard', function () use (&$routeLog) {
    $routeLog[] = 'GET /dashboard';
});

// Test GET /
$routeLog = [];
$router->dispatch('GET', '/');
assertTest("Router dispatches GET /", $routeLog === ['GET /']);

// Test GET /login with trailing slash normalization
$routeLog = [];
$router->dispatch('GET', '/login/');
assertTest("Router normalizes trailing slash on /login/", $routeLog === ['GET /login']);

// Test POST /login
$routeLog = [];
$router->dispatch('POST', '/login');
assertTest("Router dispatches POST /login", $routeLog === ['POST /login']);

// Test POST /logout
$routeLog = [];
$router->dispatch('POST', '/logout');
assertTest("Router dispatches POST /logout", $routeLog === ['POST /logout']);

// Test GET /dashboard
$routeLog = [];
$router->dispatch('GET', '/dashboard');
assertTest("Router dispatches GET /dashboard", $routeLog === ['GET /dashboard']);

// --- 6. TEST VIEW RENDERING & OUTPUT ESCAPING ---
echo "\n6. Testing View & Layout Rendering (Catetin Login UI):\n";

ob_start();
View::render('auth/login', [
    'title' => 'Masuk — Catetin',
    'error' => 'Test Error Message <unsafe>',
], 'auth');
$output = ob_get_clean();

assertTest("View renders with auth layout and fonts", str_contains($output, '<!DOCTYPE html>') && str_contains($output, 'Space+Grotesk'));
assertTest("View renders page title", str_contains($output, '<title>Masuk — Catetin</title>'));
assertTest("View renders SVG logo", str_contains($output, 'aria-label="Catetin"') && str_contains($output, '<svg viewBox="0 0 32 32"'));
assertTest("View renders headline text", str_contains($output, 'Kelola tanpa Drama, tanpa Masalah.'));
assertTest("View renders desktop and mobile paragraphs", str_contains($output, 'desktop-tablet-copy') && str_contains($output, 'mobile-copy'));
assertTest("View renders brand footer", str_contains($output, '© 2026 CATETIN'));
assertTest("View escapes error message against XSS", str_contains($output, 'Test Error Message &lt;unsafe&gt;'));
assertTest("View renders CSRF field", str_contains($output, 'name="_csrf_token"'));
assertTest("View renders username and password fields with autocomplete", str_contains($output, 'autocomplete="username"') && str_contains($output, 'autocomplete="current-password"'));
assertTest("View renders password toggle button with ARIA", str_contains($output, 'id="passwordToggle"') && str_contains($output, 'aria-label="Tampilkan password"'));
assertTest("View renders remember checkbox and forgot link", str_contains($output, 'id="remember"') && str_contains($output, 'Lupa password?'));
assertTest("View renders submit button", str_contains($output, 'type="submit">Masuk</button>'));
assertTest("View includes login.js script", str_contains($output, 'src="/assets/js/login.js"'));

ob_start();
View::render('home/dashboard', [
    'title' => 'Test Dashboard',
    'user'  => ['name' => 'Dil Tester', 'role' => 'admin'],
], 'app');
$appOutput = ob_get_clean();

assertTest("View renders with app layout", str_contains($appOutput, 'class="app-shell"') && str_contains($appOutput, 'id="app-main"'));
assertTest("View renders dashboard calendar and financial panels", str_contains($appOutput, 'id="datePickerTrigger"') && str_contains($appOutput, 'Penjualan dan pengeluaran') && str_contains($appOutput, 'Pengeluaran per kategori'));
assertTest("View renders both empty-state panels and actions", str_contains($appOutput, 'id="chartEmptyState"') && str_contains($appOutput, 'id="categoryEmptyState"') && str_contains($appOutput, 'Catat transaksi'));
assertTest("View renders desktop and mobile dashboard navigation", str_contains($appOutput, 'aria-label="Navigasi utama"') && str_contains($appOutput, 'class="mobile-tab-bar"'));
assertTest("View renders POST logout form with CSRF", str_contains($appOutput, 'action="/logout"') && str_contains($appOutput, 'name="_csrf_token"'));
assertTest("View includes dashboard.js", str_contains($appOutput, 'src="/assets/js/dashboard.js"'));

ob_start();
View::render('transactions/index', [
    'title'     => 'Transaksi — Catetin',
    'user'      => ['name' => 'Dil Tester', 'role' => 'admin'],
    'activeNav' => 'transactions',
], 'app');
$transactionsOutput = ob_get_clean();

assertTest("Transactions view renders with shared app layout", str_contains($transactionsOutput, 'id="transactionsApp"') && str_contains($transactionsOutput, 'class="app-shell"'));
assertTest("Transactions navigation is active", str_contains($transactionsOutput, 'href="/transactions"') && str_contains($transactionsOutput, 'class="navigation-link is-active"'));
assertTest("Transactions view loads its own assets", str_contains($transactionsOutput, 'assets/css/transactions.css') && str_contains($transactionsOutput, 'assets/js/transactions.js'));
assertTest("Transactions form, history, and detail dialog render", str_contains($transactionsOutput, 'id="transactionForm"') && str_contains($transactionsOutput, 'id="transactionHistory"') && str_contains($transactionsOutput, 'id="transactionDetailPanel"'));
assertTest("Transactions history includes pagination controls", str_contains($transactionsOutput, 'id="transactionPagination"') && str_contains($transactionsOutput, 'id="historyPreviousPage"') && str_contains($transactionsOutput, 'id="historyNextPage"'));

// --- 7. TEST ERROR VIEWS ---
echo "\n7. Testing Error Views:\n";

ob_start();
View::render('errors/403', ['title' => '403 Akses Ditolak', 'message' => 'Dilarang masuk'], 'auth');
$err403 = ob_get_clean();
assertTest("403 error view renders code and message", str_contains($err403, '403') && str_contains($err403, 'Dilarang masuk'));

ob_start();
View::render('errors/404', ['title' => '404 Tidak Ditemukan', 'message' => 'Halaman hilang'], 'auth');
$err404 = ob_get_clean();
assertTest("404 error view renders code and message", str_contains($err404, '404') && str_contains($err404, 'Halaman hilang'));

ob_start();
View::render('errors/500', ['title' => '500 Server Error', 'message' => 'Internal error'], 'auth');
$err500 = ob_get_clean();
assertTest("500 error view renders code and message", str_contains($err500, '500') && str_contains($err500, 'Internal error'));

echo "\n=====================================================\n";
echo " Test Results: {$passed} passed, {$failed} failed.\n";
echo "=====================================================\n";

if ($failed > 0) {
    exit(1);
}
