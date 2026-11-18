<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\SyncCentralTutorialsToTenant;
use App\Models\SchoolSetting;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class ResetDemoTenantCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'demo:reset
                            {--tenant=demo : ID tenan demo yang akan direset}';

    /**
     * The console command description.
     */
    protected $description = 'Reset database tenan demo ke kondisi awal (migrate-fresh & seed ulang)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenantId = (string) $this->option('tenant');
        $tenant = Tenant::query()->find($tenantId);

        if (! $tenant) {
            $this->error("Tenan [{$tenantId}] tidak ditemukan.");

            return self::FAILURE;
        }

        $this->info("Mereset database tenan demo [{$tenantId}]...");

        $migrateExit = Artisan::call('tenants:migrate-fresh', [
            '--tenants' => [$tenantId],
        ], $this->output);

        if ($migrateExit !== self::SUCCESS) {
            $this->error("Gagal menjalankan tenants:migrate-fresh untuk [{$tenantId}].");

            return self::FAILURE;
        }

        $seedExit = Artisan::call('tenants:seed', [
            '--tenants' => [$tenantId],
            '--force' => true,
        ], $this->output);

        if ($seedExit !== self::SUCCESS) {
            $this->error("Gagal menjalankan tenants:seed untuk [{$tenantId}].");

            return self::FAILURE;
        }

        $tenant->run(function (): void {
            SchoolSetting::getSetting();
        });

        (new SyncCentralTutorialsToTenant($tenant))->handle();

        $this->info("Database tenan demo [{$tenantId}] berhasil direset ke kondisi default.");

        return self::SUCCESS;
    }
}
