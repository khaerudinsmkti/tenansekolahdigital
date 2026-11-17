<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\CentralSettingService;
use App\Services\ThemeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Stancl\Tenancy\Database\Models\Domain;

class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        $centralDomains = config('tenancy.central_domains', ['127.0.0.1', 'localhost']);
        $currentHost = $request->getHost();
        $scheme = $request->getScheme();
        $port = $request->getPort();
        $portSuffix = in_array($port, [80, 443], true) ? '' : ':'.$port;

        // Pick a non-IP central domain as base for subdomain preview when possible
        $baseDomain = collect($centralDomains)
            ->first(fn (string $d): bool => ! filter_var($d, FILTER_VALIDATE_IP))
            ?? $currentHost;

        $tenants = Tenant::with('domains')
            ->latest()
            ->get()
            ->map(function (Tenant $tenant) use ($scheme, $baseDomain, $portSuffix): array {
                $domains = $tenant->domains->map(function (Domain $domain) use ($scheme, $baseDomain, $portSuffix): array {
                    $isCustomDomain = str_contains($domain->domain, '.');
                    $fullHost = $isCustomDomain
                        ? $domain->domain
                        : $domain->domain.'.'.$baseDomain;

                    return [
                        'id' => $domain->id,
                        'domain' => $domain->domain,
                        'type' => $isCustomDomain ? 'custom' : 'subdomain',
                        'full_host' => $fullHost,
                        'url' => $scheme.'://'.$fullHost.$portSuffix,
                    ];
                })->values();

                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name ?? $tenant->id,
                    'database' => $tenant->database()->getName(),
                    'created_at' => $tenant->created_at?->toIso8601String(),
                    'domains' => $domains,
                ];
            })
            ->values();

        $allDomains = $tenants->flatMap(fn (array $t) => $t['domains']);

        return Inertia::render('central/dashboard', [
            'tenants' => $tenants,
            'stats' => [
                'total_tenants' => $tenants->count(),
                'total_domains' => $allDomains->count(),
                'subdomains_count' => $allDomains->where('type', 'subdomain')->count(),
                'custom_domains_count' => $allDomains->where('type', 'custom')->count(),
            ],
            'central' => [
                'current_host' => $currentHost,
                'base_domain' => $baseDomain,
                'port_suffix' => $portSuffix,
                'scheme' => $scheme,
                'central_domains' => $centralDomains,
            ],
            'themes' => array_values(ThemeService::getThemes()),
            'currentTheme' => CentralSettingService::getThemeColor(),
        ]);
    }

    public function updateTheme(Request $request): RedirectResponse
    {
        $validKeys = array_keys(ThemeService::getThemes());

        $validated = $request->validate([
            'theme_color' => ['required', 'string', Rule::in($validKeys)],
        ]);

        CentralSettingService::setThemeColor($validated['theme_color']);

        $themeName = ThemeService::getTheme($validated['theme_color'])['name'] ?? $validated['theme_color'];

        return back()->with('success', "Tema warna landing page central berhasil diubah ke \"{$themeName}\".");
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'id' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9][a-z0-9\-_]*$/', 'unique:tenants,id'],
            'domain_type' => ['required', Rule::in(['subdomain', 'custom'])],
            'domain' => ['required', 'string', 'max:190'],
        ], [
            'id.regex' => 'ID tenant hanya boleh huruf kecil, angka, tanda hubung (-), atau underscore (_).',
            'id.unique' => 'ID sekolah ini sudah terdaftar.',
        ]);

        $normalizedDomain = $this->normalizeDomain(
            $validated['domain'],
            $validated['domain_type']
        );

        if ($this->isCentralDomain($normalizedDomain)) {
            return back()->withErrors([
                'domain' => 'Domain tidak boleh sama dengan central domain.',
            ]);
        }

        if (Domain::query()->where('domain', $normalizedDomain)->exists()) {
            return back()->withErrors([
                'domain' => "Domain/subdomain [{$normalizedDomain}] sudah digunakan sekolah lain.",
            ]);
        }

        $tenant = Tenant::create([
            'id' => $validated['id'],
            'name' => $validated['name'],
        ]);

        $tenant->domains()->create([
            'domain' => $normalizedDomain,
        ]);

        return back()->with('success', "Sekolah \"{$validated['name']}\" berhasil dibuat beserta database & domain [{$normalizedDomain}].");
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]);

        $tenant->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', "Nama sekolah [{$tenant->id}] berhasil diperbarui.");
    }

    public function storeDomain(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'domain_type' => ['required', Rule::in(['subdomain', 'custom'])],
            'domain' => ['required', 'string', 'max:190'],
        ]);

        $normalizedDomain = $this->normalizeDomain(
            $validated['domain'],
            $validated['domain_type']
        );

        if ($this->isCentralDomain($normalizedDomain)) {
            return back()->withErrors([
                'domain' => 'Domain tidak boleh sama dengan central domain.',
            ]);
        }

        if (Domain::query()->where('domain', $normalizedDomain)->exists()) {
            return back()->withErrors([
                'domain' => "Domain/subdomain [{$normalizedDomain}] sudah terdaftar.",
            ]);
        }

        $tenant->domains()->create([
            'domain' => $normalizedDomain,
        ]);

        return back()->with('success', "Domain [{$normalizedDomain}] berhasil ditambahkan ke {$tenant->name}.");
    }

    public function destroyDomain(Domain $domain): RedirectResponse
    {
        $domainName = $domain->domain;
        $domain->delete();

        return back()->with('success', "Domain [{$domainName}] berhasil dihapus.");
    }

    public function migrate(Tenant $tenant): RedirectResponse
    {
        Artisan::call('tenants:migrate', [
            '--tenants' => [$tenant->id],
            '--force' => true,
        ]);

        return back()->with('success', "Migrasi database untuk [{$tenant->id}] selesai dijalankan.");
    }

    public function migrateAll(): RedirectResponse
    {
        Artisan::call('tenants:migrate', [
            '--force' => true,
        ]);

        return back()->with('success', 'Migrasi database untuk seluruh sekolah berhasil dijalankan.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        $name = $tenant->name ?? $tenant->id;
        $tenant->delete();

        return back()->with('success', "Sekolah \"{$name}\" beserta database-nya berhasil dihapus.");
    }

    private function normalizeDomain(string $rawDomain, string $type): string
    {
        $domain = Str::lower(trim($rawDomain));
        $domain = preg_replace('#^https?://#', '', $domain) ?? $domain;
        $domain = rtrim($domain, '/');

        if ($type === 'subdomain') {
            foreach (config('tenancy.central_domains', []) as $centralDomain) {
                $suffix = '.'.Str::lower(trim((string) $centralDomain));
                if (str_ends_with($domain, $suffix)) {
                    $domain = substr($domain, 0, -strlen($suffix));
                    break;
                }
            }
        }

        return $domain;
    }

    private function isCentralDomain(string $domain): bool
    {
        $central = array_map(
            fn ($d) => Str::lower(trim((string) $d)),
            config('tenancy.central_domains', [])
        );

        return in_array($domain, $central, true);
    }
}
