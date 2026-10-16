# BarberPro — Sistema de Gestão para Barbearias

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-purple)

Sistema SaaS multi-tenant para gestão completa de barbearias: agendamentos, barbeiros, clientes, serviços, financeiro, calendário visual, **site público de agendamento para clientes**, controle de permissões, pagamentos e exportação de relatórios.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Rotas da Aplicação](#-rotas-da-aplicação)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Roles](#-autenticação-e-roles)
- [Permissões de Barbeiro](#-permissões-de-barbeiro)
- [Tema (Modo Claro/Escuro e Cores)](#-tema-modo-claroescuro-e-cores)
- [Site Público de Agendamento](#-site-público-de-agendamento)
- [Pagamentos e Financeiro](#-pagamentos-e-financeiro)
- [Como Rodar](#-como-rodar)
- [Edge Functions](#-edge-functions)
- [Integração com n8n + WhatsApp](#-integração-com-n8n--whatsapp)
- [Melhorias Futuras](#-melhorias-futuras)

---

## ✨ Funcionalidades

### Gestão (área administrativa)
- **Dashboard** com gráficos de faturamento e serviços populares, filtrável por período de datas ("De/Até").
- **Agendamentos** — CRUD completo com:
  - Validação de bloqueios em tempo real: ao escolher barbeiro + data + hora, o sistema verifica bloqueios (dia inteiro ou parcial) e impede o agendamento, exibindo alerta e desabilitando o botão.
  - Conclusão de atendimento com registro de **forma de pagamento** (dinheiro, pix, crédito, débito), **valor extra** e observação.
- **Calendário visual** em grade por barbeiro:
  - Faixa de horários dinâmica: adapta-se aos horários reais dos agendamentos (ex.: agendamento às 22:00 aparece mesmo se a barbearia fecha às 20:00).
  - Suporte a "encaixes" fora do slot de 30 min (ex.: 9:10) com exibição do minuto exato.
  - Clique em um agendamento para **concluir ou cancelar**; clique em um horário vago para **criar agendamento** com barbeiro, data e hora pré-preenchidos.
  - Bloqueios de agenda (dia inteiro ou parcial) exibidos na grade.
- **Barbeiros** — cadastro, credenciais de acesso, comissão, horários, dias de folga e bloqueios.
- **Serviços** e **Clientes** — CRUD completo.
  - Verificação de duplicidade de cliente por **telefone e email**.
  - Botão de **WhatsApp** para avisar clientes com agendamento no dia ("Olá, não se esqueça do seu horário marcado hoje às xx:xx").
  - **Histórico do cliente**: métricas (visitas, total gasto, ticket médio, última visita) e tabela de visitas, com filtros por período e por serviço.
  - Reset de senha enviado pelo admin.
- **Financeiro**:
  - Filtro por período de datas e atalhos de mês atual/anterior.
  - Relatório mensal consolidado por **forma de pagamento** e **comissões**.
  - Comissões por barbeiro **expansíveis**: clique para ver todos os serviços realizados no período filtrado.
  - **Exportação em CSV e PDF**.
- **Configurações** — dados da barbearia, horários e **automação do lembrete WhatsApp** (ativar/desativar e antecedência em minutos).
- **Responsivo** — todas as telas funcionam em desktop e mobile (tabelas com scroll, modais adaptados, filtros em coluna, calendário com scroll lateral).

### Site público (clientes)
- Fluxo de agendamento em 4 passos: barbearia → serviço → barbeiro → data/hora.
- Login/cadastro do cliente (role `cliente`) e área "Meus Agendamentos".
- Horários ocupados calculados pela função `get_busy_slots`.
- Recuperação de senha pelo próprio cliente.

---

## 🏗 Arquitetura

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React SPA      │────▶│  Supabase Auth   │────▶│  PostgreSQL      │
│   (Vite + TS)    │     │  (admin/barbeiro │     │  (Multi-tenant)  │
│                  │     │   /cliente)      │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
   │        │                      │
   │        │                      ▼
   │        │             ┌──────────────────┐
   │        │             │  Edge Functions   │
   │        │             │  create-admin /   │
   │        │             │  create-barbeiro  │
   │        │             └──────────────────┘
   │        │
   │        ▼
   │  ┌──────────────────┐        ┌──────────────────┐
   └─▶│  React Query     │        │  n8n Webhook      │
      │  (Cache + Sync)  │        │  (WhatsApp Bot)   │
      └──────────────────┘        └──────────────────┘
```

### Princípios

- **Multi-tenant**: Cada barbearia é um tenant isolado. Todos os dados são filtrados por `barbearia_id` via RLS (Row Level Security).
- **Role-based access**: Três papéis — `admin` (controle total), `barbeiro` (acesso restrito conforme permissões granulares) e `cliente` (acesso restrito ao site público).
- **Security-first**: Funções `SECURITY DEFINER` evitam recursão em políticas RLS. Nenhum dado sensível exposto no frontend.

---

## 🛠 Stack Tecnológica

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Frontend    | React 18, TypeScript 5, Vite 5      |
| Estilização | Tailwind CSS 3, shadcn/ui           |
| Estado      | React Query (TanStack Query)        |
| Roteamento  | React Router DOM 6                  |
| Gráficos    | Recharts                            |
| Animações   | Framer Motion                       |
| PDF/CSV     | jsPDF + jspdf-autotable             |
| Backend     | Supabase (PostgreSQL + Auth + Edge) |
| Deploy      | Lovable Cloud                       |

---

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                          # Componentes shadcn/ui (Button, Dialog, etc.)
│   ├── AppLayout.tsx                # Layout com sidebar
│   ├── AppSidebar.tsx               # Navegação lateral (filtrada por permissões)
│   ├── ConcluirAgendamentoDialog.tsx # Concluir atendimento + forma de pagamento
│   ├── HistoricoClienteDialog.tsx    # Histórico do cliente com filtros
│   ├── ThemeSwitcher.tsx            # Alternar tema claro/escuro e cor
│   ├── NavLink.tsx / StatCard.tsx
├── contexts/
│   ├── AuthContext.tsx              # Auth, roles, tenant e helper can(perm)
│   └── ThemeContext.tsx             # Tema claro/escuro + 5 paletas de cor
├── hooks/
│   ├── useSupabaseData.ts           # Hooks React Query p/ todas as entidades
│   │                                #   + useAgendamentosByRange (filtro de datas)
│   │                                #   + useBloqueiosByBarbeiroDate (validação de bloqueios)
│   └── use-mobile.tsx
├── integrations/supabase/           # Cliente e tipos auto-gerados
├── lib/
│   ├── export.ts                    # exportCSV / exportPDF (relatórios multi-seção)
│   ├── mock-data.ts / utils.ts
├── pages/
│   ├── Dashboard.tsx                # Painel com filtro de período
│   ├── Agendamentos.tsx             # CRUD + validação de bloqueios + pagamentos
│   ├── Calendario.tsx               # Grade visual dinâmica (clique/cadastro/conclusão)
│   ├── Barbeiros.tsx                # Gestão + credenciais + bloqueios + permissões
│   ├── Servicos.tsx / Clientes.tsx  # CRUD + WhatsApp + histórico + reset senha
│   ├── Financeiro.tsx               # Relatórios, comissões, formas de pagamento, export
│   ├── Configuracoes.tsx            # Barbearia + automação de lembretes
│   ├── Login.tsx / ResetPassword.tsx / NotFound.tsx
│   └── public/
│       ├── PublicLayout.tsx         # Layout do site público
│       ├── Agendar.tsx              # Fluxo de agendamento em 4 passos
│       ├── AgendarLogin.tsx         # Login do cliente
│       ├── AgendarCadastro.tsx      # Cadastro do cliente
│       └── MeusAgendamentos.tsx     # Agendamentos do cliente
└── index.css                        # Design tokens (temas claro/escuro + 5 cores)

supabase/
├── config.toml
├── functions/
│   ├── create-admin/                # Edge function: criar admin + barbearia
│   └── create-barbeiro/             # Edge function: criar/atualizar barbeiro
└── migrations/
```

---

## 🗺 Rotas da Aplicação

| Rota                  | Acesso            | Descrição                                  |
|-----------------------|-------------------|--------------------------------------------|
| `/login`              | Público           | Login administrativo                        |
| `/reset-password`     | Público           | Redefinição de senha                        |
| `/dashboard`          | Admin             | Painel com gráficos e filtro de período     |
| `/agendamentos`       | Admin/Barbeiro    | Lista e CRUD de agendamentos                |
| `/calendario`         | Admin/Barbeiro    | Calendário visual em grade                  |
| `/barbeiros`          | Admin             | Gestão de barbeiros e permissões            |
| `/servicos`           | Admin             | Catálogo de serviços                        |
| `/clientes`           | Admin             | Gestão de clientes, WhatsApp, histórico     |
| `/financeiro`         | Admin/Barbeiro*   | Relatórios (barbeiro exige `ver_faturamento_total`) |
| `/configuracoes`      | Admin             | Configurações da barbearia                  |
| `/agendar`            | Público           | Site de agendamento do cliente              |
| `/agendar/login`      | Público           | Login do cliente                            |
| `/agendar/cadastro`   | Público           | Cadastro do cliente                         |
| `/meus-agendamentos`  | Cliente           | Agendamentos do cliente logado              |

> Barbeiros sem permissão são redirecionados automaticamente para `/agendamentos` e veem **apenas a própria agenda**.

---

## 🗄 Banco de Dados

> **Arquivo completo de criação do banco**: veja [`database-schema.sql`](./database-schema.sql)

### Tabelas

| Tabela                | Descrição                                                        |
|-----------------------|------------------------------------------------------------------|
| `barbearias`          | Dados do estabelecimento + automação de lembretes (`lembrete_auto`, `lembrete_antecedencia`, `lembrete_mensagem`) |
| `profiles`            | Perfil do usuário (auto-criado no signup)                        |
| `user_roles`          | Papéis: `admin`, `barbeiro` ou `cliente`                         |
| `barbeiros`           | Cadastro de barbeiros (comissão, horários, `user_id`)            |
| `barbeiro_permissoes` | Permissões granulares por barbeiro                               |
| `barbeiro_bloqueios`  | Bloqueios de agenda (dia inteiro ou parcial, com motivo)         |
| `servicos`            | Catálogo de serviços (nome, preço, duração)                      |
| `clientes`            | Cadastro de clientes (com `user_id` para login do cliente)       |
| `agendamentos`        | Agendamentos com status, preço, `forma_pagamento`, `valor_extra` e `obs_pagamento` |

### Funções de Segurança

| Função                      | Descrição                                                        |
|-----------------------------|------------------------------------------------------------------|
| `get_user_barbearia_id()`   | Retorna o `barbearia_id` do usuário autenticado                  |
| `has_role()`                | Verifica se o usuário tem um papel específico                    |
| `get_barbeiro_id()`         | Retorna o `barbeiro.id` a partir do `user_id`                    |
| `barbeiro_has_permission()` | Verifica permissão granular do barbeiro                          |
| `get_busy_slots()`          | Retorna horários ocupados de um barbeiro em uma data (usado no site público e no calendário) |
| `handle_new_user()`         | Trigger: cria profile automaticamente no signup                  |

### Índices importantes

- `idx_no_double_booking`: índice único em `(barbeiro_id, data, hora)` para agendamentos não cancelados — impede double-booking no banco.

### Diagrama ER simplificado

```
barbearias (1) ──── (N) barbeiros
barbearias (1) ──── (N) servicos
barbearias (1) ──── (N) clientes
barbearias (1) ──── (N) agendamentos
barbeiros  (1) ──── (1) barbeiro_permissoes
barbeiros  (1) ──── (N) barbeiro_bloqueios
barbeiros  (1) ──── (N) agendamentos
servicos   (1) ──── (N) agendamentos
clientes   (1) ──── (N) agendamentos
profiles   (1) ──── (1) user_roles
profiles   (N) ──── (1) barbearias
```

---

## 🔐 Autenticação e Roles

### Fluxo de Criação de Admin

1. Chamar a edge function `create-admin` com header `x-admin-secret`
2. A função cria: usuário auth → barbearia → atualiza profile → atribui role `admin`

### Fluxo de Criação de Barbeiro

1. Admin autenticado chama a edge function `create-barbeiro`
2. A função cria: usuário auth → atualiza profile → atribui role `barbeiro` → cria registro em `barbeiros` + `barbeiro_permissoes`

### Fluxo do Cliente (site público)

1. Cliente se cadastra em `/agendar/cadastro` (signup normal do Supabase)
2. O registro fica vinculado ao `clientes.user_id` da barbearia ao fazer o primeiro agendamento
3. O cliente pode recuperar a senha sozinho ou receber um reset do admin (aba Clientes)

---

## 🛡 Permissões de Barbeiro

Barbeiros têm acesso **bloqueado por padrão** a: Dashboard, Financeiro, Clientes, Configurações, Serviços, Barbeiros. Nos Agendamentos e no Calendário, veem **somente a própria agenda**. O admin libera permissões no modal "Permissões" (aba Barbeiros):

| Permissão               | Descrição                                                            |
|--------------------------|----------------------------------------------------------------------|
| `ver_agenda_outros`      | Ver agendamentos de outros barbeiros                                 |
| `ver_faturamento_total`  | Ver relatórios financeiros da barbearia (libera a aba Financeiro)    |
| `editar_propria_agenda`  | Editar sua própria agenda, concluir/cancelar e gerenciar bloqueios   |

O helper `can(perm)` no `AuthContext` controla menu, rotas e ações no frontend; as políticas RLS aplicam as mesmas regras no banco.

---

## 🎨 Tema (Modo Claro/Escuro e Cores)

A aplicação suporta **modo escuro** (padrão) e **modo claro**, além de **5 variações de cor**:

| Cor       | Valor             |
|-----------|-------------------|
| Ouro      | `gold` (padrão)   |
| Azul      | `blue`            |
| Esmeralda | `emerald`         |
| Púrpura   | `purple`          |
| Rosa      | `rose`            |

- Botões 🌞/🌙 e 🎨 na barra lateral e no header do site público.
- Preferências salvas em `localStorage` (`theme-mode` e `theme-color`).
- `src/contexts/ThemeContext.tsx` aplica `class="light|dark"` e `data-theme="<cor>"` em `<html>`.
- Tokens semânticos em `src/index.css` sobrescritos por modo e cor — nenhum componente usa cor hard-coded.

---

## 🌐 Site Público de Agendamento

Rotas `/agendar`, `/agendar/login`, `/agendar/cadastro` e `/meus-agendamentos` dentro do mesmo app, com layout próprio (`PublicLayout`).

**Fluxo em 4 passos** (Agendar.tsx):
1. Serviço (preço e duração visíveis)
2. Barbeiro
3. Data (calendário de dias úteis da barbearia)
4. Horário (via `get_busy_slots`, respeitando bloqueios e agendamentos existentes)

O agendamento criado pelo cliente entra direto na gestão (status `confirmado`) e aparece em Agendamentos, Calendário e Financeiro.

---

## 💳 Pagamentos e Financeiro

- Ao **concluir** um atendimento, o sistema registra:
  - `forma_pagamento`: `dinheiro`, `pix`, `credito` ou `debito`
  - `valor_extra`: taxa/entrada adicional (soma ao valor do serviço)
  - `obs_pagamento`: observação livre
- Financeiro exibe **fluxo por forma de pagamento** (total e quantidade de atendimentos por método).
- Comissões calculadas por barbeiro sobre o valor total (preço + extra).
- **Relatório consolidado** (período + formas de pagamento + comissões detalhadas) exportável em **CSV** (`;` + BOM UTF-8, compatível com Excel BR) e **PDF** (jsPDF + AutoTable).

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+
- Bun (ou npm/yarn)
- Conta no [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd barberpro
bun install
```

### 2. Configurar Supabase

1. Crie um projeto no Supabase
2. Execute o arquivo [`database-schema.sql`](./database-schema.sql) no SQL Editor do Supabase
3. Copie a URL e anon key do projeto

### 3. Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. Deploy das Edge Functions

```bash
npm install -g supabase

supabase login
supabase link --project-ref SEU_PROJECT_REF

supabase functions deploy create-admin
supabase functions deploy create-barbeiro
```

### 5. Criar primeiro admin

```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/create-admin \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: barber-pro-setup-2026" \
  -d '{
    "email": "admin@suabarbearia.com",
    "password": "SuaSenhaSegura123!",
    "nome": "Seu Nome",
    "nomeBarbearia": "Nome da Barbearia"
  }'
```

Exemplo em PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = "barber-pro-setup-2026"
}

$body = @{
    email = "admin@suabarbearia.com"
    password = "SuaSenhaSegura123!"
    nome = "Seu Nome"
    nomeBarbearia = "Nome da Barbearia"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://SEU_PROJETO.supabase.co/functions/v1/create-admin" -Method Post -Headers $headers -Body $body
```

### 6. Rodar o projeto

```bash
bun run dev
```

Acesse `http://localhost:5173` para a gestão e `http://localhost:5173/agendar` para o site público de agendamento.

---

## ⚡ Edge Functions

### `create-admin`

- **Rota**: `POST /functions/v1/create-admin`
- **Auth**: Header `x-admin-secret: barber-pro-setup-2026`
- **Body**: `{ email, password, nome, nomeBarbearia }`
- **Ação**: Cria usuário + barbearia + profile + role admin

### `create-barbeiro`

- **Rota**: `POST /functions/v1/create-barbeiro`
- **Auth**: Bearer token do admin autenticado
- **Actions**:
  - `create`: `{ action: "create", email, password, nome, telefone?, comissao?, horaInicio?, horaFim? }`
  - `update_credentials`: `{ action: "update_credentials", barbeiroId, email?, password? }`

---

## 🤖 Integração com n8n + WhatsApp

O BarberPro pode ser integrado com o [n8n](https://n8n.io) para permitir agendamentos via WhatsApp usando a API do Supabase.

### Arquitetura da Integração

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ WhatsApp │────▶│ Evolution│────▶│     n8n      │────▶│ Supabase │
│ Cliente  │     │ API / Z-API    │  (Workflow)  │     │ API REST │
└──────────┘     └──────────┘     └──────────────┘     └──────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ AI (Gemini/  │
                                  │ GPT) parse   │
                                  └──────────────┘
```

### Passo a Passo

#### 1. Configurar API de WhatsApp

Escolha uma das opções:
- **Evolution API** (self-hosted, gratuito)
- **Z-API** (SaaS brasileiro, pago)
- **WhatsApp Business API** (Meta oficial)

Configure o webhook para enviar mensagens recebidas ao n8n.

> 💡 O sistema já possui **lembretes automáticos configuráveis** (aba Configurações): o admin define se o lembrete será automático e com quantos minutos de antecedência. A mensagem definida em `barbearias.lembrete_mensagem` é o template usado pelo botão de WhatsApp e pode ser reutilizada no workflow do n8n (campo `lembrete_antecedencia` em minutos).

#### 2. Criar Workflow no n8n

**Trigger**: Webhook (recebe mensagem do WhatsApp)

**Nós do workflow**:

```
1. [Webhook Trigger] - Recebe mensagem do WhatsApp
       │
2. [AI Agent / Function] - Interpreta intenção do cliente
       │                    (ex: "quero cortar cabelo amanhã às 14h")
       │
3. [Switch] - Roteia por intenção
       │
       ├── "agendar" ──▶ [Supabase] Buscar horários livres (RPC get_busy_slots)
       │                       │
       │                  [Supabase] Buscar/criar cliente
       │                       │
       │                  [Supabase] Verificar bloqueios
       │                       │
       │                  [Supabase] Inserir agendamento
       │                       │
       │                  [WhatsApp] Confirmar agendamento
       │
       ├── "cancelar" ──▶ [Supabase] Atualizar status → cancelado
       │                       │
       │                  [WhatsApp] Confirmar cancelamento
       │
       └── "consultar" ──▶ [Supabase] Buscar agendamentos do cliente
                                │
                           [WhatsApp] Listar agendamentos
```

#### 3. Configurar Nó Supabase no n8n

No n8n, adicione uma credencial do tipo **Supabase**:
- **URL**: `https://seu-projeto.supabase.co`
- **Service Role Key**: (encontrada em Settings > API no Supabase)

#### 4. Queries Úteis para o Workflow

**Buscar horários disponíveis de um barbeiro (RPC recomendada):**

```
POST /rest/v1/rpc/get_busy_slots
{ "_barbeiro_id": "{{barbeiro_id}}", "_data": "{{data}}" }
```

Retorna os horários ocupados (hora + duração); qualquer slot de 30 min não retornado está livre.

**Agendamentos existentes no dia (alternativa SQL):**

```sql
SELECT hora, duracao FROM agendamentos
WHERE barbeiro_id = '{{barbeiro_id}}'
  AND data = '{{data}}'
  AND status != 'cancelado';

-- Bloqueios do barbeiro no dia
SELECT * FROM barbeiro_bloqueios
WHERE barbeiro_id = '{{barbeiro_id}}'
  AND data = '{{data}}';
```

**Buscar ou criar cliente por telefone:**

```sql
-- Buscar
SELECT * FROM clientes
WHERE telefone = '{{telefone}}'
  AND barbearia_id = '{{barbearia_id}}';

-- Criar (via HTTP Request node com API REST do Supabase)
POST /rest/v1/clientes
{ "nome": "{{nome}}", "telefone": "{{telefone}}", "barbearia_id": "{{barbearia_id}}" }
```

**Criar agendamento:**

```
POST /rest/v1/agendamentos
Headers:
  apikey: {{SUPABASE_ANON_KEY}}
  Authorization: Bearer {{SUPABASE_SERVICE_ROLE_KEY}}
  Content-Type: application/json

Body:
{
  "barbearia_id": "{{barbearia_id}}",
  "barbeiro_id": "{{barbeiro_id}}",
  "cliente_id": "{{cliente_id}}",
  "servico_id": "{{servico_id}}",
  "data": "2026-04-10",
  "hora": "14:00",
  "duracao": 30,
  "preco": 45.00,
  "status": "confirmado"
}
```

#### 5. Exemplo de Prompt para AI Agent no n8n

```
Você é o assistente virtual da barbearia {{nomeBarbearia}}.
Você ajuda clientes a agendar, cancelar ou consultar horários.

Serviços disponíveis:
{{listaServicos}}

Barbeiros disponíveis:
{{listaBarbeiros}}

Horário de funcionamento: {{horaAbertura}} às {{horaFechamento}}

Regras:
- Sempre confirme data, hora, serviço e barbeiro antes de agendar
- Verifique se o horário está disponível antes de confirmar
- Se o cliente não escolher barbeiro, sugira o primeiro disponível
- Responda sempre em português de forma amigável
```

#### 6. Variáveis Necessárias no n8n

| Variável             | Onde encontrar                         |
|----------------------|----------------------------------------|
| `SUPABASE_URL`       | Supabase → Settings → API              |
| `SUPABASE_ANON_KEY`  | Supabase → Settings → API              |
| `SERVICE_ROLE_KEY`   | Supabase → Settings → API              |
| `BARBEARIA_ID`       | Tabela `barbearias` (UUID do tenant)   |
| `WHATSAPP_API_URL`   | Evolution API / Z-API                  |
| `WHATSAPP_TOKEN`     | Token da API de WhatsApp               |

---

## 🚧 Melhorias Futuras

### Curto Prazo
- [ ] Notificações push/email automáticas para lembrar agendamentos
- [ ] Upload de foto de perfil para barbeiros
- [ ] Exportação de relatórios em Excel (além de CSV/PDF)

### Médio Prazo
- [ ] App mobile (React Native ou PWA)
- [ ] Sistema de fidelidade / pontos para clientes
- [ ] Integração com gateway de pagamento (Stripe/Mercado Pago)
- [ ] Multi-unidade (uma conta admin com várias barbearias)

### Longo Prazo
- [ ] Marketplace de produtos para venda na barbearia
- [ ] Dashboard analytics com IA (previsão de demanda)
- [ ] Sistema de avaliação/feedback dos clientes
- [ ] Integração com Google Calendar
- [ ] White-label para franquias

---

## 📄 Licença

Projeto privado — todos os direitos reservados.
