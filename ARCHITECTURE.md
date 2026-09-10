# Arquitetura — Kurio NFT Marketplace

## 1. Objetivos

A solução foi estruturada para manter as regras de negócio fora dos componentes de interface, utilizar a stack exigida efetivamente e permitir que desenvolvimento, demonstração e testes usem a mesma camada de integração.

Fluxo principal:

```text
React UI
  ↓
Feature components / hooks
  ↓
TanStack Query
  ↓
Axios
  ↓
Contratos REST TypeScript
  ↓
MSW handlers
  ↓
PersistentMockDatabase
```

Tempo real:

```text
socket.io-client
  ↓
WebSocket
  ↓
MSW ws.link
  ↓
@mswjs/socket.io-binding
  ↓
nft.updated / order.updated
  ↓
TanStack Query cache
  ↓
reconciliação REST após reconnect
```

## 2. Responsabilidades por diretório

### `src/components`

Componentes reutilizáveis de layout, mídia, SEO e primitives visuais. Não contém respostas fictícias de API nem regras de negócio dos mocks.

### `src/features`

Organização por domínio funcional:

- `auth` — login, cadastro e sessão;
- `catalog` — listagem, filtros, ordenação e detalhe;
- `favorites` — favoritos e optimistic update;
- `cart` — carrinho persistente;
- `quote` — cotação e valores finais;
- `checkout` — revisão e envio;
- `orders` — criação, recuperação e recibo;
- `profile` — dados/avatar/senha;
- `wallets` — carteiras;
- `realtime` — aplicação dos eventos no cache.

### `src/lib/api`

Contratos de transporte, cliente Axios, endpoints e normalização de erros.

### `src/mocks`

Banco persistente, fixtures, autenticação simulada, cenários de rede e handlers MSW REST/Socket.IO.

### `src/router`

Árvore TanStack Router, rotas públicas/protegidas, parâmetros e fallback.

## 3. Roteamento

TanStack Router é responsável pela navegação e proteção dos fluxos privados.

Rotas públicas principais:

```text
/
/marketplace
/nfts/$nftId
/cart
/login
/sign-up
```

Rotas autenticadas:

```text
/checkout
/orders/$orderId
/favorites
/profile
/wallets
```

A recuperação inicial da sessão bloqueia apenas navegações protegidas. Páginas públicas podem renderizar enquanto a sessão é restaurada, evitando serializar o carregamento da Home com `GET /auth/session`.

No deploy Vercel, `vercel.json` faz rewrite de rotas para `/index.html`, permitindo acesso direto e refresh em rotas internas.

## 4. Cliente REST e contratos

Todas as chamadas REST passam por uma única instância Axios em `src/lib/api/client.ts`.

Comportamentos globais:

- `baseURL` configurável por `VITE_API_BASE_URL`;
- timeout configurável por `VITE_API_TIMEOUT_MS`;
- token Bearer aplicado via interceptor;
- erros Axios normalizados para `ApiClientError`;
- `401/SESSION_EXPIRED` fora das mutations de autenticação dispara a política global de expiração.

Contratos ficam em `src/lib/api/contracts/` e usam tipos explícitos para IDs, versões, timestamps e valores ETH.

### Endpoints

