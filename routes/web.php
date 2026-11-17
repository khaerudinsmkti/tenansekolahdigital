<?php

use App\Http\Controllers\Central\CentralAuthController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

foreach (config('tenancy.central_domains', []) as $domain) {
    Route::domain($domain)->group(function () {
        // Landing Page Utama Central
        Route::get('/', [WelcomeController::class, 'landing'])->name('central.home');

        // Autentikasi Admin Central
        Route::get('/admin/login', [CentralAuthController::class, 'showLogin'])->name('central.login');
        Route::get('/admin/captcha', [CentralAuthController::class, 'refreshCaptcha'])->name('central.captcha');
        Route::post('/admin/login', [CentralAuthController::class, 'login'])->name('central.login.store');
        Route::post('/admin/logout', [CentralAuthController::class, 'logout'])->name('central.logout');

        // Dashboard Admin Central (Wajib Login)
        Route::middleware('central.auth')->prefix('admin')->group(function () {
            Route::get('/dashboard', [TenantController::class, 'index'])->name('central.dashboard');

            Route::post('/tenants', [TenantController::class, 'store'])->name('central.tenants.store');
            Route::patch('/tenants/{tenant}', [TenantController::class, 'update'])->name('central.tenants.update');
            Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy'])->name('central.tenants.destroy');

            Route::post('/tenants/migrate-all', [TenantController::class, 'migrateAll'])->name('central.tenants.migrate-all');
            Route::post('/tenants/{tenant}/migrate', [TenantController::class, 'migrate'])->name('central.tenants.migrate');

            Route::post('/tenants/{tenant}/domains', [TenantController::class, 'storeDomain'])->name('central.domains.store');
            Route::delete('/domains/{domain}', [TenantController::class, 'destroyDomain'])->name('central.domains.destroy');

            Route::post('/theme', [TenantController::class, 'updateTheme'])->name('central.theme.update');
        });
    });
}
