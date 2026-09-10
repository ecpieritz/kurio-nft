# Kurio E2E — Playwright

A suíte usa o build otimizado do Vite e os handlers MSW da própria aplicação. Os fluxos REST passam pelos handlers MSW e os cenários de tempo real usam o binding Socket.IO/MSW com o `socket.io-client` real da aplicação.

## Execução padrão

```bash
npm run test:e2e
npm run test:e2e:report
```

`playwright.config.ts` executa o subconjunto cross-viewport estável em:

- `chromium-desktop`: 1440 × 1000;
- `chromium-mobile`: 390 × 844, touch/mobile habilitado.

O relatório HTML é salvo em `playwright-report/`. Traces, screenshots e vídeos de falhas ficam em `test-results/`.

A configuração padrão seleciona:

```text
catalog.spec.ts
authentication.spec.ts
commerce.spec.ts
accessibility-visual.spec.ts
```

Specs adicionais permanecem versionadas para hardening:

```text
account.spec.ts
favorites.spec.ts
realtime-resilience.spec.ts
```

Esses arquivos documentam cenários avançados, mas não fazem parte do `testMatch` da execução padrão atual.

## Baselines visuais

As baselines são versionadas em:

```text
tests/e2e/__screenshots__/
```

Para atualizar uma mudança visual intencional:

```bash
npm run test:e2e:update -- accessibility-visual.spec.ts -g "stable visual baselines"
```

Revise as imagens antes de versioná-las. A comparação usa `maxDiffPixelRatio: 0.01`.

## Cobertura da execução padrão

- busca, filtros combinados, ordenação, paginação e restauração da URL/histórico;
- acesso direto ao detalhe e NFT inexistente;
- interações do catálogo da Home sem navegação indevida para Marketplace;
- cadastro, sessão persistente e logout com confirmação;
- carrinho visitante, quantidade, refresh, merge após login e remoção;
- preservação do carrinho em pagamento recusado;
- regressão visual de Home, detalhe, carrinho e checkout em desktop/mobile.

## Specs avançadas versionadas

Os specs fora da execução padrão cobrem ou documentam:

- perfil, avatar, senha e carteiras;
- rollback de favorito;
- redirecionamento de favorito anônimo;
- alteração de preço/disponibilidade via Socket.IO;
- duplicatas/eventos antigos;
- reconexão;
- recuperação de pedido pendente;
- compra completa e idempotência;
- skeleton/falha/retry;
- teclado/foco de diálogos.

Eles permanecem no repositório para hardening, mas não são apresentados como testes aprovados pela execução padrão.

## Isolamento

A fixture automática:

1. carrega a aplicação;
2. executa `POST /api/__mock/reset`;
3. remove dados transitórios de sessão, visitante, pedido pendente e cenário;
4. recarrega a aplicação.

Assim cada teste parte de um estado conhecido.

## Cenários sensíveis a tempo

O endpoint MSW `/api/__mock/scenario` controla latência/falhas/eventos. Cenários avançados podem fixar o relógio do Playwright para evitar esperas arbitrárias quando a regra depende de tempo.

## Artefatos

Configuração:

```text
playwright.config.ts
```

Baselines:

```text
tests/e2e/__screenshots__/
```

Relatório local:

```text
playwright-report/
```

Falhas/traces:

```text
test-results/
```
