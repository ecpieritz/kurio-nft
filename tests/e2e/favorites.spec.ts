import { test, expect, loginAs, setMockScenario } from './support/fixtures'

test('rolls back an optimistic favorite after a mutation failure and persists the retry', async ({
  page,
}) => {
  await loginAs(page)
  await page.goto('/nfts/violet-nomad-314')

  const addFavorite = page.getByRole('button', { name: 'Adicionar aos favoritos' })
  await expect(addFavorite).toHaveAttribute('aria-pressed', 'false')

  await setMockScenario(page, 'favorite-mutation-error')
  await addFavorite.click()

  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await expect(
    page.getByRole('alert').filter({ hasText: /estado anterior foi restaurado/i }),
  ).toBeAttached()

  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )

  await setMockScenario(page, 'default')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.reload()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.goto('/favorites')
  await expect(page.getByRole('heading', { name: 'Violet Nomad #314' })).toBeVisible()
})

test('returns an anonymous collector to the NFT after authentication before favoriting', async ({
  page,
}) => {
  await page.goto('/nfts/violet-nomad-314')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()

  await expect(page).toHaveURL(/\/login\?.*redirect=/)

  await page.getByLabel('E-mail').fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/nfts/violet-nomad-314')
  await page.getByRole('button', { name: 'Adicionar aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover dos favoritos' })).toBeVisible()
})
