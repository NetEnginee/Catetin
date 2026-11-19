<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Secure Session Manager with CSRF token support, idle timeout, and flash data.
 */
class Session
{
    private const IDLE_TIMEOUT = 1800; // 30 minutes in seconds

    private static bool $started = false;

    /**
     * Start secure session.
     */
    public static function start(): void
    {
        if (self::$started || session_status() === PHP_SESSION_ACTIVE) {
            self::$started = true;
            return;
        }

        // Detect HTTPS connection
        $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);

        // Configure session security settings if headers not already sent
        if (!headers_sent()) {
            ini_set('session.use_only_cookies', '1');
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_trans_sid', '0');

            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'domain'   => '',
                'secure'   => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            session_name('catetin_session');
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            @session_start();
        }
        self::$started = true;

        // Check for session idle timeout
        self::checkIdleTimeout();

        // Age out flash data
        self::ageFlashData();

        // Ensure CSRF token is generated
        self::generateCsrfToken();
    }

    /**
     * Regenerate session ID and delete old session data.
     */
    public static function regenerate(bool $deleteOldSession = true): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            if (!headers_sent()) {
                session_regenerate_id($deleteOldSession);
            }
            // Re-generate CSRF token on session regeneration for safety
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    /**
     * Destroy the current session securely.
     */
    public static function destroy(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION = [];

            if (!headers_sent() && ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'],
                    $params['domain'],
                    $params['secure'],
                    $params['httponly']
                );
            }

            session_destroy();
            self::$started = false;
        }
    }

    /**
     * Set session key-value pair.
     */
    public static function set(string $key, mixed $value): void
    {
        self::ensureStarted();
        $_SESSION[$key] = $value;
    }

    /**
     * Get value from session.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        self::ensureStarted();
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Check if session key exists.
     */
    public static function has(string $key): bool
    {
        self::ensureStarted();
        return isset($_SESSION[$key]);
    }

    /**
     * Remove key from session.
     */
    public static function remove(string $key): void
    {
        self::ensureStarted();
        unset($_SESSION[$key]);
    }

    /**
     * Set a flash message for the subsequent request.
     */
    public static function setFlash(string $key, mixed $value): void
    {
        self::ensureStarted();
        $_SESSION['_flash']['new'][$key] = $value;
    }

    /**
     * Retrieve a flash message.
     */
    public static function getFlash(string $key, mixed $default = null): mixed
    {
        self::ensureStarted();
        return $_SESSION['_flash']['current'][$key] ?? $default;
    }

    /**
     * Store old input data for form persistence.
     */
    public static function flashOldInput(array $input): void
    {
        self::ensureStarted();
        // Do not store sensitive fields like passwords in old input
        unset($input['password'], $input['password_confirmation'], $input['_csrf_token']);
        $_SESSION['_flash']['new']['_old_input'] = $input;
    }

    /**
     * Retrieve old input data.
     */
    public static function getOldInput(string $key, string $default = ''): string
    {
        self::ensureStarted();
        $old = $_SESSION['_flash']['current']['_old_input'] ?? [];
        return (string)($old[$key] ?? $default);
    }

    /**
     * Get or create CSRF token.
     */
    public static function getCsrfToken(): string
    {
        self::ensureStarted();
        if (empty($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }

    /**
     * Validate submitted CSRF token.
     */
    public static function validateCsrfToken(?string $token): bool
    {
        self::ensureStarted();
        if (empty($token) || empty($_SESSION['_csrf_token'])) {
            return false;
        }
        return hash_equals($_SESSION['_csrf_token'], $token);
    }

    private static function generateCsrfToken(): void
    {
        if (empty($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    private static function checkIdleTimeout(): void
    {
        $now = time();
        if (isset($_SESSION['_last_activity']) && ($now - $_SESSION['_last_activity'] > self::IDLE_TIMEOUT)) {
            self::destroy();
            session_start();
            self::$started = true;
            self::generateCsrfToken();
        }
        $_SESSION['_last_activity'] = $now;
    }

    private static function ageFlashData(): void
    {
        // Move 'new' flash data to 'current', and remove expired flash data
        $_SESSION['_flash']['current'] = $_SESSION['_flash']['new'] ?? [];
        $_SESSION['_flash']['new'] = [];
    }

    private static function ensureStarted(): void
    {
        if (!self::$started && session_status() !== PHP_SESSION_ACTIVE) {
            self::start();
        }
    }
}
