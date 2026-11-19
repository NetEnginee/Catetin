<?php

/**
 * Catetin Login View
 * @var string|null $error
 */

use function App\Core\e;
use function App\Core\csrf_field;
use function App\Core\old;
$hasError = !empty($error);
?>
<main class="login-page">
  <section class="brand-panel" aria-label="Tentang Catetin">
    <div class="brand-logo" aria-label="Catetin">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="none" stroke="#5EEAD4" stroke-width="2.5"></rect>
        <path d="M10 16.5l4 4 8-9" fill="none" stroke="#5EEAD4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <span>Catetin</span>
    </div>

    <div class="brand-copy">
      <h1>Kelola tanpa Drama, tanpa Masalah.</h1>
      <p class="desktop-tablet-copy">Gunakan dimana saja, kapan saja, tanpa drama dan lebih mudah. Dengan catetin, Maksimalkan bisnis anda tanpa batas.</p>
      <p class="mobile-copy">Gunakan dimana saja, kapan saja. Maksimalkan bisnis anda tanpa batas.</p>
    </div>

  </section>

  <section class="form-panel" aria-label="Formulir masuk">
    <form class="login-form" id="loginForm" action="/login" method="POST" autocomplete="off" novalidate>
      <?= csrf_field() ?>

      <header class="form-heading">
        <h2>Masuk</h2>
        <p>Masukkan username dan password Anda.</p>
      </header>

      <div class="field">
        <label for="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          class="field-input<?= $hasError ? ' is-invalid' : '' ?>"
          aria-invalid="<?= $hasError ? 'true' : 'false' ?>"
          placeholder="contoh: budi.santoso"
          autocomplete="username"
          value="<?= e(old('username')) ?>"
          required
          autofocus>
      </div>

      <div class="field">
        <label for="password">Password</label>
        <div class="password-wrap">
          <input
            id="password"
            name="password"
            type="password"
            class="field-input<?= $hasError ? ' is-invalid' : '' ?>"
            aria-invalid="<?= $hasError ? 'true' : 'false' ?>"
            placeholder="Masukkan password"
            autocomplete="current-password"
            required>
          <button
            class="password-toggle"
            id="passwordToggle"
            type="button"
            aria-label="Tampilkan password"
            aria-pressed="false">
            <svg id="eyeIcon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18"></path>
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.5 9.7 6.2a1.5 1.5 0 0 1 0 1.6 15 15 0 0 1-3.1 3.5"></path>
              <path d="M6.2 6.2A15.8 15.8 0 0 0 2.3 11.2a1.5 1.5 0 0 0 0 1.6C3.3 14.5 6.8 19 12 19c1.2 0 2.3-.2 3.3-.7"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="form-options">
        <label class="remember-option" for="remember">
          <input id="remember" name="remember" type="checkbox">
          <span>Ingat saya</span>
        </label>
        <a class="forgot-link" href="#">Lupa password?</a>
      </div>

      <button class="submit-button" type="submit">Masuk</button>
    </form>
  </section>
</main>