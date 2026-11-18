<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

    /**
     * @return array{
     *     name: string,
     *     logo_path: string|null,
     *     logo_url: string|null
     * }
     */
    public static function getBrandingSettings(): array
    {
        $data = self::readAll();
        $logoPath = is_string($data['logo_path'] ?? null) && $data['logo_path'] !== ''
            ? $data['logo_path']
            : null;

        return [
            'name' => (string) ($data['app_name'] ?? config('app.name', 'SekolahDigital')),
            'logo_path' => $logoPath,
            'logo_url' => $logoPath ? '/storage/'.ltrim($logoPath, '/') : null,
        ];
    }

    public static function setBrandingSettings(string $name, ?string $logoPath): void
    {
        $data = self::readAll();
        $data['app_name'] = $name;
        $data['logo_path'] = $logoPath;
        self::writeAll($data);
    }

    /**
     * @return array<int, array{
     *     id: string,
     *     name: string,
     *     email: string,
     *     password_hash: string,
     *     created_at: string
     * }>
     */
    public static function getAdminAccounts(): array
    {
        $data = self::readAll();
        $admins = $data['central_admins'] ?? null;

        if (! is_array($admins) || count($admins) === 0) {
            $defaultAdmin = [
                'id' => (string) Str::uuid(),
                'name' => 'Administrator Central',
                'email' => strtolower(trim((string) env('CENTRAL_ADMIN_EMAIL', 'admin@central.local'))),
                'password_hash' => Hash::make((string) env('CENTRAL_ADMIN_PASSWORD', 'admin12345')),
                'created_at' => now()->toIso8601String(),
            ];

            $data['central_admins'] = [$defaultAdmin];
            self::writeAll($data);

            return [$defaultAdmin];
        }

        return array_values($admins);
    }

    /**
     * @return array<int, array{
     *     id: string,
     *     name: string,
     *     email: string,
     *     created_at: string
     * }>
     */
    public static function getPublicAdminAccounts(): array
    {
        return array_map(static fn (array $admin): array => [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'created_at' => $admin['created_at'] ?? '',
        ], self::getAdminAccounts());
    }

    /**
     * @return array{id: string, name: string, email: string, password_hash: string, created_at: string}|null
     */
    public static function findAdminByEmail(string $email): ?array
    {
        $target = strtolower(trim($email));

        foreach (self::getAdminAccounts() as $admin) {
            if (strtolower(trim($admin['email'])) === $target) {
                return $admin;
            }
        }

        return null;
    }

    public static function createAdminAccount(string $name, string $email, string $password): void
    {
        $admins = self::getAdminAccounts();
        $admins[] = [
            'id' => (string) Str::uuid(),
            'name' => trim($name),
            'email' => strtolower(trim($email)),
            'password_hash' => Hash::make($password),
            'created_at' => now()->toIso8601String(),
        ];

        $data = self::readAll();
        $data['central_admins'] = $admins;
        self::writeAll($data);
    }

    public static function updateAdminAccount(string $id, string $name, string $email, ?string $password = null): bool
    {
        $admins = self::getAdminAccounts();
        $updated = false;

        foreach ($admins as &$admin) {
            if ($admin['id'] === $id) {
                $admin['name'] = trim($name);
                $admin['email'] = strtolower(trim($email));
                if ($password !== null && $password !== '') {
                    $admin['password_hash'] = Hash::make($password);
                }
                $updated = true;
                break;
            }
        }
        unset($admin);

        if ($updated) {
            $data = self::readAll();
            $data['central_admins'] = $admins;
            self::writeAll($data);
        }

        return $updated;
    }

    public static function deleteAdminAccount(string $id): bool
    {
        $admins = self::getAdminAccounts();
        if (count($admins) <= 1) {
            return false;
        }

        $filtered = array_values(array_filter(
            $admins,
            static fn (array $admin): bool => $admin['id'] !== $id
        ));

        if (count($filtered) === count($admins)) {
            return false;
        }

        $data = self::readAll();
        $data['central_admins'] = $filtered;
        self::writeAll($data);

        return true;
    }
}
