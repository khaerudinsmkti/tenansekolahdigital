<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TenantUserController extends Controller
{
    public function index(Tenant $tenant): JsonResponse
    {
        try {
            $users = $tenant->run(function (): array {
                return User::query()
                    ->whereIn('role', ['admin', 'principal'])
                    ->orderByRaw("CASE WHEN role = 'principal' THEN 0 ELSE 1 END")
                    ->orderBy('name')
                    ->get(['id', 'name', 'email', 'username', 'nip', 'role', 'created_at'])
                    ->toArray();
            });

            return response()->json([
                'users' => $users,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => config('app.debug')
                    ? 'Gagal memuat daftar user: '.$e->getMessage()
                    : 'Gagal memuat daftar user. Pastikan database sekolah sudah dimigrasi.',
                'users' => [],
            ], 422);
        }
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $payload = $request->all();

        $result = $tenant->run(function () use ($payload): array {
            $validator = Validator::make($payload, [
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:190', 'unique:users,email'],
                'username' => ['nullable', 'string', 'max:60', 'unique:users,username'],
                'nip' => ['nullable', 'string', 'max:40', 'unique:users,nip'],
                'role' => ['required', Rule::in(['admin', 'principal'])],
                'password' => ['required', 'string', 'min:8'],
            ], [
                'email.unique' => 'Email sudah digunakan di sekolah ini.',
                'username.unique' => 'Username sudah digunakan di sekolah ini.',
                'nip.unique' => 'NIP sudah digunakan di sekolah ini.',
                'password.min' => 'Kata sandi minimal 8 karakter.',
            ]);

            if ($validator->fails()) {
                return [
                    'errors' => $validator->errors()->toArray(),
                ];
            }

            $data = $validator->validated();

            $user = User::create([
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'username' => ! empty($data['username']) ? trim($data['username']) : null,
                'nip' => ! empty($data['nip']) ? trim($data['nip']) : null,
                'role' => $data['role'],
                'password' => $data['password'],
                'email_verified_at' => now(),
            ]);

            return [
                'user' => $user->only(['id', 'name', 'email', 'username', 'nip', 'role', 'created_at']),
            ];
        });

        if (isset($result['errors'])) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $result['errors'],
            ], 422);
        }

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'user' => $result['user'],
        ], 201);
    }

    public function update(Request $request, Tenant $tenant, int $userId): JsonResponse
    {
        $payload = $request->all();

        $result = $tenant->run(function () use ($payload, $userId): array {
            $user = User::query()
                ->whereIn('role', ['admin', 'principal'])
                ->find($userId);

            if (! $user) {
                return ['not_found' => true];
            }

            $validator = Validator::make($payload, [
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
                'username' => ['nullable', 'string', 'max:60', Rule::unique('users', 'username')->ignore($user->id)],
                'nip' => ['nullable', 'string', 'max:40', Rule::unique('users', 'nip')->ignore($user->id)],
                'role' => ['required', Rule::in(['admin', 'principal'])],
                'password' => ['nullable', 'string', 'min:8'],
            ], [
                'email.unique' => 'Email sudah digunakan di sekolah ini.',
                'username.unique' => 'Username sudah digunakan di sekolah ini.',
                'nip.unique' => 'NIP sudah digunakan di sekolah ini.',
                'password.min' => 'Kata sandi minimal 8 karakter.',
            ]);

            if ($validator->fails()) {
                return [
                    'errors' => $validator->errors()->toArray(),
                ];
            }

            $data = $validator->validated();

            $updateData = [
                'name' => $data['name'],
                'email' => strtolower(trim($data['email'])),
                'username' => ! empty($data['username']) ? trim($data['username']) : null,
                'nip' => ! empty($data['nip']) ? trim($data['nip']) : null,
                'role' => $data['role'],
            ];

            if (! empty($data['password'])) {
                $updateData['password'] = $data['password'];
            }

            $user->update($updateData);

            return [
                'user' => $user->fresh()->only(['id', 'name', 'email', 'username', 'nip', 'role', 'created_at']),
            ];
        });

        if (isset($result['not_found'])) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        if (isset($result['errors'])) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $result['errors'],
            ], 422);
        }

        return response()->json([
            'message' => 'Data user berhasil diperbarui.',
            'user' => $result['user'],
        ]);
    }

    public function destroy(Tenant $tenant, int $userId): JsonResponse
    {
        $deleted = $tenant->run(function () use ($userId): bool {
            $user = User::query()
                ->whereIn('role', ['admin', 'principal'])
                ->find($userId);

            if (! $user) {
                return false;
            }

            return (bool) $user->delete();
        });

        if (! $deleted) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'User berhasil dihapus.',
        ]);
    }
}
