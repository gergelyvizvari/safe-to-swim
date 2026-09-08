import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import contactHandler from './api/contact.js'
import balatonHandler from './api/balaton.js'

import catalogueHandler from './api/catalogue.js'
import observationsHandler from './api/observations.js'
import sourceChecksHandler from './api/source-checks.js'

function balatonApi() {
  const configure = (server) => {
    for (const [route, handler] of Object.entries({ '/api/contact': contactHandler, '/api/balaton': balatonHandler, '/api/catalogue': catalogueHandler, '/api/observations': observationsHandler, '/api/source-checks': sourceChecksHandler })) server.middlewares.use(route, (req, res) => {
      res.status = (code) => { res.statusCode = code; return res }
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
      return handler(req, res)
    })
  }
  return { name: 'balaton-api', configureServer: configure, configurePreviewServer: configure }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'CRON_SECRET', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL']) if (env[key]) process.env[key] = env[key]
  return { plugins: [react(), balatonApi()] }
})
