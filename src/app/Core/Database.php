<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Centralized PDO Database Connection.
 */
class Database
{
    private static ?PDO $pdo = null;

    /**
     * Get the PDO connection instance.
     */
    public static function getConnection(): PDO
    {
        if (self::$pdo === null) {
            $host = env('DB_HOST', 'db');
            $port = (int)env('DB_PORT', 3306);
            $dbName = env('DB_DATABASE', 'app_database');
            $username = env('DB_USERNAME', 'app_user');
            $password = env('DB_PASSWORD', 'change_this_local_password');

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            try {
                self::$pdo = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                // Log technical error internally without leaking credentials in production
                error_log("Database connection error: " . $e->getMessage());

                $appDebug = (bool)env('APP_DEBUG', false);
                if ($appDebug) {
                    throw new RuntimeException("Database connection failed: " . $e->getMessage(), (int)$e->getCode(), $e);
                }

                throw new RuntimeException("Koneksi ke database gagal. Silakan hubungi administrator.");
            }
        }

        return self::$pdo;
    }

    /**
     * Manually set PDO instance (useful for testing with SQLite or mock).
     */
    public static function setConnection(?PDO $pdo): void
    {
        self::$pdo = $pdo;
    }

    /**
     * Disconnect the database.
     */
    public static function disconnect(): void
    {
        self::$pdo = null;
    }
}
