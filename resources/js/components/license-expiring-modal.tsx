import { usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    Check,
    Copy,
    CreditCard,
    Mail,
    MessageCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SharedLicenseProps {
    auth?: {
        user?: {
            id?: number;
            name?: string;
            role?: string;
        } | null;
    };
    school?: {
        name?: string;
    } | null;
    tenantLicense?: {
        starts_at: string | null;
        expires_at: string | null;
        status: 'unlimited' | 'upcoming' | 'active' | 'expired';
        days_remaining: number | null;
    } | null;
    centralBilling?: {
        whatsapp: string;
        bank_name: string;
        account_number: string;
        account_name: string;
        email: string;
    } | null;
    sessionLoginKey?: string | null;
}

function formatIndoDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export function LicenseExpiringModal() {
    const {
        auth,
        school,
        tenantLicense,
        centralBilling,
        sessionLoginKey,
    } = usePage<SharedLicenseProps>().props;

    const [open, setOpen] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);

    const isExpiringSoon =
        Boolean(auth?.user) &&
        tenantLicense?.status === 'active' &&
        tenantLicense.days_remaining !== null &&
        tenantLicense.days_remaining <= 30;

    useEffect(() => {
        if (!isExpiringSoon || !sessionLoginKey) {
            return;
        }

        const storageKey = `license_warning_seen_${sessionLoginKey}`;
        if (!sessionStorage.getItem(storageKey)) {
            setOpen(true);
        }
    }, [isExpiringSoon, sessionLoginKey]);

    if (!isExpiringSoon || !tenantLicense) {
        return null;
    }

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen && sessionLoginKey) {
            sessionStorage.setItem(`license_warning_seen_${sessionLoginKey}`, '1');
        }
        setOpen(nextOpen);
    };

    const schoolName = school?.name || 'Sekolah';
    const waDigits = (centralBilling?.whatsapp || '').replace(/[^0-9]/g, '');
    const normalizedWa = waDigits.startsWith('0')
        ? `62${waDigits.slice(1)}`
        : waDigits || '6281234567890';
    const waText = encodeURIComponent(
        `Halo Admin Central,\n\nSaya dari ${schoolName} ingin melakukan perpanjangan lisensi aplikasi sebelum masa aktif berakhir pada ${formatIndoDate(tenantLicense.expires_at)} (sisa ${tenantLicense.days_remaining} hari).\n\nMohon informasi pembayarannya. Terima kasih.`,
    );
    const waUrl = `https://wa.me/${normalizedWa}?text=${waText}`;

    const handleCopyAccount = async () => {
        if (!centralBilling?.account_number) return;
        try {
            await navigator.clipboard.writeText(centralBilling.account_number);
            setCopiedAccount(true);
            toast.success('Nomor rekening disalin');
            setTimeout(() => setCopiedAccount(false), 1800);
        } catch {
            toast.error('Gagal menyalin nomor rekening');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                        <AlertTriangle className="size-7" />
                    </div>
                    <DialogTitle className="text-center text-lg font-black">
                        Masa Aktif Lisensi Segera Berakhir
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs leading-relaxed">
                        Lisensi aplikasi untuk{' '}
                        <span className="font-bold text-gray-900 dark:text-white">
                            {schoolName}
                        </span>{' '}
                        akan berakhir dalam{' '}
                        <span className="font-black text-rose-600 dark:text-rose-400">
                            {tenantLicense.days_remaining} hari lagi
                        </span>{' '}
                        ({formatIndoDate(tenantLicense.expires_at)}). Segera
                        lakukan pembayaran perpanjangan agar akses aplikasi
                        tidak terhenti.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
                            <CalendarClock className="size-4" />
                            Tanggal Berakhir
                        </span>
                        <span className="font-bold text-amber-900 dark:text-amber-100">
                            {formatIndoDate(tenantLicense.expires_at)}
                        </span>
                    </div>

                    {centralBilling && (
                        <div className="rounded-2xl border border-[#E8E8E8] bg-[#FFFBF7] p-4 text-xs dark:border-[#2D234A] dark:bg-[#130E24]">
                            <div className="mb-2 flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
                                <CreditCard className="size-4 text-[#FF6B35]" />
                                Informasi Rekening Pembayaran
                            </div>
                            <div className="font-black text-gray-900 dark:text-white">
                                {centralBilling.bank_name}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-[#E8E8E8] bg-white px-3 py-2 dark:border-[#2D234A] dark:bg-[#18122B]">
                                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                                    {centralBilling.account_number}
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
                            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                <span>
                                    a.n.{' '}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        {centralBilling.account_name}
                                    </span>
                                </span>
                                {centralBilling.email && (
                                    <span className="inline-flex items-center gap-1">
                                        <Mail className="size-3" />
                                        {centralBilling.email}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleClose(false)}
                        className="w-full sm:w-auto"
                    >
                        Ingatkan Nanti
                    </Button>
                    <Button
                        asChild
                        variant="primary"
                        className="w-full rounded-xl font-bold shadow-brand sm:w-auto"
                    >
                        <a href={waUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="mr-2 size-4" />
                            Hubungi Admin Central via WhatsApp
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
