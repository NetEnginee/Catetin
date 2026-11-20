<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\Category;
use App\Models\Transaction;
use InvalidArgumentException;
use PDO;
use Throwable;

/**
 * JSON API controller for transactions, categories, and dashboard data.
 */
class ApiController extends Controller
{
    private Category $categoryModel;
    private Transaction $transactionModel;

    public function __construct(?PDO $pdo = null)
    {
        $this->categoryModel = new Category($pdo);
        $this->transactionModel = new Transaction($pdo);
    }

    /**
     * GET /api/transactions
     */
    public function transactions(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        try {
            $this->json($this->success($this->transactionsPayload($userId))['body']);
        } catch (Throwable $exception) {
            error_log('Transactions API error: ' . $exception->getMessage());
            $this->json($this->failure('Data transaksi tidak dapat dimuat.', 500)['body'], 500);
        }
    }

    /**
     * GET /api/dashboard
     */
    public function dashboard(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $date = isset($_GET['date']) && is_string($_GET['date']) && $_GET['date'] !== ''
            ? $_GET['date']
            : Transaction::today();

        try {
            $payload = $this->dashboardPayload($userId, $date);
            $this->json($this->success($payload)['body']);
        } catch (InvalidArgumentException $exception) {
            $this->json($this->failure($exception->getMessage(), 422)['body'], 422);
        } catch (Throwable $exception) {
            error_log('Dashboard API error: ' . $exception->getMessage());
            $this->json($this->failure('Data dashboard tidak dapat dimuat.', 500)['body'], 500);
        }
    }

