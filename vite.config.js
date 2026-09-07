import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import balatonHandler from './api/balaton.js'

function balatonApi() {
  const configure = (server) => {
    server.middlewares.use('/api/balaton', (req, res) => {
      res.status = (code) => { res.statusCode = code; return res }
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
      return balatonHandler(req, res)
    })
  }
  return { name: 'balaton-api', configureServer: configure, configurePreviewServer: configure }
}

export default defineConfig({
  plugins: [react(), balatonApi()],
})
