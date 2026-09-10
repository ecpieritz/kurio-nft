import {
  test,
  expect,
  loginAs,
} from './support/fixtures'

test(
  'matches stable visual baselines for home, detail, cart, and checkout',
  async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole(
        'heading',
        {
          level: 1,
        },
      ),
    ).toBeVisible()

    await page.evaluate(
      async () => {
        await document.fonts.ready
      },
    )

    await expect(
      page,
    ).toHaveScreenshot(
      'home.png',
      {
        fullPage: true,
      },
    )

    await page.goto(
      '/nfts/emerald-ape-042',
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

    await page.evaluate(
      async () => {
        await document.fonts.ready
      },
    )

    await expect(
      page,
    ).toHaveScreenshot(
      'nft-detail.png',
      {
        fullPage: true,
      },
    )

    await loginAs(
      page,
    )

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

    await page.evaluate(
      async () => {
        await document.fonts.ready
      },
    )

    await expect(
      page,
    ).toHaveScreenshot(
      'cart.png',
      {
        fullPage: true,
      },
    )

    await page.goto(
      '/checkout',
    )

    await expect(
      page.getByRole(
        'button',
        {
          name:
            'Confirmar compra',
        },
      ),
    ).toBeEnabled()

    await page.evaluate(
      async () => {
        await document.fonts.ready
      },
    )

    await expect(
      page,
    ).toHaveScreenshot(
      'checkout.png',
      {
        fullPage: true,
      },
    )
  },
)