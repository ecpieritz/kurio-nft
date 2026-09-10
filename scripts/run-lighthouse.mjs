import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'

import { lighthouseAuditConfig as config } from './lighthouse.config.mjs'

const projectRoot = resolve(import.meta.dirname, '..')

const outputRoot = resolve(projectRoot, 'lighthouse-results')

const baseUrl = process.env.LIGHTHOUSE_BASE_URL?.trim() || 'http://127.0.0.1:4173'

const enforceThresholds = process.env.LIGHTHOUSE_ENFORCE_THRESHOLDS === 'true'

const shouldStartPreview = /^https?:\/\/(?:127\.0\.0\.1|localhost):4173\/?$/u.test(baseUrl)

function executable(name) {
  if (process.platform === 'win32') {
    return `${name}.cmd`
  }

  return name
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: projectRoot,

      stdio: 'inherit',

      ...options,
    })

    child.once('error', rejectPromise)

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(
        new Error(
          `${command} exited with ${signal ? `signal ${signal}` : `code ${String(code)}`}.`,
        ),
      )
    })
  })
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
      })

      if (response.status < 500) {
        return
      }
    } catch {
      // Preview is still starting.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }

  throw new Error(`Preview did not become available at ${url} within ${timeoutMs}ms.`)
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)

  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function formatNumber(value, digits = 2) {
  return Number(value.toFixed(digits))
}

function scenarioUrl(pathname) {
  const url = new URL(pathname, baseUrl)

  url.searchParams.set('mockScenario', config.scenario)

  return url.toString()
}

async function readAudit(reportPath) {
  const report = JSON.parse(await readFile(reportPath, 'utf8'))

  return {
    performance: Math.round(report.categories.performance.score * 100),

    accessibility: Math.round(report.categories.accessibility.score * 100),

    'best-practices': Math.round(report.categories['best-practices'].score * 100),

    seo: Math.round(report.categories.seo.score * 100),

    lcpSeconds: report.audits['largest-contentful-paint'].numericValue / 1000,

    cls: report.audits['cumulative-layout-shift'].numericValue,

    tbtMs: report.audits['total-blocking-time'].numericValue,
  }
}

async function auditRoute(route, profile, runNumber) {
  const outputDirectory = join(outputRoot, route.id, profile.id)

  await mkdir(outputDirectory, {
    recursive: true,
  })

  const outputBase = join(outputDirectory, `run-${runNumber}`)

  const args = [
    '--yes',

    `lighthouse@${config.lighthouseVersion}`,

    scenarioUrl(route.path),

    '--quiet',

    '--output=html',

    '--output=json',

    `--output-path=${outputBase}`,

    `--only-categories=${config.categories.join(',')}`,

    '--locale=pt-BR',

    '--max-wait-for-load=45000',

    `--chrome-flags=${config.chromeFlags.join(' ')}`,
  ]

  if (profile.preset) {
    args.push(`--preset=${profile.preset}`)
  }

  console.log(
    `\n[Lighthouse] ${route.label} · ${profile.id} · execução ${runNumber}/${config.runs}`,
  )

  await run(executable('npx'), args)

  return readAudit(`${outputBase}.report.json`)
}

function buildSummaryMarkdown(summary) {
  const lines = [
    '# Lighthouse — resumo das medianas',

    '',

    `- Lighthouse: ${config.lighthouseVersion}`,

    `- URL base: ${baseUrl}`,

    `- Cenário MSW: ${config.scenario}`,

    `- Execuções por página/perfil: ${config.runs}`,

    `- Categorias: ${config.categories.join(', ')}`,

    `- Chrome flags: ${config.chromeFlags.join(' ')}`,

    '',

    '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Resultado |',

    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ]

  for (const result of summary.results) {
    const passed = config.categories.every(
      (category) => result.median[category] >= config.thresholds[category],
    )

    lines.push(
      `| ${result.label} | ${result.profile} | ${result.median.performance} | ${result.median.accessibility} | ${result.median['best-practices']} | ${result.median.seo} | ${result.median.lcpSeconds}s | ${result.median.cls} | ${result.median.tbtMs}ms | ${
        passed ? 'PASS' : 'ABAIXO DA META'
      } |`,
    )
  }

  lines.push(
    '',

    '## Metas',

    '',

    `- Performance: >= ${config.thresholds.performance}`,

    `- Accessibility: >= ${config.thresholds.accessibility}`,

    `- Best Practices: >= ${config.thresholds['best-practices']}`,

    `- SEO: >= ${config.thresholds.seo}`,

    '',

    'Os arquivos `.report.html` e `.report.json` de cada execução ficam nas subpastas desta pasta.',

    '',
  )

  return `${lines.join('\n')}\n`
}

async function main() {
  await rm(outputRoot, {
    recursive: true,

    force: true,
  })

  await mkdir(outputRoot, {
    recursive: true,
  })

  let previewProcess = null

  try {
    if (shouldStartPreview) {
      console.log(`[Lighthouse] Iniciando preview em ${baseUrl}`)

      previewProcess = spawn(
        executable('npm'),

        ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],

        {
          cwd: projectRoot,

          stdio: 'inherit',
        },
      )

      await waitForServer(baseUrl)
    }

    const results = []

    for (const route of config.routes) {
      for (const profile of config.profiles) {
        const runs = []

        for (let runNumber = 1; runNumber <= config.runs; runNumber += 1) {
          runs.push(await auditRoute(route, profile, runNumber))
        }

        results.push({
          route: route.id,

          label: route.label,

          profile: profile.id,

          runs,

          median: {
            performance: median(runs.map((run) => run.performance)),

            accessibility: median(runs.map((run) => run.accessibility)),

            'best-practices': median(runs.map((run) => run['best-practices'])),

            seo: median(runs.map((run) => run.seo)),

            lcpSeconds: formatNumber(median(runs.map((run) => run.lcpSeconds)), 3),

            cls: formatNumber(median(runs.map((run) => run.cls)), 4),

            tbtMs: formatNumber(median(runs.map((run) => run.tbtMs)), 0),
          },
        })
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),

      environment: {
        baseUrl,

        node: process.version,

        platform: `${process.platform}-${process.arch}`,

        lighthouse: config.lighthouseVersion,

        scenario: config.scenario,

        runsPerPageAndProfile: config.runs,
      },

      thresholds: config.thresholds,

      results,
    }

    await writeFile(
      join(outputRoot, 'summary.json'),

      `${JSON.stringify(summary, null, 2)}\n`,
    )

    await writeFile(
      join(outputRoot, 'summary.md'),

      buildSummaryMarkdown(summary),
    )

    const belowTarget = results.filter((result) =>
      config.categories.some((category) => result.median[category] < config.thresholds[category]),
    )

    console.log(`\n[Lighthouse] Relatórios: ${outputRoot}`)

    if (belowTarget.length > 0) {
      console.warn(
        `[Lighthouse] ${belowTarget.length} combinação(ões) ficaram abaixo de ao menos uma meta. Consulte lighthouse-results/summary.md.`,
      )

      if (enforceThresholds) {
        process.exitCode = 1
      }
    }
  } finally {
    if (previewProcess && !previewProcess.killed) {
      previewProcess.kill()
    }
  }
}

await main()