| Recurso                 | Método       | Endpoint                               |
| ----------------------- | ------------ | -------------------------------------- |
| Cadastro                | POST         | `/api/auth/register`                   |
| Login                   | POST         | `/api/auth/login`                      |
| Sessão                  | GET          | `/api/auth/session`                    |
| Logout                  | POST         | `/api/auth/logout`                     |
| NFTs                    | GET          | `/api/nfts`                            |
| NFT                     | GET          | `/api/nfts/:nftId`                     |
| Favoritos               | GET          | `/api/favorites`                       |
| Favorito                | PUT/DELETE   | `/api/favorites/:nftId`                |
| Carrinho                | GET          | `/api/cart`                            |
| Item do carrinho        | POST         | `/api/cart/items`                      |
| Item do carrinho        | PATCH/DELETE | `/api/cart/items/:itemId`              |
| Cotação                 | POST         | `/api/quotes`                          |
| Cotação                 | GET          | `/api/quotes/:quoteId`                 |
| Pedido                  | POST         | `/api/orders`                          |
| Pedido                  | GET          | `/api/orders/:orderId`                 |
| Recuperação idempotente | GET          | `/api/orders/recovery/:idempotencyKey` |
| Perfil                  | GET/PATCH    | `/api/profile`                         |
| Avatar                  | PATCH        | `/api/profile/avatar`                  |
| Senha                   | PATCH        | `/api/profile/password`                |
| Carteiras               | GET/POST     | `/api/wallets`                         |
| Carteira                | PATCH        | `/api/wallets/:walletId`               |

## 5. Valores ETH

Valores monetários trafegam como strings decimais (`DecimalString`). Isso evita usar `number` como representação monetária de ETH e perder precisão durante transporte/cálculo.

A cotação retornada pela API é a autoridade para finalizar o pedido. O checkout revalida a cotação antes da criação do pedido e exige nova revisão quando preço, disponibilidade, cupom ou taxa mudam.

Quantidades são números inteiros e são validadas contra a edição selecionada.

## 6. Sessão

O token de sessão é mantido em memória e `localStorage` sob a chave:

```text
kurio:session-token:v1
```

`AuthProvider` recupera a sessão via REST após refresh.

Na expiração:

1. o token é removido;
2. o contexto atual é guardado para retorno;
3. caches privados são removidos;
4. o usuário é redirecionado para login;
5. após autenticação, o fluxo anterior é retomado.

Escopos privados removidos no logout/troca de sessão:

```text
auth
profile
wallets
favorites
orders
```

O carrinho usa ownership próprio e é reconciliado separadamente para suportar merge visitante → usuário.

As senhas das fixtures não são armazenadas em texto puro. `src/mocks/auth/password.ts` calcula SHA-256 via Web Crypto e compara digests apenas na camada mockada.

## 7. Carrinho

Carrinhos anônimos são identificados por:

```text
X-Kurio-Visitor-Id
```

O `visitorId` é persistido em:

```text
kurio:visitor-id:v1
```

Carrinhos autenticados são associados ao `userId`.

Ao autenticar com um carrinho visitante ativo, o handler MSW reconcilia/mescla os itens no carrinho do usuário, respeitando disponibilidade e quantidade.

Cada item mantém:

- NFT e edição;
- preço unitário observado;
- quantidade;
- disponibilidade observada;
- flags `priceChanged` e `availabilityChanged`;
- versão.

Eventos `nft.updated` atualizam esses campos no cache e removem cotações potencialmente obsoletas.

## 8. TanStack Query e estratégia de cache

Configuração padrão em `src/lib/query/query-client.ts`:

```text
staleTime: 30 segundos
gcTime: 5 minutos
refetchOnWindowFocus: true
mutations: sem retry automático
```

Queries repetem somente erros `ApiClientError` marcados como `retryable`, no máximo duas vezes.

Chaves são separadas por domínio e parâmetros. Exemplos:

```text
['nfts', 'list', request]
['nfts', 'detail', nftId]
['favorites', userId]
['cart', ownerKey]
['orders', 'detail', orderId]
```

Isso evita compartilhar respostas entre filtros diferentes ou usuários diferentes.

### Optimistic update

Favoritos usam optimistic update:

1. cancela a consulta ativa;
2. captura snapshot anterior;
3. atualiza o cache imediatamente;
4. em falha, restaura o snapshot;
5. em settled, invalida para reconciliar com REST.

## 9. Mock database

`PersistentMockDatabase` mantém uma representação única e coerente dos recursos simulados.

Storage:

```text
kurio:msw:database:v1
```

