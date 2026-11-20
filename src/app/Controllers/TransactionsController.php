<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;

class TransactionsController extends Controller
{
    public function index(): void
    {
        $this->view('transactions/index', [
            'title'     => 'Transaksi — Catetin',
            'user'      => Auth::user(),
            'activeNav' => 'transactions',
        ], 'app');
    }
}
