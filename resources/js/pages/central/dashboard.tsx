import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Check,
    Copy,
    Database,
    ExternalLink,
    Globe,
    Home,
    Layers,
    LogOut,
    Palette,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';
import AppLogoIcon from '@/components/app-logo-icon';
import { applyTheme } from '@/lib/theme';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface TenantDomain {
    id: number;
    domain: string;
    type: 'subdomain' | 'custom';
    full_host: string;
    url: string;
}

interface TenantItem {
    id: string;
    name: string;
    database: string;
    created_at: string | null;
    domains: TenantDomain[];
}

interface ThemeOption {
    id: string;
    name: string;
    level: string;
    badge: string;
    description: string;
    primary: string;
    primary_dark: string;
    primary_light: string;
    hero_gradient?: string;
}

interface CentralDashboardProps {
    tenants: TenantItem[];
    stats: {
        total_tenants: number;
        total_domains: number;
        subdomains_count: number;
        custom_domains_count: number;
    };
    central: {
        current_host: string;
        base_domain: string;
        port_suffix: string;
        scheme: string;
        central_domains: string[];
    };
    themes: ThemeOption[];
    currentTheme: string;
}

type DomainFilter = 'all' | 'subdomain' | 'custom';

function slugifyTenantId(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 32);
}

export default function CentralDashboard({
    tenants,
    stats,
    central,
    themes = [],
    currentTheme = 'sd-orange',
}: CentralDashboardProps) {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    const [search, setSearch] = useState('');
    const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [migratingAll, setMigratingAll] = useState(false);
    const [migratingTenantId, setMigratingTenantId] = useState<string | null>(
        null,
    );
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'tenants' | 'theme'>(
        'tenants',
    );
    const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);
    const [themeLevelFilter, setThemeLevelFilter] = useState<string>('ALL');
    const [savingTheme, setSavingTheme] = useState(false);

    // Modal states
    const [createOpen, setCreateOpen] = useState(false);
    const [addDomainTenant, setAddDomainTenant] = useState<TenantItem | null>(
        null,
    );
    const [editTenant, setEditTenant] = useState<TenantItem | null>(null);
    const [deleteTenant, setDeleteTenant] = useState<TenantItem | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [idManuallyEdited, setIdManuallyEdited] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const createForm = useForm<{
        name: string;
        id: string;
        domain_type: 'subdomain' | 'custom';
        domain: string;
    }>({
        name: '',
        id: '',
        domain_type: 'subdomain',
        domain: '',
    });

    const domainForm = useForm<{
        domain_type: 'subdomain' | 'custom';
        domain: string;
    }>({
        domain_type: 'subdomain',
        domain: '',
    });

    const editForm = useForm<{
        name: string;
    }>({
        name: '',
    });

    const filteredTenants = useMemo(() => {
        const q = search.toLowerCase().trim();

        return tenants.filter((tenant) => {
            const matchesFilter =
                domainFilter === 'all' ||
                tenant.domains.some((d) => d.type === domainFilter);

            if (!matchesFilter) {
                return false;
            }

            if (!q) {
                return true;
            }

            return (
                tenant.name.toLowerCase().includes(q) ||
                tenant.id.toLowerCase().includes(q) ||
                tenant.database.toLowerCase().includes(q) ||
                tenant.domains.some(
                    (d) =>
                        d.domain.toLowerCase().includes(q) ||
                        d.full_host.toLowerCase().includes(q),
                )
            );
        });
    }, [tenants, search, domainFilter]);

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            toast.success('URL disalin ke clipboard');
            setTimeout(() => setCopiedUrl(null), 1800);
        } catch {
            toast.error('Gagal menyalin URL');
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/tenants', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                setIdManuallyEdited(false);
            },
        });
    };

    const handleAddDomainSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addDomainTenant) return;

        domainForm.post(`/admin/tenants/${addDomainTenant.id}/domains`, {
            preserveScroll: true,
            onSuccess: () => {
                setAddDomainTenant(null);
                domainForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTenant) return;

        editForm.patch(`/admin/tenants/${editTenant.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditTenant(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteDomain = (domain: TenantDomain) => {
        router.delete(`/admin/domains/${domain.id}`, {
            preserveScroll: true,
        });
    };

    const handleMigrateTenant = (tenantId: string) => {
        setMigratingTenantId(tenantId);
        router.post(
            `/admin/tenants/${tenantId}/migrate`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setMigratingTenantId(null),
            },
        );
    };

    const handleMigrateAll = () => {
        setMigratingAll(true);
        router.post(
            '/admin/tenants/migrate-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setMigratingAll(false),
            },
        );
    };

    const handleDeleteTenant = () => {
        if (!deleteTenant || deleteConfirmText !== deleteTenant.id) return;
        setDeleting(true);
        router.delete(`/admin/tenants/${deleteTenant.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTenant(null);
                setDeleteConfirmText('');
            },
        });
    };

    const handleSelectTheme = (theme: ThemeOption) => {
        setSelectedTheme(theme.id);
        applyTheme(theme as any);
    };

    const handleSaveTheme = () => {
        setSavingTheme(true);
        router.post(
            '/admin/theme',
            { theme_color: selectedTheme },
            {
                preserveScroll: true,
                onFinish: () => setSavingTheme(false),
            },
        );
    };

    const themeLevels = useMemo(() => {
        const levels = Array.from(new Set(themes.map((t) => t.level)));
        return ['ALL', ...levels];
    }, [themes]);

    const filteredThemes = useMemo(() => {
        if (themeLevelFilter === 'ALL') return themes;
        return themes.filter((t) => t.level === themeLevelFilter);
    }, [themes, themeLevelFilter]);

    const previewCreateUrl = useMemo(() => {
        const raw = createForm.data.domain.trim().toLowerCase();
        if (!raw) return null;
        if (createForm.data.domain_type === 'custom') {
            return `${central.scheme}://${raw}${central.port_suffix}`;
        }
        const sub = raw.replace(`.${central.base_domain}`, '');
        return `${central.scheme}://${sub}.${central.base_domain}${central.port_suffix}`;
    }, [createForm.data.domain, createForm.data.domain_type, central]);

    return (
        <>
            <Head title="Central Admin — Manajemen Subdomain & Sekolah" />
            <Toaster position="top-right" richColors />

            <div className="flex h-screen overflow-hidden bg-[#FFFBF7] text-[#1A1A2E] dark:bg-[#130E24] dark:text-white">
                {/* Mobile Sidebar Backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Central Admin Sidebar (tampil setelah login, tetap fix saat konten di-scroll) */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-[#E8E8E8] bg-white/95 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 dark:border-[#2D234A] dark:bg-[#18122B]/95 ${
                        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4 dark:border-[#2D234A]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                                <AppLogoIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-black tracking-tight text-gray-900 dark:text-white">
                                    Central Hub
                                </div>
                                <div className="text-[11px] font-semibold text-[#FF6B35] dark:text-[#FF8C5A]">
                                    Multi-DB MySQL
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(false)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-[#2D234A]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1.5 p-3">
                        <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                            Menu Central
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenu('tenants');
                                setMobileSidebarOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                activeMenu === 'tenants'
                                    ? 'border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] font-black text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                    : 'font-bold text-gray-600 hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-300 dark:hover:bg-[#2D234A]/60 dark:hover:text-white'
                            }`}
                        >
                            <Building2 className="h-4 w-4" />
                            Sekolah & Domain
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenu('theme');
                                setMobileSidebarOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                activeMenu === 'theme'
                                    ? 'border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] font-black text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:border-[var(--brand-primary,#FF6B35)]/40 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-white'
                                    : 'font-bold text-gray-600 hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-300 dark:hover:bg-[#2D234A]/60 dark:hover:text-white'
                            }`}
                        >
                            <Palette className="h-4 w-4" />
                            Tema Landing Page
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-300 dark:hover:bg-[#2D234A]/60 dark:hover:text-white"
                        >
                            <Home className="h-4 w-4" />
                            Landing Page Central
                        </Link>
                        <button
                            type="button"
                            onClick={handleMigrateAll}
                            disabled={migratingAll || tenants.length === 0}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-[var(--brand-primary,#FF6B35)] disabled:opacity-50 dark:text-gray-300 dark:hover:bg-[#2D234A]/60 dark:hover:text-white"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${migratingAll ? 'animate-spin' : ''}`}
                            />
                            {migratingAll ? 'Memigrasi...' : 'Migrate Semua DB'}
                        </button>
                    </nav>

                    <div className="border-t border-[#E8E8E8] p-3 dark:border-[#2D234A]">
                        <div className="mb-2 rounded-xl border border-[#E8E8E8] bg-[#FFFBF7] px-3 py-2 text-xs text-gray-500 dark:border-[#2D234A] dark:bg-[#130E24] dark:text-gray-400">
                            <div className="font-bold text-gray-800 dark:text-gray-200">
                                Central Host
                            </div>
                            <div className="truncate font-mono text-[11px]">
                                {central.current_host}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/admin/logout')}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                            <LogOut className="h-4 w-4" />
                            Keluar Admin
                        </button>
                    </div>
                </aside>

                <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
                    {/* Ambient Background Glows */}
                    <div className="pointer-events-none fixed top-0 right-0 -z-0 size-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
                    <div className="pointer-events-none fixed bottom-0 left-64 -z-0 size-96 rounded-full bg-[#4ECDC4]/10 blur-3xl" />

                    {/* Top Sticky Header */}
                    <header className="sticky top-0 z-30 border-b border-[#E8E8E8] bg-white/85 backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/85">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileSidebarOpen(true)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E8E8] text-gray-600 hover:bg-gray-100 lg:hidden dark:border-[#2D234A] dark:text-gray-300 dark:hover:bg-[#2D234A]"
                                    title="Buka menu"
                                >
                                    <Layers className="h-4 w-4" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-base font-black tracking-tight text-gray-900 sm:text-lg dark:text-white">
                                            Central Tenancy Hub
                                        </h1>
                                        <Badge
                                            variant="secondary"
                                            className="hidden border-[#FF6B35]/30 bg-[#FFF0EB] font-bold text-[#FF6B35] sm:inline-flex dark:border-[#FF6B35]/40 dark:bg-[#331C1A] dark:text-[#FF8C5A]"
                                        >
                                            Multi-DB MySQL
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Kelola subdomain, custom domain, & database sekolah dari satu tempat
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        createForm.reset();
                                        createForm.clearErrors();
                                        setIdManuallyEdited(false);
                                        setCreateOpen(true);
                                    }}
                                    className="rounded-xl font-bold shadow-brand"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Tambah Sekolah
                                </Button>
                            </div>
                        </div>
                    </header>

                <main className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    {activeMenu === 'theme' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg font-black">
                                            <Palette className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                                            Tema Warna Landing Page Central
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Pilih palet warna yang akan diterapkan pada landing page utama central. Klik tema untuk preview langsung, lalu simpan.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={savingTheme || selectedTheme === currentTheme}
                                        onClick={handleSaveTheme}
                                        className="shrink-0 rounded-xl font-bold shadow-brand"
                                    >
                                        {savingTheme ? 'Menyimpan...' : 'Simpan & Terapkan Tema'}
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="flex flex-wrap gap-2">
                                        {themeLevels.map((lvl) => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setThemeLevelFilter(lvl)}
                                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                    themeLevelFilter === lvl
                                                        ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#130E24] dark:text-gray-300 dark:hover:bg-[#2D234A]'
                                                }`}
                                            >
                                                {lvl === 'ALL' ? 'Semua Jenjang' : lvl}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {filteredThemes.map((theme) => {
                                            const isSelected = selectedTheme === theme.id;
                                            const isSaved = currentTheme === theme.id;

                                            return (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => handleSelectTheme(theme)}
                                                    className={`group flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-[var(--brand-primary,#FF6B35)] bg-[var(--brand-primary-light,#FFF0EB)]/60 shadow-md dark:bg-[var(--brand-primary,#FF6B35)]/15'
                                                            : 'border-[#E8E8E8] bg-white hover:border-gray-300 dark:border-[#2D234A] dark:bg-[#130E24]/70 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <div
                                                        className="mb-3 flex h-16 w-full items-end justify-between rounded-xl p-3 text-white shadow-xs"
                                                        style={{
                                                            background:
                                                                theme.hero_gradient ||
                                                                `linear-gradient(135deg, ${theme.primary}, ${theme.primary_dark})`,
                                                        }}
                                                    >
                                                        <span className="rounded-lg bg-black/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                                                            {theme.level}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[10px] font-black text-gray-900 shadow-xs">
                                                                <Check className="h-3 w-3 text-emerald-600" />
                                                                {isSaved ? 'Aktif' : 'Dipilih'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-sm font-black text-gray-900 dark:text-white">
                                                            {theme.name}
                                                        </div>
                                                        <span
                                                            className="size-4 shrink-0 rounded-full border border-white shadow-xs"
                                                            style={{ backgroundColor: theme.primary }}
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                        {theme.badge}
                                                    </div>
                                                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                        {theme.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <>
                    {/* KPI Bento Grid */}
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                                    Total Sekolah
                                </CardDescription>
                                <div className="rounded-xl bg-[#FFF0EB] p-2 text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]">
                                    <Building2 className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tight">
                                    {stats.total_tenants}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Tenant aktif dengan database terpisah
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                                    Total Domain
                                </CardDescription>
                                <div className="rounded-xl bg-[#E6FAF8] p-2 text-[#20B2AA] dark:bg-[#123836] dark:text-[#4ECDC4]">
                                    <Globe className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tight">
                                    {stats.total_domains}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {stats.subdomains_count} subdomain ·{' '}
                                    {stats.custom_domains_count} custom domain
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                                    Arsitektur DB
                                </CardDescription>
                                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <Database className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xl font-black tracking-tight">
                                    MySQL Multi-DB
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Isolasi database & storage otomatis
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-xs font-bold uppercase tracking-wider">
                                    Base Domain
                                </CardDescription>
                                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                    <Server className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="truncate font-mono text-base font-bold">
                                    *.{central.base_domain}
                                    {central.port_suffix}
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    Central host: {central.current_host}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Toolbar: Search + Filter */}
                    <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama sekolah, ID tenant, database, atau domain..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {(
                                    [
                                        { key: 'all', label: 'Semua' },
                                        { key: 'subdomain', label: 'Subdomain' },
                                        {
                                            key: 'custom',
                                            label: 'Custom Domain',
                                        },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setDomainFilter(tab.key)}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            domainFilter === tab.key
                                                ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-xs'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-[#130E24] dark:text-gray-300 dark:hover:bg-[#2D234A]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tenant List */}
                    {filteredTenants.length === 0 ? (
                        <Card className="border-dashed border-slate-300 dark:border-slate-800">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    {tenants.length === 0
                                        ? 'Belum ada sekolah terdaftar'
                                        : 'Tidak ada sekolah yang cocok'}
                                </h3>
                                <p className="mt-1 max-w-md text-sm text-slate-500">
                                    {tenants.length === 0
                                        ? 'Tambahkan sekolah pertama untuk otomatis membuat database MySQL terpisah beserta subdomain atau custom domain-nya.'
                                        : 'Coba ubah kata kunci pencarian atau filter tipe domain.'}
                                </p>
                                {tenants.length === 0 && (
                                    <Button
                                        className="mt-5 bg-indigo-600 text-white hover:bg-indigo-700"
                                        onClick={() => setCreateOpen(true)}
                                    >
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Tambah Sekolah Pertama
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTenants.map((tenant) => (
                                <Card
                                    key={tenant.id}
                                    className="group rounded-2xl border-[#E8E8E8] bg-white/90 transition-all hover:border-[#FF6B35]/50 hover:shadow-md dark:border-[#2D234A] dark:bg-[#18122B]/90 dark:hover:border-[#FF6B35]/50"
                                >
                                    <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-sm font-black uppercase text-white shadow-sm shadow-[#FF6B35]/25">
                                                {tenant.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <CardTitle className="text-base font-semibold">
                                                        {tenant.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-[11px]"
                                                    >
                                                        ID: {tenant.id}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                    <span className="inline-flex items-center gap-1 font-mono">
                                                        <Database className="h-3.5 w-3.5 text-emerald-500" />
                                                        {tenant.database}
                                                    </span>
                                                    {tenant.created_at && (
                                                        <span>
                                                            Dibuat:{' '}
                                                            {new Date(
                                                                tenant.created_at,
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    domainForm.reset();
                                                    domainForm.clearErrors();
                                                    setAddDomainTenant(tenant);
                                                }}
                                            >
                                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                Domain
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleMigrateTenant(
                                                        tenant.id,
                                                    )
                                                }
                                                disabled={
                                                    migratingTenantId ===
                                                    tenant.id
                                                }
                                            >
                                                <RefreshCw
                                                    className={`mr-1.5 h-3.5 w-3.5 ${
                                                        migratingTenantId ===
                                                        tenant.id
                                                            ? 'animate-spin'
                                                            : ''
                                                    }`}
                                                />
                                                Migrate
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                title="Edit nama sekolah"
                                                onClick={() => {
                                                    editForm.setData(
                                                        'name',
                                                        tenant.name,
                                                    );
                                                    editForm.clearErrors();
                                                    setEditTenant(tenant);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                                                title="Hapus sekolah"
                                                onClick={() => {
                                                    setDeleteConfirmText('');
                                                    setDeleteTenant(tenant);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <Separator className="opacity-60" />

                                    <CardContent className="pt-3.5">
                                        <div className="mb-2 text-xs font-medium text-slate-500">
                                            Domain & Subdomain Terhubung (
                                            {tenant.domains.length})
                                        </div>
                                        {tenant.domains.length === 0 ? (
                                            <p className="text-xs italic text-slate-400">
                                                Belum ada domain terhubung. Klik
                                                "+ Domain" untuk menambahkan.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {tenant.domains.map((dom) => (
                                                    <div
                                                        key={dom.id}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900/70"
                                                    >
                                                        <span
                                                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                                dom.type ===
                                                                'custom'
                                                                    ? 'bg-[#E6FAF8] text-[#20B2AA] dark:bg-[#123836] dark:text-[#4ECDC4]'
                                                                    : 'bg-[#FFF0EB] text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]'
                                                            }`}
                                                        >
                                                            {dom.type ===
                                                            'custom'
                                                                ? 'Custom'
                                                                : 'Subdomain'}
                                                        </span>
                                                        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                                                            {dom.full_host}
                                                            {central.port_suffix}
                                                        </span>

                                                        <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-700">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        dom.url,
                                                                    )
                                                                }
                                                                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                                                title="Salin URL"
                                                            >
                                                                {copiedUrl ===
                                                                dom.url ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                            <a
                                                                href={dom.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                                                title="Buka aplikasi sekolah"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteDomain(
                                                                        dom,
                                                                    )
                                                                }
                                                                className="rounded p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60"
                                                                title="Hapus domain"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Modal: Tambah Sekolah Baru */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Sekolah Baru</DialogTitle>
                        <DialogDescription>
                            Sistem akan otomatis membuat database MySQL baru,
                            menjalankan migrasi tabel sekolah, dan mendaftarkan
                            domainnya.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="tenant-name">Nama Sekolah</Label>
                            <Input
                                id="tenant-name"
                                placeholder="Contoh: SMKN 1 Jakarta"
                                value={createForm.data.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    createForm.setData((prev) => {
                                        const nextSlug = idManuallyEdited
                                            ? prev.id
                                            : slugifyTenantId(val);
                                        return {
                                            ...prev,
                                            name: val,
                                            id: nextSlug,
                                            domain:
                                                !idManuallyEdited &&
                                                prev.domain_type === 'subdomain'
                                                    ? nextSlug
                                                    : prev.domain,
                                        };
                                    });
                                }}
                                required
                            />
                            {createForm.errors.name && (
                                <p className="text-xs text-rose-500">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tenant-id">
                                ID Tenant (Slug Database)
                            </Label>
                            <Input
                                id="tenant-id"
                                placeholder="smkn1jakarta"
                                value={createForm.data.id}
                                onChange={(e) => {
                                    setIdManuallyEdited(true);
                                    createForm.setData(
                                        'id',
                                        e.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\-_]/g, ''),
                                    );
                                }}
                                required
                            />
                            <p className="text-[11px] text-slate-500">
                                Nama database:{' '}
                                <span className="font-mono font-medium">
                                    tenant{createForm.data.id || '...'}
                                </span>
                            </p>
                            {createForm.errors.id && (
                                <p className="text-xs text-rose-500">
                                    {createForm.errors.id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Tipe Akses Domain</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {(
                                    [
                                        {
                                            type: 'subdomain',
                                            title: 'Subdomain',
                                            desc: `*.${central.base_domain}`,
                                        },
                                        {
                                            type: 'custom',
                                            title: 'Custom Domain',
                                            desc: 'smkn1.sch.id',
                                        },
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        onClick={() =>
                                            createForm.setData(
                                                'domain_type',
                                                opt.type,
                                            )
                                        }
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            createForm.data.domain_type ===
                                            opt.type
                                                ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 dark:bg-indigo-950/40'
                                                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold">
                                            {opt.title}
                                        </div>
                                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                                            {opt.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tenant-domain">
                                {createForm.data.domain_type === 'subdomain'
                                    ? 'Nama Subdomain'
                                    : 'Custom Domain Lengkap'}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="tenant-domain"
                                    placeholder={
                                        createForm.data.domain_type ===
                                        'subdomain'
                                            ? 'smkn1'
                                            : 'absensi.smkn1.sch.id'
                                    }
                                    value={createForm.data.domain}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'domain',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {createForm.data.domain_type ===
                                    'subdomain' && (
                                    <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-2 font-mono text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                        .{central.base_domain}
                                    </span>
                                )}
                            </div>
                            {previewCreateUrl && (
                                <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                                    Preview akses:{' '}
                                    <span className="font-mono font-medium">
                                        {previewCreateUrl}
                                    </span>
                                </p>
                            )}
                            {createForm.errors.domain && (
                                <p className="text-xs text-rose-500">
                                    {createForm.errors.domain}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={createForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                {createForm.processing
                                    ? 'Membuat Database...'
                                    : 'Buat Sekolah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Tambah Domain / Subdomain ke Tenant */}
            <Dialog
                open={Boolean(addDomainTenant)}
                onOpenChange={(open) => !open && setAddDomainTenant(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Domain / Subdomain</DialogTitle>
                        <DialogDescription>
                            Tambahkan alamat akses baru untuk{' '}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {addDomainTenant?.name}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleAddDomainSubmit}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {(
                                [
                                    { type: 'subdomain', label: 'Subdomain' },
                                    { type: 'custom', label: 'Custom Domain' },
                                ] as const
                            ).map((opt) => (
                                <button
                                    key={opt.type}
                                    type="button"
                                    onClick={() =>
                                        domainForm.setData(
                                            'domain_type',
                                            opt.type,
                                        )
                                    }
                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                                        domainForm.data.domain_type === opt.type
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="extra-domain">
                                {domainForm.data.domain_type === 'subdomain'
                                    ? 'Subdomain'
                                    : 'Custom Domain'}
                            </Label>
                            <Input
                                id="extra-domain"
                                placeholder={
                                    domainForm.data.domain_type === 'subdomain'
                                        ? `contoh: smkn1 (akan jadi smkn1.${central.base_domain})`
                                        : 'contoh: portal.smkn1.sch.id'
                                }
                                value={domainForm.data.domain}
                                onChange={(e) =>
                                    domainForm.setData('domain', e.target.value)
                                }
                                required
                            />
                            {domainForm.errors.domain && (
                                <p className="text-xs text-rose-500">
                                    {domainForm.errors.domain}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAddDomainTenant(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={domainForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                {domainForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Domain'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Nama Sekolah */}
            <Dialog
                open={Boolean(editTenant)}
                onOpenChange={(open) => !open && setEditTenant(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Nama Sekolah</DialogTitle>
                        <DialogDescription>
                            Perbarui nama tampilan untuk tenant{' '}
                            <span className="font-mono">{editTenant?.id}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-tenant-name">
                                Nama Sekolah
                            </Label>
                            <Input
                                id="edit-tenant-name"
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                                required
                            />
                            {editForm.errors.name && (
                                <p className="text-xs text-rose-500">
                                    {editForm.errors.name}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditTenant(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={editForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Konfirmasi Hapus Sekolah */}
            <Dialog
                open={Boolean(deleteTenant)}
                onOpenChange={(open) => !open && setDeleteTenant(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600">
                            Hapus Sekolah & Database?
                        </DialogTitle>
                        <DialogDescription>
                            Tindakan ini permanen dan akan menghapus database{' '}
                            <span className="font-mono font-semibold">
                                {deleteTenant?.database}
                            </span>{' '}
                            beserta seluruh domainnya. Ketik{' '}
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {deleteTenant?.id}
                            </span>{' '}
                            untuk konfirmasi.
                        </DialogDescription>
                    </DialogHeader>

                    <Input
                        placeholder={`Ketik "${deleteTenant?.id}"`}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteTenant(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                deleting ||
                                deleteConfirmText !== deleteTenant?.id
                            }
                            onClick={handleDeleteTenant}
                        >
                            {deleting ? 'Menghapus...' : 'Hapus Permanen'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