O banco é clonado em leitura/escrita para evitar mutações acidentais fora da transação simulada.

`POST /api/__mock/reset` substitui todo o estado pelas fixtures conhecidas e volta o cenário para `default`.

## 10. Cenários de rede

A camada `src/mocks/scenarios/` centraliza efeitos determinísticos de rede e flags de negócio.

Exemplos:

- latência fixa/variável;
- respostas fora de ordem;
- offline;
- timeout;
- HTTP 422/503;
- sessão expirada;
- conflito de cadastro;
- cupom inválido/expirado;
- preço alterado;
- edição esgotada;
- mutation de favorito com erro;
- desconexão/reconexão Socket.IO;
- timeout após criação do pedido;
- pagamento confirmado/recusado.

O cenário pode vir de ambiente, query string, `localStorage` ou endpoint de controle.

## 11. Tempo real

### Transporte

A aplicação usa `socket.io-client` de verdade. Quando `VITE_ENABLE_MOCKS !== 'false'` e nenhum endpoint externo é configurado, o cliente se conecta a:

```text
https://realtime.kurio.test
```

O Socket.IO converte o transporte para WebSocket em:

```text
wss://realtime.kurio.test/socket.io/
```

Essa conexão é interceptada pelo `ws.link` do MSW e adaptada ao protocolo Socket.IO por `@mswjs/socket.io-binding`.

Isso evita uma tentativa de conexão real contra o host do deploy e mantém o fluxo de demonstração inteiramente autocontido.

### `nft.updated`

Payload contém:

- `nftId`;
- `version`;
- preço atual/anterior;
- disponibilidade total;
- disponibilidade por edição;
- `occurredAt`.

O `RealtimeProvider` encontra a maior versão conhecida no detalhe/listagens. Eventos com `version <= latestVersion` são ignorados.

Quando aceito, o evento atualiza:

- detalhe;
- todas as listas em cache;
- carrinhos ativos;
- flags de alteração de preço/disponibilidade;
- invalida cotações.

### `order.updated`

Payload contém:

- `orderId`;
- `userId`;
- `version`;
- snapshot tipado do `Order`;
- `occurredAt`.

A conexão Socket.IO envia o token atual no query do handshake. O handler mock resolve a sessão correspondente e emite eventos de pedido apenas daquela sessão.

No cliente:

- evento de outro `userId` é descartado;
- identidade do payload é validada;
- versões antigas/duplicadas são descartadas;
- o cache do pedido é atualizado;
- estados terminais invalidam carrinho/catálogo e removem cotações.

### Reconexão

A primeira conexão não causa refetch extra, protegendo o caminho crítico inicial.

A partir da segunda conexão (`reconnect`), o cliente invalida recursos ativos via REST:

```text
nfts
cart
orders (quando autenticado)
quotes
```

REST permanece a fonte de reconciliação após interrupções.

### Limitações do binding

O binding é usado somente para os eventos necessários ao desafio. Rooms, namespaces avançados, acknowledgements complexos e recursos não utilizados pelo Kurio não são simulados.

## 12. Pedidos e idempotência

Criação de pedido exige:

```http
Idempotency-Key: <key>
```

A camada mock persiste:

- chave;
- usuário;
- fingerprint do request;
- `orderId`;
- snapshot imutável usado no recibo.

Regras:

```text
mesma chave + mesmo request → mesmo pedido
mesma chave + request diferente → IDEMPOTENCY_CONFLICT
```

Em `order-timeout`, o pedido é salvo antes da resposta ser interrompida. O frontend persiste temporariamente a chave em:

```text
kurio:pending-order:v1
```

Após timeout/reconexão/refresh, `GET /orders/recovery/:idempotencyKey` recupera o pedido original.

### Recibo imutável

O recibo é montado a partir do snapshot criado junto ao pedido, e não do catálogo atual. Mudanças posteriores em preço, NFT, carteira ou disponibilidade não alteram o comprovante confirmado.

