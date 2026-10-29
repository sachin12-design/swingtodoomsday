import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'

// Dev-only: lets the browser save generated assets (sprite-sheet
// slices, cleaned sheets) straight into public/characters.
//   POST /__save?name=gwen.sheet.json   body: JSON text
//   POST /__save?name=gwen-clean.png    body: data URL or raw base64
// Never part of the production build.
function devSave() {
  return {
    name: 'spidy-dev-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('POST only')
        }
        const name = basename(new URL(req.url || '', 'http://x').searchParams.get('name') || '')
        if (!/^[\w.-]+\.(json|png|webp)$/.test(name)) {
          res.statusCode = 400
          return res.end('bad name')
        }
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          const dir = resolve(server.config.root, 'public/characters')
          mkdirSync(dir, { recursive: true })
          let body = Buffer.concat(chunks)
          if (name.endsWith('.png') || name.endsWith('.webp')) {
            const s = body.toString()
            const i = s.indexOf('base64,')
            body = Buffer.from(i >= 0 ? s.slice(i + 7) : s, 'base64')
          }
          writeFileSync(resolve(dir, name), body)
          res.end(`saved ${name} (${body.length} bytes)`)
        })
      })
    },
  }
}

export default defineConfig({
  server: { port: 5173 },
  plugins: [react(), devSave()],
})
