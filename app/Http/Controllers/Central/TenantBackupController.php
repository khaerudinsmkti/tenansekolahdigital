<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantDatabaseBackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
}
