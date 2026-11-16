import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BarChart3,
    BellRing,
    BookOpen,
    Building2,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Clock,
    Crown,
    Download,
    FileSpreadsheet,
    FileText,
    Fingerprint,
    Globe,
    GraduationCap,
    Images,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogIn,
    MessageSquare,
    Newspaper,
    Palette,
    PhoneCall,
    PlayCircle,
    QrCode,
    Rocket,
    School,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Star,
    TrendingUp,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { WhatsAppIcon } from '@/components/whatsapp-share-button';
import { dashboard, login } from '@/routes';

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

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
    whatsapp?: string | null;
}

interface AuthProp {
    user?: {
        name: string;
        role: string;
    } | null;
}

interface LandingProps {
    themes?: ThemeOption[];
}

interface FeatureItem {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlights: string[];
}

interface FeatureCategory {
    id: string;
    label: string;
    shortLabel: string;
    headline: string;
    subheadline: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    items: FeatureItem[];
}

const DEFAULT_THEMES: ThemeOption[] = [
    {
        id: 'sd-orange',
        name: 'Oranye Enerjik SD',
        level: 'SD',
        badge: 'Kreatif & Ceria',
        description: 'Warna oranye hangat yang ramah anak, memicu kreativitas & antusiasme.',
        primary: '#FF6B35',
        primary_dark: '#E55A25',
        primary_light: '#FFF0EB',
        hero_gradient: 'linear-gradient(135deg, #FF6B35 0%, #F59E0B 50%, #10B981 100%)',
    },
    {
        id: 'sd-merah',
        name: 'Merah Ceria SD',
        level: 'SD',
        badge: 'Seragam SD Nasional',
        description: 'Terinspirasi seragam merah-putih SD nasional yang berani dan hangat.',
        primary: '#DC2626',
        primary_dark: '#B91C1C',
        primary_light: '#FEF2F2',
        hero_gradient: 'linear-gradient(135deg, #DC2626 0%, #F43F5E 50%, #F59E0B 100%)',
    },
    {
        id: 'smp-biru',
        name: 'Biru Bahari SMP',
        level: 'SMP',
        badge: 'Seragam SMP Nasional',
        description: 'Terinspirasi seragam biru dongker SMP yang disiplin dan tenang.',
        primary: '#2563EB',
        primary_dark: '#1D4ED8',
        primary_light: '#EFF6FF',
        hero_gradient: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #14B8A6 100%)',
    },
    {
        id: 'sma-emerald',
        name: 'Hijau Zamrud Madrasah / SMA',
        level: 'SMA / SMK',
        badge: 'Islami & Modern',
        description: 'Nuansa hijau zamrud elegan yang berwibawa dan menenangkan.',
        primary: '#059669',
        primary_dark: '#047857',
        primary_light: '#ECFDF5',
        hero_gradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #0EA5E9 100%)',
    },
];

