<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $isTenant = function_exists('tenancy') && tenancy()->initialized;
        $user = $isTenant ? $request->user() : null;
        $isDutyToday = $user ? $user->isDutyTeacherToday() : false;
        $school = $isTenant ? \App\Models\SchoolSetting::getSetting() : null;
        $centralBranding = ! $isTenant ? \App\Services\CentralSettingService::getBrandingSettings() : null;
        $centralBilling = ! $isTenant ? \App\Services\CentralSettingService::getBillingSettings() : null;
        $centralSchool = ! $isTenant ? [
            'name' => $centralBranding['name'],
            'logo_url' => $centralBranding['logo_url'],
            'whatsapp' => $centralBilling['whatsapp'] ?? null,
            'email' => $centralBilling['email'] ?? null,
            'theme_color' => \App\Services\CentralSettingService::getThemeColor(),
            'theme_data' => \App\Services\CentralSettingService::getThemeData(),
        ] : null;
        $schoolName = $school?->name ?: ($centralBranding['name'] ?? config('app.name', 'AbsensiKu SD'));

        $tenantLicense = $isTenant && tenant() instanceof \App\Models\Tenant
            ? \App\Services\TenantLicenseService::getStatus(tenant())
            : null;
        $isLicenseExpiringSoon = $tenantLicense !== null
            && $tenantLicense['status'] === 'active'
            && $tenantLicense['days_remaining'] !== null
            && $tenantLicense['days_remaining'] <= 30;

        $centralUrl = null;
        if ($isTenant) {
            $requestHost = $request->getHost();
            $centralDomains = config('tenancy.central_domains', ['localhost', '127.0.0.1']);
            $matchedCentral = null;
            foreach ($centralDomains as $cd) {
                $cdClean = trim((string) $cd);
                if ($cdClean !== '' && str_ends_with($requestHost, '.' . $cdClean)) {
                    $matchedCentral = $cdClean;
                    break;
                }
            }
            $targetDomain = $matchedCentral ?: ($centralDomains[0] ?? null);
            if ($targetDomain) {
                $scheme = $request->getScheme();
                $port = $request->getPort();
                $portSuffix = ($port && ! in_array($port, [80, 443])) ? ':' . $port : '';
                $centralUrl = "{$scheme}://{$targetDomain}{$portSuffix}";
            } else {
                $centralUrl = config('app.url', '/');
            }
        } else {
            $centralUrl = url('/');
        }

        return [
            ...parent::share($request),
            'isCentral' => ! $isTenant,
            'centralUrl' => $centralUrl,
            'centralAdminAuthenticated' => ! $isTenant && (bool) $request->session()->get('central_admin_authenticated', false),
            'tenantLicense' => $tenantLicense,
            'centralBilling' => $isLicenseExpiringSoon ? \App\Services\CentralSettingService::getBillingSettings() : null,
            'sessionLoginKey' => $isTenant && $user ? sha1((string) $request->session()->getId()) : null,
            'name' => $schoolName,
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'is_duty_teacher_today' => $isDutyToday,
                ]) : null,
                'pending_attendance' => $user ? $user->getPendingAttendanceStatus() : null,
                'permissions' => $user ? ($user->isAdmin() ? '*' : (\App\Services\PermissionService::getMatrix()[$user->role] ?? [])) : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'contact_success' => fn () => $request->session()->get('contact_success'),
            ],
            'school' => fn () => $isTenant ? $school : $centralSchool,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
