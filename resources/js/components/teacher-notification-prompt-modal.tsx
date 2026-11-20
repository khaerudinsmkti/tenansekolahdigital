import { usePage } from '@inertiajs/react';
import { BellOff, BellRing, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { subscribeToPushNotifications } from '@/lib/webpush';

type SharedPromptProps = {
    auth?: {
        user?: {
            id?: number;
            name?: string;
            role?: string;
        } | null;
    };
    sessionLoginKey?: string | null;
};

export function TeacherNotificationPromptModal() {
    const { auth, sessionLoginKey } = usePage<SharedPromptProps>().props;
    const user = auth?.user;
    const isTeacher = user?.role === 'teacher';

    const [open, setOpen] = useState(false);
    const [activating, setActivating] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        if (!isTeacher || typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        const storageKey = sessionLoginKey
            ? `teacher_push_prompt_seen_${sessionLoginKey}`
            : `teacher_push_prompt_seen_user_${user?.id ?? '0'}`;

        if (sessionStorage.getItem(storageKey)) {
            return;
        }

        let cancelled = false;

        const checkNotificationStatus = async () => {
            const permission = Notification.permission;

            if (permission === 'granted') {
                // Jika browser mendukung Service Worker + PushManager, pastikan subscription aktif
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    try {
                        const registration = await navigator.serviceWorker.getRegistration();
                        if (registration) {
                            const subscription = await registration.pushManager.getSubscription();
                            if (subscription) {
                                // Notifikasi sudah aktif sepenuhnya -> jangan tampilkan popup
                                return;
                            }
                        } else {
                            // Tidak ada SW (misal HTTP lokal), izin browser sudah granted -> anggap aktif
                            return;
                        }
                    } catch {
                        // Jika gagal cek SW tetapi izin sudah granted, jangan ganggu user
                        return;
                    }
                } else {
                    return;
                }
            }

            if (!cancelled) {
                setPermissionDenied(permission === 'denied');
                setOpen(true);
            }
        };

        void checkNotificationStatus();

        return () => {
            cancelled = true;
        };
    }, [isTeacher, sessionLoginKey, user?.id]);

    if (!isTeacher) {
        return null;
    }

    const markSeenForSession = () => {
        const storageKey = sessionLoginKey
            ? `teacher_push_prompt_seen_${sessionLoginKey}`
            : `teacher_push_prompt_seen_user_${user?.id ?? '0'}`;
        sessionStorage.setItem(storageKey, '1');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            markSeenForSession();
        }
        setOpen(nextOpen);
    };

    const handleActivate = async () => {
        setActivating(true);
        setErrorMessage(null);

        try {
            const result = await subscribeToPushNotifications();
            if (result.success) {
                setActivated(true);
                setPermissionDenied(false);
                markSeenForSession();
                window.setTimeout(() => {
                    setOpen(false);
                }, 1400);
                return;
            }

            if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
                setPermissionDenied(true);
            }
            setErrorMessage(result.message || 'Gagal mengaktifkan notifikasi.');
        } catch {
            setErrorMessage('Terjadi kesalahan saat mengaktifkan notifikasi.');
        } finally {
            setActivating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                        {activated ? (
                            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        ) : permissionDenied ? (
                            <BellOff className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                        ) : (
                            <BellRing className="h-7 w-7" />
                        )}
                    </div>
                    <DialogTitle className="text-center text-lg font-extrabold text-gray-900 dark:text-white">
                        {activated
                            ? 'Notifikasi Berhasil Diaktifkan!'
                            : 'Notifikasi Pengingat Belum Aktif'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {activated
                            ? 'Perangkat Anda telah terdaftar. Anda akan menerima pengingat otomatis setiap hari untuk mengisi presensi siswa.'
                            : 'Aktifkan notifikasi di perangkat ini agar Anda mendapatkan pengingat otomatis setiap hari untuk mengisi absensi siswa tepat waktu.'}
                    </DialogDescription>
                </DialogHeader>

                {!activated && permissionDenied && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                        <div className="mb-1 flex items-center gap-1.5 font-bold">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            Izin Notifikasi Diblokir Browser
                        </div>
                        Klik ikon gembok / pengaturan di samping alamat URL browser Anda, ubah izin{' '}
                        <strong>Notifikasi</strong> menjadi <strong>Izinkan (Allow)</strong>, lalu
                        muat ulang halaman ini.
                    </div>
                )}

                {!activated && errorMessage && !permissionDenied && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        {errorMessage}
                    </div>
                )}

                {!activated && (
                    <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={activating}
                            className="w-full sm:w-auto"
                        >
                            Nanti Saja
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => void handleActivate()}
                            disabled={activating}
                            className="w-full font-bold shadow-brand sm:w-auto"
                        >
                            {activating ? (
                                <>
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                    Mengaktifkan...
                                </>
                            ) : (
                                <>
                                    <BellRing className="mr-1.5 h-4 w-4" />
                                    Aktifkan Notifikasi
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
