<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Core\Session;

/**
 * Controller for handling authentication flows: login and logout.
 */
class AuthController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLogin(): void
    {
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }

        $this->view('auth/login', [
            'title' => 'Masuk — Catetin',
            'error' => Session::getFlash('error'),
        ], 'auth');
    }

    /**
     * Process login submission.
     */
    public function login(): void
    {
        // 1. Verify CSRF Token
        if (!$this->validateCsrf()) {
            Session::setFlash('error', 'Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa.');
            $this->redirect('/login');
        }

        $username = trim((string)($_POST['username'] ?? ''));
        $password = (string)($_POST['password'] ?? '');

        // 2. Input validation
        if ($username === '' || $password === '') {
            Session::flashOldInput(['username' => $username]);
            Session::setFlash('error', 'Username dan password wajib diisi.');
            $this->redirect('/login');
        }

        // 3. Attempt authentication
        try {
            if (Auth::attempt($username, $password)) {
                // Authentication successful -> redirect to internal dashboard
                $this->redirect('/dashboard');
            }
        } catch (\Throwable $e) {
            error_log("Authentication exception: " . $e->getMessage());
            Session::flashOldInput(['username' => $username]);
            Session::setFlash('error', 'Terjadi kesalahan sistem atau database. Silakan coba beberapa saat lagi.');
            $this->redirect('/login');
        }

        // 4. Authentication failed: Generic error message to prevent account enumeration
        Session::flashOldInput(['username' => $username]);
        Session::setFlash('error', 'Username atau password salah. Silakan coba lagi.');
        $this->redirect('/login');
    }

    /**
     * Process logout via POST request.
     */
    public function logout(): void
    {
        // Verify CSRF Token for state-changing logout
        if (!$this->validateCsrf()) {
            Session::setFlash('error', 'Token keamanan tidak valid.');
            $this->redirect('/login');
        }

        Auth::logout();
        $this->redirect('/login');
    }
}