const FEATURE_CATEGORIES: FeatureCategory[] = [
    {
        id: 'website',
        label: 'Website Sekolah Publik',
        shortLabel: 'Web Sekolah',
        headline: 'Portal Website Sekolah Resmi yang Modern & Mudah Dikelola',
        subheadline:
            'Tingkatkan citra dan kepercayaan orang tua dengan website sekolah yang responsif, informatif, dan terhubung langsung dengan sistem internal.',
        icon: Globe,
        accentClass: 'from-orange-500 to-amber-500',
        items: [
            {
                title: 'Berita & Pengumuman Sekolah',
                badge: 'Auto Import IG & YT',
                description:
                    'Publikasikan berita kegiatan, artikel kategori dinamis, lampiran dokumen, hingga ambil thumbnail YouTube & postingan Instagram secara instan.',
                icon: Newspaper,
                highlights: [
                    'Berbagi instan ke WhatsApp',
                    'Counter jumlah pembaca otomatis',
                    'Kategori & pencarian cepat',
                ],
            },
            {
                title: 'Galeri Foto Kegiatan',
                badge: 'Lightbox Modern',
                description:
                    'Dokumentasikan momen prestasi, lomba, dan kegiatan siswa dalam album galeri publik yang tertata rapi berdasarkan tanggal kegiatan.',
                icon: Images,
                highlights: [
                    'Upload & manajemen mudah',
                    'Tampilan grid responsif',
                    'Pratinjau resolusi penuh',
                ],
            },
            {
                title: 'Profil Sekolah & Sambutan Kepsek',
                description:
                    'Tampilkan identitas sekolah, akreditasi, visi & misi, 4 nilai utama, hero banner kustom, serta sambutan resmi Kepala Sekolah.',
                icon: Building2,
                highlights: [
                    'Edit konten tanpa coding',
                    'Hero banner & motto dinamis',
                    'Tampil di Portal Sekolah',
                ],
            },
            {
                title: 'Direktori Foto Guru & Wali Kelas',
                badge: 'Sinkron Master Data',
                description:
                    'Perkenalkan jajaran pendidik dan tenaga kependidikan lengkap dengan foto profil, jabatan, NIP, dan penugasan wali kelas.',
                icon: GraduationCap,
                highlights: [
                    'Sinkronisasi 1-klik dari Master Guru',
                    'Kartu profil guru elegan',
                    'Publikasi transparan ke wali murid',
                ],
            },
            {
                title: 'Kalender Akademik & Hari Libur',
                description:
                    'Informasi jadwal KBM aktif (5 atau 6 hari sekolah), hari libur nasional, dan agenda kegiatan sekolah yang selalu sinkron.',
                icon: CalendarDays,
                highlights: [
                    'Terintegrasi dengan sistem absensi',
                    'Seed hari libur nasional otomatis',
                    'Tampilan kalender interaktif',
                ],
            },
            {
                title: 'Kontak & Kotak Aspirasi Publik',
                description:
                    'Permudah komunikasi wali murid dan masyarakat melalui informasi kontak, peta lokasi, dan formulir pesan yang langsung masuk ke admin.',
                icon: PhoneCall,
                highlights: [
                    'Notifikasi pesan masuk di dashboard',
                    'Tandai sudah dibaca & kelola pesan',
                    'Terhubung dengan WhatsApp & Email',
                ],
            },
        ],
    },
    {
        id: 'absensi',
        label: 'Absensi & Kedisiplinan',
        shortLabel: 'Absensi Siswa',
        headline: 'Presensi Harian Super Cepat & Rekap Laporan Otomatis',
        subheadline:
            'Ucapkan selamat tinggal pada rekap manual yang melelahkan. Guru dapat mengabsen satu kelas hanya dalam hitungan detik dari HP maupun laptop.',
        icon: ClipboardCheck,
        accentClass: 'from-emerald-500 to-teal-500',
        items: [
            {
                title: 'Input Absensi Harian (Batch & Quick Update)',
                badge: 'Hitung Detik',
                description:
                    'Catat status Hadir, Sakit, Izin, dan Alpa secara massal per kelas atau perbarui status individu secara instan dengan satu sentuhan.',
                icon: UserCheck,
                highlights: [
                    'Tandai semua hadir dalam 1 klik',
                    'Filter per kelas & tanggal',
                    'Validasi hari libur otomatis',
                ],
            },
            {
                title: 'Pelacak Keterlambatan Siswa',
                description:
                    'Monitor kedisiplinan siswa dengan pencatatan jam datang terlambat yang mengacu pada jam masuk resmi sekolah.',
                icon: Clock,
                highlights: [
                    'Catat menit keterlambatan & alasan',
                    'Riwayat keterlambatan per siswa',
                    'Peringatan dini untuk wali kelas',
                ],
            },
            {
                title: 'Absen Khusus & Izin Pulang Awal',
                description:
                    'Kelola penyesuaian presensi bagi siswa yang mengikuti lomba, dispensasi, atau izin pulang lebih awal dengan catatan resmi.',
                icon: CalendarCheck,
                highlights: [
                    'Riwayat penyesuaian tercatat rapi',
                    'Tidak merusak data hadir harian',
                    'Transparan bagi guru piket & kepsek',
                ],
            },
            {
                title: 'Rekapitulasi & Ekspor Excel / PDF',
                badge: 'Siap Cetak',
                description:
                    'Hasilkan laporan persentase kehadiran harian, bulanan, maupun rentang tanggal tertentu dalam format Excel (.xlsx) dan PDF resmi.',
                icon: FileSpreadsheet,
                highlights: [
                    'Filter kelas, siswa, & periode',
                    'Tanda tangan Kepala Sekolah otomatis',
                    'Siap lampiran rapor & dinas',
                ],
            },
        ],
    },
    {
        id: 'ekskul',
        label: 'Ekstrakurikuler & QR',
        shortLabel: 'Ekstrakurikuler',
        headline: 'Laporan Ekstrakurikuler Digital dengan Verifikasi QR Code',
        subheadline:
            'Kelola kegiatan pramuka, olahraga, seni, dan ekstrakurikuler lainnya secara akuntabel lengkap dengan persetujuan berjenjang dan anti-pemalsuan.',
        icon: Award,
        accentClass: 'from-violet-500 to-purple-600',
        items: [
            {
                title: 'Manajemen Roster Anggota Ekskul',
                description:
                    'Pembina dan pelatih dapat mengelola daftar anggota aktif tiap cabang ekstrakurikuler dengan mudah setiap semester.',
                icon: Users,
                highlights: [
                    'Daftar anggota per cabang ekskul',
                    'Pencatatan kehadiran peserta latihan',
                    'Akses khusus role Pembina (Coach)',
                ],
            },
            {
                title: 'Laporan Kegiatan & Dokumentasi',
                description:
                    'Input materi latihan, capaian, kendala, serta unggah foto dokumentasi kegiatan langsung dari lokasi latihan via smartphone.',
                icon: FileText,
                highlights: [
                    'Upload foto kegiatan langsung',
                    'Status Draft hingga Disetujui',
                    'Riwayat laporan terstruktur',
                ],
            },
            {
                title: 'Alur Persetujuan Kepala Sekolah',
                description:
                    'Setiap laporan pembina masuk ke antrean peninjauan Kepala Sekolah atau Admin untuk disetujui secara digital.',
                icon: CheckCircle2,
                highlights: [
                    'Approval 1-klik oleh Kepsek/Admin',
                    'Transparansi realisasi kegiatan',
                    'Siap cetak kapan saja',
                ],
            },
            {
                title: 'Cetak PDF & Verifikasi QR Code Terenkripsi',
                badge: 'Anti Pemalsuan',
                description:
                    'Dokumen PDF laporan ekskul dilengkapi QR Code terenkripsi. Siapa pun dapat memindai barcode untuk memverifikasi keabsahan dokumen secara online.',
                icon: QrCode,
                highlights: [
                    'Halaman verifikasi publik instan',
                    'Hash keamanan unik per dokumen',
                    'Standar tata naskah dinas modern',
                ],
            },
        ],
    },
    {
        id: 'kepsek',
        label: 'Jurnal Kepsek & Eksekutif',
        shortLabel: 'Jurnal Kepsek',
        headline: 'Dashboard Eksekutif & Jurnal Harian Kepala Sekolah',
        subheadline:
            'Berikan kendali penuh kepada pimpinan sekolah untuk memantau kehadiran sekolah secara real-time sekaligus mendokumentasikan agenda kepemimpinan.',
        icon: LayoutDashboard,
        accentClass: 'from-blue-500 to-indigo-600',
        items: [
            {
                title: 'Dashboard Eksekutif Real-Time',
                description:
                    'Pantau ringkasan kehadiran siswa seluruh kelas, tren keterlambatan, status guru piket, dan notifikasi penting dalam satu layar.',
                icon: BarChart3,
                highlights: [
                    'Grafik tren kehadiran harian',
                    'Deteksi kelas yang belum diabsen',
                    'Ringkasan data master sekolah',
                ],
            },
            {
                title: 'Jurnal Kepala Sekolah Khusus',
                badge: 'Privat & Aman',
                description:
                    'Modul eksklusif bagi role Kepala Sekolah untuk mencatat agenda rapat, supervisi kelas, pembinaan guru, dan tindak lanjut manajerial.',
                icon: BookOpen,
                highlights: [
                    'Akses terlindungi khusus Kepsek',
                    'Lampirkan catatan & bukti kegiatan',
                    'Pencarian & filter tanggal cepat',
                ],
            },
            {
                title: 'Ekspor Jurnal Excel & PDF Resmi',
                description:
                    'Unduh rekap jurnal kegiatan Kepala Sekolah untuk keperluan akreditasi, pelaporan pengawas, atau arsip kinerja tahunan.',
                icon: Download,
                highlights: [
                    'Format Excel (.xlsx) siap olah',
                    'Format PDF rapi siap cetak',
                    'Hemat waktu administrasi pimpinan',
                ],
            },
            {
                title: 'Matriks Pengaturan Hak Akses',
                description:
                    'Atur izin akses secara granular untuk setiap peran: Admin, Kepala Sekolah, Guru, Pembina Ekskul, dan Publisher Berita.',
                icon: ShieldCheck,
                highlights: [
                    'Kontrol fitur per role fleksibel',
                    'Reset ke default dalam 1 klik',
                    'Keamanan data sekolah terjamin',
                ],
            },
        ],
    },
    {
        id: 'teknologi',
        label: 'Master Data, PWA & Tema',
        shortLabel: 'PWA & Tema',
        headline: 'Teknologi Modern: Tema Dinamis, PWA, Push Notification & Passkey',
        subheadline:
            'Dibangun dengan arsitektur web modern yang ringan, dapat diinstal di HP layaknya aplikasi Play Store, dan siap menyesuaikan identitas jenjang sekolah Anda.',
        icon: Sparkles,
        accentClass: 'from-rose-500 to-pink-600',
        items: [
            {
                title: '10+ Tema Sekolah Multi-Jenjang & Dark Mode',
                badge: 'SD / SMP / SMA',
                description:
                    'Ganti warna identitas aplikasi secara instan sesuai jenjang: Merah/Oranye SD, Biru/Tosca SMP, Zamrud Madrasah, hingga Ungu SMK.',
                icon: Palette,
                highlights: [
                    'Perubahan tema instan seluruh halaman',
                    'Mendukung Mode Gelap (Dark Mode)',
                    'Logo & nama sekolah kustom',
                ],
            },
            {
                title: 'PWA (Progressive Web App) & Web Push VAPID',
                badge: 'Install di HP',
                description:
                    'Instal aplikasi langsung ke layar utama Android, iOS, atau Desktop. Dilengkapi pengingat presensi otomatis via Push Notification.',
                icon: Smartphone,
                highlights: [
                    'Tanpa perlu download di Play Store',
                    'Manifest dinamis per sekolah',
                    'Notifikasi pengingat guru piket & kelas',
                ],
            },
            {
                title: 'Master Data, Batch Import Excel & Kenaikan Kelas',
                description:
                    'Impor ratusan data siswa, guru, dan kelas sekaligus dari Excel. Proses kenaikan kelas massal dan kelola data alumni tanpa input ulang.',
                icon: Layers,
                highlights: [
                    'Import & template Excel terstruktur',
                    'Proses kenaikan kelas & kelulusan',
                    'Manajemen jadwal piket guru',
                ],
            },
            {
                title: 'Keamanan Passkey Biometrik & Portal Video Tutorial',
                description:
                    'Login lebih aman dan cepat dengan sidik jari/FaceID (Passkey WebAuthn) & 2FA, plus portal video tutorial bawaan untuk memandu guru.',
                icon: Fingerprint,
                highlights: [
                    'Passkey (WebAuthn) & Two-Factor Auth',
                    'Video tutorial terintegrasi di aplikasi',
                    'Kurangi beban training operator',
                ],
            },
        ],
    },
];

