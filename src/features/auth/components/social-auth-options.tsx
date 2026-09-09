import { Button } from '@/components/ui/button'

export function SocialAuthOptions() {
  return (
    <div aria-label="Opções de autenticação social indisponíveis">
      <div className="my-7 flex items-center gap-3 text-xs text-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full opacity-80"
          disabled
          title="Login social indisponível nesta simulação"
        >
          <span aria-hidden="true" className="text-base font-bold text-[#4285f4]">
            G
          </span>
          Continuar com Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full opacity-80"
          disabled
          title="Login social indisponível nesta simulação"
        >
          <span aria-hidden="true" className="text-lg font-bold text-[#4267b2]">
            f
          </span>
          Continuar com Facebook
        </Button>
      </div>
    </div>
  )
}
