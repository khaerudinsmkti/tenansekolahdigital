<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AttendanceAdjustment;
use App\Models\Classroom;
use App\Models\DutySchedule;
use App\Models\ExtracurricularMember;
use App\Models\Gallery;
use App\Models\News;
use App\Models\NewsCategory;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create or Update Primary Admin User (admin@vpskhaerudin.web.id)
        $adminUsername = User::where('username', 'admin')
            ->where('email', '!=', 'admin@vpskhaerudin.web.id')
            ->exists() ? 'admin_vps' : 'admin';

        $adminNip = User::where('nip', '198001012005011001')
            ->where('email', '!=', 'admin@vpskhaerudin.web.id')
            ->exists() ? null : '198001012005011001';

        $admin = User::updateOrCreate(
            ['email' => 'admin@vpskhaerudin.web.id'],
            [
                'name' => 'Administrator',
                'username' => $adminUsername,
                'password' => Hash::make('Masuk,com123!'),
                'role' => 'admin',
                'nip' => $adminNip,
                'email_verified_at' => now(),
            ]
        );

        // 2. Create Principal (Kepala Sekolah)
        $principal = User::firstOrCreate(
            ['email' => 'kepsek@absensiku.com'],
            [
                'name' => 'Drs. H. Mulyadi, M.Pd.',
                'username' => 'kepsek',
                'password' => Hash::make('password'),
                'role' => 'principal',
                'nip' => '197001011995121001',
                'email_verified_at' => now(),
            ]
        );

        // 3. Create Teachers
        $teacher1 = User::firstOrCreate(
            ['email' => 'nurul@absensiku.com'],
            [
                'name' => 'Nurul Hidayati, S.Pd.',
                'username' => 'nurul',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '198205142006042018',
                'email_verified_at' => now(),
            ]
        );

        $teacher2 = User::firstOrCreate(
            ['email' => 'bambang@absensiku.com'],
            [
                'name' => 'Bambang Prasetyo, S.Pd.',
                'username' => 'bambang',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '198503112009021003',
                'email_verified_at' => now(),
            ]
        );

        $teacher3 = User::firstOrCreate(
            ['email' => 'siti@absensiku.com'],
            [
                'name' => 'Siti Rahmawati, S.Pd.',
                'username' => 'siti',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '199008202015032004',
                'email_verified_at' => now(),
            ]
        );

        $teacher4 = User::firstOrCreate(
            ['email' => 'zaki@absensiku.com'],
            [
                'name' => 'Ahmad Zaki, S.Pd.I',
                'username' => 'zaki',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '199211052019031008',
                'email_verified_at' => now(),
            ]
        );

        // 4. Create Classrooms
        $kelas4A = Classroom::firstOrCreate(
            ['name' => 'Kelas 4-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher1->id,
            ]
        );

        $kelas4B = Classroom::firstOrCreate(
            ['name' => 'Kelas 4-B'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher2->id,
            ]
        );

        $kelas5A = Classroom::firstOrCreate(
            ['name' => 'Kelas 5-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher3->id,
            ]
        );

        $kelas6A = Classroom::firstOrCreate(
            ['name' => 'Kelas 6-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher4->id,
            ]
        );

        // 5. Duty Schedules (Piket)
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher2->id, 'day_of_week' => 1],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher1->id, 'day_of_week' => 2],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher3->id, 'day_of_week' => 3],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher4->id, 'day_of_week' => 4],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher2->id, 'day_of_week' => 5],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher1->id, 'day_of_week' => 6],
            ['is_active' => true]
        );

        // 6. Create Students for Kelas 4-A
        $students4A = [
            ['name' => 'Ahmad Faiz Pratama', 'nisn' => '0089218201', 'nis' => '4001', 'gender' => 'L'],
            ['name' => 'Anindya Putri Kirana', 'nisn' => '0089218202', 'nis' => '4002', 'gender' => 'P'],
            ['name' => 'Bagas Aditya Nugraha', 'nisn' => '0089218203', 'nis' => '4003', 'gender' => 'L'],
            ['name' => 'Citra Amelia Zahra', 'nisn' => '0089218204', 'nis' => '4004', 'gender' => 'P'],
            ['name' => 'Dimas Satria Ramadhan', 'nisn' => '0089218205', 'nis' => '4005', 'gender' => 'L'],
            ['name' => 'Eka Lestari Wulandari', 'nisn' => '0089218206', 'nis' => '4006', 'gender' => 'P'],
            ['name' => 'Fadhil Muhammad Ihsan', 'nisn' => '0089218207', 'nis' => '4007', 'gender' => 'L'],
            ['name' => 'Gita Permata Sari', 'nisn' => '0089218208', 'nis' => '4008', 'gender' => 'P'],
            ['name' => 'Hafiz Rizky Pratama', 'nisn' => '0089218209', 'nis' => '4009', 'gender' => 'L'],
            ['name' => 'Indah Cahya Lestari', 'nisn' => '0089218210', 'nis' => '4010', 'gender' => 'P'],
        ];

        $studentEntities4A = [];
        foreach ($students4A as $data) {
            $studentEntities4A[] = Student::firstOrCreate(
                ['nisn' => $data['nisn']],
                [
                    'classroom_id' => $kelas4A->id,
                    'name' => $data['name'],
                    'nis' => $data['nis'],
                    'gender' => $data['gender'],
                    'is_active' => true,
                ]
            );
        }

        // Students for Kelas 4-B
        $students4B = [
            ['name' => 'Kevin Arya Wijaya', 'nisn' => '0089218301', 'nis' => '4101', 'gender' => 'L'],
            ['name' => 'Laila Nur Azizah', 'nisn' => '0089218302', 'nis' => '4102', 'gender' => 'P'],
            ['name' => 'Muhammad Naufal Al-Farisi', 'nisn' => '0089218303', 'nis' => '4103', 'gender' => 'L'],
            ['name' => 'Nadia Syakira', 'nisn' => '0089218304', 'nis' => '4104', 'gender' => 'P'],
            ['name' => 'Randi Saputra', 'nisn' => '0089218305', 'nis' => '4105', 'gender' => 'L'],
        ];
        foreach ($students4B as $data) {
            Student::firstOrCreate(
                ['nisn' => $data['nisn']],
                [
                    'classroom_id' => $kelas4B->id,
                    'name' => $data['name'],
                    'nis' => $data['nis'],
                    'gender' => $data['gender'],
                    'is_active' => true,
                ]
            );
        }

        // 7. Seed Sample Attendances for Today
        $today = Carbon::today()->toDateString();
        $sampleRecords = [
            0 => ['status' => 'present', 'check_in' => '06:48:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            1 => ['status' => 'present', 'check_in' => '06:55:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            2 => ['status' => 'present', 'check_in' => '07:18:00', 'is_late' => true, 'late' => 18, 'notes' => 'Ban sepeda kempes'],
            3 => ['status' => 'sick', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Demam tinggi'],
            4 => ['status' => 'permit', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Acara keluarga di luar kota'],
            5 => ['status' => 'absent', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Tanpa keterangan'],
            6 => ['status' => 'present', 'check_in' => '06:40:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            7 => ['status' => 'present', 'check_in' => '06:50:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            8 => ['status' => 'present', 'check_in' => '07:12:00', 'is_late' => true, 'late' => 12, 'notes' => 'Terjebak macet jalan raya'],
            9 => ['status' => 'present', 'check_in' => '06:45:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
        ];

        foreach ($sampleRecords as $idx => $attData) {
            if (isset($studentEntities4A[$idx])) {
                $student = $studentEntities4A[$idx];
                $attendance = Attendance::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'date' => $today,
                    ],
                    [
                        'recorded_by' => $teacher1->id,
                        'status' => $attData['status'],
                        'check_in_time' => $attData['check_in'],
                        'is_late' => $attData['is_late'],
                        'late_minutes' => $attData['late'],
                        'notes' => $attData['notes'],
                    ]
                );

                // Add 1 sample adjustment (Early leave) for student 0
                if ($idx === 0) {
                    AttendanceAdjustment::firstOrCreate(
                        ['attendance_id' => $attendance->id],
                        [
                            'approved_by' => $teacher2->id,
                            'type' => 'early_leave_sick',
                            'departure_time' => '10:30:00',
                            'reason' => 'Mengeluh pusing dan mual saat istirahat pertama',
                            'pickup_person' => 'Ibu Kandung (Ny. Rahma)',
                            'attachment_path' => null,
                        ]
                    );
                }
            }
        }

        // 8. Create Publisher User
        $publisher = User::firstOrCreate(
            ['email' => 'publisher@absensiku.com'],
            [
                'name' => 'Tim Humas & Redaksi Berita',
                'username' => 'publisher',
                'password' => Hash::make('password'),
                'role' => 'publisher',
                'nip' => '199505052020011005',
                'email_verified_at' => now(),
            ]
        );

        // 8b. Create Coach User (Pelatih Ekstrakurikuler)
        $coach = User::firstOrCreate(
            ['email' => 'pelatih@absensiku.com'],
            [
                'name' => 'Rizky Pratama, S.Or.',
                'username' => 'pelatih',
                'password' => Hash::make('password'),
                'role' => 'coach',
                'nip' => '199407122021011002',
                'email_verified_at' => now(),
            ]
        );

        foreach (Student::orderBy('id')->take(5)->get() as $memberStudent) {
            ExtracurricularMember::firstOrCreate(
                [
                    'coach_id' => $coach->id,
                    'student_id' => $memberStudent->id,
                    'extracurricular_name' => 'Pramuka',
                ],
                [
                    'notes' => 'Anggota aktif ekstrakurikuler Pramuka',
                ]
            );
        }

        // 9. Create News Categories
        $catPengumuman = NewsCategory::firstOrCreate(
            ['name' => 'Pengumuman Resmi'],
            ['slug' => 'pengumuman-resmi', 'color' => 'amber', 'description' => 'Pengumuman kedinasan, agenda sekolah, dan surat edaran']
        );
        $catKegiatan = NewsCategory::firstOrCreate(
            ['name' => 'Kegiatan Sekolah'],
            ['slug' => 'kegiatan-sekolah', 'color' => 'emerald', 'description' => 'Dokumentasi dan liputan acara serta kegiatan belajar siswa']
        );
        $catPrestasi = NewsCategory::firstOrCreate(
            ['name' => 'Prestasi & Akademik'],
            ['slug' => 'prestasi-akademik', 'color' => 'blue', 'description' => 'Penghargaan dan capaian membanggakan siswa & guru']
        );
        $catEkskul = NewsCategory::firstOrCreate(
            ['name' => 'Ekstrakurikuler'],
            ['slug' => 'ekstrakurikuler', 'color' => 'purple', 'description' => 'Informasi klub minat, bakat, pramuka, dan olahraga']
        );

        // 10. Copy Sample News Images to Tenant Public Storage & Create Sample News
        $newsImages = [];
        foreach ([1, 2, 3] as $index) {
            $filename = "demo-news-{$index}.jpg";
            $sourcePath = database_path("seeders/assets/news/{$filename}");
            $storagePath = "news_images/{$filename}";

            if (File::exists($sourcePath)) {
                Storage::disk('public')->put($storagePath, File::get($sourcePath));
                $newsImages[$index] = $storagePath;
            } else {
                $newsImages[$index] = null;
            }
        }

        News::firstOrCreate(
            ['slug' => 'edaran-pelaksanaan-penilaian-akhir-semester-pas-2026'],
            [
                'title' => 'Surat Edaran Pelaksanaan Penilaian Akhir Semester (PAS) Gasal 2026/2027',
                'category_id' => $catPengumuman->id,
                'user_id' => $publisher->id,
                'excerpt' => 'Informasi lengkap jadwal dan tata tertib Penilaian Akhir Semester (PAS) Gasal bagi seluruh siswa kelas I hingga VI.',
                'content' => "<p>Yth. Bapak/Ibu Orang Tua / Wali Murid dan seluruh Siswa-Siswi,</p><p>Sehubungan dengan berakhirnya kegiatan pembelajaran semester gasal Tahun Ajaran 2026/2027, pihak sekolah akan menyelenggarakan <strong>Penilaian Akhir Semester (PAS) Gasal</strong> yang dimulai pada tanggal 10 Desember 2026.</p><p>Diharapkan seluruh siswa mempersiapkan diri dengan baik, menjaga kesehatan, dan datang tepat waktu sesuai jam yang ditentukan. Silakan unduh lampiran berkas jadwal resmi dan tata tertib ujian di bawah ini.</p>",
                'image_path' => $newsImages[1],
                'images' => $newsImages[1] ? [$newsImages[1]] : null,
                'attachment_path' => null,
                'attachment_name' => null,
                'is_published' => true,
                'published_at' => now()->subDays(2),
                'views_count' => 142,
            ]
        );

        News::firstOrCreate(
            ['slug' => 'prestasi-gemilang-juara-1-olimpiade-sains-nasional-tingkat-kota'],
            [
                'title' => 'Prestasi Gemilang! Kontingen Siswa Meraih Juara 1 Olimpiade Sains & Matematika',
                'category_id' => $catPrestasi->id,
                'user_id' => $publisher->id,
                'excerpt' => 'Selamat kepada Ananda Naufal dan Tim yang berhasil mengharumkan nama sekolah di ajang Olimpiade Sains Kota.',
                'content' => "<p>Kabar membanggakan kembali datang dari perwakilan siswa-siswi kita. Dalam ajang Olimpiade Sains & Matematika Tingkat Kota yang diselenggarakan akhir pekan lalu, perwakilan sekolah berhasil menyabet Juara 1 Kategori IPA Terapan dan Medali Perak Matematika.</p><p>Kepala Sekolah menyampaikan apresiasi setinggi-tingginya kepada para guru pembimbing dan orang tua yang senantiasa mendampingi proses belajar ananda. Semoga prestasi ini menjadi motivasi bagi seluruh murid untuk terus berkarya dan berprestasi.</p>",
                'image_path' => $newsImages[2],
                'images' => $newsImages[2] ? [$newsImages[2]] : null,
                'attachment_path' => null,
                'attachment_name' => null,
                'is_published' => true,
                'published_at' => now()->subDay(),
                'views_count' => 285,
            ]
        );

        News::firstOrCreate(
            ['slug' => 'kegiatan-senam-sehat-dan-edukasi-gizi-bersama-puskesmas'],
            [
                'title' => 'Kegiatan Senam Bersama dan Edukasi Pola Hidup Bersih & Sehat (PHBS)',
                'category_id' => $catKegiatan->id,
                'user_id' => $publisher->id,
                'excerpt' => 'Semarak Jumat Sehat bersama tenaga medis Puskesmas setempat untuk membangun kebiasaan hidup sehat sejak dini.',
                'content' => "<p>Jumat pagi di halaman utama sekolah berlangsung penuh keceriaan. Seluruh warga sekolah mulai dari kelas 1 sampai kelas 6, didampingi dewan guru, mengikuti kegiatan Senam Kesegaran Jasmani (SKJ) bersama.</p><p>Setelah senam, tim dari Puskesmas memberikan penyuluhan interaktif mengenai pentingnya sarapan bergizi seimbang, cara mencuci tangan dengan sabun yang benar, dan menjaga kebersihan lingkungan sekolah.</p>",
                'image_path' => $newsImages[3],
                'images' => $newsImages[3] ? [$newsImages[3]] : null,
                'attachment_path' => null,
                'attachment_name' => null,
                'is_published' => true,
                'published_at' => now(),
                'views_count' => 97,
            ]
        );
        // 11. Seed Default School Logo, Favicon & Principal Greeting Photo
        $schoolSetting = SchoolSetting::getSetting();

        $principalSource = database_path('seeders/assets/school/principal-greeting.jpg');
        if (File::exists($principalSource)) {
            $principalStoragePath = 'school/principal-greeting.jpg';
            Storage::disk('public')->put($principalStoragePath, File::get($principalSource));
            $schoolSetting->principal_photo_path = $principalStoragePath;
        }

        $logoSource = database_path('seeders/assets/school/school-logo.webp');
        if (File::exists($logoSource)) {
            $logoStoragePath = 'school/school-logo.webp';
            Storage::disk('public')->put($logoStoragePath, File::get($logoSource));
            $schoolSetting->logo_path = $logoStoragePath;
        }

        $schoolSetting->mission = "1 Menanamkan nilai keimanan, ketakwaan, dan budi pekerti luhur dalam kehidupan sehari-hari.\n2 Melaksanakan pembelajaran aktif, inovatif, kreatif, dan menyenangkan berbasis teknologi ramah anak.\n3 Mengembangkan potensi bakat, minat, dan kecerdasan majemuk peserta didik secara optimal melalui kegiatan intrakulikuler dan ekstrakurikuler.\n4 Mewujudkan lingkungan sekolah yang bersih, sehat, aman, inklusif, dan kondusif untuk bertumbuh kembang.\n5 Menjalin kemitraan yang harmonis dan transparan antara pihak sekolah, komite, orang tua murid, dan masyarakat sekitar.";
        $schoolSetting->save();

        // 12. Seed 3 Sample Activity Galleries with Photos
        Gallery::ensureTableExists();

        $sampleGalleries = [
            [
                'title' => 'Upacara Bendera & Penyerahan Piala Prestasi Siswa',
                'category' => 'Upacara & Prestasi',
                'description' => 'Dokumentasi pelaksanaan upacara bendera rutin hari Senin yang dirangkaikan dengan penyerahan piala kejuaraan Lomba PBB dan prestasi siswa.',
                'activity_date' => now()->subDays(5)->toDateString(),
                'files' => ['album-1-1.jpg', 'album-1-2.jpg', 'album-1-3.jpg', 'album-1-4.jpg'],
            ],
            [
                'title' => 'Perkemahan, Pioneering & Api Unggun Pramuka',
                'category' => 'Ekstrakurikuler',
                'description' => 'Kegiatan perkemahan akhir pekan anggota Pramuka meliputi apel pembukaan, mendirikan tenda, latihan pioneering, dan malam api unggun.',
                'activity_date' => now()->subDays(3)->toDateString(),
                'files' => ['album-2-1.jpg', 'album-2-2.jpg', 'album-2-3.jpg', 'album-2-4.jpg', 'album-2-5.jpg', 'album-2-6.jpg'],
            ],
            [
                'title' => 'Jumat Sehat, Sarapan Bersama & Pembinaan Karakter',
                'category' => 'Kegiatan Sekolah',
                'description' => 'Rangkaian program Jumat Sehat dan pembinaan siswa mulai dari senam pagi bersama, sarapan bergizi di kelas, hingga seminar motivasi di aula.',
                'activity_date' => now()->subDay()->toDateString(),
                'files' => ['album-3-1.jpg', 'album-3-2.jpg', 'album-3-3.jpg'],
            ],
        ];

        foreach ($sampleGalleries as $item) {
            $storedPaths = [];
            $totalBytes = 0;

            foreach ($item['files'] as $filename) {
                $sourcePath = database_path("seeders/assets/gallery/{$filename}");
                if (File::exists($sourcePath)) {
                    $storagePath = "galleries/{$filename}";
                    Storage::disk('public')->put($storagePath, File::get($sourcePath));
                    $storedPaths[] = $storagePath;
                    $totalBytes += File::size($sourcePath);
                }
            }

            if (! empty($storedPaths)) {
                Gallery::firstOrCreate(
                    ['title' => $item['title']],
                    [
                        'category' => $item['category'],
                        'description' => $item['description'],
                        'activity_date' => $item['activity_date'],
                        'image_path' => $storedPaths[0],
                        'images' => $storedPaths,
                        'file_size' => $totalBytes,
                        'is_published' => true,
                        'user_id' => $publisher->id,
                    ]
                );
            }
        }

        // 13. Seed Teacher Profiles with Photos
        TeacherProfile::ensureTableExists();

        TeacherProfile::whereIn('user_id', [$teacher1->id, $teacher3->id])->delete();

        $teacherProfilesData = [
            [
                'user_id' => $principal->id,
                'name' => $principal->name,
                'subject' => 'Kepala Sekolah',
                'homeroom_class' => null,
                'employment_status' => 'PNS',
                'file' => 'teacher-1.jpg',
                'sort_order' => 1,
            ],
            [
                'user_id' => $teacher2->id,
                'name' => $teacher2->name,
                'subject' => 'Guru Kelas',
                'homeroom_class' => 'Kelas 4-B',
                'employment_status' => 'PNS',
                'file' => 'teacher-2.jpg',
                'sort_order' => 2,
            ],
            [
                'user_id' => $teacher4->id,
                'name' => $teacher4->name,
                'subject' => 'Pendidikan Agama Islam',
                'homeroom_class' => null,
                'employment_status' => 'PPPK',
                'file' => 'teacher-3.jpg',
                'sort_order' => 3,
            ],
            [
                'user_id' => null,
                'name' => 'Hendra Wijaya, S.Pd.',
                'subject' => 'Matematika',
                'homeroom_class' => 'Kelas 5-A',
                'employment_status' => 'PNS',
                'file' => 'teacher-4.jpg',
                'sort_order' => 4,
            ],
            [
                'user_id' => null,
                'name' => 'Dedi Kurniawan, M.Pd.',
                'subject' => 'Ilmu Pengetahuan Alam',
                'homeroom_class' => 'Kelas 6-A',
                'employment_status' => 'PNS',
                'file' => 'teacher-5.jpg',
                'sort_order' => 5,
            ],
            [
                'user_id' => null,
                'name' => 'Fajar Nugroho, S.Pd.',
                'subject' => 'Pendidikan Jasmani & Olahraga',
                'homeroom_class' => null,
                'employment_status' => 'PPPK',
                'file' => 'teacher-6.jpg',
                'sort_order' => 6,
            ],
            [
                'user_id' => null,
                'name' => 'Rudi Hartono, S.Kom.',
                'subject' => 'Informatika & Koding',
                'homeroom_class' => null,
                'employment_status' => 'GTY',
                'file' => 'teacher-7.jpg',
                'sort_order' => 7,
            ],
            [
                'user_id' => null,
                'name' => 'Bagus Santoso, S.Pd.',
                'subject' => 'Bahasa Indonesia',
                'homeroom_class' => 'Kelas 5-B',
                'employment_status' => 'PPPK',
                'file' => 'teacher-8.jpg',
                'sort_order' => 8,
            ],
            [
                'user_id' => null,
                'name' => 'Agung Saputra, S.Sn.',
                'subject' => 'Seni Budaya & Prakarya',
                'homeroom_class' => null,
                'employment_status' => 'Honorer',
                'file' => 'teacher-9.jpg',
                'sort_order' => 9,
            ],
            [
                'user_id' => null,
                'name' => 'Dimas Pratama, S.Pd.',
                'subject' => 'Bahasa Inggris',
                'homeroom_class' => 'Kelas 6-B',
                'employment_status' => 'PPPK',
                'file' => 'teacher-10.jpg',
                'sort_order' => 10,
            ],
        ];

        foreach ($teacherProfilesData as $profileData) {
            $sourcePath = database_path("seeders/assets/teachers/{$profileData['file']}");
            $storagePath = null;
            $fileSize = 0;

            if (File::exists($sourcePath)) {
                $storagePath = "teacher_profiles/{$profileData['file']}";
                Storage::disk('public')->put($storagePath, File::get($sourcePath));
                $fileSize = File::size($sourcePath);
            }

            TeacherProfile::updateOrCreate(
                ['name' => $profileData['name']],
                [
                    'user_id' => $profileData['user_id'],
                    'subject' => $profileData['subject'],
                    'homeroom_class' => $profileData['homeroom_class'],
                    'employment_status' => $profileData['employment_status'],
                    'photo_path' => $storagePath,
                    'file_size' => $fileSize,
                    'sort_order' => $profileData['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
