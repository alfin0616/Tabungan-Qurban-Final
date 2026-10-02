

const SUPABASE_URL = 'https://iizlhvcoesawwcfetwrp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpemxodmNvZXNhd3djZmV0d3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTU0OTMsImV4cCI6MjEwMDI3MTQ5M30.BUA-QPP_i04hHMkx2EEcK572B4T3F9ZDeZlccrJi81g'

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`)
  const swagger = await res.json()
  const auditLogs = swagger.definitions.audit_logs
  console.log(JSON.stringify(auditLogs, null, 2))
}

run()
