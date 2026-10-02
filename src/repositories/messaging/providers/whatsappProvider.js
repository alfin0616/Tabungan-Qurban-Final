import { supabase } from '../../../api/supabaseClient'

/**
 * Provider Abstraction untuk WhatsApp Gateway (Fonnte, Wablas, Twilio, dll).
 * Mengambil Gateway URL & API Token dari app_settings / DB tanpa hardcode provider.
 */
export const whatsappProvider = {
  name: 'WhatsAppGateway',

  send: async ({ to, message }) => {
    try {
      if (!to || !message) return { success: false, error: 'Tujuan atau pesan kosong' }

      // 1. Ambil gateway URL & API Key dari settings DB
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['wa_gateway_url', 'wa_api_key', 'wa_enabled'])

      const settings = {}
      settingsData?.forEach((item) => {
        settings[item.key] = item.value
      })

      // Jika WA tidak diaktifkan di settings, kembalikan status simulasi/skipped
      if (settings.wa_enabled === 'false' || settings.wa_enabled === false) {
        return { success: true, simulated: true, message: 'WhatsApp gateway disabled in settings' }
      }

      const gatewayUrl = settings.wa_gateway_url || 'https://api.fonnte.com/send'
      const apiKey = settings.wa_api_key || import.meta.env.VITE_WA_API_KEY

      if (!apiKey) {
        return { success: false, error: 'WA API Key belum dikonfigurasi' }
      }

      // 2. Format nomor telepon ke standar internasional (+62 / 62)
      let formattedPhone = to.replace(/[^0-9]/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1)
      }

      // 3. Kirim via HTTP Request
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
        },
        body: JSON.stringify({
          target: formattedPhone,
          message: message,
        }),
      })

      const result = await response.json()
      return { success: response.ok, data: result }
    } catch (err) {
      return { success: false, error: err.message }
    }
  },
}
