import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cartQueryKeys } from '@/features/cart/cart-query'
import { catalogQueryKeys } from '@/features/catalog/catalog-query'
import { clearPendingOrderRecovery } from '@/features/orders/pending-order-recovery'
import { useOrderQuery } from '@/features/orders/orders-query'
import type { OrderReceipt } from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'

const walletProviderLabels: Record<string, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

function shortenReference(reference: string): string {
  if (reference.length <= 16) {
    return reference
  }

  return `${reference.slice(0, 8)}...${reference.slice(-6)}`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function OrderLoadingState() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-[72svh] place-items-center px-(--page-gutter) py-10"
    >
      <div
        role="status"
        aria-label="Carregando pedido"
        className="w-full max-w-2xl rounded-panel border bg-card p-8"
      >
        <div className="skeleton-shimmer mx-auto size-16 rounded-full bg-background" />

        <div className="skeleton-shimmer mx-auto mt-6 h-7 w-64 rounded bg-background" />

        <div className="skeleton-shimmer mt-8 h-24 rounded bg-background" />

        <div className="skeleton-shimmer mt-4 h-56 rounded bg-background" />
      </div>
    </main>
  )
}

function PendingOrderCard() {
  return (
    <section className="w-full max-w-xl rounded-panel border bg-card p-8 text-center shadow-card">
      <div className="mx-auto grid size-16 place-items-center rounded-full border border-primary text-2xl text-primary">
        ···
      </div>

      <Typography as="h1" variant="heading" className="mt-5">
        Confirmando sua compra
      </Typography>

      <Typography tone="muted" className="mt-3">
        Seu pedido foi criado com segurança e está aguardando a confirmação da transação. Esta
        página será atualizada automaticamente.
      </Typography>

      <p className="mt-6 text-xs text-muted-foreground">
        Você pode manter esta página aberta. Se a conexão cair, o pedido será recuperado quando a
        conexão voltar.
      </p>
    </section>
  )
}

function DeclinedOrderCard({ reason }: { reason?: string }) {
  return (
    <section className="w-full max-w-xl rounded-panel border border-destructive/50 bg-card p-8 text-center shadow-card">
      <div className="mx-auto grid size-16 place-items-center rounded-full border border-destructive text-2xl text-destructive">
        ×
      </div>

      <Typography as="h1" variant="heading" className="mt-5">
        Compra não confirmada
      </Typography>

      <Typography tone="muted" className="mt-3">
        {reason ?? 'A transação não foi confirmada pela carteira selecionada.'}
      </Typography>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/checkout">Voltar ao pagamento</Link>
        </Button>

        <Button asChild variant="outline">
          <Link to="/marketplace">Voltar ao mercado</Link>
        </Button>
      </div>
    </section>
  )
}

