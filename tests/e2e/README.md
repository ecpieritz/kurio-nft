# Kurio E2E — Playwright

A suíte usa o build otimizado do Vite e os handlers MSW da própria aplicação. Os fluxos REST passam pelos handlers MSW e os cenários de tempo real são emitidos pelo binding Socket.IO/MSW e recebidos pelo `socket.io-client` da aplicação.

## Execução

```bash
npm run test:e2e
npm run test:e2e:report
```

O `playwright.config.ts` executa todos os fluxos em Chromium nos dois perfis exigidos:

- `chromium-desktop`: 1440 × 1000
- `chromium-mobile`: 390 × 844, touch/mobile habilitado

O relatório HTML é salvo em `playwright-report/`. Traces, screenshots e vídeos de falhas ficam em `test-results/`.

## Baselines visuais

As baselines são arquivos versionáveis em:

```text
tests/e2e/__screenshots__/
```

Na primeira execução após uma alteração visual intencional, gere/atualize as quatro baselines nos dois projetos:

```bash
npm run test:e2e:update -- accessibility-visual.spec.ts -g "stable visual baselines"
```

Revise as imagens geradas antes de versioná-las. Depois, a execução normal usa comparação pixel a pixel com `maxDiffPixelRatio: 0.01`.

## Matriz de cobertura

| Requisito | Especificação |
| --- | --- |
| Busca, filtros, ordenação, paginação e histórico | `catalog.spec.ts` |
| Detalhe direto e NFT inexistente | `catalog.spec.ts` |
| Cadastro, login, expiração, logout e troca de usuário | `authentication.spec.ts` |
| Favoritos, optimistic update, falha e rollback | `favorites.spec.ts` |
| Carrinho, quantidade, remoção, cupom e persistência | `commerce.spec.ts` |
| Compra completa até recibo confirmado | `commerce.spec.ts` |
| Falha, clique repetido, idempotência e timeout | `commerce.spec.ts`, `realtime-resilience.spec.ts` |
| Perfil, avatar, senha e carteiras | `account.spec.ts` |
| Preço e disponibilidade via Socket.IO | `commerce.spec.ts`, `realtime-resilience.spec.ts` |
| Eventos antigos/duplicados, reconexão e retomada | `realtime-resilience.spec.ts` |
| Teclado, foco de diálogo e formulários | `accessibility-visual.spec.ts` |
| Skeleton, falha e retry | `accessibility-visual.spec.ts` |
| Regressão visual | `accessibility-visual.spec.ts` |

## Isolamento e cenários sensíveis a tempo

Cada teste começa com `POST /api/__mock/reset`, remove dados transitórios de sessão/visitante/pedido pendente e volta ao cenário `default`.

Os cenários de latência e falha são controlados pelo endpoint MSW `/api/__mock/scenario`. O teste de recuperação de pedido fixa explicitamente o relógio com `page.clock.setFixedTime()` depois que o pedido pendente é persistido, evitando depender de espera arbitrária para ultrapassar a janela de confirmação.
