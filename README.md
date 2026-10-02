# Recruiter Visual — Frontend

Interface web do **Recruiter Visual**, uma aplicação de apoio visual ao processo seletivo: o recruiter acompanha suas vagas, as etapas de cada uma e a posição dos candidatos em um funil e em um Kanban.

Este repositório contém apenas a camada de interface:

- o frontend consome a API REST do backend (`recruiter-visual-api`);
- as regras de negócio e a autorização são responsabilidade do backend;
- o frontend exibe o que a API devolve e envia as ações do usuário, sem ser fonte de verdade dessas regras.

O Recruiter Visual não se propõe a ser um ATS completo. O foco é a visualização e a movimentação de candidatos nas etapas de uma vaga.

## Stack

| Área | Tecnologia |
|---|---|
| Linguagem e biblioteca de UI | TypeScript, React 19 |
| Build e servidor de desenvolvimento | Vite |
| Rotas | React Router (SPA, rotas no cliente) |
| Estilos | Tailwind CSS v4, `class-variance-authority`, `tailwind-merge` |
| Componentes | Base UI (`@base-ui/react`), com componentes próprios em `src/components/ui` |
| Dados e cache | SWR |
| Gráficos | Recharts (funis da vaga) |
| Ícones | `lucide-react` e `@iconify/react` |

As versões exatas estão no `package.json`.

## Arquitetura resumida

```text
Usuário
   ↓
React / TypeScript
   ↓ HTTP/REST
Recruiter Visual API
   ↓
Spring Boot
```

O frontend é uma SPA estática. Toda regra de negócio (quem pode ver uma vaga, quando um candidato pode avançar, como a taxa de reprovação é calculada) é decidida pelo backend. A interface não recalcula esses resultados: apenas os apresenta e trata as respostas de erro da API.

## Pré-requisitos

- Node.js e npm. O projeto não fixa uma versão mínima de Node; o `Dockerfile` do repositório usa a imagem `node:22-slim`.
- Backend do Recruiter Visual em execução em `http://localhost:8080`.
- O frontend sobe em `http://localhost:5173` (porta padrão do Vite).

## Execução local

```bash
npm install
npm run dev
```

Build de produção (executa a checagem de tipos com `tsc` antes do `vite build`; erros de TypeScript interrompem o build):

```bash
npm run build
```

Para servir localmente o resultado do build:

```bash
npm run preview
```

