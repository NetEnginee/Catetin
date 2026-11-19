<?php

declare(strict_types=1);

namespace App\Core;

use App\Models\User;

/**
 * Authentication and authorization service.
 */
class Auth
{
    private const SESSION_USER_KEY = 'auth_user';

    /**
     * Attempt login with username and password.
     */
    public static function attempt(string $username, string $password, ?User $userModel = null): bool
    {
        $userModel = $userModel ?? new User();
        $user = $userModel->findByUsername(trim($username));

        // Generic failure: do not leak whether user exists or password was wrong
        if (!$user) {
            return false;
        }

        // Check if user is active
        if ((int)$user['is_active'] !== 1) {
            return false;
        }

        // Verify password hash
        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }

        // Successful authentication
        self::login($user);
        return true;
    }

    /**
     * Log in a user by setting secure session data.
     *
     * @param array $user Database user record
     */
    public static function login(array $user): void
    {
        // Prevent session fixation
        Session::regenerate(true);

        // Store ONLY safe non-sensitive identity information in session
        Session::set(self::SESSION_USER_KEY, [
            'id'       => (int)$user['id'],
            'username' => (string)$user['username'],
            'name'     => (string)$user['name'],
            'role'     => (string)$user['role'],
        ]);
    }

    /**
     * Log out current user and destroy session.
     */
    public static function logout(): void
    {
        Session::remove(self::SESSION_USER_KEY);
        Session::destroy();
    }

    /**
     * Check if user is authenticated.
     */
    public static function check(): bool
    {
        $user = Session::get(self::SESSION_USER_KEY);
        return is_array($user) && !empty($user['id']);
    }

    /**
     * Get authenticated user data.
     *
     * @return array{id: int, username: string, name: string, role: string}|null
     */
    public static function user(): ?array
    {
        $user = Session::get(self::SESSION_USER_KEY);
        return is_array($user) ? $user : null;
    }

    /**
     * Get authenticated user ID.
     */
    public static function id(): ?int
    {
        $user = self::user();
        return $user ? $user['id'] : null;
    }

    /**
     * Get authenticated user role.
     */
    public static function role(): ?string
    {
        $user = self::user();
        return $user ? $user['role'] : null;
    }

    /**
     * Check if authenticated user has a specific role.
     *
     * @param string|array $roles Allowed role(s), e.g. 'admin' or ['admin', 'operator']
     */
    public static function hasRole(string|array $roles): bool
    {
        if (!self::check()) {
            return false;
        }

        $currentRole = self::role();
        if (is_array($roles)) {
            return in_array($currentRole, $roles, true);
        }

        return $currentRole === $roles;
    }
}
