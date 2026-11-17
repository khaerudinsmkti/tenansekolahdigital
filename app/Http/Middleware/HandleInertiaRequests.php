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
        $centralSchool = ! $isTenant ? [
            'name' => config('app.name', 'SekolahDigital'),
            'theme_color' => \App\Services\CentralSettingService::getThemeColor(),
            'theme_data' => \App\Services\CentralSettingService::getThemeData(),
        ] : null;
        $schoolName = $school?->name ?: config('app.name', 'AbsensiKu SD');

        return [
            ...parent::share($request),
            'isCentral' => ! $isTenant,
            'centralAdminAuthenticated' => ! $isTenant && (bool) $request->session()->get('central_admin_authenticated', false),
            'tenantLicense' => $isTenant && tenant() instanceof \App\Models\Tenant
                ? \App\Services\TenantLicenseService::getStatus(tenant())
                : null,
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
