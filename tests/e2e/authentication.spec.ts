import {
  test,
  expect,
  logoutFromUi,
} from './support/fixtures'

test(
  'registers a user, creates a persistent session, and logs out with confirmation',
  async (
    {
      page,
    },
    testInfo,
  ) => {
    await page.goto(
      '/sign-up',
    )

    await page
      .getByLabel(
        'Nome de usuário',
      )
      .fill(
        'newcollector',
      )

    await page
      .getByLabel(
        'E-mail',
      )
      .fill(
        'newcollector@kurio.test',
      )

    await page
      .getByLabel(
        'Senha',
        {
          exact: true,
        },
      )
      .fill(
        'KurioNew123!',
      )

    await page
      .getByLabel(
        'Confirmar senha',
      )
      .fill(
        'KurioNew123!',
      )

    await page
      .getByRole(
        'button',
        {
          name:
            'Criar perfil',
        },
      )
      .click()

    await expect(
      page,
    ).toHaveURL('/')

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              localStorage.getItem(
                'kurio:session-token:v1',
              ),
          ),
      )
      .not.toBeNull()

    await page.reload()

    await page.goto(
      '/profile',
    )

    await expect(
      page.getByLabel(
        'Nome de usuário',
      ),
    ).toHaveValue(
      'newcollector',
    )

    await logoutFromUi(
      page,
      testInfo.project.name.includes(
        'mobile',
      ),
    )

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              localStorage.getItem(
                'kurio:session-token:v1',
              ),
          ),
      )
      .toBeNull()
  },
)