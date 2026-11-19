#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Catetin CLI - Secure User Provisioning Script
 * Usage:
 *   php bin/create-user.php
 *   php bin/create-user.php --username=admin --name="Administrator" --role=admin --password=secret
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
use App\Core\Database;
use App\Models\User;

// Bootstrap environment
App::loadEnv(dirname(__DIR__) . '/.env');

echo "========================================\n";
echo " Catetin - User Provisioning Tool\n";
echo "========================================\n\n";

// Parse CLI options
$options = getopt('', ['username:', 'name:', 'role:', 'password:']);

$username = $options['username'] ?? null;
$name = $options['name'] ?? null;
$role = $options['role'] ?? null;
$password = $options['password'] ?? null;

// Helper function to read interactive CLI input
function prompt(string $message, string $default = ''): string
{
    echo $message . ($default !== '' ? " [{$default}]: " : ": ");
    $input = trim((string)fgets(STDIN));
    return $input !== '' ? $input : $default;
}

if (empty($username)) {
    $username = prompt("Nama Pengguna (Username)");
}

if (empty($username)) {
    fwrite(STDERR, "Error: Username tidak boleh kosong.\n");
    exit(1);
}

if (empty($name)) {
    $name = prompt("Nama Lengkap Tampilan", ucfirst($username));
}

if (empty($role)) {
    $roleInput = strtolower(prompt("Peran (admin/operator)", "admin"));
    $role = in_array($roleInput, ['admin', 'operator'], true) ? $roleInput : 'operator';
}

if (!in_array($role, ['admin', 'operator'], true)) {
    fwrite(STDERR, "Error: Role harus 'admin' atau 'operator'.\n");
    exit(1);
}

if (empty($password)) {
    echo "Kata Sandi: ";
    // If running in terminal, attempt to hide password
    if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
        system('stty -echo');
        $password = trim((string)fgets(STDIN));
        system('stty echo');
        echo "\n";
    } else {
        $password = trim((string)fgets(STDIN));
    }
}

if (strlen($password) < 6) {
    fwrite(STDERR, "Error: Kata sandi minimal 6 karakter.\n");
    exit(1);
}

try {
    $db = Database::getConnection();

    // 1. Ensure users table exists
    $schemaFile = dirname(__DIR__) . '/database/schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        if ($sql !== false) {
            $db->exec($sql);
        }
    }

    $userModel = new User($db);

    // 2. Check if username already exists
    $existing = $userModel->findByUsername($username);
    if ($existing) {
        fwrite(STDERR, "Error: Pengguna dengan username '{$username}' sudah terdaftar.\n");
        exit(1);
    }

    // 3. Hash password securely
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // 4. Create user
    $userId = $userModel->create([
        'username'      => $username,
        'password_hash' => $passwordHash,
        'name'          => $name,
        'role'          => $role,
        'is_active'     => 1,
    ]);

    echo "\n[OK] Akun berhasil dibuat!\n";
    echo "  - ID       : {$userId}\n";
    echo "  - Username : {$username}\n";
    echo "  - Nama     : {$name}\n";
    echo "  - Role     : {$role}\n";
    echo "  - Status   : Aktif\n\n";

} catch (Throwable $e) {
    fwrite(STDERR, "\nError saat membuat akun: " . $e->getMessage() . "\n");
    exit(1);
}
