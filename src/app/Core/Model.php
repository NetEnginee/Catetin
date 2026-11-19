<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

/**
 * Base Model providing PDO access.
 */
abstract class Model
{
    protected PDO $db;

    public function __construct(?PDO $pdo = null)
    {
        $this->db = $pdo ?? Database::getConnection();
    }
}
