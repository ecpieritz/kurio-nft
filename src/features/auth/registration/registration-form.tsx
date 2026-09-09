import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import {
  hasRegistrationErrors,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationField,
  type RegistrationFormValues,
} from '@/features/auth/registration/registration-validation'
import { useRegisterMutation } from '@/features/auth/registration/use-register-mutation'
import { ApiClientError } from '@/lib/api/error'

const initialValues: RegistrationFormValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const registrationFields: RegistrationField[] = ['username', 'email', 'password', 'confirmPassword']

function isRegistrationField(field: string): field is RegistrationField {
  return registrationFields.some((registrationField) => registrationField === field)
}

interface FieldErrorProps {
  id: string
  message?: string
}

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null

  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-destructive">
      {message}
    </p>
  )
}

interface RegistrationFormProps {
  onRegistered?: () => void
}

export function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [registeredUsername, setRegisteredUsername] = useState<string>()
  const registerMutation = useRegisterMutation()

  function updateField(field: RegistrationField, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    registerMutation.reset()
  }

  function validateField(field: RegistrationField) {
    const nextErrors = validateRegistration(values)
    setErrors((currentErrors) => ({ ...currentErrors, [field]: nextErrors[field] }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateRegistration(values)

    if (hasRegistrationErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    registerMutation.mutate(
      {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
      {
        onSuccess: ({ user }) => {
          setRegisteredUsername(user.username)
          setValues(initialValues)
          setErrors({})
          onRegistered?.()
        },
        onError: (error) => {
          if (!(error instanceof ApiClientError) || !error.fieldErrors) return

          const responseErrors: RegistrationErrors = {}
          for (const fieldError of error.fieldErrors) {
            if (isRegistrationField(fieldError.field)) {
              responseErrors[fieldError.field] = fieldError.message
            }
          }
          setErrors(responseErrors)
        },
      },
    )
  }

  if (registeredUsername) {
    return (
      <section role="status" aria-live="polite" className="py-12 text-center">
        <Typography as="h2" variant="heading">
          Perfil criado com sucesso
        </Typography>
        <Typography tone="muted" className="mt-4">
          @{registeredUsername}, sua conta já está pronta para acessar a Kurio.
        </Typography>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link to="/login">Entrar</Link>
        </Button>
      </section>
    )
  }

  const generalError =
    registerMutation.error instanceof ApiClientError ? registerMutation.error.message : undefined

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-8" aria-label="Criar conta Kurio">
      {generalError && (
        <div role="alert" className="mb-4 rounded-control border border-destructive/70 p-3 text-xs">
          {generalError}
        </div>
      )}

      <div>
        <label htmlFor="registration-username" className="sr-only">
          Nome de usuário
        </label>
        <Input
          id="registration-username"
          name="username"
          autoComplete="username"
          placeholder="Nome de usuário"
          value={values.username}
          disabled={registerMutation.isPending}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? 'registration-username-error' : undefined}
          onChange={(event) => updateField('username', event.target.value)}
          onBlur={() => validateField('username')}
        />
        <FieldError id="registration-username-error" message={errors.username} />
      </div>

      <div className="mt-3">
        <label htmlFor="registration-email" className="sr-only">
          E-mail
        </label>
        <Input
          id="registration-email"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          spellCheck={false}
          placeholder="Digite seu e-mail"
          value={values.email}
          disabled={registerMutation.isPending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'registration-email-error' : undefined}
          onChange={(event) => updateField('email', event.target.value)}
          onBlur={() => validateField('email')}
        />
        <FieldError id="registration-email-error" message={errors.email} />
      </div>

      <div className="relative mt-3">
        <label htmlFor="registration-password" className="sr-only">
          Senha
        </label>
        <Input
          id="registration-password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Senha"
          value={values.password}
          disabled={registerMutation.isPending}
          className="pr-16"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'registration-password-error' : undefined}
          onChange={(event) => updateField('password', event.target.value)}
          onBlur={() => validateField('password')}
        />
        <button
          type="button"
          className="absolute right-3 top-3 min-h-6 px-1 text-xs text-primary hover:underline"
          aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((visible) => !visible)}
        >
          {showPassword ? 'Ocultar' : 'Mostrar'}
        </button>
        <FieldError id="registration-password-error" message={errors.password} />
      </div>

      <div className="mt-3">
        <label htmlFor="registration-password-confirmation" className="sr-only">
          Confirmar senha
        </label>
        <Input
          id="registration-password-confirmation"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Confirmar senha"
          value={values.confirmPassword}
          disabled={registerMutation.isPending}
          className="pr-16"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? 'registration-password-confirmation-error' : undefined
          }
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          onBlur={() => validateField('confirmPassword')}
        />
        <FieldError
          id="registration-password-confirmation-error"
          message={errors.confirmPassword}
        />
      </div>

      <Button type="submit" size="lg" className="mt-8 w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Criando perfil...' : 'Criar perfil'}
      </Button>
    </form>
  )
}
