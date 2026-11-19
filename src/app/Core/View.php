<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/**
 * PHP Native View and Layout Renderer.
 */
class View
{
    private static string $viewsPath = __DIR__ . '/../Views/';

    /**
     * Render a view within a layout.
     *
     * @param string $view View name relative to Views directory (e.g. 'auth/login')
     * @param array $data Data passed to view and layout
     * @param string|null $layout Layout name relative to Views/layouts/ (e.g. 'auth', 'app')
     */
    public static function render(string $view, array $data = [], ?string $layout = 'app'): void
    {
        $viewFile = self::$viewsPath . trim($view, '/') . '.php';

        if (!file_exists($viewFile)) {
            throw new RuntimeException("View file tidak ditemukan: {$viewFile}");
        }

        // Extract variables to local scope
        extract($data, EXTR_SKIP);

        // Capture view content
        ob_start();
        require $viewFile;
        $content = ob_get_clean();

        // Render within layout if specified
        if ($layout !== null) {
            $layoutFile = self::$viewsPath . 'layouts/' . trim($layout, '/') . '.php';
            if (!file_exists($layoutFile)) {
                throw new RuntimeException("Layout file tidak ditemukan: {$layoutFile}");
            }
            require $layoutFile;
        } else {
            echo $content;
        }
    }
}