const ROLES_BENEFITS = [
    {
        role: 'Kepala Sekolah',
        tagline: 'Kontrol penuh & laporan instan',
        icon: Award,
        color: 'text-orange-600 bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300',
        points: [
            'Pantau kehadiran seluruh kelas secara real-time',
            'Catat & ekspor Jurnal Kepala Sekolah (PDF/Excel)',
            'Setujui laporan ekstrakurikuler dari mana saja',
        ],
    },
    {
        role: 'Guru & Wali Kelas',
        tagline: 'Absen cepat tanpa ribet',
        icon: UserCheck,
        color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
        points: [
            'Input presensi harian cukup 30 detik dari HP',
            'Terima pengingat push notification jika belum absen',
            'Rekap otomatis sakit, izin, alpa & keterlambatan',
        ],
    },
    {
        role: 'Pembina Ekskul',
        tagline: 'Dokumentasi rapi & sah',
        icon: QrCode,
        color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300',
        points: [
            'Kelola daftar anggota ekstrakurikuler aktif',
            'Buat laporan kegiatan beserta foto di lapangan',
            'Cetak laporan PDF dengan QR Code verifikasi resmi',
        ],
    },
    {
        role: 'Admin & Operator',
        tagline: 'Administrasi bebas pusing',
        icon: Layers,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300',
        points: [
            'Import massal data siswa, guru & kelas via Excel',
            'Atur tema warna, logo, jam masuk & kalender libur',
            'Kelola kenaikan kelas, alumni & matriks hak akses',
        ],
    },
    {
        role: 'Publisher & Humas',
        tagline: 'Website sekolah selalu hidup',
        icon: Newspaper,
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300',
        points: [
            'Posting berita, galeri foto & profil guru dengan mudah',
            'Ambil konten dari Instagram & YouTube secara cepat',
            'Kelola kotak masuk aspirasi & pesan orang tua',
        ],
    },
    {
        role: 'Orang Tua & Publik',
        tagline: 'Informasi sekolah transparan',
        icon: School,
        color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
        points: [
            'Akses berita, agenda libur & galeri kegiatan terbaru',
            'Kenali profil sekolah, visi misi & wali kelas anak',
            'Verifikasi keabsahan dokumen ekskul via scan QR',
        ],
    },
];

interface PricingPlan {
    id: string;
    name: string;
    subtitle: string;
    price: string;
    period: string;
    badge?: string;
    isPopular?: boolean;
    isBestValue?: boolean;
    features: string[];
    waMessage: string;
}

