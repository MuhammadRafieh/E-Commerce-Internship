/* Deployment guard: catches the class of bug where the Vercel function and
   the local server drift apart, so a route works locally but 404s in
   production. Also asserts the function can actually be imported, which fails
   when a dependency is missing from api/package.json.

   Run: npm run verify:deploy
*/
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

const mounts = (file) => {
  const src = readFileSync(resolve(root, file), 'utf8')
  const found = new Set()
  for (const m of src.matchAll(/app\.use\(\s*'([^']+)'/g)) found.add(m[1])
  return found
}

const local = mounts('backend/server.js')
const serverless = mounts('api/index.js')

let failed = 0

console.log('route parity (backend/server.js -> api/index.js)')
for (const route of [...local].sort()) {
  if (serverless.has(route)) {
    console.log(`  OK    ${route}`)
  } else {
    failed++
    console.log(`  FAIL  ${route}  not mounted in api/index.js`)
  }
}

for (const route of [...serverless].sort()) {
  if (!local.has(route)) console.log(`  note  ${route}  only in api/index.js`)
}

console.log('\nimport check (api/index.js must resolve every dependency)')
try {
  await import(pathToFileURL(resolve(root, 'api', 'index.js')).href)
  console.log('  OK    api/index.js imported cleanly')
} catch (err) {
  failed++
  console.log(`  FAIL  ${err.code || ''} ${err.message.split('\n')[0]}`)
}

console.log(
  `\n${failed === 0 ? 'deployment surface looks consistent' : `${failed} problem(s) found`}`,
)
process.exit(failed === 0 ? 0 : 1)
