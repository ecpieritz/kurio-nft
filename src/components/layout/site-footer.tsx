import {
  useState,
  type FormEvent,
} from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

const benefits = [
  {
    badge: 'W',
    title:
      'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    badge: 'C',
    title:
      'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    badge: 'D',
    title:
      'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const socialItems = [
  'f',
  '◎',
  '♥',
  'in',
  '▶',
] as const

export function SiteFooter() {
  const [
    newsletterMessage,
    setNewsletterMessage,
  ] =
    useState('')

  function handleNewsletterSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()

    setNewsletterMessage(
      'A newsletter estará disponível em breve.',
    )
  }

  return (
    <footer className="bg-background text-sm md:px-(--page-gutter)">
      <div className="mx-auto max-w-(--content-max) border-t border-border/60 bg-card">
        <div className="grid gap-8 px-6 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-4 lg:gap-0">
          {benefits.map(
            (
              benefit,
            ) => (
              <section
                key={
                  benefit.title
                }
                className="lg:border-r lg:border-primary/55 lg:px-8 first:lg:pl-0"
              >
                <span className="grid size-14 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                  {benefit.badge}
                </span>

                <Typography
                  as="h2"
                  variant="subheading"
                  className="mt-4"
                >
                  {benefit.title}
                </Typography>

                <Typography
                  tone="muted"
                  className="mt-2 max-w-64 text-sm leading-relaxed"
                >
                  {benefit.description}
                </Typography>
              </section>
            ),
          )}

          <section className="lg:pl-8">
            <Typography
              as="h2"
              variant="subheading"
            >
              Antecipe-se ao próximo lançamento
            </Typography>

            <form
              className="mt-4 flex"
              onSubmit={
                handleNewsletterSubmit
              }
            >
              <label
                htmlFor="newsletter-email"
                className="sr-only"
              >
                Seu e-mail
              </label>

              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder="digite seu e-mail..."
                className="min-w-0 flex-1 rounded-l-control border border-r-0 border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground"
              />

              <Button
                type="submit"
                size="sm"
                className="rounded-l-none"
              >
                Enviar
              </Button>
            </form>

            <p
              role="status"
              className="mt-2 min-h-5 text-xs text-muted-foreground"
            >
              {newsletterMessage ||
                'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
            </p>
          </section>
        </div>

        <div className="grid gap-5 border-y border-border/60 bg-muted px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <strong className="tracking-[0.12em]">
            KURIO
          </strong>

          <span>
            Feito para colecionadores, criadores e cultura
          </span>

          <a
            href="mailto:contato@email.com"
            className="hover:text-primary"
          >
            contato@email.com
          </a>

          <a
            href="tel:+551140028922"
            className="hover:text-primary"
          >
            +55 11 4002 8922
          </a>
        </div>

        <div className="grid gap-8 px-6 py-9 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          <section>
            <Typography
              as="h2"
              variant="subheading"
            >
              Meu perfil
            </Typography>

            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/profile"
                  className="hover:text-primary"
                >
                  Meu perfil
                </Link>
              </li>

              <li>
                <Link
                  to="/favorites"
                  className="hover:text-primary"
                >
                  Minha coleção
                </Link>
              </li>

              <li>
                Atividade
              </li>

              <li>
                Estúdio do criador
              </li>

              <li>
                <Link
                  to="/favorites"
                  className="hover:text-primary"
                >
                  Lista de interesse
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <Typography
              as="h2"
              variant="subheading"
            >
              Central de ajuda
            </Typography>

            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                Central de ajuda
              </li>

              <li>
                Como comprar NFTs
              </li>

              <li>
                Carteira e segurança
              </li>

              <li>
                Política do mercado
              </li>

              <li>
                Denunciar item
              </li>
            </ul>
          </section>

          <section>
            <Typography
              as="h2"
              variant="subheading"
            >
              Coleções
            </Typography>

            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/marketplace"
                  className="hover:text-primary"
                >
                  Arte digital
                </Link>
              </li>

              <li>
                Fotografia
              </li>

              <li>
                Música
              </li>

              <li>
                Arte 3D
              </li>

              <li>
                Utilidade
              </li>
            </ul>
          </section>

          <section>
            <Typography
              as="h2"
              variant="subheading"
            >
              Redes sociais
            </Typography>

            <div
              className="mt-4 flex flex-wrap gap-2"
              aria-label="Redes sociais da Kurio"
            >
              {socialItems.map(
                (
                  item,
                  index,
                ) => (
                  <span
                    key={`${item}-${index}`}
                    aria-hidden="true"
                    className="grid size-8 place-items-center rounded-control border border-primary/60 text-xs font-bold text-primary"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <Typography
              as="h3"
              variant="subheading"
              className="mt-7"
            >
              Carteiras compatíveis
            </Typography>

            <p className="mt-3 inline-block rounded-control border border-primary/30 bg-background px-3 py-2 text-[0.65rem] uppercase text-primary">
              MetaMask · WalletConnect · Coinbase
            </p>
          </section>
        </div>

        <p className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}