<?php

declare(strict_types=1);

/**
 * Catetin Transactions API / Database Test Suite
 * Runs with: php tests/test_transactions.php
 *
 * Uses an in-memory SQLite database, so it needs the pdo_sqlite extension.
 * This host PHP build lacks that driver, while the app container has it; when
 * the local driver is missing the suite transparently re-runs in the app
 * container so the same command works in both environments.
 */

if (!extension_loaded('pdo_sqlite')) {
    $root = dirname(__DIR__);
    $command = sprintf(
        'docker compose -f %s exec -T app php tests/test_transactions.php',
        escapeshellarg($root . DIRECTORY_SEPARATOR . 'compose.yaml')
    );
    passthru($command, $exitCode);
    exit($exitCode);
}

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

use App\Controllers\ApiController;
use App\Core\Database;
use App\Core\Session;
use App\Models\Category;
use App\Models\Transaction;

$passed = 0;
$failed = 0;

function assertTest(string $description, bool $condition, string $failureDetails = ''): void
{
    global $passed, $failed;
    if ($condition) {
        echo "  [PASS] {$description}\n";
        $passed++;
        return;
    }
    echo "  [FAIL] {$description} - {$failureDetails}\n";
    $failed++;
}

function assertThrows(callable $callback, string $expectedMessage): bool
{
    try {
        $callback();
    } catch (InvalidArgumentException $exception) {
        return stripos($exception->getMessage(), $expectedMessage) !== false;
    }
    return false;
}

function resultStatus(array $result): int
{
    return $result['status'];
}

function resultBody(array $result): array
{
    return $result['body'];
}

Session::start();

$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$db->exec('PRAGMA foreign_keys = ON');
Database::setConnection($db);

$db->exec(<<<'SQL'
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name VARCHAR(40) COLLATE NOCASE NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, type, name)
);
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_id VARCHAR(32) NOT NULL UNIQUE,
    type TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description VARCHAR(100) NOT NULL DEFAULT '',
    amount DECIMAL(15,2) NOT NULL,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transactions_user_occurred_at ON transactions(user_id, occurred_at);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
SQL);

$db->exec("INSERT INTO users (id, username, password_hash, name, role) VALUES (1, 'user_one', 'hash', 'User One', 'operator')");
$db->exec("INSERT INTO users (id, username, password_hash, name, role) VALUES (2, 'user_two', 'hash', 'User Two', 'operator')");

echo "=====================================================\n";
echo " Running Catetin Transactions Database Test Suite\n";
echo "=====================================================\n\n";

echo "1. Testing Category defaults and validation:\n";

$categoryModel = new Category();
$categoryModel->ensureDefaults(1);
$categoryModel->ensureDefaults(2);
$grouped = $categoryModel->listForUser(1);

assertTest("ensureDefaults creates 4 income categories", count($grouped['income']) === 4);
assertTest("ensureDefaults creates 5 expense categories", count($grouped['expense']) === 5);
assertTest("ensureDefaults is idempotent", (function () use ($categoryModel): bool {
    $categoryModel->ensureDefaults(1);
    return count($categoryModel->listForUser(1)['income']) === 4;
})());
assertTest("create rejects duplicate category case-insensitively", assertThrows(
    fn () => $categoryModel->create(1, 'expense', 'bahan baku'),
    'sudah ada'
));
assertTest("findForUser rejects another user's category", $categoryModel->findForUser(2, $grouped['income'][0]['id'], 'income') === null);
assertTest("findForUser rejects a category with the wrong type", $categoryModel->findForUser(1, $grouped['income'][0]['id'], 'expense') === null);

$userOneIncomeCategory = $grouped['income'][0];
$userOneExpenseCategory = $grouped['expense'][0];

echo "\n2. Testing Transaction CRUD and per-user isolation:\n";

