import {
  useState,
  type FormEvent,
} from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import {
  useCreateWalletMutation,
  useUpdateWalletMutation,
  useWalletsQuery,
} from '@/features/wallets/wallets-query'
import type {
  BlockchainNetwork,
  CollectorWallet,
  SaveWalletRequest,
  WalletProvider,
} from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'
import { cn } from '@/lib/utils'

const networkLabels: Record<
  BlockchainNetwork,
  string
> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const providerLabels: Record<
  WalletProvider,
  string
> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

const selectClassName =
  'h-12 w-full rounded-control border border-input bg-background px-4 text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow] duration-(--duration-fast) hover:border-primary/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60'

interface WalletFormProps {
  wallet: CollectorWallet | null
  hasWallets: boolean
  pending: boolean
  error: Error | null
  onCancelCreate: () => void
  onSubmit: (
    request: SaveWalletRequest,
  ) => void
}

function getInitialForm(
  wallet: CollectorWallet | null,
  hasWallets: boolean,
): SaveWalletRequest {
  if (wallet) {
    return {
      displayName:
        wallet.displayName,

      nickname:
        wallet.nickname,

      profileName:
        wallet.profileName,

      email:
        wallet.email,

      address:
        wallet.address,

      ensName:
        wallet.ensName ?? '',

      referralCode:
        wallet.referralCode,

      network:
        wallet.network,

      provider:
        wallet.provider,

      primary:
        wallet.primary,

      expectedVersion:
        wallet.version,
    }
  }

  return {
    displayName: '',
    nickname: '',
    profileName: '',
    email: '',
    address: '',
    ensName: '',
    referralCode: '',
    network: 'ethereum',
    provider: 'metamask',
    primary: !hasWallets,
  }
}

function getWalletErrorMessage(
  error: Error | null,
): string | null {
  if (!error) {
    return null
  }

  if (
    error instanceof
      ApiClientError &&
    error.code ===
      'CONFLICT'
  ) {
    return 'Esta carteira foi alterada em outra operação. Recarregue os dados antes de salvar novamente.'
  }

  if (
    error instanceof
      ApiClientError &&
    error.code ===
      'VALIDATION_ERROR'
  ) {
    return error.message
  }

  return 'Não foi possível salvar a carteira. Tente novamente.'
}

