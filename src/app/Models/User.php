<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;
use PDO;

/**
 * User Model for authentication and account management.
 */
class User extends Model
{
    /**
     * Find active or inactive user by unique username.
     */
    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, username, password_hash, name, role, is_active, created_at, updated_at 
             FROM users 
             WHERE username = :username 
             LIMIT 1'
        );
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Find user by ID.
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, username, password_hash, name, role, is_active, created_at, updated_at 
             FROM users 
             WHERE id = :id 
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    /**
     * Create a new user.
     *
     * @param array{username: string, password_hash: string, name: string, role: string, is_active?: int} $data
     * @return int Inserted ID
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (username, password_hash, name, role, is_active) 
             VALUES (:username, :password_hash, :name, :role, :is_active)'
        );

        $stmt->execute([
            ':username'      => $data['username'],
            ':password_hash' => $data['password_hash'],
            ':name'          => $data['name'],
            ':role'          => $data['role'] ?? 'operator',
            ':is_active'     => $data['is_active'] ?? 1,
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Update user password.
     */
    public function updatePassword(int $id, string $passwordHash): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE users 
             SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP 
             WHERE id = :id'
        );

        return $stmt->execute([
            ':password_hash' => $passwordHash,
            ':id'            => $id,
        ]);
    }
}
