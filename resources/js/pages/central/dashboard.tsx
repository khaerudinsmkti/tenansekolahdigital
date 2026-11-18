import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    Check,
    Copy,
    CreditCard,
    Database,
    ExternalLink,
    Globe,
    Home,
    Image as ImageIcon,
    Layers,
    LogOut,
    Palette,
    Pencil,
    PlayCircle,
    Plus,
    RefreshCw,
    School,
    Search,
    Server,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
    UserPlus,
    Users,
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

interface TenantLicense {
    starts_at: string | null;
    expires_at: string | null;
    status: 'unlimited' | 'upcoming' | 'active' | 'expired';
    is_usable: boolean;
    days_remaining: number | null;
}

interface TenantItem {
    id: string;
    name: string;
    database: string;
    created_at: string | null;
    domains: TenantDomain[];
    license?: TenantLicense;
}

interface TenantUserItem {
    id: number;
    name: string;
    email: string;
    username: string | null;
    nip: string | null;
    role: 'admin' | 'principal';
    created_at: string | null;
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

interface CentralTutorialItem {
    id: number;
    title: string;
    youtube_url: string;
    youtube_id: string;
    description: string | null;
    target_roles: string[];
    order: number;
    is_active: boolean;
    thumbnail_url: string;
    embed_url: string;
}

interface TutorialRoleOption {
    key: string;
    name: string;
    badge: string;
    description: string;
    color: string;
}

interface CentralAdminItem {
    id: string;
    name: string;
    email: string;
    created_at: string;
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
    billingSettings: {
        whatsapp: string;
        bank_name: string;
        account_number: string;
        account_name: string;
        email: string;
    };
    brandingSettings: {
        name: string;
        logo_path: string | null;
        logo_url: string | null;
    };
    centralAdmins: CentralAdminItem[];
    currentCentralAdminId?: string | null;
    tutorials: CentralTutorialItem[];
    tutorialRoles: Record<string, TutorialRoleOption>;
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
    billingSettings,
    brandingSettings,
    centralAdmins = [],
    currentCentralAdminId = null,
    tutorials = [],
    tutorialRoles = {},
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
    const [activeMenu, setActiveMenu] = useState<
        'tenants' | 'tutorials' | 'branding' | 'theme' | 'billing' | 'admins'
    >('tenants');

    // Central Admin Accounts modal states
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const [editingCentralAdmin, setEditingCentralAdmin] =
        useState<CentralAdminItem | null>(null);
    const centralAdminForm = useForm<{
        name: string;
        email: string;
        password: string;
    }>({
        name: '',
        email: '',
        password: '',
    });

    const openCreateCentralAdminModal = () => {
        setEditingCentralAdmin(null);
        centralAdminForm.setData({ name: '', email: '', password: '' });
        centralAdminForm.clearErrors();
        setAdminModalOpen(true);
    };

    const openEditCentralAdminModal = (admin: CentralAdminItem) => {
        setEditingCentralAdmin(admin);
        centralAdminForm.setData({
            name: admin.name,
            email: admin.email,
            password: '',
        });
        centralAdminForm.clearErrors();
        setAdminModalOpen(true);
    };

