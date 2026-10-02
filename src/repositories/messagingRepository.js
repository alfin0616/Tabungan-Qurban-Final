import { whatsappProvider } from './messaging/providers/whatsappProvider'
import { emailProvider } from './messaging/providers/emailProvider'
import { MESSAGING_TEMPLATES } from './messaging/messagingTemplates'

/**
 * Service Abstraction Utama untuk Messaging (WhatsApp & Email).
 * Bebas dari hardcode provider, mendukung saluran WhatsApp, Email, maupun keduanya sekaligus.
 */
export const messagingRepository = {
  /**
   * Kirim pesan umum menggunakan template key & data dinamis
   */
  sendMessage: async ({ channel = 'both', recipientPhone, recipientEmail, templateKey, data = {} }) => {
    const template = MESSAGING_TEMPLATES[templateKey]
    if (!template) {
      return { success: false, error: `Template key '${templateKey}' tidak ditemukan` }
    }

    const results = {
      whatsapp: null,
      email: null,
    }

    // 1. Kirim via WhatsApp jika dipilih
    if ((channel === 'whatsapp' || channel === 'both') && recipientPhone) {
      const textMessage = template.getWhatsAppText(data)
      results.whatsapp = await whatsappProvider.send({
        to: recipientPhone,
        message: textMessage,
      })
    }

    // 2. Kirim via Email jika dipilih
    if ((channel === 'email' || channel === 'both') && recipientEmail) {
      const htmlContent = template.getEmailHtml(data)
      results.email = await emailProvider.send({
        to: recipientEmail,
        subject: `[SIQURBAN] - ${template.label}`,
        htmlBody: htmlContent,
      })
    }

    return {
      success: Boolean(results.whatsapp?.success || results.email?.success),
      results,
    }
  },

  /**
   * Shortcut Helper: Kirim Konfirmasi Pembayaran (Setoran)
   */
  sendPaymentConfirmation: async ({ phone, email, nama, nominal, namaKelompok, namaInstansi, tanggal }) => {
    return messagingRepository.sendMessage({
      channel: 'both',
      recipientPhone: phone,
      recipientEmail: email,
      templateKey: 'KONFIRMASI_PEMBAYARAN',
      data: { nama, nominal, namaKelompok, namaInstansi, tanggal },
    })
  },

  /**
   * Shortcut Helper: Kirim Konfirmasi Bergabung
   */
  sendJoinConfirmation: async ({ phone, email, nama, namaKelompok, namaInstansi }) => {
    return messagingRepository.sendMessage({
      channel: 'both',
      recipientPhone: phone,
      recipientEmail: email,
      templateKey: 'KONFIRMASI_BERGABUNG',
      data: { nama, namaKelompok, namaInstansi },
    })
  },

  /**
   * Shortcut Helper: Kirim Notifikasi Target Qurban Tercapai (100%)
   */
  sendTargetReachedNotification: async ({ phone, email, nama, namaKelompok, totalSaldo, targetDana }) => {
    return messagingRepository.sendMessage({
      channel: 'both',
      recipientPhone: phone,
      recipientEmail: email,
      templateKey: 'TARGET_TERCAPAI',
      data: { nama, namaKelompok, totalSaldo, targetDana },
    })
  },

  /**
   * Shortcut Helper: Kirim Pengingat Bulanan
   */
  sendMonthlyReminder: async ({ phone, email, nama, namaKelompok, sisaBulan, saldoSaatIni, targetDana }) => {
    return messagingRepository.sendMessage({
      channel: 'both',
      recipientPhone: phone,
      recipientEmail: email,
      templateKey: 'REMINDER_BULANAN',
      data: { nama, namaKelompok, sisaBulan, saldoSaatIni, targetDana },
    })
  },
}