$transactionModel = new Transaction();
$created = $transactionModel->create(1, 'income', $userOneIncomeCategory['id'], 125000, 'Penjualan uji', '2026-11-19');
$otherUserCreated = $transactionModel->create(2, 'income', $categoryModel->listForUser(2)['income'][0]['id'], 99000, 'Transaksi user dua', '2026-11-19');

assertTest("create returns a server-generated display id", str_starts_with($created['display_id'], 'TRX-20261119-'));
assertTest("create stores amount as a whole integer", (int)$created['amount'] === 125000);
assertTest("create stores the requested date", $created['date'] === '2026-11-19');
assertTest("create stores a server-derived time", (bool)preg_match('/^\d{2}\.\d{2}$/', $created['time']));
assertTest("allForUser returns only the current user's rows", count($transactionModel->allForUser(1)) === 1 && count($transactionModel->allForUser(2)) === 1);
assertTest("findForUser cannot read another user's row", $transactionModel->findForUser(2, $created['id']) === null);
assertTest("updateDate cannot modify another user's row", !$transactionModel->updateDate(2, $created['id'], '2026-11-18'));
assertTest("updateDate changes an owned row", $transactionModel->updateDate(1, $created['id'], '2026-11-18'));
assertTest("updateDate keeps the original time", $transactionModel->findForUser(1, $created['id'])['time'] === $created['time']);
assertTest("delete cannot remove another user's row", !$transactionModel->delete(2, $created['id']));
assertTest("delete removes an owned row", $transactionModel->delete(1, $created['id']));
assertTest("create rejects a non-positive amount", assertThrows(
    fn () => $transactionModel->create(1, 'income', $userOneIncomeCategory['id'], 0, 'Nominal nol', '2026-11-19'),
    'nominal'
));
assertTest("create rejects more than 11 amount digits", assertThrows(
    fn () => $transactionModel->create(1, 'income', $userOneIncomeCategory['id'], '123456789012', 'Nominal terlalu panjang', '2026-11-19'),
    'nominal'
));
assertTest("create rejects an unknown transaction type", assertThrows(
    fn () => $transactionModel->create(1, 'transfer', $userOneIncomeCategory['id'], 10000, 'Jenis salah', '2026-11-19'),
    'jenis'
));
assertTest("create rejects a date before earliest_date", assertThrows(
    fn () => $transactionModel->create(1, 'income', $userOneIncomeCategory['id'], 10000, 'Tanggal lama', '2025-12-31'),
    'tanggal'
));
assertTest("create rejects a malformed date", assertThrows(
    fn () => $transactionModel->create(1, 'income', $userOneIncomeCategory['id'], 10000, 'Tanggal salah', '2026-13-40'),
    'tanggal'
));
assertTest("create rejects another user's category", assertThrows(
    fn () => $transactionModel->create(1, 'income', $categoryModel->listForUser(2)['income'][0]['id'], 10000, 'Kategori asing', '2026-11-19'),
    'kategori'
));

echo "\n3. Testing Dashboard aggregation:\n";

$db->exec("DELETE FROM transactions");
$insert = $db->prepare(
    'INSERT INTO transactions (user_id, display_id, type, category_id, description, amount, occurred_at)
     VALUES (:user_id, :display_id, :type, :category_id, :description, :amount, :occurred_at)'
);
$rows = [
    [1, 'TRX-20261119-901', 'income', $userOneIncomeCategory['id'], 'Kasir pagi', 150000, '2026-11-19 09:15:00'],
    [1, 'TRX-20261119-902', 'income', $grouped['income'][1]['id'], 'Titip jual', 250000, '2026-11-19 11:30:00'],
    [1, 'TRX-20261119-903', 'expense', $userOneExpenseCategory['id'], 'Beli bahan', 100000, '2026-11-19 15:00:00'],
    [1, 'TRX-20261118-901', 'income', $userOneIncomeCategory['id'], 'Kasir kemarin', 50000, '2026-11-18 10:00:00'],
    [2, 'TRX-20261119-904', 'income', $categoryModel->listForUser(2)['income'][0]['id'], 'User dua', 999999, '2026-11-19 09:00:00'],
];
foreach ($rows as $row) {
    $insert->execute([
        ':user_id' => $row[0],
        ':display_id' => $row[1],
        ':type' => $row[2],
        ':category_id' => $row[3],
        ':description' => $row[4],
        ':amount' => $row[5],
        ':occurred_at' => $row[6],
    ]);
}

