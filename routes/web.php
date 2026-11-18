<?php

use App\Http\Controllers\Central\CentralAdminController;
use App\Http\Controllers\Central\CentralAuthController;
use App\Http\Controllers\Central\CentralTutorialController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Controllers\Central\TenantUserController;
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
            Route::patch('/tenants/{tenant}/license', [TenantController::class, 'updateLicense'])->name('central.tenants.license.update');
            Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy'])->name('central.tenants.destroy');

            Route::post('/tenants/migrate-all', [TenantController::class, 'migrateAll'])->name('central.tenants.migrate-all');
            Route::post('/tenants/{tenant}/migrate', [TenantController::class, 'migrate'])->name('central.tenants.migrate');

            Route::post('/tenants/{tenant}/domains', [TenantController::class, 'storeDomain'])->name('central.domains.store');
            Route::delete('/domains/{domain}', [TenantController::class, 'destroyDomain'])->name('central.domains.destroy');

            Route::get('/tenants/{tenant}/users', [TenantUserController::class, 'index'])->name('central.tenants.users.index');
            Route::post('/tenants/{tenant}/users', [TenantUserController::class, 'store'])->name('central.tenants.users.store');
            Route::put('/tenants/{tenant}/users/{userId}', [TenantUserController::class, 'update'])->name('central.tenants.users.update');
            Route::delete('/tenants/{tenant}/users/{userId}', [TenantUserController::class, 'destroy'])->name('central.tenants.users.destroy');

            Route::post('/theme', [TenantController::class, 'updateTheme'])->name('central.theme.update');
            Route::post('/billing-settings', [TenantController::class, 'updateBillingSettings'])->name('central.billing.update');

            Route::post('/central-admins', [CentralAdminController::class, 'store'])->name('central.admins.store');
            Route::put('/central-admins/{adminId}', [CentralAdminController::class, 'update'])->name('central.admins.update');
            Route::delete('/central-admins/{adminId}', [CentralAdminController::class, 'destroy'])->name('central.admins.destroy');
            Route::post('/branding-settings', [TenantController::class, 'updateBrandingSettings'])->name('central.branding.update');

            Route::post('/tutorials', [CentralTutorialController::class, 'store'])->name('central.tutorials.store');
            Route::post('/tutorials/sync-all', [CentralTutorialController::class, 'syncAll'])->name('central.tutorials.sync-all');
            Route::put('/tutorials/{tutorial}', [CentralTutorialController::class, 'update'])->name('central.tutorials.update');
            Route::patch('/tutorials/{tutorial}/toggle', [CentralTutorialController::class, 'toggle'])->name('central.tutorials.toggle');
            Route::delete('/tutorials/{tutorial}', [CentralTutorialController::class, 'destroy'])->name('central.tutorials.destroy');
        });
    });
}
