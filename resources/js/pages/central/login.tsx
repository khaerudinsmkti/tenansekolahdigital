import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CentralLoginProps {
    captchaSvg: string;
}

export default function CentralLogin({ captchaSvg }: CentralLoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [svgMarkup, setSvgMarkup] = useState(captchaSvg);
    const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);

    const form = useForm({
        email: '',
        password: '',
        captcha: '',
    });

    useEffect(() => {
        setSvgMarkup(captchaSvg);
    }, [captchaSvg]);

    const handleRefreshCaptcha = async () => {
        setRefreshingCaptcha(true);
        try {
            const response = await fetch('/admin/captcha', {
                headers: { Accept: 'application/json' },
            });
            if (response.ok) {
                const data = (await response.json()) as { svg: string };
                setSvgMarkup(data.svg);
                form.setData('captcha', '');
            }
        } finally {
            setRefreshingCaptcha(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/login', {
            onError: () => {
                void handleRefreshCaptcha();
            },
        });
    };

    return (
        <>
            <Head title="Login Admin Central — Central Tenancy Hub" />

            <div className="bg-page-gradient relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
                {/* Ambient Background Glows (sama seperti AuthLayout aplikasi) */}
                <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[#FF6B35]/15 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-[#4ECDC4]/20 blur-3xl" />

                <div className="relative z-10 w-full max-w-[440px]">
                    <div className="rounded-[22px] border-2 border-[#E8E8E8] bg-white/95 p-8 shadow-[0_24px_70px_rgba(255,107,53,0.14)] backdrop-blur-md sm:p-10 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                        <div className="mb-8 flex flex-col items-center text-center">
                            <Link
                                href="/"
                                className="group mb-4 flex items-center justify-center transition-transform duration-200 hover:scale-105"
                            >
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-lg shadow-[#FF6B35]/30">
                                    <AppLogoIcon className="size-8 text-white" />
                                </div>
                            </Link>

                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFF0EB] px-3.5 py-1 text-xs font-bold text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]">
                                <span className="size-1.5 rounded-full bg-[#FF6B35]" />
                                Sekolah Digital Indonesia
                            </div>

                            <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                       Login Admin</h1>
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">

                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="font-semibold text-[#374151] dark:text-[#E8E8E8]"
                                >
                                    Email Admin
                                </Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="admin@central.local"
                                        className="pl-10"
                                        value={form.data.email}
                                        onChange={(e) =>
                                            form.setData('email', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                {form.errors.email && (
                                    <p className="text-xs font-medium text-rose-500">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="font-semibold text-[#374151] dark:text-[#E8E8E8]"
                                >
                                    Kata Sandi
                                </Label>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="pr-10 pl-10"
                                        value={form.data.password}
                                        onChange={(e) =>
                                            form.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {form.errors.password && (
                                    <p className="text-xs font-medium text-rose-500">
                                        {form.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="captcha"
                                    className="font-semibold text-[#374151] dark:text-[#E8E8E8]"
                                >
                                    Verifikasi Keamanan (CAPTCHA)
                                </Label>
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#FFF7F2] shadow-2xs select-none dark:border-[#2D234A]"
                                        dangerouslySetInnerHTML={{
                                            __html: svgMarkup,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRefreshCaptcha}
                                        disabled={refreshingCaptcha}
                                        title="Muat ulang kode CAPTCHA"
                                        className="inline-flex h-12 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E8E8E8] bg-gray-50 text-gray-600 transition-colors hover:bg-[#FFF0EB] hover:text-[#FF6B35] disabled:opacity-50 dark:border-[#2D234A] dark:bg-[#130E24] dark:text-gray-300 dark:hover:bg-[#2D234A]"
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${refreshingCaptcha ? 'animate-spin' : ''}`}
                                        />
                                    </button>
                                    <Input
                                        id="captcha"
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Kode"
                                        maxLength={10}
                                        className="h-12 text-center font-mono text-base font-bold uppercase tracking-widest"
                                        value={form.data.captcha}
                                        onChange={(e) =>
                                            form.setData(
                                                'captcha',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        required
                                    />
                                </div>
                                {form.errors.captcha && (
                                    <p className="text-xs font-medium text-rose-500">
                                        {form.errors.captcha}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={form.processing}
                                className="w-full rounded-xl py-2.5 text-sm font-bold shadow-brand"
                            >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {form.processing
                                    ? 'Memverifikasi...'
                                    : 'Masuk ke Dashboard Admin'}
                            </Button>
                        </form>

                        <div className="mt-6 border-t border-[#E8E8E8] pt-5 text-center dark:border-[#2D234A]">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 transition-colors hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-400"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Kembali ke Halaman Utama
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