$aggregate = $transactionModel->aggregateForDate(1, '2026-11-19');
assertTest("aggregate sums sales from income rows", $aggregate['summary']['sales'] === 400000);
assertTest("aggregate sums expenses from expense rows", $aggregate['summary']['expenses'] === 100000);
assertTest("aggregate derives profit", $aggregate['summary']['profit'] === 300000);
assertTest("aggregate excludes another user's rows", $aggregate['summary']['sales'] !== 1399999);
assertTest("aggregate loads previous-day comparison", $aggregate['previous']['sales'] === 50000);
assertTest("aggregate exposes 08.00-17.00 hours", count($aggregate['chart']['hours']) === 10 && $aggregate['chart']['hours'][0] === '08.00' && $aggregate['chart']['hours'][9] === '17.00');
assertTest("aggregate accumulates sales by hour", $aggregate['chart']['sales'][1] === 150000 && $aggregate['chart']['sales'][3] === 400000);
assertTest("aggregate accumulates expenses by hour", $aggregate['chart']['expenses'][7] === 100000 && $aggregate['chart']['expenses'][9] === 100000);
assertTest("aggregate exposes expense category totals", $aggregate['categories'][0]['name'] === 'Bahan baku' && $aggregate['categories'][0]['total'] === 100000);
assertTest("aggregate sparklines mirror cumulative chart series", $aggregate['sparkline']['sales'] === $aggregate['chart']['sales']);

echo "\n4. Testing API controller result methods:\n";

$controller = new ApiController();
$payload = $controller->transactionsPayload(1);
assertTest("transactions payload exposes server date meta", $payload['meta']['today'] === Transaction::today() && $payload['meta']['earliest_date'] === Transaction::EARLIEST_DATE);
assertTest("transactions payload exposes user-scoped categories", count($payload['categories']['income']) === 4 && count($payload['categories']['expense']) === 5);
assertTest("transactions payload exposes user-scoped rows", count($payload['transactions']) === 4 && !str_contains(json_encode($payload), '999999'));
assertTest("transactions payload exposes summary", isset($payload['summary']['balance']));

$dashboardPayload = $controller->dashboardPayload(1, '2026-11-19');
assertTest("dashboard payload uses aggregate data", $dashboardPayload['summary']['sales'] === 400000 && $dashboardPayload['date'] === '2026-11-19');
assertTest("dashboard payload rejects an invalid date", assertThrows(
    fn () => $controller->dashboardPayload(1, '2026-99-99'),
    'tanggal'
));

$incomeCategoryId = (int)$payload['categories']['income'][0]['id'];
$createResult = $controller->createTransactionResult(1, [
    'type' => 'income',
    'amount' => '75000',
    'category_id' => $incomeCategoryId,
    'description' => 'Transaksi API',
    'date' => '2026-11-19',
], true);
assertTest("create API action returns 201 with created row", resultStatus($createResult) === 201 && resultBody($createResult)['ok'] === true && resultBody($createResult)['data']['amount'] === 75000);
assertTest("create API action rejects missing CSRF", resultStatus($controller->createTransactionResult(1, [
    'type' => 'income',
    'amount' => '75000',
    'category_id' => $incomeCategoryId,
    'description' => 'Tanpa token',
    'date' => '2026-11-19',
], false)) === 403);
assertTest("create API action maps validation failures to 422", resultStatus($controller->createTransactionResult(1, [
    'type' => 'income',
    'amount' => '0',
    'category_id' => $incomeCategoryId,
    'description' => 'Nominal nol',
    'date' => '2026-11-19',
], true)) === 422);

