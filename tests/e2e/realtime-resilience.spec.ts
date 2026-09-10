import { test, expect, getMockState, loginAs, setMockScenario } from './support/fixtures'

test('ignores duplicate and stale Socket.IO events after applying the newest NFT version', async ({
  page,
}) => {
  await loginAs(page)
  await page.goto('/cart')
  await page.waitForLoadState('networkidle')

  const cartItems = page.getByRole('region', { name: 'Itens do carrinho' })
  await expect(cartItems.getByText('1.19 ETH')).toBeVisible()

  await setMockScenario(page, 'realtime-stale-duplicate')
  await page.waitForTimeout(500)

  await expect(cartItems.getByText('1.29 ETH')).toBeVisible({ timeout: 15_000 })
  await expect(cartItems.getByText('O preço deste NFT foi atualizado.')).toBeVisible()

  await page.waitForTimeout(1_500)
  await expect(cartItems.getByText('0.01 ETH')).toHaveCount(0)
  await expect(cartItems.getByText('1.29 ETH')).toBeVisible()
})

test('reconnects the Socket.IO client and resumes NFT synchronization', async ({ page }) => {
  await loginAs(page)
  await page.goto('/cart')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByRole('region', { name: 'Itens do carrinho' }).getByText('1.19 ETH'),
  ).toBeVisible()

  await setMockScenario(page, 'realtime-reconnect')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const cartItems = page.getByRole('region', { name: 'Itens do carrinho' })
  await expect(cartItems.getByText('1.29 ETH')).toBeVisible({ timeout: 15_000 })
  await expect(cartItems.getByText('O preço deste NFT foi atualizado.')).toBeVisible()
})

test('blocks checkout when a selected edition becomes unavailable through Socket.IO', async ({
  page,
}) => {
  await loginAs(page)
  await page.goto('/checkout')
  await page.waitForLoadState('networkidle')

  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(confirm).toBeEnabled()

  await setMockScenario(page, 'edition-sold-out')
  await page.waitForTimeout(500)
  await expect(confirm).toBeDisabled({ timeout: 15_000 })

  await page.goto('/cart')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(/Estoque atualizado: 0 unidade/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Continuar para pagamento' })).toHaveCount(0)
})

test('recovers the same pending order after a connection interruption', async ({
  page,
  context,
}) => {
  test.slow()

  await loginAs(page)
  await setMockScenario(page, 'order-timeout')
  await page.goto('/checkout')
  await page.waitForLoadState('networkidle')

  const before = await getMockState(page)
  const initialOrderCount = before.counts.orders

  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect
    .poll(async () => (await getMockState(page)).counts.orders, {
      timeout: 8_000,
    })
    .toBe(initialOrderCount + 1)

  const storedState = await getMockState(page)
  const createdOrder = storedState.orders.at(-1)

  if (!createdOrder) {
    throw new Error('The timeout scenario did not persist the pending order.')
  }

  expect(createdOrder.status).toBe('pending')

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio:pending-order:v1')), {
      timeout: 8_000,
    })
    .not.toBeNull()

  await page.clock.setFixedTime(new Date(Date.parse(createdOrder.createdAt) + 2_000))

  await context.setOffline(true)
  await page.waitForTimeout(500)
  await context.setOffline(false)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1_000)

  await expect(page).toHaveURL(new RegExp(`/orders/${createdOrder.id}$`), {
    timeout: 20_000,
  })
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible({ timeout: 20_000 })

  const recoveredState = await getMockState(page)
  expect(recoveredState.counts.orders).toBe(initialOrderCount + 1)
  expect(
    recoveredState.idempotencyRecords.filter((record) => record.orderId === createdOrder.id),
  ).toHaveLength(1)
})
