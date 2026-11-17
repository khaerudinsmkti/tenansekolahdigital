<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;

class CreateTenantCommand extends Command
{
    protected $signature = 'tenant:create
                            {id : Unique tenant identifier (e.g. smkn1)}
                            {domain : Subdomain or custom domain (e.g. smkn1.domain.com or smkn1.sch.id)}
                            {--name= : Optional school display name}';

    protected $description = 'Create a new school tenant with its own MySQL database and domain';

    public function handle(): int
    {
        $id = (string) $this->argument('id');
        $domain = strtolower(trim((string) $this->argument('domain')));
        $name = $this->option('name') ?: $id;

        foreach (config('tenancy.central_domains', []) as $centralDomain) {
            $suffix = '.'.strtolower(trim((string) $centralDomain));
            if (str_ends_with($domain, $suffix)) {
                $domain = substr($domain, 0, -strlen($suffix));
                break;
            }
        }

        if (Tenant::query()->whereKey($id)->exists()) {
            $this->error("Tenant [{$id}] already exists.");

            return self::FAILURE;
        }

        $tenant = Tenant::create([
            'id' => $id,
            'name' => $name,
        ]);

        $tenant->domains()->create([
            'domain' => $domain,
        ]);

        $this->info("Tenant [{$id}] created with domain [{$domain}] and its database migrated.");

        return self::SUCCESS;
    }
}
