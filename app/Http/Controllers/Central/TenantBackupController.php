<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\CentralSettingService;
use App\Services\TenantDatabaseBackupService;
use App\Services\TenantStorageBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TenantBackupController extends Controller
{
    public function index(Tenant $tenant): JsonResponse
    {
        return response()->json([
            'backups' => TenantDatabaseBackupService::listBackups($tenant),
        ]);
    }

    public function store(Tenant $tenant): JsonResponse
    {
        try {
            $backup = TenantDatabaseBackupService::createBackup($tenant);

            return response()->json([
                'message' => "Backup database [{$tenant->database()->getName()}] berhasil dibuat.",
                'backup' => $backup,
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal membuat backup database: '.$e->getMessage(),
            ], 422);
        }
    }

    public function download(Tenant $tenant, string $filename): BinaryFileResponse
    {
        $path = TenantDatabaseBackupService::getBackupPath($tenant, $filename);
        if ($path === null) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return response()->download($path, basename($path), [
            'Content-Type' => 'application/sql',
        ]);
    }

    public function restore(Tenant $tenant, string $filename): JsonResponse
    {
        $path = TenantDatabaseBackupService::getBackupPath($tenant, $filename);
        if ($path === null) {
            return response()->json([
                'message' => 'File backup tidak ditemukan.',
            ], 404);
        }

        try {
            $sql = (string) file_get_contents($path);
            TenantDatabaseBackupService::restoreFromSql($tenant, $sql);

            return response()->json([
                'message' => "Database [{$tenant->database()->getName()}] berhasil di-restore dari {$filename}.",
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal restore database: '.$e->getMessage(),
            ], 422);
        }
    }

    public function restoreUpload(Request $request, Tenant $tenant): JsonResponse
    {
        $request->validate([
            'sql_file' => ['required', 'file', 'max:51200'],
        ], [
            'sql_file.required' => 'Pilih file .sql terlebih dahulu.',
            'sql_file.max' => 'Ukuran file maksimal 50 MB.',
        ]);

        $file = $request->file('sql_file');
        $ext = strtolower((string) $file->getClientOriginalExtension());
        if ($ext !== 'sql') {
            return response()->json([
                'message' => 'Format file harus .sql.',
            ], 422);
        }

        try {
            $sql = (string) file_get_contents($file->getRealPath());
            TenantDatabaseBackupService::restoreFromSql($tenant, $sql);

            return response()->json([
                'message' => "Database [{$tenant->database()->getName()}] berhasil di-restore dari file {$file->getClientOriginalName()}.",
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal restore database: '.$e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Tenant $tenant, string $filename): JsonResponse
    {
        if (! TenantDatabaseBackupService::deleteBackup($tenant, $filename)) {
            return response()->json([
                'message' => 'File backup tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => "Backup {$filename} berhasil dihapus.",
        ]);
    }

    public function updateAutoBackupSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'frequency' => ['required', Rule::in(['daily', 'weekly', 'monthly'])],
            'time' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'retention' => ['required', 'integer', 'min:1', 'max:90'],
        ], [
            'time.regex' => 'Format jam harus HH:MM (contoh: 02:00).',
        ]);

        CentralSettingService::setAutoBackupSettings([
            'enabled' => (bool) $validated['enabled'],
            'frequency' => (string) $validated['frequency'],
            'time' => (string) $validated['time'],
            'retention' => (int) $validated['retention'],
        ]);

        return back()->with('success', 'Pengaturan backup otomatis seluruh tenan berhasil disimpan.');
    }

    public function runAllNow(): RedirectResponse
    {
        Artisan::call('tenants:backup');

        $settings = CentralSettingService::getAutoBackupSettings();
        $summary = $settings['last_summary'] ?: 'Backup seluruh tenan selesai dijalankan.';

        return back()->with('success', "Backup massal selesai: {$summary}");
    }

    public function storageIndex(Tenant $tenant): JsonResponse
    {
        return response()->json([
            'backups' => TenantStorageBackupService::listBackups($tenant),
            'stats' => TenantStorageBackupService::getStorageStats($tenant),
        ]);
    }

    public function storageStore(Tenant $tenant): JsonResponse
    {
        try {
            $backup = TenantStorageBackupService::createBackup($tenant);

            return response()->json([
                'message' => "Backup storage [{$tenant->id}] berhasil dibuat ({$backup['file_count']} file, {$backup['size_human']}).",
                'backup' => $backup,
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal membuat backup storage: '.$e->getMessage(),
            ], 422);
        }
    }

    public function storageDownload(Tenant $tenant, string $filename): BinaryFileResponse
    {
        $path = TenantStorageBackupService::getBackupPath($tenant, $filename);
        if ($path === null) {
            abort(404, 'File backup storage tidak ditemukan.');
        }

        return response()->download($path, basename($path), [
            'Content-Type' => 'application/zip',
        ]);
    }

    public function storageRestore(Tenant $tenant, string $filename): JsonResponse
    {
        $path = TenantStorageBackupService::getBackupPath($tenant, $filename);
        if ($path === null) {
            return response()->json([
                'message' => 'File backup storage tidak ditemukan.',
            ], 404);
        }

        try {
            $result = TenantStorageBackupService::restoreFromZip($tenant, $path);

            return response()->json([
                'message' => "Storage tenan [{$tenant->id}] berhasil di-restore dari {$filename} ({$result['restored_files']} file).",
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal restore storage: '.$e->getMessage(),
            ], 422);
        }
    }

    public function storageRestoreUpload(Request $request, Tenant $tenant): JsonResponse
    {
        $request->validate([
            'zip_file' => ['required', 'file', 'max:204800'],
        ], [
            'zip_file.required' => 'Pilih file .zip terlebih dahulu.',
            'zip_file.max' => 'Ukuran file maksimal 200 MB.',
        ]);

        $file = $request->file('zip_file');
        $ext = strtolower((string) $file->getClientOriginalExtension());
        if ($ext !== 'zip') {
            return response()->json([
                'message' => 'Format file harus .zip.',
            ], 422);
        }

        try {
            $result = TenantStorageBackupService::restoreFromZip($tenant, (string) $file->getRealPath());

            return response()->json([
                'message' => "Storage tenan [{$tenant->id}] berhasil di-restore dari {$file->getClientOriginalName()} ({$result['restored_files']} file).",
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal restore storage: '.$e->getMessage(),
            ], 422);
        }
    }

    public function storageDestroy(Tenant $tenant, string $filename): JsonResponse
    {
        if (! TenantStorageBackupService::deleteBackup($tenant, $filename)) {
            return response()->json([
                'message' => 'File backup storage tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => "Backup storage {$filename} berhasil dihapus.",
        ]);
    }
}