function ConfirmedOrderCard({ receipt }: { receipt: OrderReceipt }) {
  const providerLabel = walletProviderLabels[receipt.walletProvider] ?? receipt.walletProvider

  return (
    <section className="w-full max-w-2xl overflow-hidden rounded-panel border border-primary/40 bg-card shadow-card">
      <header className="border-b border-primary/40 px-6 py-7 text-center md:px-8">
        <div className="mx-auto grid size-16 place-items-center rounded-full border-2 border-primary text-3xl font-bold text-primary">
          ✓
        </div>

        <Typography as="h1" variant="heading" className="mt-5">
          Seus NFTs agora estão na sua carteira
        </Typography>
      </header>

      <dl className="grid gap-px border-b border-primary/40 bg-border/70 sm:grid-cols-4">
        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">ID da transação</dt>

          <dd className="mt-1 text-sm font-semibold">
            {shortenReference(receipt.transactionReference)}
          </dd>
        </div>

        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">Data</dt>

          <dd className="mt-1 text-sm font-semibold">{formatDate(receipt.confirmedAt)}</dd>
        </div>

        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">Total</dt>

          <dd className="mt-1 text-sm font-semibold text-primary">{receipt.totalEth} ETH</dd>
        </div>

        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">Carteira</dt>

          <dd className="mt-1 text-sm font-semibold">{providerLabel}</dd>
        </div>
      </dl>

      <div className="px-6 py-6 md:px-8">
        <Typography as="h2" variant="subheading">
          Detalhes da transação
        </Typography>

        <div className="mt-4 space-y-4">
          {receipt.items.map((item) => (
            <div
              key={`${item.nftId}:${item.editionId}`}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 pb-4 last:border-0"
            >
              <img
                src={item.image.url}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                className="aspect-square w-14 rounded-control object-cover"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  ID do token: {item.tokenId} · x {item.quantity}
                </p>
              </div>

              <span className="text-sm font-bold text-primary">{item.subtotalEth} ETH</span>
            </div>
          ))}
        </div>

        <dl className="ml-auto mt-5 max-w-xs space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>

            <dd>{receipt.subtotalEth} ETH</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Desconto</dt>

            <dd>(-) {receipt.discountEth} ETH</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Taxa de rede</dt>

            <dd>{receipt.networkFeeEth} ETH</dd>
          </div>

          <div className="flex justify-between gap-4 border-t border-border/70 pt-3 font-bold">
            <dt>Total</dt>

            <dd className="text-primary">{receipt.totalEth} ETH</dd>
          </div>
        </dl>

        <p className="mt-6 border-t border-border/70 pt-5 text-center text-xs leading-5 text-muted-foreground">
          Transação confirmada na rede. Este comprovante é um snapshot imutável dos itens, valores e
          carteira usados no momento da confirmação.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
              Ver no explorador
            </a>
          </Button>

          <Button asChild variant="outline">
            <Link to="/marketplace">Continuar explorando</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function OrderPage() {
  const { orderId } = useParams({
    from: '/_authenticated/orders/$orderId',
  })

  const queryClient = useQueryClient()

  const orderQuery = useOrderQuery(orderId)

  const orderStatus = orderQuery.data?.status

  useEffect(() => {
    if (!orderStatus || orderStatus === 'pending') {
      return
    }

    clearPendingOrderRecovery()

    if (orderStatus === 'confirmed') {
      void queryClient.invalidateQueries({
        queryKey: cartQueryKeys.all,
      })

      void queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.all,
      })
    }
  }, [orderStatus, queryClient])

  if (orderQuery.isPending) {
    return <OrderLoadingState />
  }

  if (orderQuery.error instanceof ApiClientError && orderQuery.error.code === 'NOT_FOUND') {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[72svh] place-items-center px-(--page-gutter) py-10"
      >
        <section className="w-full max-w-xl rounded-panel border bg-card p-8 text-center">
          <Typography as="h1" variant="heading">
            Pedido não encontrado
          </Typography>

          <Typography tone="muted" className="mt-3">
            Não encontramos esse pedido para a sessão atual.
          </Typography>

          <Button asChild className="mt-6">
            <Link to="/marketplace">Voltar ao mercado</Link>
          </Button>
        </section>
      </main>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[72svh] place-items-center px-(--page-gutter) py-10"
      >
        <section
          role="alert"
          className="w-full max-w-xl rounded-panel border border-destructive/50 bg-card p-8 text-center"
        >
          <Typography as="h1" variant="heading">
            Não foi possível recuperar o pedido
          </Typography>

          <Typography tone="muted" className="mt-3">
            A conexão pode ter sido interrompida. Você pode tentar novamente sem criar uma compra
            duplicada.
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void orderQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  const order = orderQuery.data

  if (order.status === 'confirmed' && !order.receipt) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[72svh] place-items-center px-(--page-gutter) py-10"
      >
        <section
          role="alert"
          className="w-full max-w-xl rounded-panel border bg-card p-8 text-center"
        >
          <Typography as="h1" variant="heading">
            Comprovante indisponível
          </Typography>

          <Typography tone="muted" className="mt-3">
            O pedido foi confirmado, mas o comprovante não pôde ser carregado.
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void orderQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-[72svh] place-items-center px-(--page-gutter) py-10 md:py-16"
    >
      {order.status === 'pending' && <PendingOrderCard />}

      {order.status === 'declined' && <DeclinedOrderCard reason={order.declineReason} />}

      {order.status === 'confirmed' && order.receipt && (
        <ConfirmedOrderCard receipt={order.receipt} />
      )}
    </main>
  )
}
