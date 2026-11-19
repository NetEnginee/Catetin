<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Pretty URL Router with HTTP method matching and middleware dispatching.
 */
class Router
{
    /**
     * @var array<string, array<string, array{handler: callable|array, middleware: array<string>}>>
     */
    private array $routes = [
        'GET'  => [],
        'POST' => [],
    ];

    /**
     * Register a GET route.
     *
     * @param string $path URL path
     * @param array{0: class-string, 1: string}|callable $handler
     * @param array<string> $middleware Middleware list
     */
    public function get(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('GET', $path, $handler, $middleware);
    }

    /**
     * Register a POST route.
     *
     * @param string $path URL path
     * @param array{0: class-string, 1: string}|callable $handler
     * @param array<string> $middleware Middleware list
     */
    public function post(string $path, array|callable $handler, array $middleware = []): void
    {
        $this->addRoute('POST', $path, $handler, $middleware);
    }

    /**
     * Add a route.
     */
    private function addRoute(string $method, string $path, array|callable $handler, array $middleware): void
    {
        $normalizedPath = $this->normalizePath($path);
        $this->routes[$method][$normalizedPath] = [
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    /**
     * Dispatch the current HTTP request.
     */
    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);
        $path = $this->normalizePath((string)parse_url($uri, PHP_URL_PATH));

        // 1. Direct route match
        if (isset($this->routes[$method][$path])) {
            $route = $this->routes[$method][$path];

            // Execute middlewares
            foreach ($route['middleware'] as $middleware) {
                Middleware::handle($middleware);
            }

            // Execute route handler
            $this->executeHandler($route['handler']);
            return;
        }

        // 2. Check if route exists under a different HTTP method (405 Method Not Allowed)
        $allowedMethods = [];
        foreach ($this->routes as $otherMethod => $paths) {
            if (isset($paths[$path])) {
                $allowedMethods[] = $otherMethod;
            }
        }

        if (!empty($allowedMethods)) {
            http_response_code(405);
            header('Allow: ' . implode(', ', $allowedMethods));
            View::render('errors/404', [
                'title'   => '405 Metode Tidak Diizinkan',
                'message' => 'Metode HTTP yang diminta tidak diizinkan untuk rute ini.',
            ], 'auth');
            return;
        }

        // 3. Route not found (404)
        http_response_code(404);
        View::render('errors/404', [
            'title'   => '404 Halaman Tidak Ditemukan',
            'message' => 'Halaman atau rute yang Anda cari tidak ditemukan.',
        ], 'auth');
    }

    /**
     * Execute controller action or closure.
     */
    private function executeHandler(array|callable $handler): void
    {
        if (is_callable($handler)) {
            call_user_func($handler);
            return;
        }

        if (is_array($handler) && count($handler) === 2) {
            [$controllerClass, $action] = $handler;

            if (class_exists($controllerClass)) {
                $controller = new $controllerClass();
                if (method_exists($controller, $action)) {
                    $controller->$action();
                    return;
                }
            }
        }

        http_response_code(500);
        View::render('errors/500', [
            'title'   => '500 Kesalahan Server',
            'message' => 'Handler rute tidak dapat dieksekusi.',
        ], 'auth');
    }

    /**
     * Normalize URL path: strip trailing slash except for root '/'.
     */
    private function normalizePath(string $path): string
    {
        $path = '/' . trim($path, '/');
        return $path === '' ? '/' : $path;
    }
}
