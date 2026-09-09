import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
} from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { useAuth } from '@/features/auth/session/use-auth'
import { useCartQuery } from '@/features/cart/cart-query'
import {
  buildQuoteRequest,
  hasQuoteChanged,
} from '@/features/checkout/checkout-quote'
import { useCreateOrderMutation } from '@/features/orders/orders-query'
import { createQuote } from '@/features/quote/quote-api'
import { useWalletsQuery } from '@/features/wallets/wallets-query'
import type {
  Cart,
  CollectorCheckoutDetails,
  CollectorWallet,
  QuoteResponse,
  SessionUser,
  WalletCollection,
  WalletProvider,
} from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'
import { cn } from '@/lib/utils'

const providerLabels: Record<
  WalletProvider,
  string
> = {
  metamask: 'MetaMask',
  walletconnect:
    'WalletConnect',
  coinbase:
    'Coinbase Wallet',
}

function createIdempotencyKey(): string {
  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return `checkout-${crypto.randomUUID()}`
  }

  return `checkout-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function getQuoteErrorMessage(
  error: Error | null,
): string | null {
  if (!error) {
    return null
  }

  if (
    error instanceof
      ApiClientError &&
    error.code ===
      'AVAILABILITY_CONFLICT'
  ) {
    return 'O preço ou a disponibilidade de um NFT mudou. Revise o carrinho antes de continuar.'
  }

  if (
    error instanceof
      ApiClientError &&
    error.code ===
      'CONFLICT'
  ) {
    return 'O carrinho mudou enquanto a cotação era criada. Atualize os valores e revise os itens.'
  }

  return 'Não foi possível atualizar a cotação. Tente novamente.'
}

function getOrderErrorMessage(
  error: Error | null,
): string | null {
  if (!error) {
    return null
  }

  if (
    error instanceof
    ApiClientError
  ) {
    if (
      error.code ===
        'AVAILABILITY_CONFLICT' ||
      error.code ===
        'CONFLICT'
    ) {
      return 'A compra não foi confirmada porque os valores ou a disponibilidade mudaram. Revise a nova cotação.'
    }

    if (
      error.code ===
        'TIMEOUT' ||
      error.code ===
        'NETWORK_ERROR'
    ) {
      return 'Não foi possível confirmar a resposta da compra. Tente novamente; a mesma operação será reutilizada com segurança.'
    }
  }

  return 'Não foi possível confirmar a compra. Tente novamente.'
}

function validateCollector(
  collector: CollectorCheckoutDetails,
): string | null {
  if (
    !collector.displayName.trim() ||
    !collector.username.trim() ||
    !collector.email.trim() ||
    !collector.profileName.trim()
  ) {
    return 'Preencha os dados obrigatórios do colecionador.'
  }

  if (
    !collector.email.includes(
      '@',
    )
  ) {
    return 'Informe um e-mail válido.'
  }

  return null
}

interface CheckoutContentProps {
  cart: Cart
  wallets: WalletCollection
  user: SessionUser
}

function CheckoutContent({
  cart,
  wallets,
  user,
}: CheckoutContentProps) {
  const navigate =
    useNavigate()

  const createOrderMutation =
    useCreateOrderMutation()

  const primaryWallet =
    wallets.items.find(
      (
        wallet,
      ) =>
        wallet.primary,
    ) ??
    wallets.items[0] ??
    null

  const [
    selectedWalletId,
    setSelectedWalletId,
  ] =
    useState<
      string | null
    >(
      primaryWallet?.id ??
        null,
    )

  const selectedWallet =
    wallets.items.find(
      (
        wallet,
      ) =>
        wallet.id ===
        selectedWalletId,
    ) ??
    primaryWallet

  const [
    collector,
    setCollector,
  ] =
    useState<CollectorCheckoutDetails>(
      () => ({
        displayName:
          user.displayName,

        username:
          user.username,

        email:
          user.email,

        profileName:
          primaryWallet
            ?.profileName ??
          '',

        ensName:
          primaryWallet
            ?.ensName ??
          '',

        note: '',
      }),
    )

  const [
    couponInput,
    setCouponInput,
  ] =
    useState('')

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] =
    useState<
      string | undefined
    >(undefined)

  const [
    quote,
    setQuote,
  ] =
    useState<
      QuoteResponse | null
    >(null)

  const [
    quoteLoading,
    setQuoteLoading,
  ] =
    useState(false)

  const [
    quoteError,
    setQuoteError,
  ] =
    useState<
      Error | null
    >(null)

  const [
    reviewNotice,
    setReviewNotice,
  ] =
    useState<
      string | null
    >(null)

  const [
    formError,
    setFormError,
  ] =
    useState<
      string | null
    >(null)

  const [
    quoteRefreshNonce,
    setQuoteRefreshNonce,
  ] =
    useState(0)

  const idempotencyKeyRef =
    useRef<
      string | null
    >(null)

  const quoteSignature =
    selectedWallet
      ? JSON.stringify({
          cartVersion:
            cart.version,

          items:
            cart.items.map(
              (
                item,
              ) => ({
                id:
                  item.id,

                quantity:
                  item.quantity,

                unitPriceEth:
                  item.unitPriceEth,

                availableQuantity:
                  item.availableQuantity,

                priceChanged:
                  item.priceChanged,

                availabilityChanged:
                  item.availabilityChanged,
              }),
            ),

          walletId:
            selectedWallet.id,

          network:
            selectedWallet.network,

          coupon:
            appliedCoupon ??
            '',

          refresh:
            quoteRefreshNonce,
        })
      : null

  useEffect(() => {
  if (
    !selectedWallet ||
    cart.items.length === 0 ||
    !quoteSignature
  ) {
    return
  }

  let active = true

  void buildQuoteRequest(
    cart,
    selectedWallet,
    appliedCoupon,
  )
    .then((request) => {
      if (!active) {
        return null
      }

      setQuoteLoading(true)
      setQuoteError(null)

      return createQuote(request)
    })
    .then((nextQuote) => {
      if (
        !active ||
        !nextQuote
      ) {
        return
      }

      setQuote(nextQuote)
      setReviewNotice(null)
    })
    .catch((error: unknown) => {
      if (!active) {
        return
      }

      setQuoteError(
        error instanceof Error
          ? error
          : new Error(
              'Quote request failed.',
            ),
      )

      setQuote(null)
    })
    .finally(() => {
      if (active) {
        setQuoteLoading(false)
      }
    })

  return () => {
    active = false
  }
}, [
  appliedCoupon,
  cart,
  quoteSignature,
  selectedWallet,
])

  function handleWalletSelection(
    wallet: CollectorWallet,
  ): void {
    setSelectedWalletId(
      wallet.id,
    )

    setCollector(
      (
        current,
      ) => ({
        ...current,

        profileName:
          wallet.profileName,

        ensName:
          wallet.ensName ??
          '',
      }),
    )

    setReviewNotice(
      null,
    )

    setFormError(
      null,
    )

    idempotencyKeyRef.current =
      null
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    if (!selectedWallet) {
      setFormError(
        'Selecione uma carteira antes de confirmar a compra.',
      )

      return
    }

    const collectorError =
      validateCollector(
        collector,
      )

    if (collectorError) {
      setFormError(
        collectorError,
      )

      return
    }

    setFormError(
      null,
    )

    setQuoteError(
      null,
    )

    setReviewNotice(
      null,
    )

    createOrderMutation.reset()

    let freshQuote:
      QuoteResponse

    try {
      const freshRequest =
        await buildQuoteRequest(
          cart,
          selectedWallet,
          appliedCoupon,
        )

      freshQuote =
        await createQuote(
          freshRequest,
        )
    } catch (
      error: unknown
    ) {
      setQuoteError(
        error instanceof
          Error
          ? error
          : new Error(
              'Quote revalidation failed.',
            ),
      )

      return
    }

    if (!quote) {
      setQuote(
        freshQuote,
      )

      setReviewNotice(
        'A cotação foi atualizada. Revise os valores antes de confirmar a compra.',
      )

      return
    }

    if (
      hasQuoteChanged(
        quote,
        freshQuote,
      )
    ) {
      setQuote(
        freshQuote,
      )

      setReviewNotice(
        'Os preços, o desconto ou a disponibilidade mudaram. Revise a nova cotação antes de confirmar.',
      )

      idempotencyKeyRef.current =
        null

      return
    }

    const idempotencyKey =
      idempotencyKeyRef.current ??
      createIdempotencyKey()

    idempotencyKeyRef.current =
      idempotencyKey

    try {
      const order =
        await createOrderMutation.mutateAsync(
          {
            idempotencyKey,

            request: {
              quoteId:
                freshQuote.id,

              walletId:
                selectedWallet.id,

              network:
                selectedWallet.network,

              collector: {
                displayName:
                  collector.displayName.trim(),

                username:
                  collector.username.trim(),

                email:
                  collector.email.trim(),

                profileName:
                  collector.profileName.trim(),

                ensName:
                  collector.ensName.trim(),

                note:
                  collector.note
                    ?.trim() ||
                  undefined,
              },
            },
          },
        )

      idempotencyKeyRef.current =
        null

      await navigate({
        to: '/orders/$orderId',

        params: {
          orderId:
            order.id,
        },
      })
    } catch (
      error: unknown
    ) {
      if (
        !(
          error instanceof
          ApiClientError
        ) ||
        (
          error.code !==
            'TIMEOUT' &&
          error.code !==
            'NETWORK_ERROR'
        )
      ) {
        idempotencyKeyRef.current =
          null
      }
    }
  }

  function handleFormSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    void handleSubmit(
      event,
    )
  }

  const quoteErrorMessage =
    getQuoteErrorMessage(
      quoteError,
    )

  const orderErrorMessage =
    getOrderErrorMessage(
      createOrderMutation.error,
    )

  const hasAvailabilityConflict =
    cart.items.some(
      (
        item,
      ) =>
        item.availabilityChanged ||
        item.quantity >
          item.availableQuantity,
    )

  return (
    <form
      onSubmit={
        handleFormSubmit
      }
    >
      <nav
        aria-label="Breadcrumb"
        className="mb-6 hidden text-sm md:block"
      >
        <Link
          to="/"
          className="hover:text-primary"
        >
          Início
        </Link>

        <span aria-hidden="true">
          {' / '}
        </span>

        <Link
          to="/marketplace"
          className="hover:text-primary"
        >
          Mercado
        </Link>

        <span aria-hidden="true">
          {' / '}
        </span>

        <span className="text-muted-foreground">
          Pagamento
        </span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <section>
          <Typography
            as="h1"
            variant="heading"
          >
            Perfil do colecionador
          </Typography>

          <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>
                Nome de exibição
                <span className="text-primary">
                  *
                </span>
              </span>

              <Input
                required
                value={
                  collector.displayName
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      displayName:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>
                Nome de usuário
                <span className="text-primary">
                  *
                </span>
              </span>

              <Input
                required
                value={
                  collector.username
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      username:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>
                E-mail
                <span className="text-primary">
                  *
                </span>
              </span>

              <Input
                required
                type="email"
                value={
                  collector.email
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      email:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>
                Nome do perfil
                <span className="text-primary">
                  *
                </span>
              </span>

              <Input
                required
                value={
                  collector.profileName
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      profileName:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span>
                Nome ENS
              </span>

              <Input
                placeholder="nome.eth (opcional)"
                value={
                  collector.ensName
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      ensName:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span>
                Observação do colecionador (opcional)
              </span>

              <textarea
                rows={5}
                value={
                  collector.note ??
                  ''
                }
                onChange={(
                  event,
                ) => {
                  setCollector(
                    (
                      current,
                    ) => ({
                      ...current,

                      note:
                        event
                          .target
                          .value,
                    }),
                  )
                }}
                className="w-full resize-y rounded-control border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] hover:border-primary/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
              />
            </label>
          </div>
        </section>

        <aside className="rounded-panel border border-border/70 bg-card p-5 lg:sticky lg:top-24">
          <Typography
            as="h2"
            variant="heading"
          >
            Seus NFTs
          </Typography>

          <div className="mt-5 space-y-3">
            {cart.items.map(
              (
                item,
              ) => {
                const quoteItem =
                  quote?.items.find(
                    (
                      candidate,
                    ) =>
                      candidate.cartItemId ===
                      item.id,
                  )

                return (
                  <div
                    key={
                      item.id
                    }
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-3"
                  >
                    <img
                      src={
                        item.image
                          .url
                      }
                      alt={
                        item.image
                          .alt
                      }
                      width={
                        item.image
                          .width
                      }
                      height={
                        item.image
                          .height
                      }
                      className="aspect-square w-14 rounded-control object-cover"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {
                          item.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        ID do token:{' '}
                        {
                          item.tokenId
                        }{' '}
                        · x{' '}
                        {
                          item.quantity
                        }
                      </p>
                    </div>

                    <span className="text-sm font-bold text-primary">
                      {quoteItem
                        ?.subtotalEth ??
                        item.unitPriceEth}{' '}
                      ETH
                    </span>
                  </div>
                )
              },
            )}
          </div>

          <div className="mt-5 border-t border-border/70 pt-5">
            <label
              htmlFor="checkout-coupon"
              className="text-xs font-semibold"
            >
              Código promocional
            </label>

            <div className="mt-2 flex gap-2">
              <Input
                id="checkout-coupon"
                value={
                  couponInput
                }
                placeholder="Digite o código"
                onChange={(
                  event,
                ) => {
                  setCouponInput(
                    event.target
                      .value,
                  )
                }}
                className="h-10 min-w-0 flex-1"
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const normalized =
                    couponInput
                      .trim()
                      .toUpperCase()

                  setAppliedCoupon(
                    normalized ||
                      undefined,
                  )

                  setQuoteRefreshNonce(
                    (
                      current,
                    ) =>
                      current +
                      1,
                  )

                  idempotencyKeyRef.current =
                    null
                }}
              >
                Aplicar
              </Button>
            </div>

            {quote?.coupon
              .status ===
              'applied' && (
              <p className="mt-2 text-xs text-primary">
                Cupom{' '}
                {
                  quote
                    .coupon
                    .code
                }{' '}
                aplicado.
              </p>
            )}

            {quote?.coupon
              .status ===
              'invalid' && (
              <p className="mt-2 text-xs text-destructive">
                Código promocional inválido.
              </p>
            )}

            {quote?.coupon
              .status ===
              'expired' && (
              <p className="mt-2 text-xs text-destructive">
                Este código promocional expirou.
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-3 border-t border-border/70 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt>
                Subtotal
              </dt>

              <dd>
                {quote
                  ?.subtotalEth ??
                  '—'}{' '}
                ETH
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt>
                Desconto do lançamento
              </dt>

              <dd>
                (-){' '}
                {quote
                  ?.discountEth ??
                  '—'}{' '}
                ETH
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt>
                Taxa de rede
              </dt>

              <dd>
                {quote
                  ?.networkFeeEth ??
                  '—'}{' '}
                ETH
              </dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-border/70 pt-4 font-bold">
              <dt>
                Total
              </dt>

              <dd className="text-primary">
                {quote
                  ?.totalEth ??
                  '—'}{' '}
                ETH
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <Typography
                as="h3"
                variant="subheading"
              >
                Carteira e rede
              </Typography>

              <Button
                asChild
                variant="link"
                size="sm"
              >
                <Link to="/wallets">
                  Gerenciar
                </Link>
              </Button>
            </div>

            {wallets.items
              .length ===
            0 ? (
              <div className="mt-3 rounded-control border border-dashed p-4 text-sm text-muted-foreground">
                Nenhuma carteira cadastrada.{' '}

                <Link
                  to="/wallets"
                  className="font-semibold text-primary"
                >
                  Adicionar carteira
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                {wallets.items.map(
                  (
                    wallet,
                  ) => (
                    <button
                      key={
                        wallet.id
                      }
                      type="button"
                      onClick={() => {
                        handleWalletSelection(
                          wallet,
                        )
                      }}
                      className={cn(
                        'rounded-control border bg-background p-3 text-left transition-colors hover:border-primary',

                        selectedWallet?.id ===
                          wallet.id &&
                          'border-primary',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-4 rounded-full border border-primary',

                            selectedWallet?.id ===
                              wallet.id &&
                              'border-[5px]',
                          )}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {
                              wallet.nickname
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {
                              providerLabels[
                                wallet
                                  .provider
                              ]
                            }{' '}
                            ·{' '}
                            {
                              wallet.network
                            }{' '}
                            ·{' '}
                            {
                              wallet.address
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {quoteLoading && (
            <p className="mt-4 text-xs text-muted-foreground">
              Atualizando cotação...
            </p>
          )}

          {quoteErrorMessage && (
            <p
              role="alert"
              className="mt-4 text-xs text-destructive"
            >
              {
                quoteErrorMessage
              }
            </p>
          )}

          {reviewNotice && (
            <p
              role="alert"
              className="mt-4 rounded-control border border-primary/40 bg-primary/10 p-3 text-xs"
            >
              {
                reviewNotice
              }
            </p>
          )}

          {formError && (
            <p
              role="alert"
              className="mt-4 text-xs text-destructive"
            >
              {formError}
            </p>
          )}

          {orderErrorMessage && (
            <p
              role="alert"
              className="mt-4 text-xs text-destructive"
            >
              {
                orderErrorMessage
              }
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={
              !selectedWallet ||
              !quote ||
              quoteLoading ||
              hasAvailabilityConflict ||
              createOrderMutation.isPending
            }
          >
            {createOrderMutation.isPending
              ? 'Confirmando...'
              : 'Confirmar compra'}
          </Button>
        </aside>
      </div>
    </form>
  )
}

export function CheckoutPage() {
  const auth =
    useAuth()

  const cartQuery =
    useCartQuery()

  const walletsQuery =
    useWalletsQuery()

  if (
    cartQuery.isPending ||
    walletsQuery.isPending ||
    !auth.user
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
      >
        <div
          role="status"
          aria-label="Carregando pagamento"
          className="space-y-5"
        >
          <div className="skeleton-shimmer h-8 w-64 rounded bg-card" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
            <div className="skeleton-shimmer h-96 rounded-panel bg-card" />
            <div className="skeleton-shimmer h-[34rem] rounded-panel bg-card" />
          </div>
        </div>
      </main>
    )
  }

  if (
    cartQuery.isError ||
    walletsQuery.isError ||
    !cartQuery.data ||
    !walletsQuery.data
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[70svh] place-items-center px-(--page-gutter)"
      >
        <section
          role="alert"
          className="max-w-xl rounded-panel border bg-card p-8 text-center"
        >
          <Typography
            as="h1"
            variant="heading"
          >
            Não foi possível preparar o pagamento
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void cartQuery.refetch()
              void walletsQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  if (
    cartQuery.data
      .items.length ===
    0
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[70svh] place-items-center px-(--page-gutter)"
      >
        <section className="max-w-xl rounded-panel border bg-card p-8 text-center">
          <Typography
            as="h1"
            variant="heading"
          >
            Seu carrinho está vazio
          </Typography>

          <Button
            asChild
            className="mt-6"
          >
            <Link to="/marketplace">
              Explorar NFTs
            </Link>
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[75svh] w-full max-w-(--content-max) px-(--page-gutter) py-7 md:py-10"
    >
      <CheckoutContent
        cart={
          cartQuery.data
        }
        wallets={
          walletsQuery.data
        }
        user={
          auth.user
        }
      />
    </main>
  )
}