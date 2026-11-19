<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Middleware handling authentication, guest, and role-based authorization checks.
 */
class Middleware
{
    /**
     * Determine whether the current request passes the middleware check.
     *
     * @param string $middleware Middleware string, e.g. 'auth', 'guest', 'role:admin'
     * @return bool True if authorized, false otherwise
     */
    public static function checkAccess(string $middleware): bool
    {
        if ($middleware === 'guest') {
            return !Auth::check();
        }

        if ($middleware === 'auth') {
            return Auth::check();
        }

        if (str_starts_with($middleware, 'role:')) {
            if (!Auth::check()) {
                return false;
            }
            $requiredRoles = explode(',', substr($middleware, 5));
            return Auth::hasRole($requiredRoles);
        }

        return true;
    }

    /**
     * Run middleware checks and redirect or abort on failure.
     *
     * @param string $middleware Middleware string, e.g. 'auth', 'guest', 'role:admin'
     * @return bool True if authorized
     */
    public static function handle(string $middleware): bool
    {
        if (self::checkAccess($middleware)) {
            return true;
        }

        // Action on unauthorized access:
        if ($middleware === 'guest') {
            header('Location: /dashboard', true, 302);
            exit;
        }

        if ($middleware === 'auth') {
            header('Location: /login', true, 302);
            exit;
        }

        if (str_starts_with($middleware, 'role:')) {
            if (!Auth::check()) {
                header('Location: /login', true, 302);
                exit;
            }

            http_response_code(403);
            View::render('errors/403', [
                'title'   => '403 Akses Ditolak',
                'message' => 'Anda tidak memiliki hak akses untuk halaman ini.',
            ], 'auth');
            exit;
        }

        return true;
    }
}
