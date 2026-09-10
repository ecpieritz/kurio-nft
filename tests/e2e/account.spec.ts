import { test, expect, loginAs, logoutFromUi } from './support/fixtures'

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nYQAAAAASUVORK5CYII=',
  'base64',
)

test.beforeEach(async ({ page }) => {
  await loginAs(page)
})

test('validates and persists profile data and avatar changes', async ({ page }) => {
  await page.goto('/profile')

  const displayName = page.getByLabel('Nome de exibição')
  await displayName.fill('N')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText(/pelo menos 2 caracteres/i)).toBeVisible()

  await displayName.fill('Nova Kurio Updated')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible()

  const avatar = page.locator('input[type="file"]')
  await avatar.setInputFiles({
    name: 'avatar.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not-an-image'),
  })
  await expect(page.getByText('Use uma imagem PNG, JPEG ou WebP.')).toBeVisible()

  await avatar.setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  })
  await expect(page.getByText('Avatar atualizado com sucesso.')).toBeVisible()
  await expect(page.getByAltText('Avatar de Nova Kurio Updated')).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )

  await page.reload()
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Nova Kurio Updated')
  await expect(page.getByAltText('Avatar de Nova Kurio Updated')).toHaveAttribute(
    'src',
    /^data:image\/png;base64,/,
  )
})

test('validates the current password, changes it, and accepts the new password after logout', async ({
  page,
}, testInfo) => {
  await page.goto('/profile')
  await page.getByLabel('Senha atual').fill('wrong-password')
  await page.getByLabel('Nova senha').fill('KurioChanged123!')
  await page.getByLabel('Confirmar nova senha').fill('KurioChanged123!')
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(page.getByRole('alert').filter({ hasText: /senha atual/i })).toBeVisible()

  await page.getByLabel('Senha atual').fill('Kurio123!')
  await page.getByRole('button', { name: 'Salvar senha' }).click()
  await expect(page.getByText('Senha alterada com sucesso.')).toBeVisible()

  await logoutFromUi(page, testInfo.project.name.includes('mobile'))

  await page.goto('/login')
  await page.getByLabel('E-mail').fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('KurioChanged123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL('/')
})

test('validates, creates, edits, and persists collector wallets', async ({ page }) => {
  await page.goto('/wallets')
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click()

  await page.getByLabel('Nome de exibição').fill('Carteira de teste')
  await page.getByLabel('Apelido da carteira').fill('Secundária')
  await page.getByLabel('Nome do perfil').fill('tester.eth')
  await page.getByLabel('Endereço da carteira').fill('inválido')
  await page.getByLabel('E-mail').fill('wallet@kurio.test')
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await expect(page.getByRole('alert')).toContainText(/endereço de carteira válido/i)

  await page
    .getByLabel('Endereço da carteira')
    .fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: 'Adicionar carteira' }).click()
  await expect(page.getByText('Secundária').first()).toBeVisible()

  await page.getByRole('button', { name: /Secundária/ }).first().click()
  await page.getByLabel('Apelido da carteira').fill('Secundária editada')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Secundária editada').first()).toBeVisible()

  await page.reload()
  await expect(page.getByText('Secundária editada').first()).toBeVisible()
})
