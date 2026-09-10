import { test, expect, getMockState, loginAs, setMockScenario } from './support/fixtures'

test('keeps cart quantities across refresh, merges the visitor cart after login, and removes items', async ({
  page,
}) => {
  await page.goto('/nfts/violet-nomad-314')

  await page
    .getByRole('button', {
      name: 'Comprar NFT',
    })
    .click()

  await expect(page).toHaveURL('/cart')

  const cartItems = page.getByRole('region', {
    name: 'Itens do carrinho',
  })

  await page
    .getByRole('button', {
      name: /Aumentar quantidade de Violet Nomad/,
    })
    .click()

  await expect(
    cartItems.getByText('2', {
      exact: true,
    }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole('heading', {
      name: 'Violet Nomad #314',
    }),
  ).toBeVisible()

  await expect(
    page
      .getByRole('region', {
        name: 'Itens do carrinho',
      })
      .getByText('2', {
        exact: true,
      }),
  ).toBeVisible()

  await page.goto('/login?redirect=%2Fcart')

  await page.getByLabel('E-mail').fill('orion@kurio.test')

  await page
    .getByLabel('Senha', {
      exact: true,
    })
    .fill('Collector123!')

  await page
    .getByRole('button', {
      name: 'Entrar',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL('/cart')

  await expect(
    page.getByRole('heading', {
      name: 'Violet Nomad #314',
    }),
  ).toBeVisible()

  await expect(
    page
      .getByRole('region', {
        name: 'Itens do carrinho',
      })
      .getByText('2', {
        exact: true,
      }),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Remover',
    })
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'Seu carrinho está vazio',
    }),
  ).toBeVisible()
})

test('applies, removes, and validates cart coupons', async ({ page }) => {
  await loginAs(page)
  await page.goto('/cart')

  const coupon = page.getByLabel('Cupom de desconto')
  await coupon.fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Cupom KURIO10 aplicado.')).toBeVisible()

  await page.getByRole('button', { name: 'Remover' }).last().click()
  await expect(page.getByText('Cupom KURIO10 aplicado.')).toHaveCount(0)

  await setMockScenario(page, 'invalid-coupon')
  await coupon.fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Código promocional inválido.')).toBeVisible()

  await setMockScenario(page, 'expired-coupon')
  await coupon.fill('EXPIRED20')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Este código promocional expirou.')).toBeVisible()
})

test('completes a purchase from the catalog without duplicating repeated submission', async ({
  page,
}) => {
  await loginAs(page)
  const initialOrderCount = (await getMockState(page)).counts.orders

  await page.goto('/marketplace')
  await page.getByRole('link', { name: 'Emerald Ape #042' }).first().click()
  await page.getByRole('button', { name: 'Comprar NFT' }).click()
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()

  const disconnect = page.getByRole('button', { name: 'Desconectar' })
  await disconnect.click()
  await expect(page.getByText('Carteira desconectada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  await page.getByRole('button', { name: 'Conectar' }).click()

  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeEnabled()
  await confirm.dblclick()

  await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 })
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Ver no explorador' })).toBeVisible()
  await expect
    .poll(async () => (await getMockState(page)).counts.orders)
    .toBe(initialOrderCount + 1)
})

test('preserves the cart when payment is declined', async ({ page }) => {
  await loginAs(page)

  await setMockScenario(page, 'payment-declined')

  await page.goto('/checkout')

  await page
    .getByRole('button', {
      name: 'Confirmar compra',
    })
    .click()

  await expect(page).toHaveURL(/\/orders\//, {
    timeout: 15_000,
  })

  await expect(
    page.getByRole('heading', {
      name: 'Compra não confirmada',
    }),
  ).toBeVisible({
    timeout: 15_000,
  })

  await expect(page.getByText(/recusou a confirmação/i)).toBeVisible()

  await page.goto('/cart')

  await expect(
    page.getByRole('heading', {
      name: 'Emerald Ape #042',
    }),
  ).toBeVisible()
})
