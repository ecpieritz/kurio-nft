# Kurio — NFT Marketplace

Kurio é uma implementação do desafio Frontend de marketplace de NFTs, construída com React e TypeScript e com toda a camada de backend simulada no navegador por MSW.

## Deploy

Aplicação pública:

- https://kurio-nft.vercel.app

O deploy utiliza o mesmo build e os mesmos mocks da solução entregue. O `vercel.json` faz fallback das rotas da SPA para `index.html`, portanto acesso direto e refresh de rotas como `/nfts/:nftId`, `/profile` e `/checkout` continuam funcionando.

## Stack

- React 19
- TypeScript
- TanStack Router
- TanStack Query
- Axios
- REST
- Socket.IO Client
- MSW + `@mswjs/socket.io-binding`
- Tailwind CSS
- componentes baseados em shadcn/ui/Radix
- Playwright
- Lighthouse
- Vite

## Requisitos locais

- Node.js `>= 20.19.0`
- npm
- Chrome/Chromium instalado para Lighthouse
- browsers do Playwright instalados

## Instalação

```bash
npm ci
npx playwright install chromium
```

Crie um arquivo `.env` a partir de `.env.example` somente se quiser sobrescrever a configuração padrão:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

## Variáveis de ambiente

```env
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=10000
VITE_ENABLE_MOCKS=true
VITE_MOCK_SCENARIO=default
VITE_REALTIME_URL=
```

| Variável              | Função                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | Prefixo usado pelo cliente Axios.                                                                                             |
| `VITE_API_TIMEOUT_MS` | Timeout das chamadas REST.                                                                                                    |
| `VITE_ENABLE_MOCKS`   | `true` ativa MSW no build de desenvolvimento/demonstração.                                                                    |
| `VITE_MOCK_SCENARIO`  | Cenário determinístico inicial.                                                                                               |
| `VITE_REALTIME_URL`   | Endpoint Socket.IO opcional. Quando vazio e os mocks estão ativos, usa o endpoint interceptado `https://realtime.kurio.test`. |

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run check
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:update
npm run test:e2e:report
npm run lighthouse
```

`npm run check` executa typecheck, lint e verificação de formatação.

`npm run lighthouse` gera um build otimizado, inicia o preview local e executa três auditorias de Início e Detalhe do NFT nos perfis desktop e mobile, salvando HTML, JSON e o resumo das medianas em `lighthouse-results/`.

Para auditar o deploy público em vez do preview local:

```powershell
$env:LIGHTHOUSE_BASE_URL="https://kurio-nft.vercel.app"
npm run lighthouse
```

Em macOS/Linux:

```bash
LIGHTHOUSE_BASE_URL=https://kurio-nft.vercel.app npm run lighthouse
```

Para transformar resultados abaixo das metas em exit code diferente de zero:

```powershell
$env:LIGHTHOUSE_ENFORCE_THRESHOLDS="true"
npm run lighthouse
```

## Credenciais fictícias

### Nova Kurio

```text
E-mail: nova@kurio.test
Senha: Kurio123!
```

### Orion Collector

```text
E-mail: orion@kurio.test
Senha: Collector123!
```

As senhas não são persistidas em texto puro no banco mockado. As fixtures armazenam apenas o digest SHA-256 usado pela simulação.

## Mocking e persistência

MSW é inicializado antes do React montar a aplicação. REST e Socket.IO são interceptados na camada de rede; os componentes não possuem caminhos alternativos de negócio para os mocks.

O estado simulado é persistido em `localStorage` sob uma base versionada e contém usuários, sessões, catálogo, favoritos, carrinhos, cotações, pedidos, perfil e carteiras. O reset restaura as fixtures conhecidas de forma integral.

### Selecionar cenário pela URL

O cenário pode ser informado em qualquer rota:

```text
/?mockScenario=slow-network
/marketplace?mockScenario=empty-catalog
/nfts/emerald-ape-042?mockScenario=price-changed
```

O cenário selecionado fica persistido até ser alterado ou resetado.

Cenários disponíveis:

```text
default
empty-catalog
slow-network
variable-latency
out-of-order
offline
timeout
http-422
server-error
session-expired
registration-conflict
invalid-coupon
expired-coupon
price-changed
edition-sold-out
favorite-mutation-error
realtime-stale-duplicate
realtime-reconnect
order-timeout
payment-confirmed
payment-declined
```

### Controle dos mocks pelo navegador

Os endpoints de controle também são interceptados pelo MSW:

```text
GET  /api/__mock/scenario
PUT  /api/__mock/scenario
POST /api/__mock/reset
GET  /api/__mock/state
GET  /api/__mock/probe
```

Exemplo no console do navegador para selecionar um cenário:

```js
await fetch('/api/__mock/scenario', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenarioId: 'payment-declined' }),
})
```

Reset completo:

```js
await fetch('/api/__mock/reset', { method: 'POST' })
location.reload()
```

## Como reproduzir fluxos de falha

### Resultado vazio

```text
/?mockScenario=empty-catalog
```

### Rede lenta e skeletons

```text
/?mockScenario=slow-network
```

### Erro HTTP recuperável

```text
/?mockScenario=server-error
```

### Sessão expirada

1. Entre com uma das contas fictícias.
2. Selecione `session-expired` pelo endpoint de controle ou pela URL.
3. Acesse/recarregue uma rota protegida.
4. A aplicação limpa a sessão privada e preserva o contexto de retorno para o login.

### Cupom inválido ou expirado

Selecione `invalid-coupon` ou `expired-coupon` antes de gerar a cotação no carrinho/checkout.

### Alteração de preço em tempo real

1. Adicione `Emerald Ape #042` ao carrinho.
2. Selecione `price-changed`.
3. O handler Socket.IO/MSW emite `nft.updated`.
4. Catálogo, detalhe e carrinho são sincronizados; a cotação deixa de ser válida.

