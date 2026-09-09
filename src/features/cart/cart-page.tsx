import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import {
  useCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/features/cart/cart-query'
import type { CartItem } from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'

function getSubtotal(items: CartItem[]): string {
  const subtotal = items.reduce(
    (total, item) => total + Number(item.unitPriceEth) * item.quantity,
    0,
  )

  return subtotal.toFixed(2)
}

function getCartErrorMessage(error: Error | null): string | null {
  if (!error) return null

  if (error instanceof ApiClientError && error.code === 'AVAILABILITY_CONFLICT') {
    const availableQuantity = error.details?.availableQuantity

    if (typeof availableQuantity === 'number') {
      return availableQuantity === 0
        ? 'Esta edição esgotou e não pode mais ser adicionada ao carrinho.'
        : `O estoque mudou. Agora existem ${availableQuantity} unidade(s) disponíveis.`
    }

    return 'O estoque desta edição mudou. Revise a quantidade antes de continuar.'
  }

  if (error instanceof ApiClientError && error.code === 'CONFLICT') {
    return 'O carrinho foi atualizado em outra operação. Recarregue e tente novamente.'
  }

  return 'Não foi possível atualizar o carrinho. Tente novamente.'
}

export function CartPage() {
  const cartQuery = useCartQuery()

  const updateMutation = useUpdateCartItemMutation()

  const removeMutation = useRemoveCartItemMutation()

  if (cartQuery.isPending) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
      >
        <div role="status" aria-label="Carregando carrinho" className="space-y-5">
          <div className="skeleton-shimmer h-9 w-64 rounded bg-card" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              <div className="skeleton-shimmer h-40 rounded-panel bg-card" />
              <div className="skeleton-shimmer h-40 rounded-panel bg-card" />
            </div>

            <div className="skeleton-shimmer h-72 rounded-panel bg-card" />
          </div>
        </div>
      </main>
    )
  }

  if (cartQuery.isError || !cartQuery.data) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[70svh] place-items-center px-(--page-gutter)"
      >
        <section
          role="alert"
          className="max-w-xl rounded-panel border border-destructive/60 bg-card p-8 text-center"
        >
          <Typography as="h1" variant="heading">
            Não foi possível carregar o carrinho
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void cartQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  const cart = cartQuery.data

  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0)

  const subtotal = getSubtotal(cart.items)

  const mutationError = updateMutation.error ?? removeMutation.error

  const mutationErrorMessage = getCartErrorMessage(mutationError)

  if (cart.items.length === 0) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
      >
        <nav aria-label="Breadcrumb" className="mb-6 hidden text-sm md:block">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>

          <span aria-hidden="true">{' / '}</span>

          <span className="text-muted-foreground">Carrinho</span>
        </nav>

        <section className="mx-auto max-w-2xl rounded-panel border bg-card p-8 text-center md:p-12">
          <Typography as="h1" variant="title">
            Seu carrinho está vazio
          </Typography>

          <Typography tone="muted" className="mt-3">
            Explore o mercado e escolha uma edição para começar sua coleção.
          </Typography>

          <Button asChild className="mt-7">
            <Link to="/marketplace">Explorar NFTs</Link>
          </Button>
        </section>
      </main>
    )
  }

  const hasCartConflict = cart.items.some(
    (item) => item.availabilityChanged || item.quantity > item.availableQuantity,
  )

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-6 md:py-10"
    >
      <nav aria-label="Breadcrumb" className="mb-5 hidden text-sm md:block">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>

        <span aria-hidden="true">{' / '}</span>

        <span className="text-muted-foreground">Carrinho</span>
      </nav>

      <div className="flex items-center gap-4 md:block">
        <Button asChild variant="outline" size="icon-sm" className="md:hidden">
          <Link to="/marketplace" aria-label="Voltar ao mercado">
            ‹
          </Link>
        </Button>
        <Typography as="h1" variant="title" className="text-center md:text-left">
          Carrinho de NFTs <span className="sr-only">com {itemCount} itens</span>
        </Typography>
      </div>

      {mutationErrorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-control border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {mutationErrorMessage}
        </div>
      )}

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <section aria-label="Itens do carrinho" className="space-y-4">
          {cart.items.map((item) => {
            const isUpdating =
              updateMutation.isPending && updateMutation.variables?.itemId === item.id

            const isRemoving = removeMutation.isPending && removeMutation.variables === item.id

            const hasAvailabilityConflict =
              item.availabilityChanged || item.quantity > item.availableQuantity

            const editionLabel =
              item.editionId.split(':').at(-1)?.replace('-', '/') ?? item.editionId

            return (
              <article
                key={item.id}
                className="rounded-panel border border-border/70 bg-card p-4 md:p-5"
              >
                <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-center md:gap-6">
                  <Link
                    to="/nfts/$nftId"
                    params={{
                      nftId: item.nftId,
                    }}
                    className="overflow-hidden rounded-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  >
                    <img
                      src={item.image.url}
                      alt={item.image.alt}
                      width={item.image.width}
                      height={item.image.height}
                      className="aspect-square w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 self-start md:self-center">
                    <Link
                      to="/nfts/$nftId"
                      params={{
                        nftId: item.nftId,
                      }}
                      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Typography as="h2" variant="subheading" className="truncate">
                        {item.name}
                      </Typography>
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">Edição {editionLabel}</p>

                    <p className="mt-1 text-xs text-muted-foreground">Token {item.tokenId}</p>

                    <p className="mt-3 font-bold text-primary">{item.unitPriceEth} ETH</p>

                    {item.priceChanged && (
                      <p className="mt-2 text-xs text-warning">O preço deste NFT foi atualizado.</p>
                    )}

                    {hasAvailabilityConflict && (
                      <p className="mt-2 text-xs text-destructive">
                        Estoque atualizado: {item.availableQuantity} unidade(s) disponível(is).
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border/70 pt-4 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        disabled={item.quantity <= 1 || isUpdating || isRemoving}
                        onClick={() => {
                          removeMutation.reset()

                          updateMutation.mutate({
                            itemId: item.id,

                            quantity: item.quantity - 1,

                            expectedVersion: item.version,
                          })
                        }}
                      >
                        −
                      </Button>

                      <output
                        aria-live="polite"
                        className="min-w-7 text-center text-sm font-semibold"
                      >
                        {item.quantity}
                      </output>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        disabled={
                          item.quantity >= item.availableQuantity || isUpdating || isRemoving
                        }
                        onClick={() => {
                          removeMutation.reset()

                          updateMutation.mutate({
                            itemId: item.id,

                            quantity: item.quantity + 1,

                            expectedVersion: item.version,
                          })
                        }}
                      >
                        +
                      </Button>
                    </div>

                    <button
                      type="button"
                      className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isUpdating || isRemoving}
                      onClick={() => {
                        updateMutation.reset()

                        removeMutation.mutate(item.id)
                      }}
                    >
                      {isRemoving ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="rounded-panel border border-border/70 bg-card p-5 md:p-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <Typography as="h2" variant="heading">
            Resumo
          </Typography>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Itens</dt>

              <dd>{itemCount}</dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>

              <dd>{subtotal} ETH</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border/70 pt-5">
            <label htmlFor="coupon" className="text-xs font-semibold text-muted-foreground">
              Cupom de desconto
            </label>

            <div className="mt-2 flex gap-2">
              <Input
                id="coupon"
                type="text"
                placeholder="Digite seu cupom"
                disabled
                className="h-10 min-w-0 flex-1"
              />

              <Button type="button" variant="outline" size="sm" disabled>
                Aplicar
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Cupons serão habilitados na etapa de cotação.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-5 font-bold">
            <span>Total</span>

            <span className="text-primary">{subtotal} ETH</span>
          </div>

          {hasCartConflict ? (
            <Button type="button" size="lg" className="mt-6 w-full" disabled>
              Continuar para pagamento
            </Button>
          ) : (
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">Continuar para pagamento</Link>
            </Button>
          )}

          <Link
            to="/marketplace"
            className="mt-4 block text-center text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </main>
  )
}
