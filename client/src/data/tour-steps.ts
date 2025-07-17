export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  order: number;
}

export const tourSteps: TourStep[] = [
  {
    id: 'daily-focus',
    title: 'Daily Focus',
    description: 'Lihat dan kelola tugas harian, update progress, dan prioritas Anda. Ini adalah dashboard utama untuk produktivitas sehari-hari.',
    target: '[data-tour="daily-focus"]',
    placement: 'right',
    order: 1
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description: 'Pantau progress pencapaian goal Anda secara kronologis. Lihat riwayat check-in dan perkembangan angka target.',
    target: '[data-tour="timeline"]',
    placement: 'right',
    order: 2
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Kelola semua tugas tim dengan filter berdasarkan status, prioritas, dan PIC. Jadwal tugas dan pantau deadlines.',
    target: '[data-tour="tasks"]',
    placement: 'right',
    order: 3
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Buat dan kelola objectives dengan key results. Visualisasi hierarki goal dan pantau progress secara real-time.',
    target: '[data-tour="goals"]',
    placement: 'right',
    order: 4
  },
  {
    id: 'cycles',
    title: 'Siklus',
    description: 'Atur periode waktu untuk goals (bulanan, kuartalan, tahunan). Kelola timeline dan jadwal review goal.',
    target: '[data-tour="cycles"]',
    placement: 'right',
    order: 5
  },
  {
    id: 'achievements',
    title: 'Pencapaian',
    description: 'Lihat badges dan rewards yang telah diraih. Gamifikasi untuk motivasi dan engagement tim.',
    target: '[data-tour="achievements"]',
    placement: 'right',
    order: 6
  },
  {
    id: 'analytics',
    title: 'Analitik',
    description: 'Dashboard analitik untuk melihat performa tim, progress rate, dan insight untuk perbaikan.',
    target: '[data-tour="analytics"]',
    placement: 'right',
    order: 7
  },
  {
    id: 'users',
    title: 'Kelola Pengguna',
    description: 'Undang anggota tim baru, atur role, dan kelola akses user. Fitur untuk owner dan administrator.',
    target: '[data-tour="users"]',
    placement: 'right',
    order: 8
  },
  {
    id: 'settings',
    title: 'Pengaturan Organisasi',
    description: 'Konfigurasi pengaturan organisasi, upgrade paket, dan kelola subscription.',
    target: '[data-tour="settings"]',
    placement: 'right',
    order: 9
  },
  {
    id: 'notifications',
    title: 'Notifikasi',
    description: 'Terima notifikasi real-time untuk update task, comment, dan activity penting lainnya.',
    target: '[data-tour="notifications"]',
    placement: 'bottom',
    order: 10
  }
];