function WalletForm({
  wallet,
  hasWallets,
  pending,
  error,
  onCancelCreate,
  onSubmit,
}: WalletFormProps) {
  const [
    form,
    setForm,
  ] =
    useState<SaveWalletRequest>(
      () =>
        getInitialForm(
          wallet,
          hasWallets,
        ),
    )

  const errorMessage =
    getWalletErrorMessage(
      error,
    )

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    onSubmit({
      ...form,

      displayName:
        form.displayName.trim(),

      nickname:
        form.nickname.trim(),

      profileName:
        form.profileName.trim(),

      email:
        form.email.trim(),

      address:
        form.address.trim(),

      ensName:
        form.ensName
          ?.trim() ||
        undefined,

      referralCode:
        form.referralCode.trim(),

      expectedVersion:
        wallet?.version,
    })
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mt-6 grid gap-x-7 gap-y-5 md:grid-cols-2"
    >
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
            form.displayName
          }
          onChange={(
            event,
          ) => {
            setForm(
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
          Apelido da carteira
          <span className="text-primary">
            *
          </span>
        </span>

        <Input
          required
          value={
            form.nickname
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                nickname:
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
          Rede
          <span className="text-primary">
            *
          </span>
        </span>

        <select
          required
          className={
            selectClassName
          }
          value={
            form.network
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                network:
                  event
                    .target
                    .value as BlockchainNetwork,
              }),
            )
          }}
        >
          {Object.entries(
            networkLabels,
          ).map(
            ([
              value,
              label,
            ]) => (
              <option
                key={
                  value
                }
                value={
                  value
                }
              >
                {label}
              </option>
            ),
          )}
        </select>
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
            form.profileName
          }
          onChange={(
            event,
          ) => {
            setForm(
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

      <label className="grid gap-2 text-sm">
        <span>
          Endereço da carteira
          <span className="text-primary">
            *
          </span>
        </span>

        <Input
          required
          autoComplete="off"
          placeholder="Endereço da carteira"
          value={
            form.address
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                address:
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
          Nome ENS
        </span>

        <Input
          placeholder="nome.eth (opcional)"
          value={
            form.ensName ??
            ''
          }
          onChange={(
            event,
          ) => {
            setForm(
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

      <label className="grid gap-2 text-sm">
        <span>
          Tipo de carteira
          <span className="text-primary">
            *
          </span>
        </span>

        <select
          required
          className={
            selectClassName
          }
          value={
            form.provider
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                provider:
                  event
                    .target
                    .value as WalletProvider,
              }),
            )
          }}
        >
          {Object.entries(
            providerLabels,
          ).map(
            ([
              value,
              label,
            ]) => (
              <option
                key={
                  value
                }
                value={
                  value
                }
              >
                {label}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span>
          Código de indicação
        </span>

        <Input
          value={
            form.referralCode
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                referralCode:
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
            form.email
          }
          onChange={(
            event,
          ) => {
            setForm(
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

      <label className="flex items-center gap-3 self-end pb-3 text-sm">
        <input
          type="checkbox"
          checked={
            form.primary
          }
          onChange={(
            event,
          ) => {
            setForm(
              (
                current,
              ) => ({
                ...current,

                primary:
                  event
                    .target
                    .checked,
              }),
            )
          }}
          className="size-4 accent-primary"
        />

        Usar como carteira principal
      </label>

      {errorMessage && (
        <p
          role="alert"
          className="text-sm text-destructive md:col-span-2"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <Button
          type="submit"
          disabled={
            pending
          }
        >
          {pending
            ? 'Salvando...'
            : wallet
              ? 'Salvar alterações'
              : 'Adicionar carteira'}
        </Button>

        {!wallet &&
          hasWallets && (
            <Button
              type="button"
              variant="outline"
              disabled={
                pending
              }
              onClick={
                onCancelCreate
              }
            >
              Cancelar
            </Button>
          )}
      </div>
    </form>
  )
}

export function WalletsPage() {
  const walletsQuery =
    useWalletsQuery()

  const createMutation =
    useCreateWalletMutation()

  const updateMutation =
    useUpdateWalletMutation()

  const [
    editingWalletId,
    setEditingWalletId,
  ] =
    useState<
      | string
      | null
      | undefined
    >(undefined)

  if (
    walletsQuery.isPending
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[70svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-12"
      >
        <div
          role="status"
          aria-label="Carregando carteiras"
          className="space-y-5"
        >
          <div className="skeleton-shimmer h-9 w-64 rounded bg-card" />
          <div className="skeleton-shimmer h-20 rounded-panel bg-card" />
          <div className="skeleton-shimmer h-96 rounded-panel bg-card" />
        </div>
      </main>
    )
  }

  if (
    walletsQuery.isError ||
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
            Não foi possível carregar suas carteiras
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void walletsQuery.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  const wallets =
    walletsQuery.data.items

  const primaryWallet =
    wallets.find(
      (
        wallet,
      ) =>
        wallet.primary,
    ) ??
    wallets[0] ??
    null

  const activeWalletId =
    editingWalletId ===
    undefined
      ? primaryWallet?.id ??
        null
      : editingWalletId

  const activeWallet =
    wallets.find(
      (
        wallet,
      ) =>
        wallet.id ===
        activeWalletId,
    ) ?? null

  const isCreating =
    activeWalletId ===
    null

  const pending =
    createMutation.isPending ||
    updateMutation.isPending

  const mutationError =
    createMutation.error ??
    updateMutation.error

  function selectWallet(
    walletId: string,
  ): void {
    createMutation.reset()
    updateMutation.reset()

    setEditingWalletId(
      walletId,
    )
  }

  function startCreating(): void {
    createMutation.reset()
    updateMutation.reset()

    setEditingWalletId(
      null,
    )
  }

  function handleSave(
    request: SaveWalletRequest,
  ): void {
    if (activeWallet) {
      updateMutation.mutate(
        {
          walletId:
            activeWallet.id,

          request: {
            ...request,

            expectedVersion:
              activeWallet.version,
          },
        },

        {
          onSuccess: (
            wallet,
          ) => {
            setEditingWalletId(
              wallet.id,
            )
          },
        },
      )

      return
    }

    createMutation.mutate(
      request,

      {
        onSuccess: (
          wallet,
        ) => {
          setEditingWalletId(
            wallet.id,
          )
        },
      },
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto min-h-[75svh] w-full max-w-(--content-max) px-(--page-gutter) py-7 md:py-10"
    >
      <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-panel bg-card p-4 lg:sticky lg:top-24">
          <Typography
            as="h1"
            variant="heading"
            className="px-2 py-2"
          >
            Meu perfil
          </Typography>

          <nav
            aria-label="Configurações do perfil"
            className="mt-2 grid gap-1 text-sm"
          >
            <span className="rounded-control px-3 py-3 text-muted-foreground">
              Dados do perfil
            </span>

            <span className="rounded-control border-l-4 border-primary bg-background px-3 py-3 font-semibold text-primary">
              Carteiras
            </span>

            <span className="rounded-control px-3 py-3 text-muted-foreground">
              Atividade
            </span>

            <span className="rounded-control px-3 py-3 text-muted-foreground">
              Lista de interesse
            </span>
          </nav>
        </aside>

        <section>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Typography
                as="h2"
                variant="heading"
              >
                {isCreating
                  ? 'Adicionar carteira'
                  : activeWallet
                        ?.primary
                    ? 'Carteira principal'
                    : 'Editar carteira'}
              </Typography>

              <Typography
                tone="muted"
                className="mt-1"
              >
                Gerencie as carteiras disponíveis no pagamento e no recebimento dos NFTs comprados.
              </Typography>
            </div>

            <Button
              type="button"
              variant="ghost"
              disabled={
                pending
              }
              onClick={
                startCreating
              }
            >
              Adicionar
            </Button>
          </div>

          {wallets.length >
            0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {wallets.map(
                (
                  wallet,
                ) => (
                  <button
                    key={
                      wallet.id
                    }
                    type="button"
                    onClick={() => {
                      selectWallet(
                        wallet.id,
                      )
                    }}
                    className={cn(
                      'rounded-panel border bg-card p-4 text-left transition-colors hover:border-primary',

                      activeWallet?.id ===
                        wallet.id &&
                        'border-primary',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">
                        {
                          wallet.nickname
                        }
                      </span>

                      {wallet.primary && (
                        <span className="rounded-full border border-primary px-2 py-1 text-[0.65rem] font-bold text-primary">
                          PRINCIPAL
                        </span>
                      )}
                    </div>

                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {
                        wallet.address
                      }
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {
                        networkLabels[
                          wallet
                            .network
                        ]
                      }{' '}
                      ·{' '}
                      {
                        providerLabels[
                          wallet
                            .provider
                        ]
                      }
                    </p>
                  </button>
                ),
              )}
            </div>
          )}

          <WalletForm
            key={
              activeWallet?.id ??
              'new-wallet'
            }
            wallet={
              activeWallet
            }
            hasWallets={
              wallets.length >
              0
            }
            pending={
              pending
            }
            error={
              mutationError
            }
            onCancelCreate={() => {
              setEditingWalletId(
                undefined,
              )
            }}
            onSubmit={
              handleSave
            }
          />
        </section>
      </div>
    </main>
  )
}