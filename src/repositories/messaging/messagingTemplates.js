import { formatCurrency } from '../../utils/formatCurrency'

export const MESSAGING_TEMPLATES = {
  KONFIRMASI_PEMBAYARAN: {
    key: 'KONFIRMASI_PEMBAYARAN',
    label: 'Konfirmasi Pembayaran (Setoran)',
    getWhatsAppText: ({ nama, nominal, namaKelompok, namaInstansi, tanggal }) => `
*[SIQURBAN]* - Konfirmasi Setoran Tabungan Qurban

Assalamu'alaikum wr. wb. Bapak/Ibu *${nama}*,

Alhamdulillah, setoran tabungan qurban Anda telah berhasil diterima.

📌 *Rincian Transaksi:*
• Nominal: *${formatCurrency(nominal)}*
• Kelompok: *${namaKelompok || '-'}*
• Masjid/Instansi: *${namaInstansi || '-'}*
• Tanggal: *${tanggal || new Date().toLocaleDateString('id-ID')}*

Semoga Allah SWT menerima niat suci ibadah qurban Anda. Aamiin.

_Pesan ini dikirim otomatis oleh Sistem SIQURBAN._
`.trim(),

    getEmailHtml: ({ nama, nominal, namaKelompok, namaInstansi, tanggal }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #059669; margin: 0;">SIQURBAN</h2>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Konfirmasi Setoran Tabungan Qurban</p>
  </div>
  <p>Assalamu'alaikum wr. wb. <strong>${nama}</strong>,</p>
  <p>Alhamdulillah, setoran tabungan qurban Anda telah berhasil dicatat oleh sistem.</p>
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h4 style="margin-top: 0; color: #166534;">Rincian Setoran:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #1e293b;">
      <li><strong>Nominal Setoran:</strong> ${formatCurrency(nominal)}</li>
      <li><strong>Kelompok Qurban:</strong> ${namaKelompok || '-'}</li>
      <li><strong>Masjid/Instansi:</strong> ${namaInstansi || '-'}</li>
      <li><strong>Tanggal Transaksi:</strong> ${tanggal || new Date().toLocaleDateString('id-ID')}</li>
    </ul>
  </div>
  <p style="color: #475569; font-size: 13px;">Semoga Allah SWT memberkahi rezeki dan niat ibadah qurban Anda.</p>
</div>
`.trim(),
  },

  KONFIRMASI_BERGABUNG: {
    key: 'KONFIRMASI_BERGABUNG',
    label: 'Konfirmasi Pendaftaran & Bergabung Kelompok',
    getWhatsAppText: ({ nama, namaKelompok, namaInstansi }) => `
*[SIQURBAN]* - Selamat Bergabung!

Assalamu'alaikum wr. wb. *${nama}*,

Selamat datang di Sistem Tabungan Qurban (*SIQURBAN*).
Anda telah resmi terdaftar pada:

📌 *Detail Keanggotaan:*
• Nama Jamaah: *${nama}*
• Kelompok Qurban: *${namaKelompok || '-'}*
• Masjid/Instansi: *${namaInstansi || '-'}*

Silakan mulai menabung secara rutin untuk persiapan ibadah qurban Anda.

_Pesan ini dikirim otomatis oleh SIQURBAN._
`.trim(),

    getEmailHtml: ({ nama, namaKelompok, namaInstansi }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #059669; margin: 0;">SIQURBAN</h2>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Selamat Bergabung di SIQURBAN</p>
  </div>
  <p>Assalamu'alaikum wr. wb. <strong>${nama}</strong>,</p>
  <p>Selamat! Akun Anda telah berhasil dibuat dan terhubung ke kelompok qurban.</p>
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0;"><strong>Nama Jamaah:</strong> ${nama}</p>
    <p style="margin: 4px 0;"><strong>Kelompok:</strong> ${namaKelompok || '-'}</p>
    <p style="margin: 4px 0;"><strong>Masjid/Instansi:</strong> ${namaInstansi || '-'}</p>
  </div>
</div>
`.trim(),
  },

  TARGET_TERCAPAI: {
    key: 'TARGET_TERCAPAI',
    label: 'Notifikasi Target Qurban Tercapai (100%)',
    getWhatsAppText: ({ nama, namaKelompok, totalSaldo, targetDana }) => `
*[SIQURBAN]* - Target Dana Qurban Tercapai! 🎉

Assalamu'alaikum wr. wb. *${nama}*,

Alhamdulillahirabbil'alamiin! Tabungan Qurban untuk *${namaKelompok}* telah mencapai 100% target.

📌 *Ringkasan Target:*
• Total Dana Terkumpul: *${formatCurrency(totalSaldo)}*
• Target Dana: *${formatCurrency(targetDana)}*

Jazakumullah khairan katsiran atas istiqomah Anda dalam menabung.

_SIQURBAN Team_
`.trim(),

    getEmailHtml: ({ nama, namaKelompok, totalSaldo, targetDana }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <h2 style="color: #059669; text-align: center;">🎉 Target Dana Qurban Tercapai!</h2>
  <p>Assalamu'alaikum wr. wb. <strong>${nama}</strong>,</p>
  <p>Alhamdulillah, tabungan untuk <strong>${namaKelompok}</strong> telah mencapai target dana qurban yang ditentukan (${formatCurrency(totalSaldo)} / ${formatCurrency(targetDana)}).</p>
</div>
`.trim(),
  },

  REMINDER_BULANAN: {
    key: 'REMINDER_BULANAN',
    label: 'Pengingat Setoran Bulanan',
    getWhatsAppText: ({ nama, namaKelompok, sisaBulan, saldoSaatIni, targetDana }) => `
*[SIQURBAN]* - Pengingat Setoran Tabungan Qurban

Assalamu'alaikum wr. wb. *${nama}*,

Bulan ini telah memasuki periode setoran tabungan qurban.

📌 *Status Tabungan (${namaKelompok}):*
• Saldo Saat Ini: *${formatCurrency(saldoSaatIni)}*
• Target Dana: *${formatCurrency(targetDana)}*
• Estimasi Pelaksanaan: *${sisaBulan || 'Beberapa'} bulan lagi*

Mari tunaikan setoran bulan ini untuk kelancaran ibadah qurban Anda.

_SIQURBAN Team_
`.trim(),

    getEmailHtml: ({ nama, namaKelompok, sisaBulan, saldoSaatIni, targetDana }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <h2 style="color: #059669; text-align: center;">Pengingat Setoran Bulanan</h2>
  <p>Assalamu'alaikum wr. wb. <strong>${nama}</strong>,</p>
  <p>Mari rutinkan setoran tabungan qurban Anda untuk kelompok <strong>${namaKelompok}</strong>.</p>
  <p>Saldo Terkumpul: <strong>${formatCurrency(saldoSaatIni)}</strong> dari Target <strong>${formatCurrency(targetDana)}</strong>.</p>
</div>
`.trim(),
  },

  REMINDER_OTOMATIS: {
    key: 'REMINDER_OTOMATIS',
    label: 'Reminder Otomatis Sistem',
    getWhatsAppText: ({ nama, pesan }) => `
*[SIQURBAN]* - Pengingat Otomatis

Assalamu'alaikum wr. wb. *${nama}*,

${pesan}

_Pesan ini dikirim otomatis oleh SIQURBAN._
`.trim(),

    getEmailHtml: ({ nama, pesan }) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <h3 style="color: #059669;">Notifikasi Pengingat SIQURBAN</h3>
  <p>Halo <strong>${nama}</strong>,</p>
  <p>${pesan}</p>
</div>
`.trim(),
  },
}