const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'website',
        name: 'Paket Website Sekolah',
        subtitle: 'Cocok untuk membangun citra & portal informasi resmi sekolah',
        price: 'Rp 200rb',
        period: '/tahun',
        badge: 'Starter',
        features: [
            'Portal Website Sekolah Modern & Responsif',
            'Berita & Pengumuman (Auto Import IG & YouTube)',
            'Galeri Foto Kegiatan & Lightbox',
            'Profil Sekolah, Visi Misi & Sambutan Kepsek',
            'Direktori Foto Guru & Wali Kelas',
            'Kalender Akademik & Formulir Kontak Aspirasi',
            'Penggantian Tema Sekolah (10+ Tema) & Dark Mode',
        ],
        waMessage:
            'Halo, saya tertarik untuk bertanya & memesan *Paket Website Sekolah (Rp 200rb/tahun)*. Mohon info lebih lanjut.',
    },
    {
        id: 'website-absensi',
        name: 'Paket Website + Absensi',
        subtitle: 'Digitalisasi penuh portal sekolah & presensi siswa harian',
        price: 'Rp 300rb',
        period: '/tahun',
        badge: 'Paling Populer',
        isPopular: true,
        features: [
            'Semua fitur di Paket Website Sekolah',
            'Input Absensi Harian Cepat (Batch & Quick Update)',
            'Pelacak Keterlambatan Siswa Otomatis',
            'Absen Khusus & Izin Pulang Awal',
            'Rekap Laporan Harian, Bulanan & Semester',
            'Ekspor Laporan Absensi ke Excel (.xlsx) & PDF',
            'PWA Installable & Push Notifikasi Pengingat Guru',
        ],
        waMessage:
            'Halo, saya tertarik untuk bertanya & memesan *Paket Website + Absensi Siswa (Rp 300rb/tahun)*. Mohon info lebih lanjut.',
    },
    {
        id: 'all-in-one',
        name: 'Paket All-in-One Lengkap',
        subtitle: 'Solusi paripurna hingga level pimpinan & ekstrakurikuler',
        price: 'Rp 350rb',
        period: '/tahun',
        badge: 'Terlengkap',
        isBestValue: true,
        features: [
            'Semua fitur Website Sekolah + Absensi Siswa',
            'Jurnal Kepala Sekolah (Agenda & Supervisi Privat)',
            'Ekspor Jurnal Kepala Sekolah ke Excel & PDF',
            'Laporan Ekstrakurikuler & Roster Anggota',
            'Alur Persetujuan (Approval) Laporan Ekskul',
            'Cetak PDF Ekskul + Verifikasi QR Code Terenkripsi',
            'Matriks Hak Akses, Kenaikan Kelas & Passkey Biometrik',
        ],
        waMessage:
            'Halo, saya tertarik untuk bertanya & memesan *Paket All-in-One Lengkap (Rp 350rb/tahun)*. Mohon info lebih lanjut.',
    },
];

