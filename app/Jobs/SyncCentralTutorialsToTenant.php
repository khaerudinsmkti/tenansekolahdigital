<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CentralTutorial;
use App\Models\Tenant;
use App\Models\Tutorial;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncCentralTutorialsToTenant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Tenant $tenant) {}

    public function handle(): void
    {
        $centralTutorials = CentralTutorial::query()
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        if ($centralTutorials->isEmpty()) {
            return;
        }

        $this->tenant->run(function () use ($centralTutorials): void {
            foreach ($centralTutorials as $item) {
                Tutorial::query()->updateOrCreate(
                    ['youtube_id' => $item->youtube_id],
                    [
                        'title' => $item->title,
                        'youtube_url' => $item->youtube_url,
                        'description' => $item->description,
                        'target_roles' => $item->target_roles,
                        'order' => $item->order,
                        'is_active' => $item->is_active,
                    ]
                );
            }
        });
    }
}
