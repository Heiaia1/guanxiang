import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataRoot = path.join(root, 'miniprogram', 'data')
const sources = [
  'action-templates',
  'domain-rules',
  'hexagrams',
  'legal-documents',
  'questions',
  'safety-words',
  'scenario-rules',
  'trigrams',
  'wisdom-notes'
]

for (const name of sources) {
  const sourcePath = path.join(dataRoot, `${name}.json`)
  const outputPath = path.join(dataRoot, `${name}-data.js`)
  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  const output = [
    '// 此文件由 scripts/generate-data-modules.mjs 根据同名 JSON 自动生成。',
    '// 微信小程序运行时不能直接 require JSON，因此以 CommonJS 模块提供离线数据。',
    `module.exports = ${JSON.stringify(data, null, 2)}`,
    ''
  ].join('\n')
  fs.writeFileSync(outputPath, output, 'utf8')

  for (const obsoleteName of [`${name}.data.ts`, `${name}-data.ts`]) {
    const obsoletePath = path.join(dataRoot, obsoleteName)
    if (fs.existsSync(obsoletePath)) fs.unlinkSync(obsoletePath)
  }
}

console.log(`已生成 ${sources.length} 个微信运行时数据模块。`)