function buildWhatsAppUrl(rawPhone: string | null | undefined, message: string): string {
    const digitsOnly = (rawPhone || '').replace(/\D/g, '');
    let normalized = digitsOnly || '6281234567890';
    if (normalized.startsWith('0')) {
        normalized = `62${normalized.slice(1)}`;
    }
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

const FAQS = [
    {
        q: 'Apakah aplikasi ini hanya untuk SD atau bisa untuk SMP, SMA, SMK, dan Madrasah?',
        a: 'Bisa digunakan untuk semua jenjang (SD/MI, SMP/MTs, SMA/MA, hingga SMK). Aplikasi sudah dilengkapi 10+ pilihan tema warna khusus jenjang SD, SMP, SMA/SMK, dan Madrasah yang bisa diganti kapan saja dalam satu klik.',
    },
    {
        q: 'Apakah sekolah bisa menggunakan logo, nama sekolah, dan foto guru sendiri?',
        a: 'Tentu saja! Seluruh identitas mulai dari nama sekolah, logo, alamat, jam masuk, banner hero website, sambutan Kepala Sekolah, profil sekolah, hingga galeri foto guru dapat diubah langsung dari panel pengaturan tanpa perlu menyentuh kode.',
    },
    {
        q: 'Bagaimana cara guru menggunakan aplikasi di HP? Apakah harus unduh di Play Store?',
        a: 'Aplikasi sudah mendukung teknologi PWA (Progressive Web App). Guru dan staf cukup membuka link website sekolah di browser HP (Chrome/Safari) lalu klik "Tambahkan ke Layar Utama" (Install App). Aplikasi akan tampil seperti aplikasi native dan mendukung notifikasi pengingat absensi.',
    },
    {
        q: 'Apakah data siswa yang jumlahnya ratusan harus diinput satu per satu?',
        a: 'Tidak perlu. Tersedia fitur Batch Import Excel (.xlsx) untuk mengimpor data kelas, siswa, dan guru secara massal dalam hitungan detik, lengkap dengan fitur proses kenaikan kelas otomatis di akhir tahun ajaran.',
    },
    {
        q: 'Apa fungsi QR Code pada laporan ekstrakurikuler?',
        a: 'Setiap laporan kegiatan ekstrakurikuler yang dicetak ke PDF dilengkapi QR Code terenkripsi. Jika dipindai menggunakan kamera HP, akan langsung membuka halaman verifikasi publik resmi untuk memastikan dokumen tersebut asli dan telah disetujui pihak sekolah.',
    },
];

export default function Landing({ themes = [] }: LandingProps) {
    const { auth, school } = usePage<{ auth: AuthProp; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'SekolahDigital';

    const availableThemes = themes.length > 0 ? themes : DEFAULT_THEMES;
    const [activeCategoryId, setActiveCategoryId] = useState<string>(FEATURE_CATEGORIES[0].id);
    const [selectedThemeId, setSelectedThemeId] = useState<string>(availableThemes[0].id);
    const [themeLevelFilter, setThemeLevelFilter] = useState<string>('ALL');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const activeCategory =
        FEATURE_CATEGORIES.find((cat) => cat.id === activeCategoryId) ?? FEATURE_CATEGORIES[0];

    const previewTheme =
        availableThemes.find((t) => t.id === selectedThemeId) ?? availableThemes[0];

    const filteredThemes =
        themeLevelFilter === 'ALL'
            ? availableThemes
            : availableThemes.filter((t) => t.level.includes(themeLevelFilter));

    return (
        <div className="min-h-screen bg-[#FFFBF7] text-[#1A1A2E] dark:bg-[#130E24] dark:text-white transition-colors pb-20 md:pb-0">
            <Head title={`Platform Sekolah Digital Terpadu - ${schoolName}`} />

            <PublicHeader />
            <PwaInstallPrompt />

            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden border-b border-gray-200/70 dark:border-[#2D234A]">
                {/* Ambient Background Glows */}
                <div
                    className="pointer-events-none absolute -top-28 -left-24 size-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'var(--brand-primary, #FF6B35)' }}
                />
                <div className="pointer-events-none absolute top-12 -right-24 size-96 rounded-full bg-teal-400/20 opacity-40 blur-3xl dark:bg-teal-500/15" />

                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-12 lg:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                        {/* Left Copy */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary,#FF6B35)]/30 bg-[var(--brand-primary-light,#FFF0EB)] px-4 py-1.5 text-xs font-extrabold text-[var(--brand-primary,#FF6B35)] shadow-2xs dark:bg-[var(--brand-primary,#FF6B35)]/15 dark:text-orange-300">
                                <Sparkles className="size-3.5" />
                                <span>Solusi All-in-One Sekolah Modern • SD, SMP, SMA/SMK & Madrasah</span>
                            </div>

                            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12] dark:text-white">
                                Satu Aplikasi Terpadu untuk{' '}
                                <span
                                    className="bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(135deg, var(--brand-primary, #FF6B35) 0%, #F59E0B 55%, #10B981 100%)',
                                    }}
                                >
                                    Website Sekolah, Absensi Siswa, & Manajemen Digital
                                </span>
                            </h1>

                            <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg dark:text-gray-300">
                                Tinggalkan cara manual yang memakan waktu. Kelola{' '}
                                <strong className="font-bold text-gray-900 dark:text-white">
                                    portal berita, galeri, profil guru, absensi harian, rekap Excel/PDF,
                                    laporan ekskul ber-QR Code, jurnal kepala sekolah, tema dinamis, hingga
                                    aplikasi PWA
                                </strong>{' '}
                                dalam satu sistem yang cepat, aman, dan siap pakai.
                            </p>

                            {/* Primary & Secondary CTAs */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <Button
                                    asChild
                                    variant="primary"
                                    size="lg"
                                    className="h-12 rounded-2xl px-6 text-sm font-black shadow-brand"
                                >
                                    <a href="#fitur-lengkap">
                                        <Rocket className="mr-2 size-4" />
                                        Jelajahi Semua Fitur
                                    </a>
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    className="h-12 rounded-2xl border-2 border-gray-200 bg-white/80 px-5 text-sm font-extrabold text-gray-800 hover:border-[var(--brand-primary,#FF6B35)]/50 hover:bg-[var(--brand-primary-light,#FFF0EB)] hover:text-[var(--brand-primary,#FF6B35)] dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                >
                                    <Link href="/portal">
                                        <School className="mr-2 size-4" />
                                        Lihat Portal Sekolah
                                        <ArrowRight className="ml-1.5 size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    variant="ghost"
                                    size="lg"
                                    className="h-12 rounded-2xl px-4 text-sm font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    <Link
                                        href={
                                            auth?.user
                                                ? auth.user.role === 'publisher'
                                                    ? '/news-management'
                                                    : dashboard()
                                                : login()
                                        }
                                    >
                                        <LogIn className="mr-1.5 size-4" />
                                        {auth?.user ? 'Buka Dashboard' : 'Masuk Sistem'}
                                    </Link>
                                </Button>
                            </div>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
                                {[
                                    { icon: Smartphone, text: 'PWA Installable' },
                                    { icon: Palette, text: `${availableThemes.length} Tema Jenjang` },
                                    { icon: QrCode, text: 'Verifikasi QR Ekskul' },
                                    { icon: FileSpreadsheet, text: 'Ekspor Excel & PDF' },
                                ].map((badge) => (
                                    <div
                                        key={badge.text}
                                        className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs dark:border-[#2D234A] dark:bg-[#18122B]/80 dark:text-gray-200"
                                    >
                                        <badge.icon className="size-4 shrink-0 text-[var(--brand-primary,#FF6B35)]" />
                                        <span className="truncate">{badge.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Visual Mockup Card */}
                        <div className="lg:col-span-5">
                            <div className="relative rounded-[28px] border border-gray-200/90 bg-white p-4 shadow-2xl dark:border-[#2D234A] dark:bg-[#18122B]">
                                {/* Fake Browser Top Bar */}
                                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-[#2D234A]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-rose-400" />
                                        <span className="size-2.5 rounded-full bg-amber-400" />
                                        <span className="size-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="rounded-lg bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 dark:bg-[#231B3D] dark:text-gray-300">
                                        app.sekolahdigital.sch.id
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live
                                    </span>
                                </div>

                                {/* Mini Dashboard Preview */}
                                <div className="space-y-3">
                                    {/* Gradient Summary Banner */}
                                    <div
                                        className="rounded-2xl p-4 text-white shadow-md transition-all duration-300"
                                        style={{
                                            background:
                                                previewTheme.hero_gradient ||
                                                `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.primary_dark})`,
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                                                    Ringkasan Kehadiran Hari Ini
                                                </p>
                                                <p className="mt-1 text-2xl font-black">98.4% Hadir</p>
                                            </div>
                                            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs">
                                                <TrendingUp className="size-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                                            <div className="rounded-lg bg-white/15 py-1.5">Hadir: 412</div>
                                            <div className="rounded-lg bg-white/15 py-1.5">Sakit: 4</div>
                                            <div className="rounded-lg bg-white/15 py-1.5">Izin: 2</div>
                                            <div className="rounded-lg bg-white/15 py-1.5">Alpa: 1</div>
                                        </div>
                                    </div>

                                    {/* 2 Mini Feature Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 dark:border-[#2D234A] dark:bg-[#231B3D]/70">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                                                    <QrCode className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black">Ekskul Pramuka</div>
                                                    <div className="text-[10px] text-emerald-600 font-bold dark:text-emerald-400">
                                                        Disetujui & QR Valid
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 dark:border-[#2D234A] dark:bg-[#231B3D]/70">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                                                    <BellRing className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black">Push Pengingat</div>
                                                    <div className="text-[10px] text-gray-500 font-semibold dark:text-gray-400">
                                                        PWA Aktif di HP Guru
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini Journal & Portal Bar */}
                                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-gray-200 bg-white px-3.5 py-2.5 dark:border-[#2D234A] dark:bg-[#130E24]">
                                        <div className="flex items-center gap-2.5">
                                            <BookOpen className="size-4 text-[var(--brand-primary,#FF6B35)]" />
                                            <div>
                                                <div className="text-xs font-extrabold">
                                                    Jurnal Kepala Sekolah
                                                </div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    Supervisi kelas & ekspor PDF siap
                                                </div>
                                            </div>
                                        </div>
                                        <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            Tercatat
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. INTERACTIVE FEATURE EXPLORER */}
            <section id="fitur-lengkap" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-12 lg:py-20">
                <div className="mx-auto max-w-3xl text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#FFF0EB)] px-3.5 py-1 text-xs font-extrabold text-[var(--brand-primary,#FF6B35)] dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-orange-300">
                        <Zap className="size-3.5" />
                        Ekosistem Fitur Lengkap
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                        Semua Kebutuhan Digital Sekolah dalam Satu Paket
                    </h2>
                    <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
                        Pilih kategori di bawah untuk melihat detail modul yang langsung siap digunakan
                        oleh sekolah Anda.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    {FEATURE_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = category.id === activeCategoryId;
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setActiveCategoryId(category.id)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-brand scale-[1.02]'
                                        : 'border border-gray-200 bg-white text-gray-700 hover:border-[var(--brand-primary,#FF6B35)]/40 hover:text-[var(--brand-primary,#FF6B35)] dark:border-[#2D234A] dark:bg-[#18122B] dark:text-gray-200'
                                }`}
                            >
                                <Icon className="size-4" />
                                <span className="hidden sm:inline">{category.label}</span>
                                <span className="sm:hidden">{category.shortLabel}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Category Content */}
                <div className="mt-8 rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10 dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="mb-8 flex flex-col gap-3 border-b border-gray-100 pb-6 md:flex-row md:items-end md:justify-between dark:border-[#2D234A]">
                        <div className="max-w-2xl space-y-2">
                            <div
                                className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${activeCategory.accentClass} px-3 py-1 text-xs font-black text-white shadow-xs`}
                            >
                                <activeCategory.icon className="size-3.5" />
                                <span>{activeCategory.label}</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
                                {activeCategory.headline}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {activeCategory.subheadline}
                            </p>
                        </div>

                        {activeCategory.id === 'website' && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="shrink-0 rounded-xl border-[var(--brand-primary,#FF6B35)]/40 text-xs font-extrabold text-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-light,#FFF0EB)]"
                            >
                                <Link href="/portal">
                                    Coba Portal Sekolah Sekarang
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {activeCategory.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50/60 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary,#FF6B35)]/35 hover:bg-white hover:shadow-md dark:border-[#2D234A] dark:bg-[#130E24]/70 dark:hover:bg-[#1F1738]"
                                >
                                    <div>
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--brand-primary-light,#FFF0EB)] text-[var(--brand-primary,#FF6B35)] transition-transform group-hover:scale-105 dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-orange-300">
                                                <ItemIcon className="size-5" />
                                            </div>
                                            {item.badge && (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-black text-gray-900 dark:text-white">
                                            {item.title}
                                        </h4>
                                        <p className="mt-1.5 text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-300">
                                            {item.description}
                                        </p>
                                    </div>

                                    <ul className="mt-4 space-y-1.5 border-t border-gray-200/70 pt-3 dark:border-[#2D234A]">
                                        {item.highlights.map((hl) => (
                                            <li
                                                key={hl}
                                                className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
                                            >
                                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                                                <span>{hl}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. INTERACTIVE LIVE THEME SWITCHER DEMO */}
            <section className="border-y border-gray-200/70 bg-white/70 py-14 sm:py-18 dark:border-[#2D234A] dark:bg-[#18122B]/50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
                    <div className="grid items-center gap-10 lg:grid-cols-12">
                        {/* Left Theme Selector */}
                        <div className="lg:col-span-6 space-y-5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-extrabold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                                <Palette className="size-3.5" />
                                Simulasi Penggantian Tema Instan
                            </span>

                            <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                                Sesuaikan Warna Aplikasi dengan Identitas Jenjang Sekolah Anda
                            </h2>

                            <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                                Baik untuk SD, SMP, SMA, SMK, maupun Madrasah — Admin cukup memilih
                                tema warna dari pengaturan, dan seluruh tampilan website publik, tombol,
                                hingga dashboard akan langsung berubah otomatis.
                            </p>

                            {/* Level Filter Pills */}
                            <div className="flex flex-wrap gap-2">
                                {['ALL', 'SD', 'SMP', 'SMA'].map((lvl) => (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setThemeLevelFilter(lvl)}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                                            themeLevelFilter === lvl
                                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 dark:border-[#2D234A] dark:bg-[#18122B] dark:text-gray-300'
                                        }`}
                                    >
                                        {lvl === 'ALL' ? 'Semua Jenjang' : lvl === 'SMA' ? 'SMA / SMK / MA' : lvl}
                                    </button>
                                ))}
                            </div>

                            {/* Theme Swatches Grid */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {filteredThemes.map((theme) => {
                                    const isSelected = theme.id === previewTheme.id;
                                    return (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setSelectedThemeId(theme.id)}
                                            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-gray-900 bg-white shadow-md ring-2 ring-gray-900/10 dark:border-white dark:bg-[#231B3D] dark:ring-white/20'
                                                    : 'border-gray-200 bg-white/80 hover:border-gray-300 dark:border-[#2D234A] dark:bg-[#18122B]'
                                            }`}
                                        >
                                            <span
                                                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                                                style={{ backgroundColor: theme.primary }}
                                            >
                                                {isSelected && <CheckCircle2 className="size-4" />}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="truncate text-xs font-black text-gray-900 dark:text-white">
                                                    {theme.name}
                                                </div>
                                                <div className="truncate text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                                    {theme.level} • {theme.badge}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Live Theme Preview Card */}
                        <div className="lg:col-span-6">
                            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-xl dark:border-[#2D234A] dark:bg-[#130E24]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="flex size-9 items-center justify-center rounded-xl text-white font-black text-sm shadow-sm transition-colors duration-300"
                                            style={{ backgroundColor: previewTheme.primary }}
                                        >
                                            <School className="size-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-900 dark:text-white">
                                                Pratinjau Tema: {previewTheme.name}
                                            </div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                                {previewTheme.badge}
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className="rounded-full px-3 py-1 text-[10px] font-black transition-colors duration-300"
                                        style={{
                                            backgroundColor: previewTheme.primary_light,
                                            color: previewTheme.primary,
                                        }}
                                    >
                                        {previewTheme.level}
                                    </span>
                                </div>

                                {/* Simulated School Portal Banner */}
                                <div
                                    className="rounded-2xl p-5 text-white shadow-md transition-all duration-300"
                                    style={{
                                        background:
                                            previewTheme.hero_gradient ||
                                            `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.primary_dark})`,
                                    }}
                                >
                                    <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                                        Portal Resmi Sekolah
                                    </span>
                                    <h4 className="mt-2 text-lg font-black leading-snug">
                                        Selamat Datang di Portal Akademik & Informasi Sekolah
                                    </h4>
                                    <p className="mt-1 text-xs text-white/90">
                                        {previewTheme.description}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-black text-gray-900 shadow-xs">
                                            Input Absensi
                                        </span>
                                        <span className="rounded-xl bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-xs">
                                            Berita & Galeri
                                        </span>
                                    </div>
                                </div>

                                {/* Simulated Cards Below */}
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Presensi Kelas', value: '100% Terisi' },
                                        { label: 'Laporan Ekskul', value: 'QR Terverifikasi' },
                                        { label: 'PWA Push', value: 'Aktif' },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl border p-3 transition-colors duration-300 dark:bg-[#18122B]"
                                            style={{
                                                borderColor: `${previewTheme.primary}30`,
                                                backgroundColor: `${previewTheme.primary_light}50`,
                                            }}
                                        >
                                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                {stat.label}
                                            </div>
                                            <div
                                                className="mt-0.5 text-xs font-black transition-colors duration-300"
                                                style={{ color: previewTheme.primary }}
                                            >
                                                {stat.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. PWA & ROLE ECOSYSTEM */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-12 lg:py-20">
                <div className="mx-auto max-w-3xl text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3.5 py-1 text-xs font-extrabold text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                        <Users className="size-3.5" />
                        Dirancang untuk Seluruh Warga Sekolah
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                        Setiap Peran Punya Ruang Kerja yang Tepat
                    </h2>
                    <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
                        Hak akses dipisahkan secara rapi sehingga setiap pengguna fokus pada tugasnya
                        masing-masing dengan pengalaman mobile-first & PWA.
                    </p>
                </div>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {ROLES_BENEFITS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.role}
                                className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-[#2D234A] dark:bg-[#18122B]"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.color}`}
                                    >
                                        <Icon className="size-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 dark:text-white">
                                            {item.role}
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            {item.tagline}
                                        </p>
                                    </div>
                                </div>
                                <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-[#2D234A]">
                                    {item.points.map((point) => (
                                        <li
                                            key={point}
                                            className="flex items-start gap-2 text-xs font-medium leading-relaxed text-gray-700 dark:text-gray-300"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* PWA Highlight Banner */}
                <div className="mt-12 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1A1A2E] via-[#241B42] to-[#130E24] p-7 text-white shadow-xl sm:p-10">
                    <div className="grid items-center gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-teal-300 backdrop-blur-xs">
                                <Smartphone className="size-3.5" />
                                <span>Progressive Web App (PWA) + Web Push VAPID</span>
                            </div>
                            <h3 className="text-2xl font-black sm:text-3xl">
                                Bisa Diinstal di Smartphone Guru & Wali Murid Tanpa Ribet Play Store
                            </h3>
                            <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                                Dengan teknologi PWA dan manifest dinamis, logo dan nama sekolah Anda
                                akan langsung tampil sebagai ikon aplikasi di layar utama HP Android,
                                iPhone, maupun Desktop. Lengkap dengan notifikasi push pengingat presensi
                                untuk guru.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1 text-xs font-bold">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2">
                                    <BellRing className="size-4 text-amber-300" />
                                    Pengingat Presensi Otomatis
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2">
                                    <KeyRound className="size-4 text-emerald-300" />
                                    Login Passkey Sidik Jari / FaceID
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2">
                                    <PlayCircle className="size-4 text-sky-300" />
                                    Portal Video Tutorial Bawaan
                                </span>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-3">
                            <Button
                                asChild
                                variant="primary"
                                size="lg"
                                className="h-12 rounded-2xl font-black shadow-brand"
                            >
                                <Link href="/portal">
                                    <School className="mr-2 size-4" />
                                    Lihat Demo Portal Sekolah
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-12 rounded-2xl border-white/25 bg-white/10 font-bold text-white hover:bg-white/20"
                            >
                                <Link href="/kontak">
                                    <MessageSquare className="mr-2 size-4" />
                                    Tanya & Pesan Aplikasi
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4.5 PRICING PLANS SECTION */}
            <section
                id="paket-harga"
                className="relative overflow-hidden border-t border-gray-200/70 bg-gradient-to-b from-[#FFFBF7] via-white to-[#FFFBF7] py-14 sm:py-20 dark:border-[#2D234A] dark:from-[#130E24] dark:via-[#18122B] dark:to-[#130E24]"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-3xl text-center space-y-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                            <Crown className="size-3.5" />
                            Pilihan Paket & Investasi Terjangkau
                        </span>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Pilih Paket yang Sesuai dengan Kebutuhan Sekolah Anda
                        </h2>
                        <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
                            Biaya tahunan transparan tanpa biaya tersembunyi per siswa. Mulai dari
                            website sekolah hingga sistem manajemen lengkap.
                        </p>
                    </div>

                    <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-7">
                        {PRICING_PLANS.map((plan) => {
                            const waHref = buildWhatsAppUrl(school?.whatsapp, plan.waMessage);
                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col justify-between rounded-[28px] p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 ${
                                        plan.isPopular
                                            ? 'border-2 border-[var(--brand-primary,#FF6B35)] bg-white shadow-2xl ring-4 ring-[var(--brand-primary,#FF6B35)]/10 dark:bg-[#1E1636]'
                                            : plan.isBestValue
                                              ? 'border-2 border-violet-500/70 bg-gradient-to-b from-white to-violet-50/40 shadow-xl dark:from-[#18122B] dark:to-[#221740]'
                                              : 'border border-gray-200/90 bg-white shadow-sm hover:shadow-lg dark:border-[#2D234A] dark:bg-[#18122B]'
                                    }`}
                                >
                                    {/* Top Floating Badge */}
                                    {plan.badge && (
                                        <div className="mb-4 flex items-center justify-between">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                                                    plan.isPopular
                                                        ? 'bg-[var(--brand-primary,#FF6B35)] text-white shadow-brand'
                                                        : plan.isBestValue
                                                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm'
                                                          : 'bg-gray-100 text-gray-700 dark:bg-[#231B3D] dark:text-gray-300'
                                                }`}
                                            >
                                                {plan.isPopular && <Sparkles className="size-3" />}
                                                {plan.isBestValue && <Crown className="size-3" />}
                                                {plan.badge}
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                            {plan.name}
                                        </h3>
                                        <p className="mt-1.5 min-h-[40px] text-xs leading-relaxed text-gray-600 sm:text-sm dark:text-gray-300">
                                            {plan.subtitle}
                                        </p>

                                        {/* Price Display */}
                                        <div className="my-6 flex items-baseline gap-1.5 border-y border-gray-100 py-5 dark:border-[#2D234A]">
                                            <span
                                                className={`text-3xl font-black tracking-tight sm:text-4xl ${
                                                    plan.isPopular
                                                        ? 'text-[var(--brand-primary,#FF6B35)]'
                                                        : plan.isBestValue
                                                          ? 'text-violet-600 dark:text-violet-400'
                                                          : 'text-gray-900 dark:text-white'
                                                }`}
                                            >
                                                {plan.price}
                                            </span>
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                {plan.period}
                                            </span>
                                        </div>

                                        {/* Feature Checklist */}
                                        <ul className="space-y-3">
                                            {plan.features.map((feat) => (
                                                <li
                                                    key={feat}
                                                    className="flex items-start gap-2.5 text-xs font-semibold leading-relaxed text-gray-700 sm:text-sm dark:text-gray-200"
                                                >
                                                    <CheckCircle2
                                                        className={`mt-0.5 size-4 shrink-0 ${
                                                            plan.isPopular
                                                                ? 'text-[var(--brand-primary,#FF6B35)]'
                                                                : plan.isBestValue
                                                                  ? 'text-violet-500'
                                                                  : 'text-emerald-500'
                                                        }`}
                                                    />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Card CTA */}
                                    <div className="mt-8 pt-2">
                                        <Button
                                            asChild
                                            size="lg"
                                            variant={plan.isPopular ? 'primary' : 'outline'}
                                            className={`h-12 w-full rounded-2xl text-sm font-black transition-all ${
                                                plan.isPopular
                                                    ? 'shadow-brand'
                                                    : plan.isBestValue
                                                      ? 'border-violet-500 bg-violet-600 text-white hover:bg-violet-700 hover:text-white shadow-md shadow-violet-500/20'
                                                      : 'border-2 border-gray-200 hover:border-[var(--brand-primary,#FF6B35)] hover:bg-[var(--brand-primary-light,#FFF0EB)] hover:text-[var(--brand-primary,#FF6B35)] dark:border-[#2D234A] dark:hover:bg-[#231B3D]'
                                            }`}
                                        >
                                            <a
                                                href={waHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <WhatsAppIcon className="mr-2 size-4" />
                                                Pesan via WhatsApp
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. FAQ SECTION */}
            <section className="border-t border-gray-200/70 bg-white/60 py-14 sm:py-18 dark:border-[#2D234A] dark:bg-[#18122B]/40">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-2 mb-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light,#FFF0EB)] px-3.5 py-1 text-xs font-extrabold text-[var(--brand-primary,#FF6B35)] dark:bg-[var(--brand-primary,#FF6B35)]/20 dark:text-orange-300">
                            <Star className="size-3.5" />
                            Pertanyaan Umum
                        </span>
                        <h2 className="text-2xl font-black text-gray-900 sm:text-3xl dark:text-white">
                            Hal yang Sering Ditanyakan Sebelum Menggunakan Aplikasi
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaqIndex === index;
                            return (
                                <div
                                    key={faq.q}
                                    className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white transition-all dark:border-[#2D234A] dark:bg-[#18122B]"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer"
                                    >
                                        <span className="text-sm font-black text-gray-900 sm:text-base dark:text-white">
                                            {faq.q}
                                        </span>
                                        <ChevronDown
                                            className={`size-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-[var(--brand-primary,#FF6B35)]' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-gray-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-gray-600 sm:text-sm dark:border-[#2D234A] dark:text-gray-300">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 6. FINAL HIGH-CONVERTING CTA */}
            <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-12 lg:py-20">
                <div
                    className="relative overflow-hidden rounded-[32px] p-8 text-center text-white shadow-2xl sm:p-14"
                    style={{
                        background:
                            'linear-gradient(135deg, var(--brand-primary, #FF6B35) 0%, #E11D48 55%, #7C3AED 100%)',
                    }}
                >
                    <div className="mx-auto max-w-2xl space-y-5">
                        <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
                            Siap Membawa Sekolah Anda ke Era Digital Modern?
                        </h2>
                        <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                            Dapatkan seluruh fitur website sekolah, absensi siswa, laporan
                            ekstrakurikuler ber-QR Code, jurnal kepala sekolah, tema dinamis, dan PWA
                            dalam satu aplikasi terpadu yang siap dipasang untuk sekolah Anda.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <Button
                                asChild
                                size="lg"
                                className="h-12 rounded-2xl bg-white px-7 text-sm font-black text-gray-900 shadow-lg hover:bg-gray-100"
                            >
                                <Link href="/kontak">
                                    <PhoneCall className="mr-2 size-4" />
                                    Hubungi & Pesan Sekarang
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-12 rounded-2xl border-white/40 bg-white/15 px-6 text-sm font-extrabold text-white backdrop-blur-xs hover:bg-white/25"
                            >
                                <Link href="/portal">
                                    <School className="mr-2 size-4" />
                                    Lihat Portal Sekolah
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="hidden md:block border-t border-gray-200/80 bg-white/80 py-8 text-center text-xs text-gray-500 dark:border-[#2D234A] dark:bg-[#18122B]/80 dark:text-gray-400">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-12">
                    <p className="font-bold">
                        &copy; {new Date().getFullYear()} {schoolName}. Platform Manajemen & Website
                        Sekolah Digital.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 font-bold">
                        <Link href="/portal" className="hover:text-[var(--brand-primary,#FF6B35)]">
                            Portal Sekolah
                        </Link>
                        <Link href="/profil" className="hover:text-[var(--brand-primary,#FF6B35)]">
                            Profil
                        </Link>
                        <Link href="/berita" className="hover:text-[var(--brand-primary,#FF6B35)]">
                            Berita
                        </Link>
                        <Link href="/galeri" className="hover:text-[var(--brand-primary,#FF6B35)]">
                            Galeri
                        </Link>
                        <Link href="/kontak" className="hover:text-[var(--brand-primary,#FF6B35)]">
                            Kontak
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Floating WhatsApp Button (Pojok Kanan Bawah) */}
            <a
                href={buildWhatsAppUrl(
                    school?.whatsapp,
                    `Halo, saya ingin bertanya mengenai aplikasi ${schoolName} dan paket harganya.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tanya via WhatsApp"
                title="Tanya perihal aplikasi via WhatsApp"
                className="fixed bottom-34 right-4 md:bottom-20 md:right-6 z-40 group flex items-center gap-2.5 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] px-4 py-3 text-white shadow-xl shadow-emerald-500/30 ring-2 ring-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 dark:ring-[#18122B]"
            >
                <span className="relative flex items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/40 opacity-75" />
                    <WhatsAppIcon className="relative size-5" />
                </span>
                <span className="hidden sm:inline text-xs font-black tracking-wide">
                    Tanya Aplikasi
                </span>
            </a>
        </div>
    );
}
