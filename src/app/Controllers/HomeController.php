<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;

/**
 * Controller handling root landing redirects and internal dashboard placeholder.
 */
class HomeController extends Controller
{
    /**
     * Root '/' route handler.
     * Redirects to /dashboard if logged in, otherwise redirects to /login.
     */
    public function index(): void
    {
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }

        $this->redirect('/login');
    }

    /**
     * Internal dashboard verification placeholder.
     * Protected by 'auth' middleware.
     */
    public function dashboard(): void
    {
        $user = Auth::user();

        $this->view('home/dashboard', [
            'title' => 'Dashboard - Catetin',
            'user'  => $user,
        ], 'app');
    }
}
