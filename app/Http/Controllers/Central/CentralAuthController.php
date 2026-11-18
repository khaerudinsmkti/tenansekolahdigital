<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Services\CentralSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class CentralAuthController extends Controller
{
    public function showLogin(Request $request): Response|RedirectResponse
    {
        if ($request->session()->get('central_admin_authenticated', false)) {
            return redirect()->route('central.dashboard');
        }

        return Inertia::render('central/login', [
            'captchaSvg' => $this->generateCaptchaSvg($request),
        ]);
    }

    public function refreshCaptcha(Request $request): JsonResponse
    {
        return response()->json([
            'svg' => $this->generateCaptchaSvg($request),
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $throttleKey = 'central-login:'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return back()->withErrors([
                'email' => "Terlalu banyak percobaan login. Silakan coba lagi dalam {$seconds} detik.",
            ])->onlyInput('email');
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'captcha' => ['required', 'string', 'max:10'],
        ], [
            'captcha.required' => 'Kode CAPTCHA wajib diisi.',
        ]);

        $expectedCaptcha = (string) $request->session()->pull('central_captcha_answer', '');
        $providedCaptcha = strtoupper(trim($credentials['captcha']));

        if ($expectedCaptcha === '' || ! hash_equals(strtoupper($expectedCaptcha), $providedCaptcha)) {
            RateLimiter::hit($throttleKey, 60);

            return back()->withErrors([
                'captcha' => 'Kode CAPTCHA tidak sesuai. Silakan coba lagi.',
            ])->onlyInput('email');
        }

        $admin = CentralSettingService::findAdminByEmail($credentials['email']);

        if ($admin === null || ! Hash::check($credentials['password'], $admin['password_hash'])) {
            RateLimiter::hit($throttleKey, 60);

            return back()->withErrors([
                'email' => 'Email atau kata sandi admin central tidak sesuai.',
            ])->onlyInput('email');
        }

        RateLimiter::clear($throttleKey);

        $request->session()->regenerate();
        $request->session()->put('central_admin_authenticated', true);
        $request->session()->put('central_admin_id', $admin['id']);
        $request->session()->put('central_admin_name', $admin['name']);
        $request->session()->put('central_admin_email', $admin['email']);

        return redirect()->intended(route('central.dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget([
            'central_admin_authenticated',
            'central_admin_id',
            'central_admin_name',
            'central_admin_email',
        ]);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('central.login');
    }

    private function generateCaptchaSvg(Request $request): string
    {
        // Exclude ambiguous characters (0, O, 1, I, l)
        $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        $code = '';
        $maxIndex = strlen($alphabet) - 1;

        for ($i = 0; $i < 5; $i++) {
            $code .= $alphabet[random_int(0, $maxIndex)];
        }

        $request->session()->put('central_captcha_answer', $code);

        $colors = ['#FF6B35', '#0F766E', '#7C3AED', '#B45309', '#1D4ED8'];
        $lettersSvg = '';

        for ($i = 0; $i < 5; $i++) {
            $x = 22 + ($i * 30) + random_int(-2, 2);
            $y = 33 + random_int(-4, 4);
            $rotate = random_int(-18, 18);
            $color = $colors[random_int(0, count($colors) - 1)];
            $char = htmlspecialchars($code[$i], ENT_XML1, 'UTF-8');

            $lettersSvg .= sprintf(
                '<text x="%d" y="%d" fill="%s" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24" font-weight="800" transform="rotate(%d %d %d)">%s</text>',
                $x,
                $y,
                $color,
                $rotate,
                $x,
                $y,
                $char
            );
        }

        $noiseLines = '';
        for ($i = 0; $i < 5; $i++) {
            $x1 = random_int(0, 170);
            $y1 = random_int(0, 48);
            $x2 = random_int(0, 170);
            $y2 = random_int(0, 48);
            $lineColor = $colors[random_int(0, count($colors) - 1)];
            $noiseLines .= sprintf(
                '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.3" stroke-opacity="0.35" />',
                $x1,
                $y1,
                $x2,
                $y2,
                $lineColor
            );
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 48" width="175" height="48" role="img" aria-label="Captcha"><rect width="175" height="48" rx="10" fill="#FFF7F2" />%s%s</svg>',
            $noiseLines,
            $lettersSvg
        );
    }
}