    /**
     * POST /api/transactions
     */
    public function createTransaction(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->createTransactionResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * POST /api/transactions/update-date
     */
    public function updateTransactionDate(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->updateTransactionDateResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * POST /api/transactions/delete
     */
    public function deleteTransaction(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->deleteTransactionResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * POST /api/transactions/delete-batch
     */
    public function deleteManyTransactions(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->deleteManyTransactionsResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * POST /api/categories
     */
    public function createCategory(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->createCategoryResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * POST /api/categories/delete
     */
    public function deleteCategory(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            $this->json($this->failure('Autentikasi diperlukan.', 401)['body'], 401);
            return;
        }

        $body = $this->requestBody();
        $result = $this->removeCategoryResult($userId, $body, $this->csrfIsValid($body));
        $this->json($result['body'], $result['status']);
    }

    /**
     * Testable payload for GET /api/transactions.
     */
    public function transactionsPayload(int $userId): array
    {
        $this->categoryModel->ensureDefaults($userId);
        $categories = $this->categoryModel->listForUser($userId);
        $transactions = $this->transactionModel->allForUser($userId);

        return [
            'meta' => [
                'today'         => Transaction::today(),
                'earliest_date' => Transaction::EARLIEST_DATE,
            ],
            'categories' => $categories,
            'transactions' => $transactions,
            'summary' => $this->summarize($transactions),
        ];
    }

    /**
     * Testable payload for GET /api/dashboard.
     */
    public function dashboardPayload(int $userId, string $date): array
    {
        $aggregate = $this->transactionModel->aggregateForDate($userId, $date);
        $aggregate['meta'] = [
            'today'         => Transaction::today(),
            'earliest_date' => Transaction::EARLIEST_DATE,
        ];

        return $aggregate;
    }

    /**
     * Testable create-transaction logic.
     */
    public function createTransactionResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        if (!isset($body['type'], $body['amount'], $body['category_id'], $body['date'])) {
            return $this->failure('Lengkapi semua kolom transaksi.', 422);
        }

        $categoryId = $this->positiveInt($body['category_id']);
        if ($categoryId === null) {
            return $this->failure('Kategori tidak valid.', 422);
        }

        try {
            $transaction = $this->transactionModel->create(
                $userId,
                (string)$body['type'],
                $categoryId,
                $body['amount'],
                isset($body['description']) ? (string)$body['description'] : '',
                (string)$body['date']
            );

            return $this->success($transaction, 201);
        } catch (InvalidArgumentException $exception) {
            return $this->failure($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            error_log('Create transaction API error: ' . $exception->getMessage());
            return $this->failure('Transaksi gagal disimpan.', 500);
        }
    }

    /**
     * Testable date-update logic.
     */
    public function updateTransactionDateResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        $id = $this->positiveInt($body['id'] ?? null);
        if ($id === null || !isset($body['date'])) {
            return $this->failure('Data transaksi tidak valid.', 422);
        }

        try {
            if (!$this->transactionModel->updateDate($userId, $id, (string)$body['date'])) {
                return $this->failure('Transaksi tidak ditemukan.', 404);
            }

            return $this->success($this->transactionModel->findForUser($userId, $id));
        } catch (InvalidArgumentException $exception) {
            return $this->failure($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            error_log('Update transaction API error: ' . $exception->getMessage());
            return $this->failure('Tanggal transaksi gagal diperbarui.', 500);
        }
    }

    /**
     * Testable delete logic.
     */
    public function deleteTransactionResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        $id = $this->positiveInt($body['id'] ?? null);
        if ($id === null) {
            return $this->failure('Data transaksi tidak valid.', 422);
        }

        try {
            if (!$this->transactionModel->delete($userId, $id)) {
                return $this->failure('Transaksi tidak ditemukan.', 404);
            }

            return $this->success(['id' => $id]);
        } catch (Throwable $exception) {
            error_log('Delete transaction API error: ' . $exception->getMessage());
            return $this->failure('Transaksi gagal dihapus.', 500);
        }
    }

    /**
     * Testable category creation logic.
     */
    /**
     * Testable batch delete logic.
     */
    public function deleteManyTransactionsResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        $ids = $body['ids'] ?? null;
        if (!is_array($ids) || $ids === []) {
            return $this->failure('Pilih minimal satu transaksi.', 422);
        }

        $validIds = [];
        foreach ($ids as $id) {
            $parsed = $this->positiveInt($id);
            if ($parsed !== null) {
                $validIds[] = $parsed;
            }
        }
        if ($validIds === []) {
            return $this->failure('Data transaksi tidak valid.', 422);
        }

        try {
            $deleted = $this->transactionModel->deleteMany($userId, $validIds);
            return $this->success(['deleted' => $deleted]);
        } catch (Throwable $exception) {
            error_log('Delete many transactions API error: ' . $exception->getMessage());
            return $this->failure('Transaksi gagal dihapus.', 500);
        }
    }

    public function createCategoryResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        if (!isset($body['type'], $body['name'])) {
            return $this->failure('Lengkapi jenis dan nama kategori.', 422);
        }

        try {
            return $this->success(
                $this->categoryModel->create($userId, (string)$body['type'], (string)$body['name']),
                201
            );
        } catch (InvalidArgumentException $exception) {
            return $this->failure($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            error_log('Create category API error: ' . $exception->getMessage());
            return $this->failure('Kategori gagal disimpan.', 500);
        }
    }

    /**
     * Testable category removal logic.
     */
    public function removeCategoryResult(int $userId, array $body, bool $csrfValid): array
    {
        if (!$csrfValid) {
            return $this->failure('Token CSRF tidak valid.', 403);
        }

        $id = $this->positiveInt($body['id'] ?? null);
        if ($id === null) {
            return $this->failure('Data kategori tidak valid.', 422);
        }

        try {
            $result = $this->categoryModel->deleteWithFallback($userId, $id);
            if ($result === null) {
                return $this->failure('Kategori tidak ditemukan.', 404);
            }

            return $this->success($result);
        } catch (Throwable $exception) {
            error_log('Remove category API error: ' . $exception->getMessage());
            return $this->failure('Kategori gagal dihapus.', 500);
        }
    }

    /**
     * Decode a JSON request body into an array.
     */
    private function requestBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return $_POST;
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Validate the CSRF token carried in a JSON body.
     */
    private function csrfIsValid(array $body): bool
    {
        $token = $body['_csrf_token'] ?? null;
        return $this->validateCsrf(is_string($token) ? $token : null);
    }

    /**
     * Parse a positive integer from request data.
     */
    private function positiveInt(mixed $value): ?int
    {
        if (is_int($value) && $value > 0) {
            return $value;
        }
        if (is_string($value) && ctype_digit($value) && (int)$value > 0) {
            return (int)$value;
        }
        return null;
    }

    /**
     * Build a success envelope with an internal status for tests.
     *
     * @return array{status: int, body: array{ok: bool, data: mixed}}
     */
    private function success(mixed $data, int $status = 200): array
    {
        return [
            'status' => $status,
            'body'   => ['ok' => true, 'data' => $data],
        ];
    }

    /**
     * Build an error envelope with an internal status for tests.
     *
     * @return array{status: int, body: array{ok: bool, error: string}}
     */
    private function failure(string $error, int $status): array
    {
        return [
            'status' => $status,
            'body'   => ['ok' => false, 'error' => $error],
        ];
    }

    /**
     * Summary for the complete user-scoped transaction set.
     */
    private function summarize(array $transactions): array
    {
        $incomeTotal = 0;
        $expenseTotal = 0;
        $incomeCount = 0;
        $expenseCount = 0;

        foreach ($transactions as $transaction) {
            if ($transaction['type'] === 'income') {
                $incomeTotal += $transaction['amount'];
                $incomeCount++;
            } elseif ($transaction['type'] === 'expense') {
                $expenseTotal += $transaction['amount'];
                $expenseCount++;
            }
        }

        return [
            'income_total'     => $incomeTotal,
            'income_count'     => $incomeCount,
            'expense_total'    => $expenseTotal,
            'expense_count'    => $expenseCount,
            'balance'          => $incomeTotal - $expenseTotal,
            'transaction_count' => count($transactions),
        ];
    }

}
