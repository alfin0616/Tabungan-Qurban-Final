/**
 * @fileoverview Definisi Tipe Data Global untuk SIQURBAN.
 * File ini hanya berisi anotasi JSDoc agar editor (VS Code) bisa 
 * memberikan auto-complete yang cerdas meskipun kita menggunakan Vanilla JS.
 */

/**
 * @typedef {Object} Anggota
 * @property {string} id - UUID Anggota
 * @property {string} nama - Nama lengkap
 * @property {string} kode_anggota - Kode unik (generate otomatis)
 * @property {string} no_hp - Nomor Handphone
 * @property {string} alamat - Alamat domisili
 * @property {'L'|'P'} jenis_kelamin - Laki-laki atau Perempuan
 * @property {string} tanggal_bergabung - Tanggal (YYYY-MM-DD)
 * @property {boolean} status - Aktif (true) atau Nonaktif (false)
 * @property {string|null} foto - URL Foto profil anggota (opsional)
 * @property {string} instansi_id - ID Instansi / Masjid
 * @property {string} kelompok_id - ID Kelompok Qurban
 * @property {string} user_id - ID akun login (Auth)
 */

/**
 * @typedef {Object} Transaksi
 * @property {string} id - UUID Transaksi
 * @property {string} tanggal - Tanggal transaksi (YYYY-MM-DD)
 * @property {string} anggota_id - ID Anggota
 * @property {'setoran'|'penarikan'} jenis - Jenis transaksi
 * @property {number} nominal - Jumlah uang
 * @property {string} metode_pembayaran - 'tunai', 'transfer', atau 'qris'
 * @property {string} keterangan - Catatan tambahan
 * @property {string|null} bukti - URL Foto bukti transaksi (opsional)
 */

/**
 * @typedef {Object} Pengeluaran
 * @property {string} id - UUID Pengeluaran
 * @property {string} tanggal - Tanggal pengeluaran
 * @property {'listrik'|'air'|'kebersihan'|'atk'|'konsumsi'|'pemeliharaan'|'honor'|'lainnya'} kategori - Kategori pengeluaran
 * @property {number} nominal - Jumlah pengeluaran
 * @property {string} keterangan - Rincian kebutuhan
 * @property {string|null} bukti - Foto/Scan nota (opsional)
 */

/**
 * @typedef {Object} SystemSettings
 * @property {string} app_name
 * @property {string} company_name
 * @property {string} theme_color
 * @property {boolean} maintenance_mode
 */

export {}
