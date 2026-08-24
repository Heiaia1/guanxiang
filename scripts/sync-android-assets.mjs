import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'desktop')
const destination = path.join(root, 'android', 'app', 'src', 'main', 'assets')
const assets = ['index.html', 'styles.css', 'core.js', 'app.js']

await mkdir(destination, { recursive: true })
await Promise.all(assets.map((name) => copyFile(path.join(source, name), path.join(destination, name))))
console.log(`已同步 ${assets.length} 个 Android 离线资源`)
