<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\CentralSettingService;
use App\Services\TenantDatabaseBackupService;
use Illuminate\Console\Command;

class BackupAllTenantsCommand extends Command
{
    protected $signature = 'tenants:backup {--keep= : Override retention count per tenant}';

    protected $description = 'Backup MySQL databases for all registered tenants and prune old backups';

    public function handle(): int
    {
        $settings = CentralSettingService::getAutoBackupSettings();
        $keep = $this->option('keep') !== null
            ? max(1, (int) $this->option('keep'))
            : $settings['retention'];

        $tenants = Tenant::all();
        $total = $tenants->count();
        $success = 0;
        $failed = 0;

        foreach ($tenants as $tenant) {
            try {
                $backup = TenantDatabaseBackupService::createBackup($tenant);
                TenantDatabaseBackupService::pruneBackups($tenant, $keep);
                $this->info("[{$tenant->id}] Backup created: {$backup['filename']} ({$backup['size_human']})");
                $success++;
            } catch (\Throwable $e) {
                report($e);
                $this->error("[{$tenant->id}] Failed: {$e->getMessage()}");
                $failed++;
            }
        }

        $summary = $failed > 0
            ? "{$success}/{$total} tenan berhasil ({$failed} gagal)"
            : "{$success}/{$total} tenan berhasil dibackup";

        CentralSettingService::recordAutoBackupRun($summary);

        $this->line("Summary: {$summary}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
