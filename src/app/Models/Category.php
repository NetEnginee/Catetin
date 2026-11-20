<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use InvalidArgumentException;
use PDO;

/**
 * Category model for income and expense classifications.
 */
class Category extends Model
{
    private const DEFAULTS = [
        'income' => [
            'Penjualan langsung',
            'Titip jual',
            'Pesanan online',
            'Pemasukan lain',
        ],
        'expense' => [
            'Bahan baku',
            'Gaji harian',
            'Sewa dan listrik',
            'Transportasi',
            'Lain-lain',
        ],
    ];

    /**
     * List a user's categories grouped by transaction type.
     *
     * @return array{income: array<int, array{id: int, name: string}>, expense: array<int, array{id: int, name: string}>}
     */
    public function listForUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, type, name
             FROM categories
             WHERE user_id = :user_id
             ORDER BY CASE type WHEN \'income\' THEN 0 ELSE 1 END, id ASC'
        );
        $stmt->execute([':user_id' => $userId]);

        $grouped = ['income' => [], 'expense' => []];
        foreach ($stmt->fetchAll() as $row) {
            $type = (string)$row['type'];
            if (!isset($grouped[$type])) {
                continue;
            }
            $grouped[$type][] = [
                'id'   => (int)$row['id'],
                'name' => (string)$row['name'],
            ];
        }

        return $grouped;
    }

    /**
     * Insert the default taxonomy once per user.
     */
    public function ensureDefaults(int $userId): void
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM categories WHERE user_id = :user_id');
        $stmt->execute([':user_id' => $userId]);
        if ((int)$stmt->fetchColumn() > 0) {
            return;
        }

        $insert = $this->db->prepare(
            'INSERT INTO categories (user_id, type, name) VALUES (:user_id, :type, :name)'
        );
        foreach (self::DEFAULTS as $type => $names) {
            foreach ($names as $name) {
                $insert->execute([
                    ':user_id' => $userId,
                    ':type'    => $type,
                    ':name'    => $name,
                ]);
            }
        }
    }

    /**
     * Find a category owned by a user, optionally restricted to a type.
     */
    public function findForUser(int $userId, int $id, ?string $type = null): ?array
    {
        $sql = 'SELECT id, user_id, type, name FROM categories WHERE user_id = :user_id AND id = :id';
        $params = [':user_id' => $userId, ':id' => $id];

        if ($type !== null) {
            $sql .= ' AND type = :type';
            $params[':type'] = $type;
        }
        $sql .= ' LIMIT 1';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();

        return $row ?: null;
    }

    /**
     * Create a custom category for a user.
     *
     * @return array{id: int, type: string, name: string}
     */
    public function create(int $userId, string $type, string $name): array
    {
        $type = strtolower(trim($type));
        $name = trim($name);

        if (!in_array($type, ['income', 'expense'], true)) {
            throw new InvalidArgumentException('Jenis kategori tidak valid.');
        }
        if ($name === '' || mb_strlen($name) > 40) {
            throw new InvalidArgumentException('Nama kategori harus antara 1 sampai 40 karakter.');
        }

        $duplicate = $this->db->prepare(
            'SELECT id FROM categories
             WHERE user_id = :user_id AND type = :type AND LOWER(name) = LOWER(:name)
             LIMIT 1'
        );
        $duplicate->execute([
            ':user_id' => $userId,
            ':type'    => $type,
            ':name'    => $name,
        ]);
        if ($duplicate->fetchColumn() !== false) {
            throw new InvalidArgumentException('Kategori tersebut sudah ada.');
        }

        $insert = $this->db->prepare(
            'INSERT INTO categories (user_id, type, name) VALUES (:user_id, :type, :name)'
        );
        $insert->execute([
            ':user_id' => $userId,
            ':type'    => $type,
            ':name'    => $name,
        ]);

        return [
            'id'   => (int)$this->db->lastInsertId(),
            'type' => $type,
            'name' => $name,
        ];
    }
}