## 13. Perfil e carteiras

Perfil utiliza versionamento otimista (`expectedVersion`) para evitar sobrescrita silenciosa de um recurso mais novo.

Alterações de nome/e-mail/username sincronizam também o usuário da sessão no cache.

Avatar aceita PNG/JPEG/WebP dentro do limite definido pela UI/mock.

Carteiras possuem versão, rede, provider e flag `primary`. Ao promover uma carteira, a anterior deixa de ser principal.

## 14. Acessibilidade

Decisões principais:

- landmarks e headings semânticos;
- labels associados a inputs;
- mensagens de erro por campo e `role="alert"`/`role="status"` quando apropriado;
- foco visível;
- controle de foco nos diálogos;
- navegação por teclado;
- `alt` para imagens relevantes;
- ícones decorativos com `aria-hidden`;
- ícones coloridos por CSS mask em elemento vetorial, evitando imagem 1×1 de baixa resolução;
- skeletons com dimensões estáveis e shimmer compatível com reduced motion;
- responsividade sem overflow horizontal intencional.

## 15. Imagens e performance

Os quatro artworks principais possuem WebP em 400 e 800 px.

`NftArtwork` fornece `srcSet` e `sizes`, deixando o navegador escolher a largura adequada.

A imagem principal da Home usa preload e prioridade alta; imagens abaixo da dobra permanecem lazy quando apropriado.

O Socket.IO é importado dinamicamente e conectado depois do caminho crítico inicial.

## 16. Lighthouse

Configuração versionada:

```text
scripts/lighthouse.config.mjs
scripts/run-lighthouse.mjs
```

O runner:

1. usa build otimizado;
2. inicia `vite preview` quando auditando localhost;
3. executa Lighthouse `13.4.1`;
4. usa `default` como cenário MSW;
5. executa Início e Detalhe;
6. executa mobile e desktop;
7. repete três vezes cada combinação;
8. produz HTML + JSON;
9. calcula mediana de Performance, Accessibility, Best Practices, SEO, LCP, CLS e TBT;
10. grava `summary.md` e `summary.json`.

## 17. Testes E2E

Playwright utiliza o mesmo build e os mesmos handlers MSW da aplicação.

Cada teste da suíte padrão:

- começa com reset do banco/scenario;
- remove sessão/visitor/pedido pendente transitórios;
- executa em Chromium desktop e mobile;
- usa baselines visuais versionadas para Home, detalhe, carrinho e checkout.

A configuração atual executa o subconjunto cross-viewport estável. Specs avançadas de conta, favoritos e realtime permanecem versionadas como cenários de hardening e são uma limitação conhecida da entrega atual.

## 18. Decisões e desvios de UX/Figma

- Estados sem frame específico (erro, loading, vazio, confirmação mobile) seguem os mesmos tokens, tipografia e linguagem visual dos frames fornecidos.
- Login/cadastro são rotas para preservar navegação direta e contexto, mas no desktop são apresentados visualmente como modal sobre a Home.
- Ações editoriais fora do escopo não simulam sucesso de backend.
- Integrações sociais e blockchain reais não são acionadas; somente a simulação definida no desafio é apresentada como funcional.
- Dados de carteira, hashes, explorer URLs e transações são deliberadamente fictícios.

## 19. Limitações conhecidas

- MSW e Socket.IO binding são destinados à demonstração/testes; não representam infraestrutura de backend real.
- O estado persistente é local ao navegador/dispositivo.
- SHA-256 é suficiente apenas para a fixture simulada; uma aplicação real usaria hashing de senha no backend com algoritmo próprio para password hashing e salt.
- A suíte E2E padrão não inclui todos os specs avançados versionados; eles permanecem disponíveis para hardening.
- Resultados Lighthouse variam conforme hardware/Chrome. A comparação oficial da entrega deve usar as três execuções reproduzíveis nas mesmas condições.