    const handleCentralAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCentralAdmin) {
            centralAdminForm.put(
                `/admin/central-admins/${editingCentralAdmin.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAdminModalOpen(false);
                        setEditingCentralAdmin(null);
                    },
                },
            );
        } else {
            centralAdminForm.post('/admin/central-admins', {
                preserveScroll: true,
                onSuccess: () => {
                    setAdminModalOpen(false);
                    centralAdminForm.reset();
                },
            });
        }
    };
    const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);
    const [themeLevelFilter, setThemeLevelFilter] = useState<string>('ALL');
    const [savingTheme, setSavingTheme] = useState(false);

    const brandingForm = useForm<{
        name: string;
        logo: File | null;
        remove_logo: boolean;
    }>({
        name: brandingSettings?.name ?? 'SekolahDigital',
        logo: null,
        remove_logo: false,
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(
        brandingSettings?.logo_url ?? null,
    );

    const billingForm = useForm({
        whatsapp: billingSettings?.whatsapp ?? '6281234567890',
        bank_name: billingSettings?.bank_name ?? 'Bank BCA',
        account_number: billingSettings?.account_number ?? '1234567890',
        account_name: billingSettings?.account_name ?? 'PT Sekolah Digital Indonesia',
        email: billingSettings?.email ?? 'admin@central.local',
    });

    // Central Video Tutorial modal states
    const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] =
        useState<CentralTutorialItem | null>(null);
    const [syncingTutorials, setSyncingTutorials] = useState(false);
    const tutorialForm = useForm<{
        title: string;
        youtube_url: string;
        description: string;
        target_roles: string[];
        order: number;
        is_active: boolean;
    }>({
        title: '',
        youtube_url: '',
        description: '',
        target_roles: ['teacher'],
        order: 0,
        is_active: true,
    });

    // License modal states
    const [licenseTenant, setLicenseTenant] = useState<TenantItem | null>(null);
    const licenseForm = useForm<{
        license_starts_at: string;
        license_expires_at: string;
    }>({
        license_starts_at: '',
        license_expires_at: '',
    });

    // Tenant Users (Admin & Kepala Sekolah) modal states
    const [manageUsersTenant, setManageUsersTenant] =
        useState<TenantItem | null>(null);
    const [tenantUsers, setTenantUsers] = useState<TenantUserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [editingUser, setEditingUser] = useState<TenantUserItem | null>(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [userErrors, setUserErrors] = useState<Record<string, string[]>>({});
    const [userFormData, setUserFormData] = useState<{
        name: string;
        email: string;
        username: string;
        nip: string;
        role: 'admin' | 'principal';
        password: string;
    }>({
        name: '',
        email: '',
        username: '',
        nip: '',
        role: 'admin',
        password: '',
    });

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

    const openLicenseModal = (tenant: TenantItem) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        licenseForm.setData({
            license_starts_at: tenant.license?.starts_at ?? todayStr,
            license_expires_at: tenant.license?.expires_at ?? '',
        });
        licenseForm.clearErrors();
        setLicenseTenant(tenant);
    };

    const applyLicensePreset = (months: number | null) => {
        if (months === null) {
            licenseForm.setData({
                license_starts_at: '',
                license_expires_at: '',
            });
            return;
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const startStr = licenseForm.data.license_starts_at || todayStr;
        const endDate = new Date(`${startStr}T00:00:00`);
        endDate.setMonth(endDate.getMonth() + months);
        const yyyy = endDate.getFullYear();
        const mm = String(endDate.getMonth() + 1).padStart(2, '0');
        const dd = String(endDate.getDate()).padStart(2, '0');

        licenseForm.setData({
            license_starts_at: startStr,
            license_expires_at: `${yyyy}-${mm}-${dd}`,
        });
    };

    const handleLicenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseTenant) return;

        licenseForm.patch(`/admin/tenants/${licenseTenant.id}/license`, {
            preserveScroll: true,
            onSuccess: () => {
                setLicenseTenant(null);
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

    const openCreateTutorialModal = () => {
        setEditingTutorial(null);
        tutorialForm.setData({
            title: '',
            youtube_url: '',
            description: '',
            target_roles: ['teacher'],
            order: tutorials.length + 1,
            is_active: true,
        });
        tutorialForm.clearErrors();
        setTutorialModalOpen(true);
    };

    const openEditTutorialModal = (item: CentralTutorialItem) => {
        setEditingTutorial(item);
        tutorialForm.setData({
            title: item.title,
            youtube_url: item.youtube_url,
            description: item.description ?? '',
            target_roles: item.target_roles ?? ['teacher'],
            order: item.order ?? 0,
            is_active: item.is_active,
        });
        tutorialForm.clearErrors();
        setTutorialModalOpen(true);
    };

    const toggleTutorialRole = (roleKey: string) => {
        const current = tutorialForm.data.target_roles;
        if (roleKey === 'all') {
            tutorialForm.setData(
                'target_roles',
                current.includes('all') ? [] : ['all'],
            );
            return;
        }
        const withoutAll = current.filter((r) => r !== 'all');
        if (withoutAll.includes(roleKey)) {
            tutorialForm.setData(
                'target_roles',
                withoutAll.filter((r) => r !== roleKey),
            );
        } else {
            tutorialForm.setData('target_roles', [...withoutAll, roleKey]);
        }
    };

    const handleTutorialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTutorial) {
            tutorialForm.put(`/admin/tutorials/${editingTutorial.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setTutorialModalOpen(false);
                    setEditingTutorial(null);
                },
            });
        } else {
            tutorialForm.post('/admin/tutorials', {
                preserveScroll: true,
                onSuccess: () => {
                    setTutorialModalOpen(false);
                    tutorialForm.reset();
                },
            });
        }
    };

    const handleSyncAllTutorials = () => {
        setSyncingTutorials(true);
        router.post(
            '/admin/tutorials/sync-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setSyncingTutorials(false),
            },
        );
    };

    const handleBrandingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        brandingForm.post('/admin/branding-settings', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                brandingForm.setData('logo', null);
                brandingForm.setData('remove_logo', false);
            },
        });
    };

    const handleBillingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        billingForm.post('/admin/billing-settings', {
            preserveScroll: true,
        });
    };

    const themeLevels = useMemo(() => {
        const levels = Array.from(new Set(themes.map((t) => t.level)));
        return ['ALL', ...levels];
    }, [themes]);

    const filteredThemes = useMemo(() => {
        if (themeLevelFilter === 'ALL') return themes;
        return themes.filter((t) => t.level === themeLevelFilter);
    }, [themes, themeLevelFilter]);

    const getCsrfToken = (): string => {
        return (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        );
    };

    const resetUserForm = (role: 'admin' | 'principal' = 'admin') => {
        setEditingUser(null);
        setUserErrors({});
        setUserFormData({
            name: '',
            email: '',
            username: '',
            nip: '',
            role,
            password: '',
        });
    };

    const openManageUsers = async (tenant: TenantItem) => {
        setManageUsersTenant(tenant);
        setShowUserForm(false);
        resetUserForm();
        setLoadingUsers(true);
        setTenantUsers([]);

        try {
            const response = await fetch(`/admin/tenants/${tenant.id}/users`, {
                headers: { Accept: 'application/json' },
            });
            const data = (await response.json()) as {
                users?: TenantUserItem[];
                message?: string;
            };
            if (!response.ok) {
                toast.error(data.message || 'Gagal memuat user sekolah.');
            } else {
                setTenantUsers(data.users ?? []);
            }
        } catch {
            toast.error('Terjadi kesalahan jaringan saat memuat user.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const startEditTenantUser = (user: TenantUserItem) => {
        setEditingUser(user);
        setUserErrors({});
        setUserFormData({
            name: user.name,
            email: user.email,
            username: user.username ?? '',
            nip: user.nip ?? '',
            role: user.role,
            password: '',
        });
        setShowUserForm(true);
    };

    const handleSaveTenantUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manageUsersTenant) return;

        setSavingUser(true);
        setUserErrors({});

        const url = editingUser
            ? `/admin/tenants/${manageUsersTenant.id}/users/${editingUser.id}`
            : `/admin/tenants/${manageUsersTenant.id}/users`;

        try {
            const response = await fetch(url, {
                method: editingUser ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(userFormData),
            });

            const data = (await response.json()) as {
                user?: TenantUserItem;
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                if (data.errors) {
                    setUserErrors(data.errors);
                }
                toast.error(data.message || 'Gagal menyimpan data user.');
                return;
            }

            if (data.user) {
                if (editingUser) {
                    setTenantUsers((prev) =>
                        prev.map((u) =>
                            u.id === data.user!.id ? data.user! : u,
                        ),
                    );
                } else {
                    setTenantUsers((prev) => [...prev, data.user!]);
                }
            }

            toast.success(data.message || 'User berhasil disimpan.');
            setShowUserForm(false);
            resetUserForm();
        } catch {
            toast.error('Terjadi kesalahan saat menyimpan user.');
        } finally {
            setSavingUser(false);
        }
    };

    const handleDeleteTenantUser = async (user: TenantUserItem) => {
        if (!manageUsersTenant) return;
        setDeletingUserId(user.id);

        try {
            const response = await fetch(
                `/admin/tenants/${manageUsersTenant.id}/users/${user.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                },
            );

            const data = (await response.json()) as { message?: string };
            if (!response.ok) {
                toast.error(data.message || 'Gagal menghapus user.');
                return;
            }

            setTenantUsers((prev) => prev.filter((u) => u.id !== user.id));
            toast.success(data.message || 'User berhasil dihapus.');
        } catch {
            toast.error('Terjadi kesalahan saat menghapus user.');
        } finally {
            setDeletingUserId(null);
        }
    };

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

            <div className="flex h-screen overflow-hidden bg-[#F6F7FB] text-[#1A1A2E] dark:bg-[#0E0A1A] dark:text-white">
                {/* Mobile Sidebar Backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Central Admin Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 flex h-full w-[272px] shrink-0 flex-col border-r border-gray-200/80 bg-white/95 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 dark:border-white/[0.08] dark:bg-[#151026]/95 ${
                        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Brand Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4.5 dark:border-white/[0.06]">
                        <div className="flex items-center gap-3 min-w-0">
                            {brandingSettings?.logo_url ? (
                                <img
                                    src={brandingSettings.logo_url}
                                    alt={brandingSettings.name}
                                    className="h-10 w-10 shrink-0 rounded-2xl border border-gray-200 bg-white object-contain p-1 shadow-sm dark:border-white/10"
                                />
                            ) : (
                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#FF8552] to-[#FFB347] text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/25">
                                    <AppLogoIcon className="h-5 w-5 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-black tracking-tight text-gray-900 dark:text-white">
                                        {brandingSettings?.name || 'Central Hub'}
                                    </span>
                                    <span className="shrink-0 rounded-md bg-[#FFF0EB] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FF6B35] dark:bg-[#FF6B35]/20 dark:text-[#FF9E75]">
                                        Admin
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                    Multi-Tenant Control
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(false)}
                            className="rounded-xl p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 lg:hidden dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
                        <div className="space-y-1">
                            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Manajemen Utama
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('tenants');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'tenants'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <Building2
                                        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                            activeMenu === 'tenants'
                                                ? 'text-white'
                                                : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                        }`}
                                    />
                                    <span>Sekolah & Domain</span>
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                        activeMenu === 'tenants'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                    }`}
                                >
                                    {tenants.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('tutorials');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'tutorials'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <PlayCircle
                                        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                            activeMenu === 'tutorials'
                                                ? 'text-white'
                                                : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                        }`}
                                    />
                                    <span>Video Tutorial</span>
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                        activeMenu === 'tutorials'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                                    }`}
                                >
                                    {tutorials.length}
                                </span>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Kustomisasi & Billing
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('branding');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'branding'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <School
                                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                        activeMenu === 'branding'
                                            ? 'text-white'
                                            : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                    }`}
                                />
                                <span>Logo & Nama</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('theme');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'theme'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <Palette
                                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                        activeMenu === 'theme'
                                            ? 'text-white'
                                            : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                    }`}
                                />
                                <span>Tema Landing Page</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('billing');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'billing'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <CreditCard
                                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                        activeMenu === 'billing'
                                            ? 'text-white'
                                            : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                    }`}
                                />
                                <span>Billing & Kontak</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveMenu('admins');
                                    setMobileSidebarOpen(false);
                                }}
                                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all duration-200 ${
                                    activeMenu === 'admins'
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25'
                                        : 'font-semibold text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                                }`}
                            >
                                <ShieldCheck
                                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${
                                        activeMenu === 'admins'
                                            ? 'text-white'
                                            : 'text-gray-400 group-hover:text-[#FF6B35] dark:text-gray-400'
                                    }`}
                                />
                                <span>Akun Admin Central</span>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Sistem & Pintasan
                            </div>
                            <Link
                                href="/"
                                className="group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Home className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#FF6B35]" />
                                    <span>Landing Page Central</span>
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-gray-300 transition-colors group-hover:text-[#FF6B35] dark:text-gray-600" />
                            </Link>

                            <button
                                type="button"
                                onClick={handleMigrateAll}
                                disabled={migratingAll || tenants.length === 0}
                                className="group flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold text-gray-600 transition-all duration-200 hover:bg-emerald-50/80 hover:text-emerald-700 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 text-gray-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${
                                        migratingAll ? 'animate-spin text-emerald-600' : ''
                                    }`}
                                />
                                <span>{migratingAll ? 'Memigrasi DB...' : 'Migrate Semua DB'}</span>
                            </button>
                        </div>
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="border-t border-gray-100 p-3.5 dark:border-white/[0.06]">
                        <div className="mb-2.5 rounded-2xl border border-gray-200/80 bg-gray-50/80 p-3 dark:border-white/[0.08] dark:bg-[#100B1E]">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                    Central Host
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
                                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    Online
                                </span>
                            </div>
                            <div className="mt-1 truncate font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {central.current_host}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/admin/logout')}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/50 px-3 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100/80 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Keluar Admin
                        </button>
                    </div>
                </aside>

                <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
                    {/* Ambient Background Glows */}
                    <div className="pointer-events-none fixed top-0 right-0 -z-0 size-[460px] rounded-full bg-[#FF6B35]/[0.07] blur-[120px]" />
                    <div className="pointer-events-none fixed bottom-0 left-64 -z-0 size-[420px] rounded-full bg-[#4ECDC4]/[0.07] blur-[120px]" />

                    {/* Top Sticky Header */}
                    <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#130E24]/80">
                        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileSidebarOpen(true)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-2xs transition-colors hover:bg-gray-50 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                    title="Buka menu"
                                >
                                    <Layers className="h-4 w-4" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h1 className="text-base font-black tracking-tight text-gray-900 sm:text-lg dark:text-white">
                                            {activeMenu === 'tenants'
                                                ? 'Sekolah & Domain'
                                                : activeMenu === 'tutorials'
                                                  ? 'Video Tutorial Global'
                                                  : activeMenu === 'branding'
                                                    ? 'Logo & Nama Sekolah'
                                                    : activeMenu === 'theme'
                                                      ? 'Tema Landing Page'
                                                      : 'Billing & Kontak Admin'}
                                        </h1>
                                        <Badge
                                            variant="secondary"
                                            className="hidden border border-[#FF6B35]/25 bg-[#FFF0EB] text-[11px] font-bold text-[#FF6B35] sm:inline-flex dark:border-[#FF6B35]/40 dark:bg-[#FF6B35]/15 dark:text-[#FF9E75]"
                                        >
                                            Multi-DB MySQL
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {activeMenu === 'tenants'
                                            ? 'Kelola subdomain, custom domain, lisensi, & database sekolah dari satu tempat'
                                            : activeMenu === 'tutorials'
                                              ? 'Sinkronisasi panduan video YouTube ke seluruh portal sekolah'
                                              : activeMenu === 'branding'
                                                ? 'Atur logo dan nama utama yang tampil pada landing page & header central'
                                                : activeMenu === 'theme'
                                                  ? 'Atur identitas visual & palet warna landing page utama central'
                                                  : 'Konfigurasi informasi pembayaran, WhatsApp, & email layanan'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        createForm.reset();
                                        createForm.clearErrors();
                                        setIdManuallyEdited(false);
                                        setCreateOpen(true);
                                    }}
                                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] px-4 font-bold text-white shadow-md shadow-[#FF6B35]/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#FF6B35]/30"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Tambah Sekolah
                                </Button>
                            </div>
                        </div>
                    </header>

                <main className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    {activeMenu === 'tutorials' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#18122B]/90">
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg font-black">
                                            <PlayCircle className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                                            Manajemen Video Tutorial Global
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Setiap video tutorial yang dibuat, diubah, atau dihapus di sini akan otomatis disinkronkan ke seluruh tenan sesuai target role.
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={syncingTutorials || tutorials.length === 0}
                                            onClick={handleSyncAllTutorials}
                                            className="rounded-xl font-bold"
                                        >
                                            <RefreshCw
                                                className={`mr-1.5 h-3.5 w-3.5 ${syncingTutorials ? 'animate-spin' : ''}`}
                                            />
                                            {syncingTutorials
                                                ? 'Menyinkronkan...'
                                                : 'Sync ke Semua Tenan'}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={openCreateTutorialModal}
                                            className="rounded-xl font-bold shadow-brand"
                                        >
                                            <Plus className="mr-1.5 h-4 w-4" />
                                            Tambah Video Tutorial
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {tutorials.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-[#E8E8E8] py-12 text-center dark:border-[#2D234A]">
                                            <PlayCircle className="mx-auto mb-3 h-10 w-10 text-[#FF6B35]/60" />
                                            <div className="text-sm font-bold">
                                                Belum ada video tutorial global
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Tambahkan video tutorial YouTube untuk otomatis masuk ke menu Video Tutorial setiap sekolah.
                                            </p>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={openCreateTutorialModal}
                                                className="mt-4 rounded-xl font-bold shadow-brand"
                                            >
                                                <Plus className="mr-1.5 h-4 w-4" />
                                                Tambah Video Pertama
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {tutorials.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-2xs dark:border-[#2D234A] dark:bg-[#130E24]"
                                                >
                                                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                                                        <img
                                                            src={item.thumbnail_url}
                                                            alt={item.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                                            <span
                                                                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                                                                    item.is_active
                                                                        ? 'bg-emerald-500 text-white'
                                                                        : 'bg-gray-700 text-gray-200'
                                                                }`}
                                                            >
                                                                {item.is_active
                                                                    ? 'Aktif'
                                                                    : 'Nonaktif'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-4">
                                                        <div className="text-sm font-black text-gray-900 line-clamp-2 dark:text-white">
                                                            {item.title}
                                                        </div>
                                                        {item.description && (
                                                            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                                                {item.description}
                                                            </p>
                                                        )}

                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {item.target_roles.map((r) => (
                                                                <span
                                                                    key={r}
                                                                    className="rounded-md bg-[#FFF0EB] px-2 py-0.5 text-[10px] font-bold text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]"
                                                                >
                                                                    {r === 'all'
                                                                        ? 'Semua Peran'
                                                                        : tutorialRoles[r]?.badge || r}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <div className="mt-4 flex items-center justify-between border-t border-[#E8E8E8] pt-3 dark:border-[#2D234A]">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.patch(
                                                                        `/admin/tutorials/${item.id}/toggle`,
                                                                        {},
                                                                        { preserveScroll: true },
                                                                    )
                                                                }
                                                                className="text-xs font-bold text-gray-600 hover:text-[var(--brand-primary,#FF6B35)] dark:text-gray-300"
                                                            >
                                                                {item.is_active
                                                                    ? 'Nonaktifkan'
                                                                    : 'Aktifkan'}
                                                            </button>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() =>
                                                                        openEditTutorialModal(item)
                                                                    }
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                                                                    onClick={() =>
                                                                        router.delete(
                                                                            `/admin/tutorials/${item.id}`,
                                                                            { preserveScroll: true },
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : activeMenu === 'billing' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#18122B]/90">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-black">
                                        <CreditCard className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                                        Pengaturan Rekening, WhatsApp & Email Admin
                                    </CardTitle>
                                    <CardDescription>
                                        Informasi ini akan tampil pada popup
                                        peringatan lisensi H-30 hari maupun
                                        halaman pembayaran saat lisensi tenan
                                        berakhir.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={handleBillingSubmit}
                                        className="max-w-2xl space-y-4"
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="cb-bank">
                                                    Nama Bank
                                                </Label>
                                                <Input
                                                    id="cb-bank"
                                                    placeholder="Contoh: Bank BRI / Bank BCA"
                                                    value={
                                                        billingForm.data
                                                            .bank_name
                                                    }
                                                    onChange={(e) =>
                                                        billingForm.setData(
                                                            'bank_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {billingForm.errors
                                                    .bank_name && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            billingForm.errors
                                                                .bank_name
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="cb-account">
                                                    Nomor Rekening
                                                </Label>
                                                <Input
                                                    id="cb-account"
                                                    placeholder="1234567890"
                                                    value={
                                                        billingForm.data
                                                            .account_number
                                                    }
                                                    onChange={(e) =>
                                                        billingForm.setData(
                                                            'account_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {billingForm.errors
                                                    .account_number && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            billingForm.errors
                                                                .account_number
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 sm:col-span-2">
                                                <Label htmlFor="cb-owner">
                                                    Atas Nama Rekening
                                                </Label>
                                                <Input
                                                    id="cb-owner"
                                                    placeholder="Nama pemilik rekening"
                                                    value={
                                                        billingForm.data
                                                            .account_name
                                                    }
                                                    onChange={(e) =>
                                                        billingForm.setData(
                                                            'account_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {billingForm.errors
                                                    .account_name && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            billingForm.errors
                                                                .account_name
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="cb-wa">
                                                    Nomor HP / WhatsApp Admin
                                                </Label>
                                                <Input
                                                    id="cb-wa"
                                                    placeholder="6281234567890"
                                                    value={
                                                        billingForm.data.whatsapp
                                                    }
                                                    onChange={(e) =>
                                                        billingForm.setData(
                                                            'whatsapp',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {billingForm.errors
                                                    .whatsapp && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            billingForm.errors
                                                                .whatsapp
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="cb-email">
                                                    Email Admin Central
                                                </Label>
                                                <Input
                                                    id="cb-email"
                                                    type="email"
                                                    placeholder="admin@central.local"
                                                    value={
                                                        billingForm.data.email
                                                    }
                                                    onChange={(e) =>
                                                        billingForm.setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                {billingForm.errors.email && (
                                                    <p className="text-xs text-rose-500">
                                                        {
                                                            billingForm.errors
                                                                .email
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={
                                                    billingForm.processing
                                                }
                                                className="rounded-xl font-bold shadow-brand"
                                            >
                                                {billingForm.processing
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Pengaturan Billing'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    ) : activeMenu === 'branding' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#18122B]/90">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-black">
                                        <School className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                                        Pengaturan Logo & Nama Sekolah Central
                                    </CardTitle>
                                    <CardDescription>
                                        Atur nama dan logo resmi yang akan ditampilkan di header, footer, dan landing page utama central.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form
                                        onSubmit={handleBrandingSubmit}
                                        className="grid gap-6 lg:grid-cols-12"
                                    >
                                        <div className="space-y-5 lg:col-span-7">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="central-brand-name"
                                                    className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300"
                                                >
                                                    Nama Sekolah / Aplikasi Central
                                                </Label>
                                                <Input
                                                    id="central-brand-name"
                                                    value={brandingForm.data.name}
                                                    onChange={(e) =>
                                                        brandingForm.setData(
                                                            'name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Contoh: Sekolah Digital Indonesia"
                                                    className="h-11 rounded-xl"
                                                    required
                                                />
                                                {brandingForm.errors.name && (
                                                    <p className="text-xs text-rose-500">
                                                        {brandingForm.errors.name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                                    Logo Sekolah / Brand
                                                </Label>
                                                <div className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-gray-200/90 bg-gray-50/60 p-5 sm:flex-row sm:items-center dark:border-white/10 dark:bg-[#110C20]/60">
                                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xs dark:border-white/10 dark:bg-[#18122B]">
                                                        {logoPreview ? (
                                                            <img
                                                                src={logoPreview}
                                                                alt="Preview Logo"
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <label
                                                                htmlFor="central-logo-upload"
                                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition-colors hover:border-[#FF6B35]/50 hover:text-[#FF6B35] dark:border-white/10 dark:bg-[#18122B] dark:text-gray-200"
                                                            >
                                                                <Upload className="h-3.5 w-3.5" />
                                                                Pilih File Logo
                                                            </label>
                                                            <input
                                                                id="central-logo-upload"
                                                                type="file"
                                                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file =
                                                                        e.target
                                                                            .files?.[0];
                                                                    if (file) {
                                                                        brandingForm.setData(
                                                                            'logo',
                                                                            file,
                                                                        );
                                                                        brandingForm.setData(
                                                                            'remove_logo',
                                                                            false,
                                                                        );
                                                                        setLogoPreview(
                                                                            URL.createObjectURL(
                                                                                file,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />

                                                            {logoPreview && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                                                    onClick={() => {
                                                                        brandingForm.setData(
                                                                            'logo',
                                                                            null,
                                                                        );
                                                                        brandingForm.setData(
                                                                            'remove_logo',
                                                                            true,
                                                                        );
                                                                        setLogoPreview(
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                    Hapus Logo
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                            Format: PNG, JPG, WEBP, atau SVG (Maks. 2MB). Disarankan rasio 1:1 dengan latar transparan.
                                                        </p>
                                                        {brandingForm.errors.logo && (
                                                            <p className="text-xs text-rose-500">
                                                                {brandingForm.errors.logo}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={brandingForm.processing}
                                                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] px-5 font-bold text-white shadow-md shadow-[#FF6B35]/25"
                                                >
                                                    {brandingForm.processing
                                                        ? 'Menyimpan...'
                                                        : 'Simpan Logo & Nama'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Live Preview Box */}
                                        <div className="lg:col-span-5">
                                            <div className="rounded-2xl border border-gray-200/90 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-[#110C20]/70">
                                                <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Pratinjau Tampilan Header
                                                </div>
                                                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs dark:border-white/10 dark:bg-[#18122B]">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {logoPreview ? (
                                                            <img
                                                                src={logoPreview}
                                                                alt="Logo Preview"
                                                                className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1 dark:border-white/10"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-sm">
                                                                <School className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-black text-gray-900 dark:text-white">
                                                                {brandingForm.data.name || 'SekolahDigital'}
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-gray-400">
                                                                Portal Resmi Central
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-lg bg-[#FFF0EB] px-2.5 py-1 text-[10px] font-bold text-[#FF6B35] dark:bg-[#FF6B35]/20 dark:text-[#FF9E75]">
                                                        Aktif
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    ) : activeMenu === 'admins' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-[#E8E8E8] bg-white/90 shadow-xs dark:border-[#2D234A] dark:bg-[#18122B]/90">
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg font-black">
                                            <ShieldCheck className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                                            Manajemen Akun Login Admin Central
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Kelola akun yang dapat masuk ke
                                            halaman Admin Central (/admin/login).
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={openCreateCentralAdminModal}
                                        className="shrink-0 rounded-xl font-bold shadow-brand"
                                    >
                                        <UserPlus className="mr-1.5 h-4 w-4" />
                                        Tambah Admin Central
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {centralAdmins.map((admin) => {
                                        const isCurrentSession =
                                            currentCentralAdminId === admin.id;
                                        return (
                                            <div
                                                key={admin.id}
                                                className="flex flex-col gap-3 rounded-2xl border border-[#E8E8E8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2D234A] dark:bg-[#130E24]"
                                            >
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {admin.name}
                                                        </span>
                                                        {isCurrentSession && (
                                                            <Badge className="bg-[#FFF0EB] text-[10px] font-bold text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]">
                                                                Sedang Login
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {admin.email}
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditCentralAdminModal(
                                                                admin,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                                        Edit / Password
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/50"
                                                        title={
                                                            isCurrentSession
                                                                ? 'Tidak bisa menghapus akun yang sedang login'
                                                                : 'Hapus akun admin'
                                                        }
                                                        disabled={
                                                            isCurrentSession ||
                                                            centralAdmins.length <=
                                                                1
                                                        }
                                                        onClick={() =>
                                                            router.delete(
                                                                `/admin/central-admins/${admin.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    ) : activeMenu === 'theme' ? (
                        <div className="space-y-6">
                            <Card className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#18122B]/90">
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
                        <Card className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B35]/40 hover:shadow-lg hover:shadow-[#FF6B35]/10 dark:border-white/[0.08] dark:bg-[#18122B]/90">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF6B35] to-[#FFB347]" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Total Sekolah
                                </CardDescription>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF0EB] to-[#FFE2D6] text-[#FF6B35] ring-1 ring-[#FF6B35]/15 transition-transform duration-300 group-hover:scale-105 dark:from-[#331C1A] dark:to-[#291513] dark:text-[#FF8C5A]">
                                    <Building2 className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {stats.total_tenants}
                                </div>
                                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Tenant aktif dengan database terpisah
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#20B2AA]/40 hover:shadow-lg hover:shadow-[#20B2AA]/10 dark:border-white/[0.08] dark:bg-[#18122B]/90">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#20B2AA] to-[#4ECDC4]" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Total Domain
                                </CardDescription>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E6FAF8] to-[#CCF5F1] text-[#20B2AA] ring-1 ring-[#20B2AA]/15 transition-transform duration-300 group-hover:scale-105 dark:from-[#123836] dark:to-[#0F2D2B] dark:text-[#4ECDC4]">
                                    <Globe className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                    {stats.total_domains}
                                </div>
                                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {stats.subdomains_count} subdomain ·{' '}
                                    {stats.custom_domains_count} custom domain
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-white/[0.08] dark:bg-[#18122B]/90">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Arsitektur DB
                                </CardDescription>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 ring-1 ring-emerald-500/15 transition-transform duration-300 group-hover:scale-105 dark:from-emerald-950/70 dark:to-emerald-900/50 dark:text-emerald-400">
                                    <Database className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-900 dark:text-white">
                                    MySQL Multi-DB
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Isolasi database & storage otomatis
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 dark:border-white/[0.08] dark:bg-[#18122B]/90">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Base Domain
                                </CardDescription>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 ring-1 ring-amber-500/15 transition-transform duration-300 group-hover:scale-105 dark:from-amber-950/70 dark:to-amber-900/50 dark:text-amber-400">
                                    <Server className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="truncate font-mono text-base font-bold text-gray-900 dark:text-white">
                                    *.{central.base_domain}
                                    {central.port_suffix}
                                </div>
                                <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Central host: {central.current_host}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Toolbar: Search + Filter */}
                    <Card className="rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#18122B]/90">
                        <CardContent className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama sekolah, ID tenant, database, atau domain..."
                                    className="h-10 rounded-xl border-gray-200/90 bg-gray-50/70 pl-10 pr-9 text-sm transition-colors focus:bg-white dark:border-white/10 dark:bg-[#100B1E] dark:focus:bg-[#151026]"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-200/70 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                        title="Bersihkan pencarian"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-[#100B1E]">
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
                                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            domainFilter === tab.key
                                                ? 'bg-white text-[#FF6B35] shadow-xs dark:bg-[#FF6B35] dark:text-white'
                                                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
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
                        <Card className="rounded-2xl border-2 border-dashed border-gray-200/90 bg-white/70 dark:border-white/10 dark:bg-[#18122B]/50">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF0EB] to-[#FFE2D6] text-[#FF6B35] shadow-sm dark:from-[#331C1A] dark:to-[#291513] dark:text-[#FF8C5A]">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {tenants.length === 0
                                        ? 'Belum ada sekolah terdaftar'
                                        : 'Tidak ada sekolah yang cocok'}
                                </h3>
                                <p className="mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
                                    {tenants.length === 0
                                        ? 'Tambahkan sekolah pertama untuk otomatis membuat database MySQL terpisah beserta subdomain atau custom domain-nya.'
                                        : 'Coba ubah kata kunci pencarian atau filter tipe domain.'}
                                </p>
                                {tenants.length === 0 && (
                                    <Button
                                        className="mt-5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8A5B] font-bold text-white shadow-md shadow-[#FF6B35]/25"
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
                                    className="group overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#FF6B35]/45 hover:shadow-xl hover:shadow-[#FF6B35]/[0.06] dark:border-white/[0.08] dark:bg-[#18122B]/95 dark:hover:border-[#FF6B35]/50"
                                >
                                    <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#FF8552] to-[#FFB347] text-sm font-black uppercase text-white shadow-md shadow-[#FF6B35]/20 ring-1 ring-white/20">
                                                {tenant.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">
                                                        {tenant.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-lg border-gray-200 bg-gray-50/80 font-mono text-[11px] font-semibold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                                                    >
                                                        ID: {tenant.id}
                                                    </Badge>
                                                    {tenant.license && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[11px] font-bold ${
                                                                tenant.license
                                                                    .status ===
                                                                'expired'
                                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                                    : tenant
                                                                            .license
                                                                            .status ===
                                                                        'upcoming'
                                                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                                      : tenant
                                                                              .license
                                                                              .status ===
                                                                          'active'
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            {tenant.license
                                                                .status ===
                                                            'expired'
                                                                ? 'Lisensi Expired'
                                                                : tenant.license
                                                                        .status ===
                                                                    'upcoming'
                                                                  ? `Aktif ${tenant.license.starts_at}`
                                                                  : tenant
                                                                          .license
                                                                          .status ===
                                                                      'active'
                                                                    ? tenant
                                                                          .license
                                                                          .expires_at
                                                                        ? `Lisensi Aktif · Sisa ${tenant.license.days_remaining} hari`
                                                                        : 'Lisensi Aktif'
                                                                    : 'Tanpa Batas'}
                                                        </Badge>
                                                    )}
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
                                                onClick={() =>
                                                    openLicenseModal(tenant)
                                                }
                                            >
                                                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                                                Lisensi
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    void openManageUsers(tenant)
                                                }
                                            >
                                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                                Admin & Kepsek
                                            </Button>
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

                                    <CardContent className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-white/[0.06] dark:bg-[#110C20]/60">
                                        <div className="mb-2.5 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            <span>
                                                Domain & Subdomain Terhubung ({tenant.domains.length})
                                            </span>
                                        </div>
                                        {tenant.domains.length === 0 ? (
                                            <p className="text-xs italic text-gray-400">
                                                Belum ada domain terhubung. Klik
                                                "+ Domain" untuk menambahkan.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {tenant.domains.map((dom) => (
                                                    <div
                                                        key={dom.id}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3 py-1.5 text-xs shadow-2xs transition-colors hover:border-[#FF6B35]/35 dark:border-white/10 dark:bg-[#18122B]"
                                                    >
                                                        <span
                                                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
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
                                                        <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                                            {dom.full_host}
                                                            {central.port_suffix}
                                                        </span>

                                                        <div className="ml-1 flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-white/10">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        dom.url,
                                                                    )
                                                                }
                                                                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
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
                                                                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-[#FFF0EB] hover:text-[#FF6B35] dark:hover:bg-[#FF6B35]/20 dark:hover:text-[#FF9E75]"
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
                                                                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
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

            {/* Modal: Tambah / Edit Akun Admin Central */}
            <Dialog
                open={adminModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setAdminModalOpen(false);
                        setEditingCentralAdmin(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                            {editingCentralAdmin
                                ? 'Edit Akun Admin Central'
                                : 'Tambah Akun Admin Central'}
                        </DialogTitle>
                        <DialogDescription>
                            Akun ini digunakan untuk login ke panel Central
                            Tenancy Hub.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleCentralAdminSubmit}
                        className="space-y-4"
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="ca-name">Nama Admin</Label>
                            <Input
                                id="ca-name"
                                placeholder="Nama lengkap"
                                value={centralAdminForm.data.name}
                                onChange={(e) =>
                                    centralAdminForm.setData(
                                        'name',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {centralAdminForm.errors.name && (
                                <p className="text-xs text-rose-500">
                                    {centralAdminForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ca-email">Email Login</Label>
                            <Input
                                id="ca-email"
                                type="email"
                                placeholder="admin@central.local"
                                value={centralAdminForm.data.email}
                                onChange={(e) =>
                                    centralAdminForm.setData(
                                        'email',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {centralAdminForm.errors.email && (
                                <p className="text-xs text-rose-500">
                                    {centralAdminForm.errors.email}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ca-password">
                                Kata Sandi{' '}
                                {editingCentralAdmin
                                    ? '(Kosongkan jika tetap)'
                                    : '(Min. 8 karakter)'}
                            </Label>
                            <Input
                                id="ca-password"
                                type="password"
                                placeholder="••••••••"
                                value={centralAdminForm.data.password}
                                onChange={(e) =>
                                    centralAdminForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                required={!editingCentralAdmin}
                            />
                            {centralAdminForm.errors.password && (
                                <p className="text-xs text-rose-500">
                                    {centralAdminForm.errors.password}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAdminModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={centralAdminForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                {centralAdminForm.processing
                                    ? 'Menyimpan...'
                                    : editingCentralAdmin
                                      ? 'Simpan Perubahan'
                                      : 'Tambah Admin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Tambah / Edit Video Tutorial Global */}
            <Dialog
                open={tutorialModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setTutorialModalOpen(false);
                        setEditingTutorial(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                            {editingTutorial
                                ? 'Edit Video Tutorial'
                                : 'Tambah Video Tutorial Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            Video akan otomatis masuk ke seluruh tenan sesuai
                            target peran (role) yang dipilih.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTutorialSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="ct-title">Judul Video</Label>
                            <Input
                                id="ct-title"
                                placeholder="Contoh: Panduan Input Presensi Harian"
                                value={tutorialForm.data.title}
                                onChange={(e) =>
                                    tutorialForm.setData('title', e.target.value)
                                }
                                required
                            />
                            {tutorialForm.errors.title && (
                                <p className="text-xs text-rose-500">
                                    {tutorialForm.errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ct-youtube">URL YouTube</Label>
                            <Input
                                id="ct-youtube"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={tutorialForm.data.youtube_url}
                                onChange={(e) =>
                                    tutorialForm.setData(
                                        'youtube_url',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {tutorialForm.errors.youtube_url && (
                                <p className="text-xs text-rose-500">
                                    {tutorialForm.errors.youtube_url}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ct-desc">
                                Deskripsi Singkat (Opsional)
                            </Label>
                            <textarea
                                id="ct-desc"
                                rows={2}
                                placeholder="Penjelasan singkat isi video..."
                                value={tutorialForm.data.description}
                                onChange={(e) =>
                                    tutorialForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Target Role di Tenan</Label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleTutorialRole('all')}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                                        tutorialForm.data.target_roles.includes(
                                            'all',
                                        )
                                            ? 'border-[var(--brand-primary,#FF6B35)] bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)]'
                                            : 'border-[#E8E8E8] text-gray-600 dark:border-[#2D234A] dark:text-gray-300'
                                    }`}
                                >
                                    Semua Peran
                                </button>
                                {Object.values(tutorialRoles).map((r) => {
                                    const active =
                                        tutorialForm.data.target_roles.includes(
                                            r.key,
                                        );
                                    return (
                                        <button
                                            key={r.key}
                                            type="button"
                                            onClick={() =>
                                                toggleTutorialRole(r.key)
                                            }
                                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                                                active
                                                    ? 'border-[var(--brand-primary,#FF6B35)] bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)]'
                                                    : 'border-[#E8E8E8] text-gray-600 dark:border-[#2D234A] dark:text-gray-300'
                                            }`}
                                        >
                                            {r.badge}
                                        </button>
                                    );
                                })}
                            </div>
                            {tutorialForm.errors.target_roles && (
                                <p className="text-xs text-rose-500">
                                    {tutorialForm.errors.target_roles}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="ct-order">Urutan Tampil</Label>
                                <Input
                                    id="ct-order"
                                    type="number"
                                    min={0}
                                    value={tutorialForm.data.order}
                                    onChange={(e) =>
                                        tutorialForm.setData(
                                            'order',
                                            Number(e.target.value) || 0,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                                    <input
                                        type="checkbox"
                                        checked={tutorialForm.data.is_active}
                                        onChange={(e) =>
                                            tutorialForm.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    Aktifkan langsung di tenan
                                </label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setTutorialModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={tutorialForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                {tutorialForm.processing
                                    ? 'Menyimpan & Sync...'
                                    : editingTutorial
                                      ? 'Simpan & Sync'
                                      : 'Tambah & Sync ke Tenan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Kelola Lisensi Tenant */}
            <Dialog
                open={Boolean(licenseTenant)}
                onOpenChange={(open) => !open && setLicenseTenant(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                            Kelola Lisensi Aplikasi
                        </DialogTitle>
                        <DialogDescription>
                            Atur tanggal mulai aktif dan tanggal berakhir untuk{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {licenseTenant?.name}
                            </span>
                            . Jika melewati tanggal berakhir, aplikasi akan
                            otomatis diarahkan ke halaman pembayaran.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLicenseSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Preset Cepat Masa Aktif</Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: '+1 Bulan', months: 1 },
                                    { label: '+6 Bulan', months: 6 },
                                    { label: '+1 Tahun', months: 12 },
                                    { label: 'Tanpa Batas', months: null },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() =>
                                            applyLicensePreset(preset.months)
                                        }
                                        className="rounded-lg border border-[#E8E8E8] bg-[#FFFBF7] px-2.5 py-1 text-xs font-bold text-gray-700 transition-colors hover:border-[#FF6B35] hover:text-[#FF6B35] dark:border-[#2D234A] dark:bg-[#130E24] dark:text-gray-200"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="license-starts-at">
                                    Tanggal Mulai Aktif
                                </Label>
                                <Input
                                    id="license-starts-at"
                                    type="date"
                                    value={licenseForm.data.license_starts_at}
                                    onChange={(e) =>
                                        licenseForm.setData(
                                            'license_starts_at',
                                            e.target.value,
                                        )
                                    }
                                />
                                {licenseForm.errors.license_starts_at && (
                                    <p className="text-xs text-rose-500">
                                        {licenseForm.errors.license_starts_at}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="license-expires-at">
                                    Tanggal Berakhir (Expired)
                                </Label>
                                <Input
                                    id="license-expires-at"
                                    type="date"
                                    value={licenseForm.data.license_expires_at}
                                    onChange={(e) =>
                                        licenseForm.setData(
                                            'license_expires_at',
                                            e.target.value,
                                        )
                                    }
                                />
                                {licenseForm.errors.license_expires_at && (
                                    <p className="text-xs text-rose-500">
                                        {licenseForm.errors.license_expires_at}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setLicenseTenant(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={licenseForm.processing}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                {licenseForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Lisensi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Kelola Admin & Kepala Sekolah Tenant */}
            <Dialog
                open={Boolean(manageUsersTenant)}
                onOpenChange={(open) => {
                    if (!open) {
                        setManageUsersTenant(null);
                        setShowUserForm(false);
                        resetUserForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[var(--brand-primary,#FF6B35)]" />
                            Admin & Kepala Sekolah
                        </DialogTitle>
                        <DialogDescription>
                            Kelola akun dengan peran{' '}
                            <span className="font-semibold">Admin</span> dan{' '}
                            <span className="font-semibold">
                                Kepala Sekolah
                            </span>{' '}
                            untuk{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {manageUsersTenant?.name}
                            </span>{' '}
                            (<span className="font-mono">{manageUsersTenant?.database}</span>).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-gray-500">
                                Daftar Akun ({tenantUsers.length})
                            </div>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (showUserForm && !editingUser) {
                                        setShowUserForm(false);
                                    } else {
                                        resetUserForm();
                                        setShowUserForm(true);
                                    }
                                }}
                                className="rounded-xl font-bold shadow-brand"
                            >
                                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                {showUserForm && !editingUser
                                    ? 'Tutup Form'
                                    : 'Tambah Akun'}
                            </Button>
                        </div>

                        {showUserForm && (
                            <form
                                onSubmit={handleSaveTenantUser}
                                className="space-y-3 rounded-2xl border border-[#E8E8E8] bg-[#FFFBF7] p-4 dark:border-[#2D234A] dark:bg-[#130E24]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-black uppercase tracking-wider text-[var(--brand-primary,#FF6B35)]">
                                        {editingUser
                                            ? `Edit Akun: ${editingUser.name}`
                                            : 'Tambah Akun Baru'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUserForm(false);
                                            resetUserForm();
                                        }}
                                        className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                                    >
                                        Batal
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="tu-name">
                                            Nama Lengkap
                                        </Label>
                                        <Input
                                            id="tu-name"
                                            placeholder="Nama lengkap"
                                            value={userFormData.name}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                        {userErrors.name && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.name[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tu-role">Peran</Label>
                                        <select
                                            id="tu-role"
                                            value={userFormData.role}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    role: e.target.value as
                                                        | 'admin'
                                                        | 'principal',
                                                }))
                                            }
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            <option value="admin">
                                                Admin Sekolah
                                            </option>
                                            <option value="principal">
                                                Kepala Sekolah
                                            </option>
                                        </select>
                                        {userErrors.role && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.role[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tu-email">Email</Label>
                                        <Input
                                            id="tu-email"
                                            type="email"
                                            placeholder="admin@sekolah.sch.id"
                                            value={userFormData.email}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                        {userErrors.email && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.email[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tu-username">
                                            Username (Opsional)
                                        </Label>
                                        <Input
                                            id="tu-username"
                                            placeholder="admin_sekolah"
                                            value={userFormData.username}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    username: e.target.value,
                                                }))
                                            }
                                        />
                                        {userErrors.username && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.username[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tu-nip">
                                            NIP (Opsional)
                                        </Label>
                                        <Input
                                            id="tu-nip"
                                            placeholder="198001012005011001"
                                            value={userFormData.nip}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    nip: e.target.value,
                                                }))
                                            }
                                        />
                                        {userErrors.nip && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.nip[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="tu-password">
                                            Kata Sandi{' '}
                                            {editingUser
                                                ? '(Kosongkan jika tetap)'
                                                : '(Min. 8 karakter)'}
                                        </Label>
                                        <Input
                                            id="tu-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={userFormData.password}
                                            onChange={(e) =>
                                                setUserFormData((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                }))
                                            }
                                            required={!editingUser}
                                        />
                                        {userErrors.password && (
                                            <p className="text-xs text-rose-500">
                                                {userErrors.password[0]}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={savingUser}
                                        className="rounded-xl font-bold shadow-brand"
                                    >
                                        {savingUser
                                            ? 'Menyimpan...'
                                            : editingUser
                                              ? 'Simpan Perubahan'
                                              : 'Buat Akun'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {loadingUsers ? (
                            <div className="py-8 text-center text-xs text-gray-500">
                                Memuat daftar Admin & Kepala Sekolah...
                            </div>
                        ) : tenantUsers.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#E8E8E8] py-8 text-center text-xs text-gray-500 dark:border-[#2D234A]">
                                Belum ada akun Admin atau Kepala Sekolah di
                                tenant ini. Klik &ldquo;Tambah Akun&rdquo; untuk
                                membuat.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tenantUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex flex-col gap-3 rounded-2xl border border-[#E8E8E8] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#2D234A] dark:bg-[#18122B]"
                                    >
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {u.name}
                                                </span>
                                                <span
                                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                        u.role === 'principal'
                                                            ? 'bg-[#E6FAF8] text-[#20B2AA] dark:bg-[#123836] dark:text-[#4ECDC4]'
                                                            : 'bg-[#FFF0EB] text-[#FF6B35] dark:bg-[#331C1A] dark:text-[#FF8C5A]'
                                                    }`}
                                                >
                                                    {u.role === 'principal'
                                                        ? 'Kepala Sekolah'
                                                        : 'Admin'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{u.email}</span>
                                                {u.username && (
                                                    <span className="font-mono">
                                                        @{u.username}
                                                    </span>
                                                )}
                                                {u.nip && (
                                                    <span className="font-mono">
                                                        NIP: {u.nip}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                title="Edit / Reset Password"
                                                onClick={() =>
                                                    startEditTenantUser(u)
                                                }
                                            >
                                                <Pencil className="h-4 w-4 text-gray-500" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                                                title="Hapus akun"
                                                disabled={
                                                    deletingUserId === u.id
                                                }
                                                onClick={() =>
                                                    void handleDeleteTenantUser(
                                                        u,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
