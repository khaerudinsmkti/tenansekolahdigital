<?php

declare(strict_types=1);

namespace App\Services;

class CentralSettingService
{
    private static function filePath(): string
    {
        return storage_path('app/central-settings.json');
    }

    public static function getThemeColor(): string
    {
        $path = self::filePath();
        if (! is_file($path)) {
            return 'sd-orange';
        }

        $data = json_decode((string) file_get_contents($path), true);
        $color = is_array($data) ? ($data['theme_color'] ?? 'sd-orange') : 'sd-orange';

        return array_key_exists($color, ThemeService::getThemes()) ? $color : 'sd-orange';
    }

    public static function setThemeColor(string $themeColor): void
    {
        $themes = ThemeService::getThemes();
        $validColor = array_key_exists($themeColor, $themes) ? $themeColor : 'sd-orange';

        $dir = dirname(self::filePath());
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(
            self::filePath(),
            json_encode(['theme_color' => $validColor], JSON_PRETTY_PRINT)
        );
    }

    public static function getThemeData(): array
    {
        return ThemeService::getTheme(self::getThemeColor());
    }
}
