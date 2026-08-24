import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const miniRoot = path.join(root, 'miniprogram')
const desktopRoot = path.join(root, 'desktop')

const dataNames = [
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

const serviceNames = [
  ['assessment', 'assessment-engine'],
  ['analysis', 'analysis-engine'],
  ['hexagrams', 'hexagram-engine'],
  ['wisdom', 'wisdom-service']
]

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(miniRoot, 'data', `${name}.json`), 'utf8'))
}

function transpileService(name) {
  const source = fs.readFileSync(path.join(miniRoot, 'services', `${name}.ts`), 'utf8')
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      removeComments: false
    },
    fileName: `${name}.ts`,
    reportDiagnostics: true
  }).outputText.trim()
}

const data = Object.fromEntries(dataNames.map((name) => [name, readJson(name)]))
const parts = [
  '// 此文件由 scripts/generate-desktop-core.mjs 自动生成，请勿手工编辑。',
  '(function bootstrapGuanxiangCore(global) {',
  '  "use strict";',
  `  const data = ${JSON.stringify(data)};`,
  '  function loadService(name, factory) {',
  '    const module = { exports: {} };',
  '    const exports = module.exports;',
  '    const require = (request) => {',
  '      const match = request.match(/\\.\\.\\/data\\/(.+?)(?:-data)?$/);',
  '      if (match && Object.prototype.hasOwnProperty.call(data, match[1])) return data[match[1]];',
  '      throw new Error(`桌面核心 ${name} 无法解析依赖：${request}`);',
  '    };',
  '    factory(require, module, exports);',
  '    return module.exports;',
  '  }'
]

for (const [exportName, serviceName] of serviceNames) {
  const code = transpileService(serviceName)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
  parts.push(`  const ${exportName} = loadService(${JSON.stringify(serviceName)}, function (require, module, exports) {`)
  parts.push(code)
  parts.push('  });')
}

parts.push(
  '  global.GX_CORE = Object.freeze({',
  '    assessment,',
  '    analysis,',
  '    hexagrams,',
  '    wisdom,',
  '    domains: data["domain-rules"],',
  '    legalDocuments: data["legal-documents"],',
  '    version: "1.0.0"',
  '  });',
  '})(window);',
  ''
)

fs.mkdirSync(desktopRoot, { recursive: true })
fs.writeFileSync(path.join(desktopRoot, 'core.js'), parts.join('\n'), 'utf8')
console.log(`已生成桌面共享核心：${dataNames.length} 份数据、${serviceNames.length} 个服务。`)
