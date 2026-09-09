import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
} from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { useAuth } from '@/features/auth/session/use-auth'
import {
  useChangePasswordMutation,
  useProfileQuery,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
} from '@/features/profile/profile-query'
import type {
  CollectorProfile,
  UpdateProfileRequest,
} from '@/lib/api/contracts'
import { ApiClientError } from '@/lib/api/error'

const MAX_AVATAR_SIZE_BYTES =
  2 * 1024 * 1024

const acceptedAvatarTypes =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

interface ProfileFormValues {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

function getFieldError(
  error: Error | null,
  field: string,
): string | null {
  if (
    !(
      error instanceof
      ApiClientError
    )
  ) {
    return null
  }

  return (
    error.fieldErrors?.find(
      (
        fieldError,
      ) =>
        fieldError.field ===
        field,
    )?.message ?? null
  )
}

function getProfileErrorMessage(
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
      'CONFLICT'
    ) {
      return 'Alguns dados foram alterados ou já estão em uso. Revise os campos antes de salvar.'
    }

    if (
      error.code ===
      'VALIDATION_ERROR'
    ) {
      return error.message
    }
  }

  return 'Não foi possível atualizar o perfil. Tente novamente.'
}

function getAvatarErrorMessage(
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
    return 'O perfil mudou antes da atualização do avatar. Tente novamente.'
  }

  return 'Não foi possível atualizar o avatar. Tente novamente.'
}

function getPasswordErrorMessage(
  error: Error | null,
): string | null {
  if (!error) {
    return null
  }

  if (
    error instanceof
    ApiClientError
  ) {
    const currentPasswordError =
      error.fieldErrors?.find(
        (
          fieldError,
        ) =>
          fieldError.field ===
          'currentPassword',
      )?.message

    if (
      currentPasswordError
    ) {
      return currentPasswordError
    }

    if (
      error.code ===
      'VALIDATION_ERROR'
    ) {
      return error.message
    }
  }

  return 'Não foi possível alterar a senha. Tente novamente.'
}

function validateNewPassword(
  values: PasswordFormValues,
): string | null {
  if (
    !values.currentPassword
  ) {
    return 'Informe sua senha atual.'
  }

  if (
    !values.newPassword
  ) {
    return 'Informe a nova senha.'
  }

  if (
    values.newPassword.length <
    8
  ) {
    return 'A nova senha deve ter pelo menos 8 caracteres.'
  }

  if (
    !/[a-z]/.test(
      values.newPassword,
    ) ||
    !/[A-Z]/.test(
      values.newPassword,
    ) ||
    !/\d/.test(
      values.newPassword,
    ) ||
    !/[^a-zA-Z0-9]/.test(
      values.newPassword,
    )
  ) {
    return 'A nova senha deve incluir letra maiúscula, minúscula, número e símbolo.'
  }

  if (
    values.currentPassword ===
    values.newPassword
  ) {
    return 'A nova senha deve ser diferente da senha atual.'
  }

  if (
    values.confirmPassword !==
    values.newPassword
  ) {
    return 'As novas senhas não coincidem.'
  }

  return null
}

function fileToDataUrl(
  file: File,
): Promise<string> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader()

      reader.addEventListener(
        'load',
        () => {
          if (
            typeof reader.result ===
            'string'
          ) {
            resolve(
              reader.result,
            )

            return
          }

          reject(
            new Error(
              'Não foi possível ler a imagem selecionada.',
            ),
          )
        },
      )

      reader.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'Não foi possível ler a imagem selecionada.',
            ),
          )
        },
      )

      reader.readAsDataURL(
        file,
      )
    },
  )
}

interface PasswordInputProps {
  id: string
  label: string
  value: string
  autoComplete: string
  visible: boolean
  onChange: (
    value: string,
  ) => void
  onToggleVisibility: () => void
}

