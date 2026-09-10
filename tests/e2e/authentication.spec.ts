import { test, expect, loginAs, logoutFromUi, setMockScenario } from './support/fixtures'

test('registers a user, creates a persistent session, and logs out with confirmation', async ({
  page,
}, testInfo) => {
  await page.goto('/sign-up')

  await page.getByLabel('Nome de usuário').fill('newcollector')

  await page.getByLabel('E-mail').fill('newcollector@kurio.test')

  await page
    .getByLabel('Senha', {
      exact: true,
    })
    .fill('KurioNew123!')

  await page.getByLabel('Confirmar senha').fill('KurioNew123!')

  await page
    .getByRole('button', {
      name: 'Criar perfil',
    })
    .click()

  await expect(page).toHaveURL('/')

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio:session-token:v1')))
    .not.toBeNull()

  await page.reload()

  await page.goto('/profile')

  await expect(page.getByLabel('Nome de usuário')).toHaveValue('newcollector')

  await logoutFromUi(page, testInfo.project.name.includes('mobile'))

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio:session-token:v1')))
    .toBeNull()
})

test('expires the session and resumes the protected route after login', async ({ page }) => {
  await loginAs(page)
  await page.goto('/profile')
  await setMockScenario(page, 'session-expired')
  await page.reload()

  await expect(page).toHaveURL(/\/login\?.*reason=session-expired/)
  await expect(page.getByText(/sessão expirou/i)).toBeVisible()

  await setMockScenario(page, 'default')
  await page.getByLabel('E-mail').fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/profile')
})

test('clears private data when switching users', async ({ page }, testInfo) => {
  await loginAs(page, 'nova')
  await logoutFromUi(page, testInfo.project.name.includes('mobile'))

  await loginAs(page, 'orion')
  await page.goto('/favorites')
  await expect(page.getByText('Ivory Baron #088')).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
})

test('reports a registration conflict and still supports fixture login', async ({ page }) => {
  await setMockScenario(page, 'registration-conflict')
  await page.goto('/sign-up')
  await page.getByLabel('Nome de usuário').fill('existingcollector')
  await page.getByLabel('E-mail').fill('existing@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioNew123!')
  await page.getByLabel('Confirmar senha').fill('KurioNew123!')
  await page.getByRole('button', { name: 'Criar perfil' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: /já está em uso|já existe/i }),
  ).toBeVisible()

  await setMockScenario(page, 'default')
  await loginAs(page)
  await page.goto('/profile')
  await expect(page.getByLabel('Nome de usuário')).toHaveValue('nova')
})
