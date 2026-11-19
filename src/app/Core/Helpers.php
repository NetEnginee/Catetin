<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Global helper functions for the Catetin application.
 */

if (!function_exists('App\Core\e')) {
    /**
     * Escape HTML output for safety against XSS attacks.
     */
    function e(?string $value): string
    {
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('App\Core\env')) {
    /**
     * Retrieve environment variable with optional default value.
     */
    function env(string $key, mixed $default = null): mixed
    {
        $val = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($val === false || $val === null) {
            return $default;
        }

        return match (strtolower((string)$val)) {
            'true', '(true)' => true,
            'false', '(false)' => false,
            'empty', '(empty)' => '',
            'null', '(null)' => null,
            default => $val,
        };
    }
}

if (!function_exists('App\Core\csrf_token')) {
    /**
     * Get the current session CSRF token.
     */
    function csrf_token(): string
    {
        return Session::getCsrfToken();
    }
}

if (!function_exists('App\Core\csrf_field')) {
    /**
     * Render an HTML hidden input field containing the CSRF token.
     */
    function csrf_field(): string
    {
        $token = csrf_token();
        return '<input type="hidden" name="_csrf_token" value="' . e($token) . '">';
    }
}

if (!function_exists('App\Core\old')) {
    /**
     * Retrieve flashed old input value.
     */
    function old(string $key, string $default = ''): string
    {
        return Session::getOldInput($key, $default);
    }
}

if (!function_exists('App\Core\flash')) {
    /**
     * Retrieve flashed message from session.
     */
    function flash(string $key): mixed
    {
        return Session::getFlash($key);
    }
}

if (!function_exists('App\Core\url')) {
    /**
     * Return normalized application path.
     */
    function url(string $path = ''): string
    {
        $path = '/' . ltrim($path, '/');
        return $path;
    }
}