function PasswordInput({
  id,
  label,
  value,
  autoComplete,
  visible,
  onChange,
  onToggleVisibility,
}: PasswordInputProps) {
  return (
    <label
      htmlFor={id}
      className="grid gap-2 text-sm"
    >
      <span>
        {label}
      </span>

      <span className="relative block">
        <Input
          id={id}
          type={
            visible
              ? 'text'
              : 'password'
          }
          value={
            value
          }
          autoComplete={
            autoComplete
          }
          onChange={(
            event,
          ) => {
            onChange(
              event.target.value,
            )
          }}
          className="pr-24"
        />

        <button
          type="button"
          className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          aria-label={
            visible
              ? `Ocultar ${label.toLowerCase()}`
              : `Mostrar ${label.toLowerCase()}`
          }
          onClick={
            onToggleVisibility
          }
        >
          {visible
            ? 'Ocultar'
            : 'Mostrar'}
        </button>
      </span>
    </label>
  )
}

function AccountSidebar() {
  const auth =
    useAuth()

  const navigate =
    useNavigate()

  const [
    logoutPending,
    setLogoutPending,
  ] =
    useState(false)

  function handleLogout(): void {
    if (
      logoutPending
    ) {
      return
    }

    setLogoutPending(
      true,
    )

    void auth
      .logout()
      .then(() =>
        navigate({
          to: '/',
          replace: true,
        }),
      )
      .finally(() => {
        setLogoutPending(
          false,
        )
      })
  }

  return (
    <aside className="hidden h-fit overflow-hidden rounded-panel bg-card lg:sticky lg:top-24 lg:block">
      <Typography
        as="h2"
        variant="heading"
        className="px-4 pb-2 pt-5"
      >
        Meu perfil
      </Typography>

      <nav
        aria-label="Configurações do perfil"
        className="grid text-sm"
      >
        <Link
          to="/profile"
          activeOptions={{
            exact: true,
          }}
          className="flex items-center gap-3 border-l-4 border-primary bg-background px-4 py-3 font-semibold text-primary"
        >
          <Icon
            name="user"
            className="size-4"
          />

          Dados do perfil
        </Link>

        <Link
          to="/wallets"
          className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary transition-colors hover:bg-background/60"
        >
          <Icon
            name="location"
            className="size-4"
          />

          Carteiras
        </Link>

        <span className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary/80">
          <Icon
            name="activity"
            className="size-4"
          />

          Atividade
        </span>

        <Link
          to="/favorites"
          className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary transition-colors hover:bg-background/60"
        >
          <Icon
            name="heart"
            className="size-4"
          />

          Lista de interesse
        </Link>

        <span className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary/80">
          <Icon
            name="activity"
            className="size-4"
          />

          Ofertas
        </span>

        <span className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary/80">
          <Icon
            name="download"
            className="size-4"
          />

          Arquivos baixados
        </span>

        <span className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-primary/80">
          <Icon
            name="danger"
            className="size-4"
          />

          Suporte
        </span>
      </nav>

      <div className="border-t border-border">
        <button
          type="button"
          disabled={
            logoutPending
          }
          onClick={
            handleLogout
          }
          className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-semibold text-primary transition-colors hover:bg-background/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name="logout"
            className="size-4"
          />

          {logoutPending
            ? 'Saindo...'
            : 'Sair'}
        </button>
      </div>
    </aside>
  )
}

interface ProfileEditorProps {
  profile: CollectorProfile
}

