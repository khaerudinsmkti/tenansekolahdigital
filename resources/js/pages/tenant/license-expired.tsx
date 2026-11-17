import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CalendarClock,
    Check,
    Copy,
    CreditCard,
    Lock,
    MessageCircle,
    ShieldAlert,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LicenseExpiredProps {
    license: {
        starts_at: string | null;
        expires_at: string | null;
        status: 'unlimited' | 'upcoming' | 'active' | 'expired';
        is_usable: boolean;
        days_remaining: number | null;
    };
    schoolName: string;
    tenantId: string;
    host: string;
    billing: {
        whatsapp: string;
        bank_name: string;
        account_number: string;
        account_name: string;
    };
}

const RENEWAL_PLANS = [
    {
        id: 'website',
        name: 'Paket Website Sekolah',
        subtitle: 'Cocok untuk membangun citra & portal informasi resmi sekolah',
        price: 'Rp 500rb',
        period: '/tahun',
        badge: 'Starter',
        highlight: false,
    },
    {
        id: 'website-absensi',
        name: 'Paket Website + Absensi',
        subtitle: 'Digitalisasi penuh portal sekolah & presensi siswa harian',
        price: 'Rp 600rb',
        period: '/tahun',
        badge: 'Paling Populer',
        highlight: true,
    },
    {
        id: 'all-in-one',
        name: 'Paket All-in-One Lengkap',
        subtitle: 'Solusi paripurna hingga level pimpinan & ekstrakurikuler',
        price: 'Rp 700rb',
        period: '/tahun',
        badge: 'Terlengkap',
        highlight: false,
    },
];

function formatIndoDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export default function LicenseExpired({
    license,
    schoolName,
    tenantId,
    host,
    billing,
}: LicenseExpiredProps) {
    const [selectedPlan, setSelectedPlan] = useState(RENEWAL_PLANS[1].id);
    const [copiedAccount, setCopiedAccount] = useState(false);

    const isUpcoming = license.status === 'upcoming';
    const activePlan =
        RENEWAL_PLANS.find((p) => p.id === selectedPlan) ?? RENEWAL_PLANS[1];

    const waPhone = billing.whatsapp.replace(/[^0-9]/g, '');
    const waMessage = encodeURIComponent(
        `Halo Admin Central,\n\nSaya ingin melakukan perpanjangan/aktivasi lisensi aplikasi sekolah:\n- Sekolah: ${schoolName}\n- ID Tenant: ${tenantId}\n- Domain: ${host}\n- Paket: ${activePlan.name} (${activePlan.price})\n- Tanggal Berakhir: ${formatIndoDate(license.expires_at)}\n\nMohon informasi konfirmasi aktivasinya. Terima kasih.`,
    );
    const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

    const handleCopyAccount = async () => {
        try {
            await navigator.clipboard.writeText(billing.account_number);
            setCopiedAccount(true);
            toast.success('Nomor rekening disalin');
            setTimeout(() => setCopiedAccount(false), 1800);
        } catch {
            toast.error('Gagal menyalin nomor rekening');
        }
    };

    return (
        <>
            <Head
                title={
                    isUpcoming
                        ? `Lisensi Belum Aktif — ${schoolName}`
                        : `Pembayaran Perpanjangan Lisensi — ${schoolName}`
                }
            />
            <Toaster position="top-right" richColors />

            <div className="bg-page-gradient relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
                {/* Ambient Background Glows */}
                <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[#FF6B35]/15 blur-3xl" />
                <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-[#4ECDC4]/20 blur-3xl" />

                <div className="relative z-10 w-full max-w-3xl space-y-6">
                    {/* Top Status Banner */}
                    <div className="rounded-[24px] border-2 border-[#E8E8E8] bg-white/95 p-6 shadow-[0_24px_70px_rgba(255,107,53,0.14)] backdrop-blur-md sm:p-8 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-lg shadow-[#FF6B35]/30">
                                <AppLogoIcon className="size-8 text-white" />
                            </div>

                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                {isUpcoming ? (
                                    <CalendarClock className="size-3.5" />
                                ) : (
                                    <ShieldAlert className="size-3.5" />
                                )}
                                {isUpcoming
                                    ? 'Lisensi Aplikasi Belum Aktif'
                                    : 'Masa Aktif Lisensi Berakhir (Expired)'}
                            </div>

                            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                                {schoolName}
                            </h1>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {isUpcoming
                                    ? `Akses aplikasi untuk ${schoolName} dijadwalkan mulai aktif pada ${formatIndoDate(license.starts_at)}. Silakan selesaikan pembayaran atau hubungi pengelola platform jika ingin mengaktifkan lebih awal.`
                                    : `Akses aplikasi untuk ${schoolName} sementara dinonaktifkan karena masa berlaku lisensi telah berakhir pada ${formatIndoDate(license.expires_at)}. Silakan lakukan pembayaran perpanjangan di bawah ini agar aplikasi dapat digunakan kembali.`}
                            </p>

                            {/* License Meta Pills */}
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E8E8] bg-[#FFFBF7] px-3 py-1.5 font-semibold text-gray-700 dark:border-[#2D234A] dark:bg-[#130E24] dark:text-gray-200">
                                    <Building2 className="size-3.5 text-[#FF6B35]" />
                                    Tenant: <span className="font-mono">{tenantId}</span>
                                </div>
                                {license.starts_at && (
                                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E8E8] bg-[#FFFBF7] px-3 py-1.5 font-semibold text-gray-700 dark:border-[#2D234A] dark:bg-[#130E24] dark:text-gray-200">
                                        <CalendarClock className="size-3.5 text-[#20B2AA]" />
                                        Aktif: {formatIndoDate(license.starts_at)}
                                    </div>
                                )}
                                {license.expires_at && (
                                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                        <AlertTriangle className="size-3.5" />
                                        Berakhir: {formatIndoDate(license.expires_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment & Renewal Section */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                        {/* Left: Pilih Paket Perpanjangan */}
                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/95 shadow-xs md:col-span-7 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-black">
                                    <Sparkles className="size-4 text-[#FF6B35]" />
                                    1. Pilih Paket Perpanjangan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                                {RENEWAL_PLANS.map((plan) => {
                                    const isSelected = selectedPlan === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedPlan(plan.id)
                                            }
                                            className={`flex w-full items-center justify-between rounded-2xl border-2 p-3.5 text-left transition-all ${
                                                isSelected
                                                    ? 'border-[var(--brand-primary,#FF6B35)] bg-[var(--brand-primary-light,#FFF0EB)]/70 shadow-xs dark:bg-[var(--brand-primary,#FF6B35)]/15'
                                                    : 'border-[#E8E8E8] hover:border-gray-300 dark:border-[#2D234A] dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                                        {plan.name}
                                                    </span>
                                                    <span className="rounded-md bg-[#E6FAF8] px-2 py-0.5 text-[10px] font-bold text-[#20B2AA] dark:bg-[#123836] dark:text-[#4ECDC4]">
                                                        {plan.badge}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {plan.subtitle}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-[#FF6B35]">
                                                    {plan.price}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {plan.period}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Right: Instruksi Pembayaran & Konfirmasi */}
                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/95 shadow-xs md:col-span-5 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-black">
                                    <CreditCard className="size-4 text-[#20B2AA]" />
                                    2. Pembayaran & Konfirmasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFFBF7] p-4 dark:border-[#2D234A] dark:bg-[#130E24]">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        Transfer Bank
                                    </div>
                                    <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
                                        {billing.bank_name}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 dark:border-[#2D234A] dark:bg-[#18122B]">
                                        <span className="font-mono text-sm font-bold tracking-wide text-gray-900 dark:text-white">
                                            {billing.account_number}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyAccount}
                                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#2D234A]"
                                            title="Salin nomor rekening"
                                        >
                                            {copiedAccount ? (
                                                <Check className="size-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        a.n.{' '}
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {billing.account_name}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-[#FFF0EB] p-3 text-xs text-gray-700 dark:bg-[#331C1A] dark:text-gray-200">
                                    <div className="font-bold text-[#FF6B35]">
                                        Total Tagihan: {activePlan.price}
                                    </div>
                                    <div className="mt-0.5 text-[11px]">
                                        Setelah transfer, kirim bukti pembayaran
                                        agar lisensi langsung diaktifkan.
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    variant="primary"
                                    className="w-full rounded-xl py-2.5 text-xs font-bold shadow-brand"
                                >
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <MessageCircle className="mr-2 size-4" />
                                        Konfirmasi Pembayaran (WhatsApp)
                                    </a>
                                </Button>

                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                                    <Lock className="size-3" />
                                    Data sekolah Anda tetap aman tersimpan
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