$apiRows = $controller->transactionsPayload(1)['transactions'];
$newRow = $apiRows[0];
$updateResult = $controller->updateTransactionDateResult(1, ['id' => $newRow['id'], 'date' => '2026-11-17'], true);
assertTest("update-date API action returns the updated row", resultStatus($updateResult) === 200 && resultBody($updateResult)['data']['date'] === '2026-11-17');
assertTest("update-date API action rejects another user's row", resultStatus($controller->updateTransactionDateResult(2, ['id' => $newRow['id'], 'date' => '2026-11-17'], true)) === 404);
assertTest("update-date API action rejects missing CSRF", resultStatus($controller->updateTransactionDateResult(1, ['id' => $newRow['id'], 'date' => '2026-11-17'], false)) === 403);

$deleteResult = $controller->deleteTransactionResult(2, ['id' => $newRow['id']], true);
assertTest("delete API action rejects another user's row", resultStatus($deleteResult) === 404);
assertTest("delete API action removes an owned row", resultStatus($controller->deleteTransactionResult(1, ['id' => $newRow['id']], true)) === 200);
assertTest("delete API action rejects missing CSRF", resultStatus($controller->deleteTransactionResult(1, ['id' => $newRow['id']], false)) === 403);

$categoryResult = $controller->createCategoryResult(1, ['type' => 'expense', 'name' => 'Kategori Baru'], true);
assertTest("category API action returns 201 with new category", resultStatus($categoryResult) === 201 && resultBody($categoryResult)['data']['name'] === 'Kategori Baru');
assertTest("category API action rejects duplicates with 422", resultStatus($controller->createCategoryResult(1, ['type' => 'expense', 'name' => 'kategori baru'], true)) === 422);
assertTest("category API action rejects missing CSRF", resultStatus($controller->createCategoryResult(1, ['type' => 'expense', 'name' => 'Tanpa Token'], false)) === 403);

$removableCategoryId = (int)resultBody($categoryResult)['data']['id'];
assertTest("removeCategoryResult returns 403 without CSRF and deletes nothing", resultStatus($controller->removeCategoryResult(1, ['id' => $removableCategoryId], false)) === 403 && in_array('Kategori Baru', array_column($categoryModel->listForUser(1)['expense'], 'name'), true));
assertTest("removeCategoryResult returns 422 for an invalid id", resultStatus($controller->removeCategoryResult(1, ['id' => 'abc'], true)) === 422);
assertTest("removeCategoryResult returns 404 for another user's category", resultStatus($controller->removeCategoryResult(2, ['id' => $userOneIncomeCategory['id']], true)) === 404);
$removalApiResult = $controller->removeCategoryResult(1, ['id' => $removableCategoryId], true);
assertTest("removeCategoryResult returns 200 with moved count and fallback", resultStatus($removalApiResult) === 200 && resultBody($removalApiResult)['data']['moved'] === 0 && resultBody($removalApiResult)['data']['fallback']['name'] === 'Lain-lain');

echo "\n5. Testing category removal:\n";

$removalCategory = $categoryModel->create(1, 'income', 'Kategori Uji Hapus');
$transactionModel->create(1, 'income', $removalCategory['id'], 11000, 'Pakai kategori 1', '2026-11-20');
$transactionModel->create(1, 'income', $removalCategory['id'], 12000, 'Pakai kategori 2', '2026-11-20');

assertTest("countUsage counts transactions for an owned category", $categoryModel->countUsage(1, $removalCategory['id']) === 2);
assertTest("countUsage does not count another user's transactions", $categoryModel->countUsage(2, $removalCategory['id']) === 0);

$existingFallback = null;
foreach ($categoryModel->listForUser(1)['income'] as $category) {
    if ($category['name'] === 'Pemasukan lain') {
        $existingFallback = $category;
        break;
    }
}
assertTest("ensureFallback returns the existing income fallback", $existingFallback !== null && $categoryModel->ensureFallback(1, 'income')['id'] === $existingFallback['id']);