function ProfileEditor({
  profile,
}: ProfileEditorProps) {
  const updateProfileMutation =
    useUpdateProfileMutation()

  const updateAvatarMutation =
    useUpdateAvatarMutation()

  const avatarInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const [
    form,
    setForm,
  ] =
    useState<ProfileFormValues>(
      () => ({
        displayName:
          profile.displayName,

        username:
          profile.username,

        email:
          profile.email,

        ensName:
          profile.ensName,

        walletNickname:
          profile.walletNickname,
      }),
    )

  const [
    profileSaved,
    setProfileSaved,
  ] =
    useState(false)

  const [
    avatarSaved,
    setAvatarSaved,
  ] =
    useState(false)

  const [
    avatarClientError,
    setAvatarClientError,
  ] =
    useState<
      string | null
    >(null)

  const displayNameError =
    getFieldError(
      updateProfileMutation.error,
      'displayName',
    )

  const usernameError =
    getFieldError(
      updateProfileMutation.error,
      'username',
    )

  const emailError =
    getFieldError(
      updateProfileMutation.error,
      'email',
    )

  const ensNameError =
    getFieldError(
      updateProfileMutation.error,
      'ensName',
    )

  const walletNicknameError =
    getFieldError(
      updateProfileMutation.error,
      'walletNickname',
    )

  const profileErrorMessage =
    getProfileErrorMessage(
      updateProfileMutation.error,
    )

  const avatarErrorMessage =
    avatarClientError ??
    getAvatarErrorMessage(
      updateAvatarMutation.error,
    )

  function handleProfileSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    setProfileSaved(
      false,
    )

    updateProfileMutation.reset()

    const request:
      UpdateProfileRequest = {
        displayName:
          form.displayName.trim(),

        username:
          form.username.trim(),

        email:
          form.email.trim(),

        ensName:
          form.ensName.trim(),

        walletNickname:
          form.walletNickname.trim(),

        expectedVersion:
          profile.version,
      }

    updateProfileMutation.mutate(
      request,
      {
        onSuccess: () => {
          setProfileSaved(
            true,
          )
        },
      },
    )
  }

  function handleAvatarSelection(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const file =
      event.target.files?.[0]

    event.target.value =
      ''

    if (!file) {
      return
    }

    setAvatarSaved(
      false,
    )

    setAvatarClientError(
      null,
    )

    updateAvatarMutation.reset()

    if (
      !acceptedAvatarTypes.has(
        file.type,
      )
    ) {
      setAvatarClientError(
        'Use uma imagem PNG, JPEG ou WebP.',
      )

      return
    }

    if (
      file.size >
      MAX_AVATAR_SIZE_BYTES
    ) {
      setAvatarClientError(
        'A imagem deve ter no máximo 2 MB.',
      )

      return
    }

    void fileToDataUrl(
      file,
    )
      .then(
        (
          avatarDataUrl,
        ) => {
          updateAvatarMutation.mutate(
            {
              avatarDataUrl,

              expectedVersion:
                profile.version,
            },
            {
              onSuccess:
                () => {
                  setAvatarSaved(
                    true,
                  )
                },
            },
          )
        },
      )
      .catch(
        (
          error:
            unknown,
        ) => {
          setAvatarClientError(
            error instanceof
              Error
              ? error.message
              : 'Não foi possível ler a imagem selecionada.',
          )
        },
      )
  }

  function handleRemoveAvatar(): void {
    setAvatarSaved(
      false,
    )

    setAvatarClientError(
      null,
    )

    updateAvatarMutation.reset()

    updateAvatarMutation.mutate(
      {
        avatarDataUrl:
          null,

        expectedVersion:
          profile.version,
      },
      {
        onSuccess:
          () => {
            setAvatarSaved(
              true,
            )
          },
      },
    )
  }

  return (
    <section>
      <Typography
        as="h1"
        variant="heading"
      >
        Perfil do colecionador
      </Typography>

      <form
        onSubmit={
          handleProfileSubmit
        }
        className="mt-6"
      >
        <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
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
              aria-invalid={
                Boolean(
                  displayNameError,
                )
              }
              onChange={(
                event,
              ) => {
                setProfileSaved(
                  false,
                )

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

            {displayNameError && (
              <span className="text-xs text-destructive">
                {
                  displayNameError
                }
              </span>
            )}
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
                form.username
              }
              aria-invalid={
                Boolean(
                  usernameError,
                )
              }
              onChange={(
                event,
              ) => {
                setProfileSaved(
                  false,
                )

                setForm(
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

            {usernameError && (
              <span className="text-xs text-destructive">
                {
                  usernameError
                }
              </span>
            )}
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
              aria-invalid={
                Boolean(
                  emailError,
                )
              }
              onChange={(
                event,
              ) => {
                setProfileSaved(
                  false,
                )

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

            {emailError && (
              <span className="text-xs text-destructive">
                {emailError}
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm">
            <span>
              Nome ENS
            </span>

            <Input
              placeholder="nome.eth (opcional)"
              value={
                form.ensName
              }
              aria-invalid={
                Boolean(
                  ensNameError,
                )
              }
              onChange={(
                event,
              ) => {
                setProfileSaved(
                  false,
                )

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

            {ensNameError && (
              <span className="text-xs text-destructive">
                {
                  ensNameError
                }
              </span>
            )}
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
                form.walletNickname
              }
              aria-invalid={
                Boolean(
                  walletNicknameError,
                )
              }
              onChange={(
                event,
              ) => {
                setProfileSaved(
                  false,
                )

                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    walletNickname:
                      event
                        .target
                        .value,
                  }),
                )
              }}
            />

            {walletNicknameError && (
              <span className="text-xs text-destructive">
                {
                  walletNicknameError
                }
              </span>
            )}
          </label>

          <div className="grid gap-2 text-sm">
            <span>
              Avatar
            </span>

            <div className="flex min-h-12 flex-wrap items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card">
                {profile.avatarUrl ? (
                  <img
                    src={
                      profile.avatarUrl
                    }
                    alt={`Avatar de ${profile.displayName}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <Icon
                    name="image"
                    className="size-5"
                  />
                )}
              </span>

              <input
                ref={
                  avatarInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={
                  handleAvatarSelection
                }
              />

              <Button
                type="button"
                disabled={
                  updateAvatarMutation.isPending
                }
                onClick={() => {
                  avatarInputRef.current?.click()
                }}
              >
                {updateAvatarMutation.isPending
                  ? 'Atualizando...'
                  : 'Alterar'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={
                  !profile.avatarUrl ||
                  updateAvatarMutation.isPending
                }
                onClick={
                  handleRemoveAvatar
                }
              >
                Remover
              </Button>
            </div>

            {avatarErrorMessage && (
              <span
                role="alert"
                className="text-xs text-destructive"
              >
                {
                  avatarErrorMessage
                }
              </span>
            )}

            {avatarSaved &&
              !avatarErrorMessage && (
                <span
                  role="status"
                  className="text-xs text-success"
                >
                  Avatar atualizado com sucesso.
                </span>
              )}
          </div>
        </div>

        {profileErrorMessage && (
          <p
            role="alert"
            className="mt-5 text-sm text-destructive"
          >
            {
              profileErrorMessage
            }
          </p>
        )}

        {profileSaved &&
          !profileErrorMessage && (
            <p
              role="status"
              className="mt-5 text-sm text-success"
            >
              Perfil atualizado com sucesso.
            </p>
          )}

        <Button
          type="submit"
          className="mt-6"
          disabled={
            updateProfileMutation.isPending
          }
        >
          {updateProfileMutation.isPending
            ? 'Salvando...'
            : 'Salvar perfil'}
        </Button>
      </form>
    </section>
  )
}

function PasswordEditor() {
  const passwordMutation =
    useChangePasswordMutation()

  const [
    form,
    setForm,
  ] =
    useState<PasswordFormValues>({
      currentPassword:
        '',

      newPassword:
        '',

      confirmPassword:
        '',
    })

  const [
    currentVisible,
    setCurrentVisible,
  ] =
    useState(false)

  const [
    newVisible,
    setNewVisible,
  ] =
    useState(false)

  const [
    confirmVisible,
    setConfirmVisible,
  ] =
    useState(false)

  const [
    clientError,
    setClientError,
  ] =
    useState<
      string | null
    >(null)

  const [
    passwordSaved,
    setPasswordSaved,
  ] =
    useState(false)

  const passwordErrorMessage =
    clientError ??
    getPasswordErrorMessage(
      passwordMutation.error,
    )

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    setPasswordSaved(
      false,
    )

    setClientError(
      null,
    )

    passwordMutation.reset()

    const validationError =
      validateNewPassword(
        form,
      )

    if (
      validationError
    ) {
      setClientError(
        validationError,
      )

      return
    }

    passwordMutation.mutate(
      {
        currentPassword:
          form.currentPassword,

        newPassword:
          form.newPassword,
      },
      {
        onSuccess:
          () => {
            setForm({
              currentPassword:
                '',

              newPassword:
                '',

              confirmPassword:
                '',
            })

            setCurrentVisible(
              false,
            )

            setNewVisible(
              false,
            )

            setConfirmVisible(
              false,
            )

            setPasswordSaved(
              true,
            )
          },
      },
    )
  }

  return (
    <section className="mt-10 border-t border-border/70 pt-8">
      <Typography
        as="h2"
        variant="heading"
      >
        Alterar senha
      </Typography>

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-6 max-w-[27rem] space-y-5"
      >
        <PasswordInput
          id="current-password"
          label="Senha atual"
          value={
            form.currentPassword
          }
          autoComplete="current-password"
          visible={
            currentVisible
          }
          onChange={(
            value,
          ) => {
            setPasswordSaved(
              false,
            )

            setClientError(
              null,
            )

            setForm(
              (
                current,
              ) => ({
                ...current,

                currentPassword:
                  value,
              }),
            )
          }}
          onToggleVisibility={() => {
            setCurrentVisible(
              (
                current,
              ) => !current,
            )
          }}
        />

        <PasswordInput
          id="new-password"
          label="Nova senha"
          value={
            form.newPassword
          }
          autoComplete="new-password"
          visible={
            newVisible
          }
          onChange={(
            value,
          ) => {
            setPasswordSaved(
              false,
            )

            setClientError(
              null,
            )

            setForm(
              (
                current,
              ) => ({
                ...current,

                newPassword:
                  value,
              }),
            )
          }}
          onToggleVisibility={() => {
            setNewVisible(
              (
                current,
              ) => !current,
            )
          }}
        />

        <PasswordInput
          id="confirm-new-password"
          label="Confirmar nova senha"
          value={
            form.confirmPassword
          }
          autoComplete="new-password"
          visible={
            confirmVisible
          }
          onChange={(
            value,
          ) => {
            setPasswordSaved(
              false,
            )

            setClientError(
              null,
            )

            setForm(
              (
                current,
              ) => ({
                ...current,

                confirmPassword:
                  value,
              }),
            )
          }}
          onToggleVisibility={() => {
            setConfirmVisible(
              (
                current,
              ) => !current,
            )
          }}
        />

        {passwordErrorMessage && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {
              passwordErrorMessage
            }
          </p>
        )}

        {passwordSaved &&
          !passwordErrorMessage && (
            <p
              role="status"
              className="text-sm text-success"
            >
              Senha alterada com sucesso.
            </p>
          )}

        <Button
          type="submit"
          disabled={
            passwordMutation.isPending
          }
        >
          {passwordMutation.isPending
            ? 'Alterando...'
            : 'Salvar senha'}
        </Button>
      </form>
    </section>
  )
}

export function ProfilePage() {
  const profileQuery =
    useProfileQuery()

  if (
    profileQuery.isPending
  ) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-[75svh] w-full max-w-(--content-max) px-(--page-gutter) py-8 md:py-10"
      >
        <div
          role="status"
          aria-label="Carregando perfil"
          className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]"
        >
          <div className="skeleton-shimmer h-96 rounded-panel bg-card" />

          <div className="space-y-5">
            <div className="skeleton-shimmer h-8 w-64 rounded bg-card" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="skeleton-shimmer h-20 rounded bg-card" />
              <div className="skeleton-shimmer h-20 rounded bg-card" />
              <div className="skeleton-shimmer h-20 rounded bg-card" />
              <div className="skeleton-shimmer h-20 rounded bg-card" />
            </div>

            <div className="skeleton-shimmer h-72 max-w-[27rem] rounded bg-card" />
          </div>
        </div>
      </main>
    )
  }

  if (
    profileQuery.isError ||
    !profileQuery.data
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
            Não foi possível carregar seu perfil
          </Typography>

          <Typography
            tone="muted"
            className="mt-3"
          >
            Verifique sua conexão e tente novamente.
          </Typography>

          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => {
              void profileQuery.refetch()
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
      className="mx-auto min-h-[75svh] w-full max-w-(--content-max) px-(--page-gutter) py-7 md:py-10"
    >
      <div className="grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <AccountSidebar />

        <div>
          <ProfileEditor
            profile={
              profileQuery.data
            }
          />

          <PasswordEditor />
        </div>
      </div>
    </main>
  )
}