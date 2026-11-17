<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Carbon\Carbon;

class TenantLicenseService
{
    /**
     * @return array{
     *     starts_at: string|null,
     *     expires_at: string|null,
     *     status: 'unlimited'|'upcoming'|'active'|'expired',
     *     is_usable: bool,
     *     days_remaining: int|null
     * }
     */
    public static function getStatus(Tenant $tenant): array
    {
        $startsAtRaw = $tenant->getAttribute('license_starts_at');
        $expiresAtRaw = $tenant->getAttribute('license_expires_at');

        $startsAt = is_string($startsAtRaw) && $startsAtRaw !== '' ? $startsAtRaw : null;
        $expiresAt = is_string($expiresAtRaw) && $expiresAtRaw !== '' ? $expiresAtRaw : null;

        if ($startsAt === null && $expiresAt === null) {
            return [
                'starts_at' => null,
                'expires_at' => null,
                'status' => 'unlimited',
                'is_usable' => true,
                'days_remaining' => null,
            ];
        }

        $tz = config('app.timezone', 'Asia/Jakarta');
        $today = Carbon::today($tz);

        if ($startsAt !== null) {
            $startDate = Carbon::parse($startsAt, $tz)->startOfDay();
            if ($today->lt($startDate)) {
                return [
                    'starts_at' => $startDate->toDateString(),
                    'expires_at' => $expiresAt ? Carbon::parse($expiresAt, $tz)->toDateString() : null,
                    'status' => 'upcoming',
                    'is_usable' => false,
                    'days_remaining' => null,
                ];
            }
        }

        if ($expiresAt !== null) {
            $endDate = Carbon::parse($expiresAt, $tz)->startOfDay();
            if ($today->gt($endDate)) {
                return [
                    'starts_at' => $startsAt ? Carbon::parse($startsAt, $tz)->toDateString() : null,
                    'expires_at' => $endDate->toDateString(),
                    'status' => 'expired',
                    'is_usable' => false,
                    'days_remaining' => 0,
                ];
            }

            return [
                'starts_at' => $startsAt ? Carbon::parse($startsAt, $tz)->toDateString() : null,
                'expires_at' => $endDate->toDateString(),
                'status' => 'active',
                'is_usable' => true,
                'days_remaining' => (int) $today->diffInDays($endDate),
            ];
        }

        return [
            'starts_at' => $startsAt ? Carbon::parse($startsAt, $tz)->toDateString() : null,
            'expires_at' => null,
            'status' => 'active',
            'is_usable' => true,
            'days_remaining' => null,
        ];
    }
}
