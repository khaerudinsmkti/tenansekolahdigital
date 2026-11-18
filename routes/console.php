<?php

use App\Services\CentralSettingService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pengingat Presensi Otomatis ke Ponsel Guru via VAPID Web Push
Schedule::command('attendance:send-reminders')
    ->hourly()
    ->between('06:30', '16:00')
    ->withoutOverlapping()
    ->runInBackground();

// Backup Otomatis Database Seluruh Tenan (Harian / Mingguan / Bulanan)
$autoBackup = CentralSettingService::getAutoBackupSettings();
if ($autoBackup['enabled']) {
    $backupEvent = Schedule::command('tenants:backup')
        ->timezone(config('app.timezone', 'Asia/Jakarta'))
        ->withoutOverlapping();

    match ($autoBackup['frequency']) {
        'weekly' => $backupEvent->weeklyOn(0, $autoBackup['time']),
        'monthly' => $backupEvent->monthlyOn(1, $autoBackup['time']),
        default => $backupEvent->dailyAt($autoBackup['time']),
    };
}
