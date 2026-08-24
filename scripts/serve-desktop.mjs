import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'desktop')
const port = Number(process.env.GX_DESKTOP_PORT || 41731)
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
}

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname)
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const file = path.resolve(root, relative)
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }
  try {
    const content = fs.readFileSync(file)
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })
    response.end(content)
  } catch (_error) {
    response.writeHead(404).end('Not Found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`观象录桌面版本地预览：http://127.0.0.1:${port}`)
})
