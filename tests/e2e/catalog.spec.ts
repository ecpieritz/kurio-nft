import { test, expect, setMockScenario } from './support/fixtures'

test('search, combined filters, sorting, pagination, and history restore URL state', async ({
  page,
}, testInfo) => {
  await page.goto('/marketplace')

  const mobile = testInfo.project.name.includes('mobile')

  await page.getByRole('search').getByLabel('Buscar NFTs').fill('ape')

  await expect(page).toHaveURL(/search=ape/)

  if (mobile) {
    await page
      .getByRole('button', {
        name: /^Filtros/,
      })
      .click()
  }

  const prefix = mobile ? 'mobile' : 'desktop'

  await page.locator(`#${prefix}-category-digital-art`).check()

  await page.locator(`#${prefix}-network-ethereum`).check()

  const sort = page.locator(`#${mobile ? 'mobile' : 'desktop'}-catalog-sort`)

  await sort.selectOption('price-asc')

  await expect
    .poll(() => new URL(page.url()).searchParams.get('categories'))
    .toContain('digital-art')

  await expect.poll(() => new URL(page.url()).searchParams.get('networks')).toContain('ethereum')

  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('price-asc')

  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBeNull()

  await page
    .getByRole('button', {
      name: 'Limpar',
    })
    .click()

  await page.getByRole('search').getByLabel('Buscar NFTs').fill('')

  await expect(
    page.getByRole('button', {
      name: 'Página 2',
    }),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Página 2',
    })
    .click()

  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2')

  await page.goBack()

  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBeNull()

  await page.goForward()

  await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2')
})

test('handles empty, out-of-order, and retryable catalog responses', async ({ page }) => {
  await setMockScenario(page, 'empty-catalog')
  await page.goto('/marketplace')
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()

  await setMockScenario(page, 'out-of-order')
  await page.goto('/marketplace')
  const search = page.getByRole('search').getByLabel('Buscar NFTs')
  await search.fill('ape')
  await search.fill('nomad')
  await expect(page.getByText('Violet Nomad #314')).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)

  await setMockScenario(page, 'server-error')
  await page.goto('/marketplace?search=error')
  await expect(
    page.getByRole('heading', { name: /não foi possível carregar os NFTs/i }),
  ).toBeVisible()

  await setMockScenario(page, 'default')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText(/NFTs encontrados/)).toBeVisible()
})

test('supports direct NFT access and a not-found state', async ({ page }) => {
  await page.goto('/nfts/emerald-ape-042')

  await expect(
    page.getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()

  await expect(page.getByText('ID do token:')).toBeVisible()

  await page.goto('/nfts/nft-that-does-not-exist')

  await expect(
    page.getByRole('heading', {
      name: 'NFT não encontrado',
    }),
  ).toBeVisible()
})

test('keeps home catalog views, sorting, and pagination on the home route', async ({
  page,
}, testInfo) => {
  await page.goto('/')

  const views = page.getByRole('group', {
    name: 'Visões do catálogo na página inicial',
  })

  await views
    .getByRole('button', {
      name: 'Novos lançamentos',
    })
    .click()

  await expect(
    views.getByRole('button', {
      name: 'Novos lançamentos',
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await expect(page).toHaveURL('/')

  await views
    .getByRole('button', {
      name: 'Em alta',
    })
    .click()

  await expect(
    views.getByRole('button', {
      name: 'Em alta',
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await expect(page).toHaveURL('/')

  if (!testInfo.project.name.includes('mobile')) {
    await page.locator('#home-catalog-sort').selectOption('price-asc')

    await expect(page.locator('#home-catalog-sort')).toHaveValue('price-asc')

    await expect(page).toHaveURL('/')
  }

  const pageTwo = page.getByRole('button', {
    name: 'Página 2',
  })

  await expect(pageTwo).toBeVisible()

  await pageTwo.click()

  await expect(pageTwo).toHaveAttribute('aria-current', 'page')

  await expect(page).toHaveURL('/')
})
