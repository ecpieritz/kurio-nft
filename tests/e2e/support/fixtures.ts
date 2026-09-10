import { expect, test as base, type Page } from '@playwright/test'

export type MockScenario =
  | 'default'
  | 'empty-catalog'
  | 'slow-network'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'session-expired'
  | 'registration-conflict'
  | 'price-changed'
  | 'edition-sold-out'
  | 'invalid-coupon'
  | 'expired-coupon'
  | 'favorite-mutation-error'
  | 'realtime-stale-duplicate'
  | 'realtime-reconnect'
  | 'order-timeout'
  | 'payment-confirmed'
  | 'payment-declined'

export interface MockStateSummary {
  schemaVersion: number

  revision: number

  counts: {
    users: number
    nfts: number
    carts: number
    orders: number
  }

  orders: Array<{
    id: string
    userId: string

    status: 'pending' | 'confirmed' | 'declined'

    createdAt: string
  }>

  idempotencyRecords: Array<{
    key: string
    userId: string
    orderId: string
  }>
}

export async function setMockScenario(page: Page, scenarioId: MockScenario): Promise<void> {
  const result = await page.evaluate(async (id) => {
    const response = await fetch('/api/__mock/scenario', {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        scenarioId: id,
      }),
    })

    return {
      ok: response.ok,

      body: await response.text(),
    }
  }, scenarioId)

  expect(result.ok, result.body).toBe(true)
}

export async function getMockState(page: Page): Promise<MockStateSummary> {
  return page.evaluate(async () => {
    const response = await fetch('/api/__mock/state')

    if (!response.ok) {
      throw new Error(await response.text())
    }

    return (await response.json()) as MockStateSummary
  })
}

export async function loginAs(page: Page, user: 'nova' | 'orion' = 'nova'): Promise<void> {
  const credentials =
    user === 'nova'
      ? {
          email: 'nova@kurio.test',

          password: 'Kurio123!',
        }
      : {
          email: 'orion@kurio.test',

          password: 'Collector123!',
        }

  await page.goto('/login')

  await page.getByLabel('E-mail').fill(credentials.email)

  await page
    .getByLabel('Senha', {
      exact: true,
    })
    .fill(credentials.password)

  await page
    .getByRole('button', {
      name: 'Entrar',
      exact: true,
    })
    .click()

  await expect(page).toHaveURL('/')
}

export async function logoutFromUi(page: Page, mobile: boolean): Promise<void> {
  if (mobile) {
    await page.goto('/profile')

    await page
      .getByRole('button', {
        name: 'Sair da conta',
      })
      .click()
  } else {
    await page
      .getByRole('button', {
        name: /^Olá, .+!$/,
      })
      .click()

    await page
      .getByRole('menuitem', {
        name: 'Sair',
      })
      .click()
  }

  const dialog = page.getByRole('dialog', {
    name: 'Sair da sua conta?',
  })

  await expect(dialog).toBeVisible()

  await dialog
    .getByRole('button', {
      name: 'Sim, sair',
    })
    .click()

  await expect(page).toHaveURL('/')
}

interface KurioFixtures {
  resetMocks: void
}

export const test = base.extend<KurioFixtures>({
  resetMocks: [
    async ({ page }, use) => {
      await page.goto('/')

      await expect(page.locator('#main-content')).toBeVisible()

      const reset = await page.evaluate(async () => {
        const response = await fetch('/api/__mock/reset', {
          method: 'POST',
        })

        return {
          ok: response.ok,

          body: await response.text(),
        }
      })

      expect(reset.ok, reset.body).toBe(true)

      await page.evaluate(() => {
        localStorage.removeItem('kurio:session-token:v1')

        localStorage.removeItem('kurio:visitor-id:v1')

        localStorage.removeItem('kurio:pending-order:v1')

        localStorage.removeItem('kurio:msw:scenario:v1')
      })

      await page.reload()

      await expect(page.locator('#main-content')).toBeVisible()

      await use()
    },

    {
      auto: true,
    },
  ],
})

export { expect }