$expenseFallbackId = null;
foreach ($categoryModel->listForUser(1)['expense'] as $category) {
    if ($category['name'] === 'Lain-lain') {
        $expenseFallbackId = $category['id'];
        break;
    }
}
$db->exec('DELETE FROM categories WHERE id = ' . (int)$expenseFallbackId);
$newExpenseFallback = $categoryModel->ensureFallback(1, 'expense');
$expenseNames = array_column($categoryModel->listForUser(1)['expense'], 'name');
assertTest("ensureFallback creates a missing expense fallback", $newExpenseFallback['name'] === 'Lain-lain' && in_array('Lain-lain', $expenseNames, true));

$beforeRemoval = array_values(array_filter(
    $transactionModel->allForUser(1),
    fn (array $row): bool => $row['category_id'] === $removalCategory['id']
));
$removalResult = $categoryModel->deleteWithFallback(1, $removalCategory['id']);
$afterRemoval = $transactionModel->allForUser(1);
$preserved = count($beforeRemoval) === 2 && $removalResult['moved'] === 2 && $removalResult['fallback']['name'] === 'Pemasukan lain';
foreach ($beforeRemoval as $row) {
    $match = null;
    foreach ($afterRemoval as $candidate) {
        if ($candidate['id'] === $row['id']) {
            $match = $candidate;
            break;
        }
    }
    $preserved = $preserved && $match !== null
        && $match['amount'] === $row['amount']
        && $match['date'] === $row['date']
        && $match['type'] === $row['type']
        && $match['category_id'] === $removalResult['fallback']['id'];
}
$remainingNames = array_column($categoryModel->listForUser(1)['income'], 'name');
assertTest("deleteWithFallback reassignment preserves transaction data", $preserved && !in_array('Kategori Uji Hapus', $remainingNames, true));

$fallbackToDelete = $categoryModel->ensureFallback(1, 'income');
$fallbackTransaction = $transactionModel->create(1, 'income', $fallbackToDelete['id'], 13000, 'Fallback terpakai', '2026-11-20');
$fallbackRemoval = $categoryModel->deleteWithFallback(1, $fallbackToDelete['id']);
$afterFallbackRemoval = $transactionModel->allForUser(1);
$movedTransaction = null;
foreach ($afterFallbackRemoval as $candidate) {
    if ($candidate['id'] === $fallbackTransaction['id']) {
        $movedTransaction = $candidate;
        break;
    }
}
assertTest(
    "deleteWithFallback creates a numbered replacement when deleting the fallback",
    $fallbackRemoval !== null
        && str_starts_with($fallbackRemoval['fallback']['name'], 'Pemasukan lain')
        && $fallbackRemoval['fallback']['name'] !== 'Pemasukan lain'
        && $fallbackRemoval['moved'] >= 1
        && $movedTransaction !== null
        && $movedTransaction['category_id'] === $fallbackRemoval['fallback']['id']
);

assertTest("deleteWithFallback cannot remove another user's category", $categoryModel->deleteWithFallback(2, $userOneIncomeCategory['id']) === null && in_array('Penjualan langsung', array_column($categoryModel->listForUser(1)['income'], 'name'), true));

$unusedCategory = $categoryModel->create(1, 'expense', 'Kategori Kosong');
$unusedRemoval = $categoryModel->deleteWithFallback(1, $unusedCategory['id']);
assertTest("deleteWithFallback deletes an unused category with moved = 0", $unusedRemoval['moved'] === 0 && !in_array('Kategori Kosong', array_column($categoryModel->listForUser(1)['expense'], 'name'), true));

Database::disconnect();

echo "\n=====================================================\n";
echo " Test Results: {$passed} passed, {$failed} failed.\n";
echo "=====================================================\n";

if ($failed > 0) {
    exit(1);
}
