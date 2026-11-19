<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use ZipArchive;

class TenantStorageBackupService
{
    public static function tenantPublicDir(Tenant $tenant): string
    {
        $prefix = (string) config('tenancy.filesystem.suffix_base', 'tenant');

        return base_path('storage/'.$prefix.$tenant->id.'/app/public');
    }

    public static function backupDir(Tenant $tenant): string
    {
        $safeId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $tenant->id) ?: 'tenant';

        return base_path('storage/app/central-storage-backups/'.$safeId);
    }

    /**
     * @return array{file_count: int, total_size: int, total_size_human: string}
     */
    public static function getStorageStats(Tenant $tenant): array
    {
        $publicDir = self::tenantPublicDir($tenant);
        if (! is_dir($publicDir)) {
            return [
                'file_count' => 0,
                'total_size' => 0,
                'total_size_human' => '0 B',
            ];
        }

        $count = 0;
        $totalSize = 0;

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($publicDir, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $count++;
                $totalSize += $file->getSize();
            }
        }

        return [
            'file_count' => $count,
            'total_size' => $totalSize,
            'total_size_human' => self::formatBytes($totalSize),
        ];
    }

    /**
     * @return array<int, array{filename: string, size: int, size_human: string, created_at: string}>
     */
    public static function listBackups(Tenant $tenant): array
    {
        $dir = self::backupDir($tenant);
        if (! is_dir($dir)) {
            return [];
        }

        $files = glob($dir.'/*.zip') ?: [];
        $items = [];

        foreach ($files as $path) {
            if (! is_file($path)) {
                continue;
            }
            $size = (int) filesize($path);
            $mtime = (int) filemtime($path);
            $items[] = [
                'filename' => basename($path),
                'size' => $size,
                'size_human' => self::formatBytes($size),
                'created_at' => date('c', $mtime),
            ];
        }

        usort($items, static fn (array $a, array $b): int => strcmp($b['created_at'], $a['created_at']));

        return $items;
    }

    /**
     * @return array{filename: string, size: int, size_human: string, file_count: int, created_at: string}
     */
    public static function createBackup(Tenant $tenant): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('Ekstensi PHP ZipArchive belum aktif di server.');
        }

        $publicDir = self::tenantPublicDir($tenant);
        if (! is_dir($publicDir)) {
            throw new RuntimeException('Folder storage tenan belum tersedia atau masih kosong.');
        }

        $dir = self::backupDir($tenant);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'storage-'.$tenant->id.'-'.date('Ymd-His').'.zip';
        $fullPath = $dir.'/'.$filename;

        $zip = new ZipArchive;
        if ($zip->open($fullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Gagal membuat arsip ZIP backup storage.');
        }

        $realBase = realpath($publicDir);
        if ($realBase === false) {
            $zip->close();
            throw new RuntimeException('Gagal membaca direktori storage tenan.');
        }

        $fileCount = 0;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($realBase, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $filePath = $file->getRealPath();
            if ($filePath === false) {
                continue;
            }

            $relativePath = ltrim(str_replace('\\', '/', substr($filePath, strlen($realBase))), '/');
            if ($relativePath === '') {
                continue;
            }

            $zip->addFile($filePath, $relativePath);
            $fileCount++;
        }

        $zip->close();

        if ($fileCount === 0) {
            if (is_file($fullPath)) {
                @unlink($fullPath);
            }
            throw new RuntimeException('Folder storage tenan masih kosong (belum ada gambar atau file PDF).');
        }

        $size = (int) filesize($fullPath);

        return [
            'filename' => $filename,
            'size' => $size,
            'size_human' => self::formatBytes($size),
            'file_count' => $fileCount,
            'created_at' => date('c', (int) filemtime($fullPath)),
        ];
    }

    public static function getBackupPath(Tenant $tenant, string $filename): ?string
    {
        $safeName = basename($filename);
        if ($safeName === '' || ! str_ends_with(strtolower($safeName), '.zip')) {
            return null;
        }

        $path = self::backupDir($tenant).'/'.$safeName;

        return is_file($path) ? $path : null;
    }

    /**
     * @return array{restored_files: int}
     */
    public static function restoreFromZip(Tenant $tenant, string $zipPath): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('Ekstensi PHP ZipArchive belum aktif di server.');
        }

        if (! is_file($zipPath)) {
            throw new RuntimeException('File arsip .zip tidak ditemukan.');
        }

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('File arsip .zip rusak atau tidak dapat dibuka.');
        }

        $blockedExtensions = ['php', 'phtml', 'phar', 'sh', 'bat', 'exe', 'cmd'];
        $entriesToExtract = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false) {
                continue;
            }

            $normalized = str_replace('\\', '/', $name);

            // Prevent Zip Slip / directory traversal
            if (
                str_starts_with($normalized, '/')
                || str_contains($normalized, '../')
                || str_contains($normalized, '..\\')
                || preg_match('/^[a-zA-Z]:/', $normalized) === 1
            ) {
                $zip->close();
                throw new RuntimeException('Arsip ZIP mengandung path file yang tidak aman.');
            }

            if (str_ends_with($normalized, '/')) {
                continue;
            }

            $ext = strtolower(pathinfo($normalized, PATHINFO_EXTENSION));
            if (in_array($ext, $blockedExtensions, true) || basename($normalized) === '.htaccess') {
                continue;
            }

            $entriesToExtract[] = [
                'index' => $i,
                'relative' => ltrim($normalized, '/'),
            ];
        }

        if (count($entriesToExtract) === 0) {
            $zip->close();
            throw new RuntimeException('Arsip ZIP tidak berisi file gambar/PDF yang valid.');
        }

        $publicDir = self::tenantPublicDir($tenant);
        if (! is_dir($publicDir)) {
            mkdir($publicDir, 0755, true);
        } else {
            File::cleanDirectory($publicDir);
        }

        $restoredCount = 0;
        foreach ($entriesToExtract as $entry) {
            $targetPath = $publicDir.'/'.$entry['relative'];
            $targetDir = dirname($targetPath);
            if (! is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            $stream = $zip->getStream($zip->getNameIndex($entry['index']));
            if ($stream === false) {
                continue;
            }

            $out = fopen($targetPath, 'wb');
            if ($out !== false) {
                stream_copy_to_stream($stream, $out);
                fclose($out);
                $restoredCount++;
            }
            fclose($stream);
        }

        $zip->close();

        return [
            'restored_files' => $restoredCount,
        ];
    }

    public static function deleteBackup(Tenant $tenant, string $filename): bool
    {
        $path = self::getBackupPath($tenant, $filename);
        if ($path === null) {
            return false;
        }

        return @unlink($path);
    }

    public static function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1).' KB';
        }
        if ($bytes < 1073741824) {
            return round($bytes / 1048576, 2).' MB';
        }

        return round($bytes / 1073741824, 2).' GB';
    }
}
