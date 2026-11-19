<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Base Controller providing view rendering, redirection, and request helpers.
 */
abstract class Controller
{
    /**
     * Render a view with layout.
     */
    protected function view(string $view, array $data = [], ?string $layout = 'app'): void
    {
        View::render($view, $data, $layout);
    }

    /**
     * Redirect to another URL.
     */
    protected function redirect(string $url, int $statusCode = 302): void
    {
        header("Location: {$url}", true, $statusCode);
        exit;
    }

    /**
     * Return JSON response.
     */
    protected function json(mixed $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Validate CSRF token from POST request.
     */
    protected function validateCsrf(): bool
    {
        $token = $_POST['_csrf_token'] ?? null;
        return Session::validateCsrfToken($token);
    }
}
