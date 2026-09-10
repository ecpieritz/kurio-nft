import { test, expect, loginAs, setMockScenario } from './support/fixtures'

test('supports keyboard navigation, form errors, and dialog focus', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()

  await page.goto('/sign-up')
  await page.getByRole('button', { name: 'Criar perfil' }).click()
  await expect(page.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert')).toHaveCount(4)

  await loginAs(page)
  if (testInfo.project.name.includes('mobile')) {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sair da conta' }).click()
  } else {
    await page.getByRole('button', { name: /^Olá, .+!$/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }

  const dialog = page.getByRole('dialog', { name: 'Sair da sua conta?' })
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('shows skeletons on slow requests and recovers after an API failure', async ({ page }) => {
  await setMockScenario(page, 'slow-network')
  await page.goto('/marketplace?search=ape')
  await expect(page.getByRole('status', { name: 'Carregando catálogo' })).toBeVisible()
  await expect(page.getByText(/NFTs encontrados/)).toBeVisible({ timeout: 10_000 })

  await setMockScenario(page, 'server-error')
  await page.goto('/marketplace?search=nomad')
  await expect(
    page.getByRole('heading', { name: /não foi possível carregar os NFTs/i }),
  ).toBeVisible()

  await setMockScenario(page, 'default')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText(/NFTs encontrados/)).toBeVisible()
})

test('matches stable visual baselines for home, detail, cart, and checkout', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
    }),
  ).toBeVisible()

  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await expect(page).toHaveScreenshot('home.png', {
    fullPage: true,
  })

  await page.goto('/nfts/emerald-ape-042')

  await expect(
    page.getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()

  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await expect(page).toHaveScreenshot('nft-detail.png', {
    fullPage: true,
  })

  await loginAs(page)

  await page.goto('/cart')

  await expect(
    page.getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()

  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await expect(page).toHaveScreenshot('cart.png', {
    fullPage: true,
  })

  await page.goto('/checkout')

  await expect(
    page.getByRole('button', {
      name: 'Confirmar compra',
    }),
  ).toBeEnabled()

  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await expect(page).toHaveScreenshot('checkout.png', {
    fullPage: true,
  })
})
