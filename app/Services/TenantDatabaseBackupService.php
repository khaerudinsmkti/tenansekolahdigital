<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use PDO;

class TenantDatabaseBackupService
{
    public static function backupDir(Tenant $tenant): string
    {
        $safeId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $tenant->id) ?: 'tenant';

        return base_path('storage/app/central-backups/'.$safeId);
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

        $files = glob($dir.'/*.sql') ?: [];
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
     * @return array{filename: string, size: int, size_human: string, created_at: string}
     */
    public static function createBackup(Tenant $tenant): array
    {
        $dir = self::backupDir($tenant);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'backup-'.$tenant->id.'-'.date('Ymd-His').'.sql';
        $fullPath = $dir.'/'.$filename;

        $sql = self::exportSql($tenant);
        file_put_contents($fullPath, $sql);

        $size = (int) filesize($fullPath);

        return [
            'filename' => $filename,
            'size' => $size,
            'size_human' => self::formatBytes($size),
            'created_at' => date('c', (int) filemtime($fullPath)),
        ];
    }

    public static function getBackupPath(Tenant $tenant, string $filename): ?string
    {
        $safeName = basename($filename);
        if (! preg_match('/^[a-zA-Z0-9_\-\.]+\.sql$/', $safeName)) {
            return null;
        }

        $fullPath = self::backupDir($tenant).'/'.$safeName;

        return is_file($fullPath) ? $fullPath : null;
    }

    public static function deleteBackup(Tenant $tenant, string $filename): bool
    {
        $path = self::getBackupPath($tenant, $filename);
        if ($path === null) {
            return false;
        }

        return unlink($path);
    }

    public static function pruneBackups(Tenant $tenant, int $keep): int
    {
        if ($keep < 1) {
            return 0;
        }

        $backups = self::listBackups($tenant);
        if (count($backups) <= $keep) {
            return 0;
        }

        $deleted = 0;
        foreach (array_slice($backups, $keep) as $old) {
            if (self::deleteBackup($tenant, $old['filename'])) {
                $deleted++;
            }
        }

        return $deleted;
    }

    public static function exportSql(Tenant $tenant): string
    {
        return $tenant->run(function () use ($tenant): string {
            $pdo = DB::connection()->getPdo();
            $dbName = $tenant->database()->getName();

            $lines = [
                '-- TenanSekolahDigital MySQL Backup',
                '-- Tenant ID: '.$tenant->id,
                '-- Database: '.$dbName,
                '-- Generated: '.date('Y-m-d H:i:s'),
                '',
                'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";',
                'SET FOREIGN_KEY_CHECKS = 0;',
                'SET NAMES utf8mb4;',
                '',
            ];

            $tablesStmt = $pdo->query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            $tables = $tablesStmt ? $tablesStmt->fetchAll(PDO::FETCH_NUM) : [];

            foreach ($tables as $row) {
                $table = (string) $row[0];
                $quotedTable = '`'.str_replace('`', '``', $table).'`';

                $createStmt = $pdo->query("SHOW CREATE TABLE {$quotedTable}");
                $createRow = $createStmt ? $createStmt->fetch(PDO::FETCH_NUM) : false;
                if (! $createRow || ! isset($createRow[1])) {
                    continue;
                }

                $lines[] = '-- --------------------------------------------------------';
                $lines[] = "-- Table structure for {$quotedTable}";
                $lines[] = '-- --------------------------------------------------------';
                $lines[] = "DROP TABLE IF EXISTS {$quotedTable};";
                $lines[] = $createRow[1].';';
                $lines[] = '';

                $dataStmt = $pdo->query("SELECT * FROM {$quotedTable}");
                if (! $dataStmt) {
                    continue;
                }

                $colCount = $dataStmt->columnCount();
                $colNames = [];
                for ($i = 0; $i < $colCount; $i++) {
                    $meta = $dataStmt->getColumnMeta($i);
                    $colName = (string) ($meta['name'] ?? "col_{$i}");
                    $colNames[] = '`'.str_replace('`', '``', $colName).'`';
                }
                $colList = implode(', ', $colNames);

                $batch = [];
                while (($record = $dataStmt->fetch(PDO::FETCH_NUM)) !== false) {
                    $values = [];
                    foreach ($record as $val) {
                        if ($val === null) {
                            $values[] = 'NULL';
                        } elseif (is_int($val) || is_float($val)) {
                            $values[] = (string) $val;
                        } else {
                            $values[] = $pdo->quote((string) $val);
                        }
                    }
                    $batch[] = '('.implode(', ', $values).')';

                    if (count($batch) >= 100) {
                        $lines[] = "INSERT INTO {$quotedTable} ({$colList}) VALUES";
                        $lines[] = implode(",\n", $batch).';';
                        $batch = [];
                    }
                }

                if (count($batch) > 0) {
                    $lines[] = "INSERT INTO {$quotedTable} ({$colList}) VALUES";
                    $lines[] = implode(",\n", $batch).';';
                }

                $lines[] = '';
            }

            $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';
            $lines[] = '';

            return implode("\n", $lines);
        });
    }

    public static function restoreFromSql(Tenant $tenant, string $sqlContent): void
    {
        $statements = self::splitSqlStatements($sqlContent);

        $tenant->run(function () use ($statements): void {
            $pdo = DB::connection()->getPdo();
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0;');

            try {
                foreach ($statements as $statement) {
                    $trimmed = trim($statement);
                    if ($trimmed === '') {
                        continue;
                    }
                    $pdo->exec($trimmed);
                }
            } finally {
                $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');
            }
        });
    }

    /**
     * Split a SQL dump into individual statements respecting quotes, escapes, and comments.
     *
     * @return array<int, string>
     */
    private static function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $current = '';
        $length = strlen($sql);
        $inSingleQuote = false;
        $inDoubleQuote = false;
        $inBacktick = false;
        $inLineComment = false;
        $inBlockComment = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $next = $i + 1 < $length ? $sql[$i + 1] : '';

            if ($inLineComment) {
                if ($char === "\n") {
                    $inLineComment = false;
                }

                continue;
            }

            if ($inBlockComment) {
                if ($char === '*' && $next === '/') {
                    $inBlockComment = false;
                    $i++;
                }

                continue;
            }

            if (! $inSingleQuote && ! $inDoubleQuote && ! $inBacktick) {
                if (($char === '-' && $next === '-') || $char === '#') {
                    $inLineComment = true;

                    continue;
                }
                if ($char === '/' && $next === '*') {
                    $inBlockComment = true;
                    $i++;

                    continue;
                }
            }

            if ($char === '\\' && ($inSingleQuote || $inDoubleQuote)) {
                $current .= $char.$next;
                $i++;

                continue;
            }

            if ($char === "'" && ! $inDoubleQuote && ! $inBacktick) {
                $inSingleQuote = ! $inSingleQuote;
            } elseif ($char === '"' && ! $inSingleQuote && ! $inBacktick) {
                $inDoubleQuote = ! $inDoubleQuote;
            } elseif ($char === '`' && ! $inSingleQuote && ! $inDoubleQuote) {
                $inBacktick = ! $inBacktick;
            }

            if ($char === ';' && ! $inSingleQuote && ! $inDoubleQuote && ! $inBacktick) {
                if (trim($current) !== '') {
                    $statements[] = $current;
                }
                $current = '';
            } else {
                $current .= $char;
            }
        }

        if (trim($current) !== '') {
            $statements[] = $current;
        }

        return $statements;
    }

    private static function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / 1048576, 2).' MB';
    }
}
