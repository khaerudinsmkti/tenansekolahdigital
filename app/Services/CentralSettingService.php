<?php

declare(strict_types=1);

namespace App\Services;

class CentralSettingService
{
    private static function filePath(): string
    {
        // Use base_path() so FilesystemTenancyBootstrapper does not suffix the path inside tenant requests.
        return base_path('storage/app/central-settings.json');
    }

    /**
     * @return array<string, mixed>
     */
    private static function readAll(): array
    {
        $path = self::filePath();
        if (! is_file($path)) {
            return [];
        }

        $data = json_decode((string) file_get_contents($path), true);

        return is_array($data) ? $data : [];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private static function writeAll(array $data): void
    {
        $dir = dirname(self::filePath());
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(
            self::filePath(),
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    public static function getThemeColor(): string
    {
        $data = self::readAll();
        $color = is_string($data['theme_color'] ?? null) ? $data['theme_color'] : 'sd-orange';

        return array_key_exists($color, ThemeService::getThemes()) ? $color : 'sd-orange';
    }

    public static function setThemeColor(string $themeColor): void
    {
        $themes = ThemeService::getThemes();
        $validColor = array_key_exists($themeColor, $themes) ? $themeColor : 'sd-orange';

        $data = self::readAll();
        $data['theme_color'] = $validColor;
        self::writeAll($data);
    }

    public static function getThemeData(): array
    {
        return ThemeService::getTheme(self::getThemeColor());
    }

    /**
     * @return array{
     *     whatsapp: string,
     *     bank_name: string,
     *     account_number: string,
     *     account_name: string,
     *     email: string
     * }
     */
    public static function getBillingSettings(): array
    {
        $data = self::readAll();

        return [
            'whatsapp' => (string) ($data['billing_whatsapp'] ?? env('CENTRAL_BILLING_WHATSAPP', '6281234567890')),
            'bank_name' => (string) ($data['billing_bank'] ?? env('CENTRAL_BILLING_BANK', 'Bank BCA')),
            'account_number' => (string) ($data['billing_account'] ?? env('CENTRAL_BILLING_ACCOUNT', '1234567890')),
            'account_name' => (string) ($data['billing_owner'] ?? env('CENTRAL_BILLING_OWNER', 'PT Sekolah Digital Indonesia')),
            'email' => (string) ($data['billing_email'] ?? env('CENTRAL_ADMIN_EMAIL', 'admin@central.local')),
        ];
    }

    /**
     * @param  array{
     *     whatsapp: string,
     *     bank_name: string,
     *     account_number: string,
     *     account_name: string,
     *     email: string
     * }  $billing
     */
    public static function setBillingSettings(array $billing): void
    {
        $data = self::readAll();
        $data['billing_whatsapp'] = $billing['whatsapp'];
        $data['billing_bank'] = $billing['bank_name'];
        $data['billing_account'] = $billing['account_number'];
        $data['billing_owner'] = $billing['account_name'];
        $data['billing_email'] = $billing['email'];
        self::writeAll($data);
    }
}
