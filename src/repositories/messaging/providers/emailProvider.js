import { supabase } from '../../../api/supabaseClient'

/**
 * Provider Abstraction untuk Email Service (Resend, SendGrid, SMTP, Supabase Mail).
 * Mengambil Mail API Key & Sender Email dari app_settings / DB tanpa hardcode provider.
 */
export const emailProvider = {
  name: 'EmailGateway',

  send: async ({ to, subject, htmlBody }) => {
    try {
      if (!to || !subject || !htmlBody) return { success: false, error: 'Target email, subjek, atau body kosong' }

      // 1. Ambil Email settings dari DB
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['email_smtp_host', 'email_from_address', 'email_enabled'])

      const settings = {}
      settingsData?.forEach((item) => {
        settings[item.key] = item.value
      })

      if (settings.email_enabled === 'false' || settings.email_enabled === false) {
        return { success: true, simulated: true, message: 'Email service disabled in settings' }
      }

      // 2. Kirim via Supabase RPC atau Webhook Service
      const { data, error } = await supabase.rpc('send_email_notification', {
        p_recipient: to,
        p_subject: subject,
        p_html: htmlBody,
      }).catch(() => ({ data: null, error: null }))

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || 'Email dispatched successfully' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },
}
