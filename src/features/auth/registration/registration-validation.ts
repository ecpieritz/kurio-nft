import type { RegisterRequest } from '@/lib/api/contracts'

export interface RegistrationFormValues extends RegisterRequest {
  confirmPassword: string
}

export type RegistrationField = keyof RegistrationFormValues
export type RegistrationErrors = Partial<Record<RegistrationField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[a-zA-Z0-9_]+$/

export function validateRegistration(values: RegistrationFormValues): RegistrationErrors {
  const errors: RegistrationErrors = {}
  const username = values.username.trim()
  const email = values.email.trim()

  if (!username) {
    errors.username = 'Informe um nome de usuário.'
  } else if (username.length < 3 || username.length > 24) {
    errors.username = 'Use entre 3 e 24 caracteres.'
  } else if (!usernamePattern.test(username)) {
    errors.username = 'Use apenas letras, números e sublinhado.'
  }

  if (!email) {
    errors.email = 'Informe seu e-mail.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Digite um e-mail válido.'
  }

  if (!values.password) {
    errors.password = 'Crie uma senha.'
  } else if (values.password.length < 8) {
    errors.password = 'A senha deve ter pelo menos 8 caracteres.'
  } else if (
    !/[a-z]/.test(values.password) ||
    !/[A-Z]/.test(values.password) ||
    !/\d/.test(values.password) ||
    !/[^a-zA-Z0-9]/.test(values.password)
  ) {
    errors.password = 'Inclua letra maiúscula, minúscula, número e símbolo.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return errors
}

export function hasRegistrationErrors(errors: RegistrationErrors): boolean {
  return Object.keys(errors).length > 0
}
