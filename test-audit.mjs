import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iizlhvcoesawwcfetwrp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpemxodmNvZXNhd3djZmV0d3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTU0OTMsImV4cCI6MjEwMDI3MTQ5M30.BUA-QPP_i04hHMkx2EEcK572B4T3F9ZDeZlccrJi81g'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
  const { data, error, count } = await supabase
    .from('audit_logs')
    .select('*')
    .range(0, 19)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase Error:', error)
  } else {
    console.log('Success! Count:', count)
    console.log(data)
  }
}

run()