> **Lint:** `npm run lint` não funciona no estado atual. O projeto tem a configuração em `.eslintrc.cjs`, e a versão instalada do ESLint espera `eslint.config.js`. Veja [Limitações conhecidas](#limitações-conhecidas).

## Integração com o backend

```text
Frontend
   ↓ /api
Vite dev proxy
   ↓
http://localhost:8080
```

No desenvolvimento local, toda chamada a `/api/...` é encaminhada pelo proxy do Vite (`vite.config.ts`) para o backend, sem o prefixo `/api`. Por exemplo, `/api/vagas` chega ao backend como `/vagas`.

Esse proxy existe apenas no servidor de desenvolvimento. O repositório tem arquivos para servir o build estático (`Dockerfile`, `nginx.conf`, `netlify.toml`), mas nenhum deles encaminha `/api` para o backend. A estratégia de acesso à API em produção ainda precisa ser definida antes do deploy.

## Autenticação e sessão

- **Registro:** a tela de cadastro envia nome, e-mail e senha para a API. Nenhum token é criado nesse momento.
- **Verificação de e-mail:** depois do cadastro, o recruiter informa o código de 6 dígitos recebido por e-mail. Com o e-mail confirmado, ele é levado ao login.
- **Login:** em caso de sucesso, a API devolve um JWT e os dados básicos do recruiter (nome e e-mail).
- **Armazenamento:** o token fica no `localStorage`, na chave `recruiter-visual.token`. Nome e e-mail ficam na chave `recruiter-visual.user`. A senha nunca é armazenada.
- **Envio do token:** todas as chamadas feitas pelo fetcher do projeto (`src/api/global-fetcher.ts`) enviam o cabeçalho `Authorization: Bearer <token>` quando há sessão.
- **Rotas protegidas:** sem token, qualquer tela da aplicação redireciona para o login, que devolve o usuário à tela que ele tentava abrir.
- **Sessão expirada ou inválida:** a validade do token é verificada pelo backend. Uma resposta `401` faz o frontend descartar o token e redirecionar para o login.
- **Logout:** remove o token e os dados do usuário e limpa o cache de dados da sessão.

## Rotas principais

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Redireciona para `/apps/vagas` | Autenticado |
| `/apps/vagas` | Minhas vagas | Autenticado |
| `/apps/vagas/create` | Nova vaga | Autenticado |
| `/apps/vagas/:id` | Detalhe da vaga | Autenticado |
| `/auth/auth2/login` | Login | Público |
| `/auth/auth2/register` | Cadastro | Público |
| `/auth/auth2/two-steps` | Verificação de e-mail | Público |
| `/auth/404` | Página não encontrada | Público |

As rotas são definidas em `src/routes/Router.tsx`.

## Fluxo de vagas

- **Minhas vagas (`/apps/vagas`):** lista as vagas do recruiter autenticado, com código, status, título e data de criação, e permite buscar pelo código da vaga.
- **Nova vaga (`/apps/vagas/create`):** cria a vaga com código, título, descrição e as etapas configuradas na tela. As etapas podem ser adicionadas, renomeadas, reordenadas e excluídas; a etapa de fechamento pode ser renomeada, mas fica sempre por último e não pode ser excluída.
- **Detalhe da vaga (`/apps/vagas/:id`):** usa o `id` da rota para carregar da API a vaga, suas etapas, os candidatos ativos, os candidatos reprovados e as avaliações. Uma vaga inexistente ou de outro recruiter é tratada como "não encontrada".

No detalhe, as etapas devolvidas pela API alimentam o funil e o Kanban, o status da vaga é refletido na interface e as avaliações por etapa de todos os candidatos são carregadas em uma única requisição.

## Funil e Kanban

O funil e o Kanban usam a mesma lista de etapas, na ordem definida pelo backend.

- **Funil:** mostra a quantidade de candidatos ativos em cada etapa.
- **Funil de reprovados:** mostra quantos candidatos foram reprovados em cada etapa.
- **Taxa de reprovação por etapa:** exibida abaixo do funil de reprovados, usando diretamente o valor calculado pelo backend. Quando ninguém chegou à etapa, a interface mostra `—`.
- **Kanban:** uma coluna por etapa, com os candidatos ativos na etapa em que estão. Cada card mostra nome, stack, LinkedIn e a avaliação da etapa.
- **Avançar:** botão no card que move o candidato para a próxima etapa.
- **Reprovar:** botão no card, com confirmação, que reprova o candidato na etapa atual. Não está disponível na etapa de fechamento.
- **Reprovados:** seção que lista os candidatos reprovados e a etapa em que cada reprovação aconteceu.

A movimentação dos candidatos é feita pelos botões do card.

## Avaliação por etapa

- A avaliação pertence ao par **candidato + etapa**: a nota de uma etapa não substitui nem é copiada para outra.
- Cada card mostra cinco estrelas com o rótulo "Avaliação desta etapa", sempre referentes à etapa atual do candidato. Sem avaliação, as estrelas aparecem vazias.
- A nota vai de 1 a 5 e é dada clicando diretamente em uma estrela do card.
- As avaliações da vaga são carregadas em lote, em uma única requisição. Não há requisição individual por card.
- O clique salva a nota pelo endpoint de avaliação do backend, com atualização otimista: a estrela muda imediatamente e, se a API recusar, a nota anterior é restaurada e o card mostra uma mensagem de erro.
- A avaliação continua disponível em qualquer status da vaga, conforme a regra do backend.

## Status da vaga

A interface apresenta quatro status, com um selo colorido ao lado do código da vaga:

| Status | Apresentação | Ações de status disponíveis |
|---|---|---|
| `ATUANDO` | Verde | Suspender processo, Cancelar processo |
| `PAUSADA` | Amarelo | Retomar processo, Cancelar processo |
| `FECHADA` | Neutro | Nenhuma |
| `CANCELADA` | Vermelho | Nenhuma |

- As ações ficam no menu "Alterar status" do detalhe da vaga e pedem confirmação antes de serem enviadas.
- Quando a vaga não está `ATUANDO`, os botões de cadastrar candidato, avançar e reprovar ficam desabilitados. Os dados continuam visíveis.
- O status exibido é sempre o devolvido pela API.

As regras de negócio de cada status estão documentadas no backend, em `docs/ARQUITETURA.md` do projeto `recruiter-visual-api`.

## Organização do frontend

| Diretório | Responsabilidade |
|---|---|
| `src/views` | Telas (páginas) da aplicação. As de vagas ficam em `src/views/apps/vagas` e as de autenticação em `src/views/auth/auth2`. |
| `src/components` | Componentes reutilizáveis. Os de vagas (funil, Kanban, editor de etapas, selo e ações de status, cadastro de candidato) ficam em `src/components/apps/vagas`; os componentes de base ficam em `src/components/ui`. |
| `src/context` | Contextos e hooks de dados. `src/context/vagas-context` concentra as leituras e ações de vagas, etapas, candidatos e avaliações. |
| `src/api` | Camada de acesso HTTP: o fetcher com o JWT (`global-fetcher.ts`) e as chamadas de autenticação (`auth/auth-api.ts`). |
| `src/types` | Tipos TypeScript compartilhados, incluindo os contratos da API de vagas (`apps/vagas.ts`). |
| `src/layouts` | Estruturas de página: layout com header para as telas autenticadas e layout em branco para as telas públicas. |
| `src/routes` | Definição das rotas e a proteção das telas autenticadas (`RequireAuth`). |
| `src/lib` | Funções auxiliares: sessão (`auth-token.ts`) e regras de formatação e validação de vagas (`vagas.ts`). |
| `src/hooks` | Hooks genéricos de interface. |
| `src/css` | Estilos globais. |

## Estado e cache

Os dados da API são carregados com SWR, por meio dos contextos e hooks de `src/context/vagas-context`:

- as telas não chamam a API diretamente; elas usam esses hooks, que expõem os dados e as ações;
- depois de uma ação (cadastrar, avançar, reprovar, alterar status), apenas os dados afetados são recarregados da API, sem recarregar a página;
- a avaliação por etapa usa atualização otimista sobre os dados de avaliações;
- o cache é limpo no login e no logout, para que os dados de um recruiter não apareçam para outro.

## Limitações conhecidas

- `npm run lint` está incompatível com a configuração de ESLint existente (`.eslintrc.cjs` com uma versão do ESLint que espera `eslint.config.js`).
- O repositório ainda tem arquivos e rotas herdados da base inicial do projeto que não fazem parte do fluxo principal do Recruiter Visual.
- A estratégia de acesso à API em produção ainda precisa ser definida antes do deploy.
- O frontend não tem suíte de testes automatizados própria.

## Backend relacionado

O backend fica em um projeto separado, `recruiter-visual-api`. A documentação técnica dele está em:

- `README.md`
- `docs/ARQUITETURA.md`
- `docs/FLUXOS.md`

## SSO

O suporte a SSO corporativo não está implementado atualmente. O caminho arquitetural futuro está documentado no backend, em `docs/ARQUITETURA.md`.
