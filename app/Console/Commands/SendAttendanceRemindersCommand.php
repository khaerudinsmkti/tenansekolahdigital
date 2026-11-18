<?php

namespace App\Console\Commands;

use App\Models\AcademicHoliday;
use App\Models\SchoolSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantLicenseService;
use App\Services\WebPushService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAttendanceRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:send-reminders {--force : Abaikan pengecekan jam operasional dan hari libur}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi Web Push VAPID ke guru yang belum melakukan absensi harian kelasnya.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isForced = (bool) $this->option('force');
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->info('Belum ada tenan yang terdaftar.');
            return self::SUCCESS;
        }

        $totalNotified = 0;

        foreach ($tenants as $tenant) {
            $license = TenantLicenseService::getStatus($tenant);
            if (! $license['is_usable'] && ! $isForced) {
                $this->line("[{$tenant->id}] Dilewati karena lisensi tidak aktif ({$license['status']}).");
                continue;
            }

            try {
                $sent = $tenant->run(fn (): int => $this->processTenant($tenant->id, $isForced));
                $totalNotified += $sent;
            } catch (\Throwable $e) {
                report($e);
                $this->error("[{$tenant->id}] Gagal memproses pengingat: {$e->getMessage()}");
            }
        }

        $this->info("Selesai seluruh tenan. Total {$totalNotified} notifikasi push berhasil dikirimkan.");

        return self::SUCCESS;
    }

    private function processTenant(string $tenantId, bool $isForced): int
    {
        $setting = SchoolSetting::getSetting();

        // 1. Cek apakah fitur pengingat PWA diaktifkan
        if (! $setting->pwa_reminder_enabled && ! $isForced) {
            $this->info("[{$tenantId}] Fitur pengingat presensi PWA sedang dinonaktifkan.");
            return 0;
        }

        $now = Carbon::now();
        $today = $now->toDateString();

        // 2. Cek hari libur sekolah (Kecuali jika --force)
        if (! $isForced) {
            $holiday = AcademicHoliday::getOffDay($today);
            if ($holiday) {
                $this->info("[{$tenantId}] Hari libur sekolah: {$holiday->name}.");
                return 0;
            }
        }

        // 3. Cek rentang jam operasional pengingat (Kecuali jika --force)
        if (! $isForced) {
            $startTime = substr($setting->pwa_reminder_start_time ?? '07:00', 0, 5);
            $endTime = substr($setting->pwa_reminder_end_time ?? '14:00', 0, 5);

            $currentHm = $now->format('H:i');
            if ($currentHm < $startTime || $currentHm > $endTime) {
                $this->info("[{$tenantId}] Di luar jam operasional pengingat ({$startTime} s.d {$endTime}).");
                return 0;
            }
        }

        // 4. Ambil semua guru aktif
        $teachers = User::where('role', 'teacher')->get();

        if ($teachers->isEmpty()) {
            $this->info("[{$tenantId}] Tidak ada pengguna dengan peran guru.");
            return 0;
        }

        $this->info("[{$tenantId}] Memeriksa status absensi untuk {$teachers->count()} guru...");

        $notifiedCount = 0;
        $title = $setting->pwa_reminder_title ?: 'Pengingat Presensi Siswa ⏰';
        $customMessage = $setting->pwa_reminder_message;

        foreach ($teachers as $teacher) {
            $status = $teacher->getPendingAttendanceStatus($today);

            if (! $status || empty($status['needs_attendance']) || empty($status['pending_classes'])) {
                continue;
            }

            $pendingClasses = $status['pending_classes'];
            $classNames = implode(', ', array_column($pendingClasses, 'name'));

            $body = $customMessage
                ? "{$customMessage} (Kelas: {$classNames})"
                : "Halo Bpk/Ibu {$teacher->name}, presensi siswa untuk kelas {$classNames} hari ini belum diisi. Harap segera melakukan absensi.";

            $payload = [
                'title' => $title,
                'body' => $body,
                'icon' => $setting->logo_url ?: '/icons/icon-192x192.png',
                'badge' => '/icons/icon-192x192.png',
                'url' => '/attendances',
                'tag' => 'attendance-reminder-' . $today,
                'timestamp' => now()->timestamp * 1000,
            ];

            $result = WebPushService::sendToUser($teacher, $payload);

            if (! empty($result['success']) && $result['sent_count'] > 0) {
                $notifiedCount += $result['sent_count'];
                $this->line("  ✓ [{$tenantId}] Notifikasi terkirim ke {$teacher->name} ({$result['sent_count']} perangkat) - Kelas: {$classNames}");
            } else {
                $this->line("  - [{$tenantId}] {$teacher->name} belum mengisi {$classNames}, namun belum mengaktifkan notifikasi.");
            }
        }

        return $notifiedCount;
    }
}
