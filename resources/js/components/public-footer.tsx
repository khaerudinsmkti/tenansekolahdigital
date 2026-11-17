import { usePage } from '@inertiajs/react';

interface PublicFooterProps {
    schoolName?: string;
    className?: string;
}

export function PublicFooter({ schoolName: propSchoolName, className }: PublicFooterProps) {
    const { school, centralUrl } = usePage<{
        school?: { name?: string };
        centralUrl?: string;
    }>().props;

    const schoolName = propSchoolName || school?.name || 'Sekolah';

    const getLandingUrl = (): string => {
        if (centralUrl) return centralUrl;
        if (typeof window === 'undefined') return '/';
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;
        const parts = host.split('.');
        if (parts.length > 1) {
            if (parts[parts.length - 1] === 'localhost') {
                return `${protocol}//localhost${port}`;
            }
            if (parts.length >= 3) {
                return `${protocol}//${parts.slice(1).join('.')}${port}`;
            }
        }
        return `${protocol}//${host}${port}`;
    };

    return (
        <footer
            className={`border-t border-[#E8E8E8] bg-white/70 py-6 text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF] pb-24 md:pb-6 ${
                className || ''
            }`}
        >
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                <div>
                    &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                    <span>Develop by</span>
                    <a
                        href={getLandingUrl()}
                        title="Kunjungi Website Resmi Sekolah Digital"
                        className="font-extrabold text-[var(--brand-primary,#FF6B35)] transition-colors hover:underline"
                    >
                        Sekolah Digital
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default PublicFooter;
