/**
 * Indonesian Full Timestamp Helper
 * Format: "Hari, Tanggal Bulan Tahun | Jam:Menit:Detik WIB"
 * Contoh: "Kamis, 20 Agustus 2026 | 11:46:30 WIB"
 */
export function getFullTimestamp(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${dayName}, ${day} ${month} ${year} | ${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Format Short Timestamp
 * Contoh: "20 Ags 2026, 11:46"
 */
export function getShortTimestamp(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  return (
    date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
    ' WIB'
  );
}
