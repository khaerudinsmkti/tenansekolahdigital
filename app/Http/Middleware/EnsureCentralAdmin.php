<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCentralAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('central_admin_authenticated', false)) {
            return redirect()->route('central.login');
        }

        return $next($request);
    }
}
