<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;

/**
 * Transaction model with per-user scoping and dashboard aggregation.
 */
class Transaction extends Model
{
    public const EARLIEST_DATE = '2026-01-01';

    private const DASHBOARD_CATEGORY_ORDER = [
        'Bahan baku',
        'Gaji harian',
        'Sewa dan listrik',
        'Transportasi',
        'Lain-lain',
    ];

    /**
     * Current date in Asia/Jakarta.
     */
    public static function today(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d');
    }

    /**
     * All transactions owned by a user, newest first.
     */
    public function allForUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            $this->selectSql() . ' WHERE t.user_id = :user_id ORDER BY t.occurred_at DESC, t.id DESC'
        );
        $stmt->execute([':user_id' => $userId]);

        return array_map(fn (array $row): array => $this->formatRow($row), $stmt->fetchAll());
    }

    /**
     * Find one transaction owned by a user.
     */
    public function findForUser(int $userId, int $id): ?array
    {
        $stmt = $this->db->prepare(
            $this->selectSql() . ' WHERE t.user_id = :user_id AND t.id = :id LIMIT 1'
        );
        $stmt->execute([':user_id' => $userId, ':id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->formatRow($row) : null;
    }

    /**
     * Create a transaction with a server-generated ID and timestamp.
     *
     * @param int|string $amount Whole-rupiah amount, at most 11 digits
     * @return array<string, mixed>
     */
    public function create(
        int $userId,
        string $type,
        int $categoryId,
        int|string $amount,
        string $description,
        string $date
    ): array {
        $type = strtolower(trim($type));
        if (!in_array($type, ['income', 'expense'], true)) {
            throw new InvalidArgumentException('Jenis transaksi tidak valid.');
        }

        $amountValue = (string)$amount;
        if (!ctype_digit($amountValue) || strlen($amountValue) > 11 || (int)$amountValue <= 0) {
            throw new InvalidArgumentException('Masukkan nominal lebih dari Rp 0, maksimal 11 digit.');
        }

        $description = trim($description);
        if (mb_strlen($description) > 100) {
            throw new InvalidArgumentException('Keterangan maksimal 100 karakter.');
        }

        $this->validateDate($date);

        $category = (new Category($this->db))->findForUser($userId, $categoryId, $type);
        if ($category === null) {
            throw new InvalidArgumentException('Kategori tidak valid untuk jenis transaksi ini.');
        }

        $displayId = $this->generateDisplayId($date);
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
        $occurredAt = $date . ' ' . $now->format('H:i:s');

        $stmt = $this->db->prepare(
            'INSERT INTO transactions (user_id, display_id, type, category_id, description, amount, occurred_at)
             VALUES (:user_id, :display_id, :type, :category_id, :description, :amount, :occurred_at)'
        );
        $stmt->execute([
            ':user_id'     => $userId,
            ':display_id'  => $displayId,
            ':type'        => $type,
            ':category_id' => $categoryId,
            ':description' => $description,
            ':amount'      => (int)$amountValue,
            ':occurred_at' => $occurredAt,
        ]);

        $id = (int)$this->db->lastInsertId();
        return $this->findForUser($userId, $id) ?? [
            'id'          => $id,
            'display_id'  => $displayId,
            'date'        => $date,
            'time'        => str_replace(':', '.', $now->format('H:i')),
            'type'        => $type,
            'category_id' => $categoryId,
            'category'    => (string)$category['name'],
            'description' => $description,
            'amount'      => (int)$amountValue,
        ];
    }

    /**
     * Change only the date of an owned transaction, preserving its time.
     */
    public function updateDate(int $userId, int $id, string $date): bool
    {
        $this->validateDate($date);

        $lookup = $this->db->prepare('SELECT occurred_at FROM transactions WHERE user_id = :user_id AND id = :id LIMIT 1');
        $lookup->execute([':user_id' => $userId, ':id' => $id]);
        $occurredAt = $lookup->fetchColumn();
        if ($occurredAt === false) {
            return false;
        }

        $timePart = substr((string)$occurredAt, 11);
        if ($timePart === '') {
            $timePart = '12:00:00';
        }

        $stmt = $this->db->prepare(
            'UPDATE transactions
             SET occurred_at = :occurred_at, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = :user_id AND id = :id'
        );
        $stmt->execute([
            ':occurred_at' => $date . ' ' . $timePart,
            ':user_id'     => $userId,
            ':id'          => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Delete an owned transaction.
     */
    public function delete(int $userId, int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM transactions WHERE user_id = :user_id AND id = :id');
        $stmt->execute([':user_id' => $userId, ':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Build the dashboard payload for a single date.
     *
     * @return array<string, mixed>
     */
    public function aggregateForDate(int $userId, string $date): array
    {
        $this->validateDate($date);

        $current = $this->rowsForDate($userId, $date);
        $previousDate = (new DateTimeImmutable($date, new DateTimeZone('Asia/Jakarta')))
            ->modify('-1 day')
            ->format('Y-m-d');
        $previous = $previousDate >= self::EARLIEST_DATE ? $this->rowsForDate($userId, $previousDate) : [];

        $currentTotals = $this->totals($current);
        $previousTotals = $this->totals($previous);

        $hours = [];
        for ($hour = 8; $hour <= 17; $hour++) {
            $hours[] = sprintf('%02d.00', $hour);
        }

        $salesByHour = array_fill(0, count($hours), 0);
        $expensesByHour = array_fill(0, count($hours), 0);
        $categoryTotals = [];

        foreach ($current as $row) {
            $amount = (int)$row['amount'];
            if ($row['type'] === 'income') {
                $hour = max(8, min(17, (int)substr((string)$row['occurred_at'], 11, 2)));
                $salesByHour[$hour - 8] += $amount;
            } else {
                $hour = max(8, min(17, (int)substr((string)$row['occurred_at'], 11, 2)));
                $expensesByHour[$hour - 8] += $amount;
                $name = (string)$row['category'];
                $categoryTotals[$name] = ($categoryTotals[$name] ?? 0) + $amount;
            }
        }

        $salesCumulative = $this->cumulative($salesByHour);
        $expensesCumulative = $this->cumulative($expensesByHour);
        $profitCumulative = [];
        foreach ($salesCumulative as $index => $value) {
            $profitCumulative[] = $value - $expensesCumulative[$index];
        }

        return [
            'date'      => $date,
            'summary'   => $currentTotals,
            'previous'  => $previousTotals,
            'categories'=> $this->orderedCategories($categoryTotals),
            'chart'     => [
                'hours'    => $hours,
                'sales'    => $salesCumulative,
                'expenses' => $expensesCumulative,
            ],
            'sparkline' => [
                'sales'    => $salesCumulative,
                'expenses' => $expensesCumulative,
                'profit'   => $profitCumulative,
            ],
        ];
    }

    /**
     * Base SELECT shared by find/list queries.
     */
    private function selectSql(): string
    {
        return 'SELECT t.id, t.display_id, t.user_id, t.type, t.category_id, c.name AS category,
                       t.description, t.amount, t.occurred_at, t.created_at, t.updated_at
                FROM transactions t
                JOIN categories c ON c.id = t.category_id';
    }

    /**
     * Normalize a database row into the API shape.
     */
    private function formatRow(array $row): array
    {
        return [
            'id'          => (int)$row['id'],
            'display_id'  => (string)$row['display_id'],
            'date'        => substr((string)$row['occurred_at'], 0, 10),
            'time'        => str_replace(':', '.', substr((string)$row['occurred_at'], 11, 5)),
            'occurred_at' => (string)$row['occurred_at'],
            'type'        => (string)$row['type'],
            'category_id' => (int)$row['category_id'],
            'category'    => (string)$row['category'],
            'description' => (string)$row['description'],
            'amount'      => (int)round((float)$row['amount']),
        ];
    }

    /**
     * Raw rows used by aggregation.
     */
    private function rowsForDate(int $userId, string $date): array
    {
        $stmt = $this->db->prepare(
            'SELECT t.type, t.amount, t.occurred_at, c.name AS category
             FROM transactions t
             JOIN categories c ON c.id = t.category_id
             WHERE t.user_id = :user_id AND t.occurred_at >= :start AND t.occurred_at < :end'
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':start'   => $date . ' 00:00:00',
            ':end'     => date('Y-m-d', strtotime($date . ' +1 day')) . ' 00:00:00',
        ]);

        return $stmt->fetchAll();
    }

    /**
     * Summary figures shared by dashboard and transactions payloads.
     */
    private function totals(array $rows): array
    {
        $sales = 0;
        $expenses = 0;
        foreach ($rows as $row) {
            $amount = (int)round((float)$row['amount']);
            if ($row['type'] === 'income') {
                $sales += $amount;
            } elseif ($row['type'] === 'expense') {
                $expenses += $amount;
            }
        }

        return [
            'sales'    => $sales,
            'expenses' => $expenses,
            'profit'   => $sales - $expenses,
        ];
    }

    /**
     * Convert per-hour values into cumulative series.
     */
    private function cumulative(array $values): array
    {
        $result = [];
        $running = 0;
        foreach ($values as $value) {
            $running += $value;
            $result[] = $running;
        }
        return $result;
    }

    /**
     * Fixed dashboard category order, with custom categories appended.
     */
    private function orderedCategories(array $totals): array
    {
        $ordered = [];
        foreach (self::DASHBOARD_CATEGORY_ORDER as $name) {
            if (isset($totals[$name]) && $totals[$name] > 0) {
                $ordered[] = ['name' => $name, 'total' => $totals[$name]];
                unset($totals[$name]);
            }
        }

        ksort($totals);
        foreach ($totals as $name => $total) {
            if ($total > 0) {
                $ordered[] = ['name' => (string)$name, 'total' => $total];
            }
        }

        return $ordered;
    }

    /**
     * Generate the next per-date display ID.
     */
    private function generateDisplayId(string $date): string
    {
        $prefix = 'TRX-' . str_replace('-', '', $date) . '-';
        $stmt = $this->db->prepare(
            'SELECT display_id FROM transactions WHERE display_id LIKE :prefix ORDER BY display_id DESC LIMIT 1'
        );
        $stmt->execute([':prefix' => $prefix . '%']);
        $last = $stmt->fetchColumn();

        $sequence = 1;
        if ($last !== false) {
            $sequence = (int)substr((string)$last, strlen($prefix)) + 1;
        }

        return $prefix . str_pad((string)$sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Validate and bound transaction dates.
     */
    private function validateDate(string $date): void
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
            throw new InvalidArgumentException('Tanggal transaksi tidak valid.');
        }

        if (!checkdate((int)$matches[2], (int)$matches[3], (int)$matches[1])) {
            throw new InvalidArgumentException('Tanggal transaksi tidak valid.');
        }

        if ($date < self::EARLIEST_DATE || $date > self::today()) {
            throw new InvalidArgumentException('Tanggal transaksi di luar rentang yang diizinkan.');
        }
    }
}
