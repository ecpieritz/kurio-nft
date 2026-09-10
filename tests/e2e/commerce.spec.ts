import {
  test,
  expect,
  loginAs,
  setMockScenario,
} from './support/fixtures'

test(
  'keeps cart quantities across refresh, merges the visitor cart after login, and removes items',
  async ({
    page,
  }) => {
    await page.goto(
      '/nfts/violet-nomad-314',
    )

    await page
      .getByRole(
        'button',
        {
          name:
            'Comprar NFT',
        },
      )
      .click()

    await expect(
      page,
    ).toHaveURL(
      '/cart',
    )

    const cartItems =
      page.getByRole(
        'region',
        {
          name:
            'Itens do carrinho',
        },
      )

    await page
      .getByRole(
        'button',
        {
          name:
            /Aumentar quantidade de Violet Nomad/,
        },
      )
      .click()

    await expect(
      cartItems.getByText(
        '2',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await page.reload()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Violet Nomad #314',
        },
      ),
    ).toBeVisible()

    await expect(
      page
        .getByRole(
          'region',
          {
            name:
              'Itens do carrinho',
          },
        )
        .getByText(
          '2',
          {
            exact: true,
          },
        ),
    ).toBeVisible()

    await page.goto(
      '/login?redirect=%2Fcart',
    )

    await page
      .getByLabel(
        'E-mail',
      )
      .fill(
        'orion@kurio.test',
      )

    await page
      .getByLabel(
        'Senha',
        {
          exact: true,
        },
      )
      .fill(
        'Collector123!',
      )

    await page
      .getByRole(
        'button',
        {
          name: 'Entrar',
          exact: true,
        },
      )
      .click()

    await expect(
      page,
    ).toHaveURL(
      '/cart',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Violet Nomad #314',
        },
      ),
    ).toBeVisible()

    await expect(
      page
        .getByRole(
          'region',
          {
            name:
              'Itens do carrinho',
          },
        )
        .getByText(
          '2',
          {
            exact: true,
          },
        ),
    ).toBeVisible()

    await page
      .getByRole(
        'button',
        {
          name: 'Remover',
        },
      )
      .click()

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Seu carrinho está vazio',
        },
      ),
    ).toBeVisible()
  },
)

test(
  'preserves the cart when payment is declined',
  async ({
    page,
  }) => {
    await loginAs(
      page,
    )

    await setMockScenario(
      page,
      'payment-declined',
    )

    await page.goto(
      '/checkout',
    )

    await page
      .getByRole(
        'button',
        {
          name:
            'Confirmar compra',
        },
      )
      .click()

    await expect(
      page,
    ).toHaveURL(
      /\/orders\//,
      {
        timeout:
          15_000,
      },
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Compra não confirmada',
        },
      ),
    ).toBeVisible({
      timeout:
        15_000,
    })

    await expect(
      page.getByText(
        /recusou a confirmação/i,
      ),
    ).toBeVisible()

    await page.goto(
      '/cart',
    )

    await expect(
      page.getByRole(
        'heading',
        {
          name:
            'Emerald Ape #042',
        },
      ),
    ).toBeVisible()
  },
)