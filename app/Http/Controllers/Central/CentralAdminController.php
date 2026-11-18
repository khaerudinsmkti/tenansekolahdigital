<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Services\CentralSettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CentralAdminController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        if (CentralSettingService::findAdminByEmail($validated['email']) !== null) {
            return back()->withErrors([
                'email' => 'Email admin central ini sudah terdaftar.',
            ]);
        }

        CentralSettingService::createAdminAccount(
            $validated['name'],
            $validated['email'],
            $validated['password'],
        );

        return back()->with('success', "Akun admin central \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function update(Request $request, string $adminId): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'password.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        $existing = CentralSettingService::findAdminByEmail($validated['email']);
        if ($existing !== null && $existing['id'] !== $adminId) {
            return back()->withErrors([
                'email' => 'Email sudah digunakan oleh akun admin central lain.',
            ]);
        }

        $updated = CentralSettingService::updateAdminAccount(
            $adminId,
            $validated['name'],
            $validated['email'],
            $validated['password'] ?? null,
        );

        if (! $updated) {
            return back()->with('error', 'Akun admin central tidak ditemukan.');
        }

        if ($request->session()->get('central_admin_id') === $adminId) {
            $request->session()->put('central_admin_email', strtolower(trim($validated['email'])));
            $request->session()->put('central_admin_name', trim($validated['name']));
        }

        return back()->with('success', "Akun admin central \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroy(Request $request, string $adminId): RedirectResponse
    {
        if ($request->session()->get('central_admin_id') === $adminId) {
            return back()->with('error', 'Tidak dapat menghapus akun yang sedang digunakan untuk login.');
        }

        $deleted = CentralSettingService::deleteAdminAccount($adminId);

        if (! $deleted) {
            return back()->with('error', 'Minimal harus ada 1 akun admin central aktif.');
        }

        return back()->with('success', 'Akun admin central berhasil dihapus.');
    }
}