### Edição esgotada

Use `edition-sold-out`. A edição `1/50` do Emerald Ape fica indisponível e o checkout bloqueia confirmação com dados obsoletos.

### Timeout após criar pedido

Use `order-timeout`. O pedido é persistido antes da resposta de criação ser interrompida. A chave de idempotência fica salva e a recuperação retorna o mesmo pedido em vez de criar outro.

### Pagamento recusado

Use `payment-declined`. O pedido chega ao estado terminal `declined` e o carrinho é preservado.

### Reconexão do tempo real

Use `realtime-reconnect`. O mock encerra a primeira conexão Socket.IO e o cliente reconecta. Após reconexão, recursos ativos são reconciliados via REST.

## REST

Os contratos TypeScript ficam em `src/lib/api/contracts/`. O cliente HTTP único fica em `src/lib/api/client.ts` e usa Axios.

Recursos implementados:

- autenticação e sessão;
- catálogo e detalhe de NFTs;
- favoritos;
- carrinho;
- cotação;
- pedidos e recuperação idempotente;
- perfil/avatar/senha;
- carteiras.

A documentação das decisões, cache, sessão, carrinho, pedidos e reconciliação REST/Socket.IO está em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Tempo real

O frontend usa `socket.io-client`. No modo mock, a conexão aponta para `https://realtime.kurio.test` e é interceptada por MSW com `@mswjs/socket.io-binding`; não existe servidor Socket.IO privado.

Eventos implementados:

```text
nft.updated
order.updated
```

Ambos possuem identidade estável e versão. O cliente ignora duplicatas e versões antigas. `order.updated` é filtrado pela sessão ativa; o mock associa a conexão ao token de sessão enviado no handshake.

Depois de uma reconexão, catálogo, carrinho e pedidos ativos são invalidados para reconciliação com a API REST.

## Playwright

```bash
npm run test:e2e
```

A execução padrão usa Chromium nos viewports:

- desktop: `1440 × 1000`;
- mobile: `390 × 844` com touch/mobile habilitado.

O conjunto padrão é a suíte cross-viewport estável configurada em `playwright.config.ts`. Specs adicionais de conta, favoritos e resiliência em tempo real permanecem versionadas para hardening e documentação dos cenários avançados.

Baselines visuais versionadas:

```text
tests/e2e/__screenshots__/chromium-desktop/
tests/e2e/__screenshots__/chromium-mobile/
```

Relatório HTML:

```bash
npm run test:e2e:report
```

Traces, screenshots e vídeos são retidos para falhas.

Mais detalhes em [`tests/e2e/README.md`](./tests/e2e/README.md).

## Lighthouse

A configuração reproduzível fica em:

```text
scripts/lighthouse.config.mjs
scripts/run-lighthouse.mjs
```

Condições da auditoria automatizada:

- Lighthouse CLI `13.4.1`;
- cenário MSW `default`;
- modo Navigation;
- Chrome headless/incognito;
- extensões desabilitadas;
- 3 execuções por página e perfil;
- Início e Detalhe do NFT;
- mobile e desktop;
- Performance, Accessibility, Best Practices e SEO;
- registro de LCP, CLS e TBT;
- HTML e JSON de cada execução;
- `summary.md` e `summary.json` com medianas.

Metas:

| Categoria      |  Meta |
| -------------- | ----: |
| Performance    | >= 90 |
| Accessibility  | >= 95 |
| Best Practices | >= 95 |
| SEO            | >= 90 |

Os relatórios exploratórios anteriores podem ser arquivados fora de `public/`. Para a entrega final, prefira versionar `lighthouse-results/`, gerado pelo comando acima, para não incluir relatórios como assets públicos do Vite.

## Estrutura principal

```text
src/
  components/
  features/
  lib/
    api/
    auth/
    eth/
    query/
    realtime/
  mocks/
    auth/
    database/
    fixtures/
    handlers/
    scenarios/
  router/
scripts/
tests/e2e/
```

## Limitações conhecidas

- Blockchain, extensões de carteira e gateway de pagamento são simulações, conforme o escopo do desafio.
- O binding Socket.IO do MSW cobre os eventos usados pelo desafio, não pretende reproduzir todos os recursos de um servidor Socket.IO real.
- A execução E2E padrão prioriza o subconjunto cross-viewport estável; specs avançadas adicionais permanecem no repositório para hardening.
- A auditoria Lighthouse é sensível à máquina e versão do Chrome; a entrega usa mediana de três execuções nas mesmas condições.
