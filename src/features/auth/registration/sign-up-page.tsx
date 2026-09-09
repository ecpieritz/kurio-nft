import { Link } from '@tanstack/react-router'

import { AuthModalLayout } from '@/features/auth/components/auth-modal-layout'
import { AuthPanel } from '@/features/auth/components/auth-panel'
import { SocialAuthOptions } from '@/features/auth/components/social-auth-options'
import { RegistrationForm } from '@/features/auth/registration/registration-form'

export function SignUpPage() {
  return (
    <AuthModalLayout>
      <AuthPanel mode="register">
        <RegistrationForm />
        <SocialAuthOptions />
        <p className="mt-10 text-center text-sm text-muted-foreground md:hidden">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Entre
          </Link>
        </p>
      </AuthPanel>
    </AuthModalLayout>
  )
}
