<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\CentralTutorial;
use App\Models\Tenant;
use App\Models\Tutorial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CentralTutorialController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validRoles = array_merge(['all'], array_keys(Tutorial::getAvailableRoles()));

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'youtube_url' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'target_roles' => ['required', 'array', 'min:1'],
            'target_roles.*' => ['string', 'in:'.implode(',', $validRoles)],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $youtubeId = Tutorial::extractYoutubeId($validated['youtube_url']);
        if (! $youtubeId) {
            return back()->withErrors([
                'youtube_url' => 'Link YouTube tidak valid. Gunakan URL YouTube atau ID video yang benar.',
            ]);
        }

        $tutorial = CentralTutorial::create([
            'title' => $validated['title'],
            'youtube_url' => $validated['youtube_url'],
            'youtube_id' => $youtubeId,
            'description' => $validated['description'] ?? null,
            'target_roles' => array_values($validated['target_roles']),
            'order' => (int) ($validated['order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $syncedCount = $this->syncTutorialToAllTenants($tutorial);

        return back()->with('success', "Video tutorial \"{$tutorial->title}\" berhasil ditambahkan & disinkronkan ke {$syncedCount} tenan.");
    }

    public function update(Request $request, CentralTutorial $tutorial): RedirectResponse
    {
        $validRoles = array_merge(['all'], array_keys(Tutorial::getAvailableRoles()));

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'youtube_url' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'target_roles' => ['required', 'array', 'min:1'],
            'target_roles.*' => ['string', 'in:'.implode(',', $validRoles)],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $youtubeId = Tutorial::extractYoutubeId($validated['youtube_url']);
        if (! $youtubeId) {
            return back()->withErrors([
                'youtube_url' => 'Link YouTube tidak valid. Gunakan URL YouTube atau ID video yang benar.',
            ]);
        }

        $previousYoutubeId = $tutorial->youtube_id;

        $tutorial->update([
            'title' => $validated['title'],
            'youtube_url' => $validated['youtube_url'],
            'youtube_id' => $youtubeId,
            'description' => $validated['description'] ?? null,
            'target_roles' => array_values($validated['target_roles']),
            'order' => (int) ($validated['order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $syncedCount = $this->syncTutorialToAllTenants($tutorial, $previousYoutubeId);

        return back()->with('success', "Video tutorial \"{$tutorial->title}\" berhasil diperbarui di {$syncedCount} tenan.");
    }

    public function toggle(CentralTutorial $tutorial): RedirectResponse
    {
        $tutorial->update([
            'is_active' => ! $tutorial->is_active,
        ]);

        $syncedCount = $this->syncTutorialToAllTenants($tutorial);
        $statusText = $tutorial->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Video tutorial \"{$tutorial->title}\" {$statusText} di {$syncedCount} tenan.");
    }

    public function destroy(CentralTutorial $tutorial): RedirectResponse
    {
        $youtubeId = $tutorial->youtube_id;
        $title = $tutorial->title;
        $tutorial->delete();

        $deletedCount = 0;
        foreach (Tenant::all() as $tenant) {
            try {
                $tenant->run(function () use ($youtubeId): void {
                    Tutorial::query()->where('youtube_id', $youtubeId)->delete();
                });
                $deletedCount++;
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', "Video tutorial \"{$title}\" dihapus dari central & {$deletedCount} tenan.");
    }

    public function syncAll(): RedirectResponse
    {
        $centralTutorials = CentralTutorial::query()
            ->orderBy('order')
            ->orderBy('id')
            ->get();

        $syncedTenants = 0;
        foreach (Tenant::all() as $tenant) {
            try {
                $tenant->run(function () use ($centralTutorials): void {
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
                $syncedTenants++;
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', "Seluruh video tutorial berhasil disinkronkan ke {$syncedTenants} tenan.");
    }

    private function syncTutorialToAllTenants(CentralTutorial $tutorial, ?string $previousYoutubeId = null): int
    {
        $syncedCount = 0;

        foreach (Tenant::all() as $tenant) {
            try {
                $tenant->run(function () use ($tutorial, $previousYoutubeId): void {
                    $lookupKey = $previousYoutubeId ?: $tutorial->youtube_id;

                    $existing = Tutorial::query()
                        ->where('youtube_id', $lookupKey)
                        ->first();

                    $attributes = [
                        'title' => $tutorial->title,
                        'youtube_url' => $tutorial->youtube_url,
                        'youtube_id' => $tutorial->youtube_id,
                        'description' => $tutorial->description,
                        'target_roles' => $tutorial->target_roles,
                        'order' => $tutorial->order,
                        'is_active' => $tutorial->is_active,
                    ];

                    if ($existing) {
                        $existing->update($attributes);
                    } else {
                        Tutorial::query()->create($attributes);
                    }
                });

                $syncedCount++;
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $syncedCount;
    }
}
