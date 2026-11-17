<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\SchoolSetting;
use App\Models\Tenant;
use App\Services\CentralSettingService;
use App\Services\TenantLicenseService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantLicenseActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! function_exists('tenancy') || ! tenancy()->initialized) {
            return $next($request);
        }

        $tenant = tenant();
        if (! $tenant instanceof Tenant) {
            return $next($request);
        }

        $license = TenantLicenseService::getStatus($tenant);
        if ($license['is_usable']) {
            return $next($request);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'message' => $license['status'] === 'upcoming'
                    ? 'Masa aktif lisensi aplikasi sekolah belum dimulai.'
                    : 'Masa aktif lisensi aplikasi sekolah telah berakhir.',
                'license' => $license,
            ], 403);
        }

        $schoolName = $tenant->name ?? $tenant->id;
        try {
            $settingName = SchoolSetting::getSetting()->name;
            if ($settingName) {
                $schoolName = $settingName;
            }
        } catch (\Throwable) {
            // Fallback to tenant name if school_settings table is not ready
        }

        return Inertia::render('tenant/license-expired', [
            'license' => $license,
            'schoolName' => $schoolName,
            'tenantId' => $tenant->id,
            'host' => $request->getHost(),
            'billing' => CentralSettingService::getBillingSettings(),
        ])->toResponse($request)->setStatusCode(403);
    }
}
