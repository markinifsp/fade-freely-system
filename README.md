# BarberPro — Sistema de Gestão para Barbearias

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-purple)

Sistema SaaS multi-tenant para gestão completa de barbearias: agendamentos, barbeiros, clientes, serviços, financeiro e calendário visual.

---

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Roles](#-autenticação-e-roles)
- [Como Rodar](#-como-rodar)
- [Edge Functions](#-edge-functions)
- [Integração com n8n + WhatsApp](#-integração-com-n8n--whatsapp)
- [Melhorias Futuras](#-melhorias-futuras)

---

## 🏗 Arquitetura

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   React SPA      │────▶│  Supabase Auth   │────▶│  PostgreSQL      │
│   (Vite + TS)    │     │  + RLS Policies   │     │  (Multi-tenant)  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                         │
        │                         ▼
        │                ┌──────────────────┐
        │                │  Edge Functions   │
        │                │  (Deno Deploy)    │
        │                └──────────────────┘
        │                         ▲
        │                         │
        ▼                ┌──────────────────┐
┌──────────────────┐     │  n8n Webhook      │
│  React Query     │     │  (WhatsApp Bot)   │
│  (Cache + Sync)  │     └──────────────────┘
└──────────────────┘
```

### Princípios

- **Multi-tenant**: Cada barbearia é um tenant isolado. Todos os dados são filtrados por `barbearia_id` via RLS (Row Level Security).
- **Role-based access**: Dois papéis — `admin` (controle total) e `barbeiro` (acesso restrito conforme permissões).
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
| Backend     | Supabase (PostgreSQL + Auth + Edge) |
| Deploy      | Lovable Cloud                       |

---

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui (Button, Dialog, etc.)
│   ├── AppLayout.tsx     # Layout com sidebar
│   ├── AppSidebar.tsx    # Navegação lateral
│   ├── NavLink.tsx       # Link de navegação
│   └── StatCard.tsx      # Card de estatística
├── contexts/
│   └── AuthContext.tsx    # Contexto de autenticação, roles, tenant
├── hooks/
│   ├── useSupabaseData.ts # Hooks React Query para todas as entidades
│   └── use-mobile.tsx     # Detecção de mobile
├── integrations/
│   └── supabase/
│       ├── client.ts      # Cliente Supabase (auto-gerado)
│       └── types.ts       # Tipos do banco (auto-gerado)
├── lib/
│   ├── mock-data.ts       # Dados de exemplo
│   └── utils.ts           # Utilitários (cn, formatters)
├── pages/
│   ├── Dashboard.tsx      # Painel principal com gráficos
│   ├── Agendamentos.tsx   # CRUD de agendamentos + validação de bloqueios
│   ├── Calendario.tsx     # Visualização diária em grade
│   ├── Barbeiros.tsx      # Gestão de barbeiros + credenciais + bloqueios
│   ├── Servicos.tsx       # CRUD de serviços
│   ├── Clientes.tsx       # CRUD de clientes
│   ├── Financeiro.tsx     # Relatórios financeiros com gráficos
│   ├── Configuracoes.tsx  # Configurações da barbearia
│   └── Login.tsx          # Tela de login
└── index.css              # Design tokens (tema dark + gold)

supabase/
├── config.toml            # Configuração do projeto Supabase
├── functions/
│   ├── create-admin/      # Edge function: criar admin + barbearia
│   └── create-barbeiro/   # Edge function: criar/atualizar barbeiro
└── migrations/            # Migrações SQL do banco
```

---

## 🗄 Banco de Dados

### Tabelas

| Tabela                | Descrição                                      |
|-----------------------|------------------------------------------------|
| `barbearias`          | Dados do estabelecimento (nome, horário, dias)  |
| `profiles`            | Perfil do usuário (auto-criado no signup)       |
| `user_roles`          | Papéis: `admin` ou `barbeiro`                  |
| `barbeiros`           | Cadastro de barbeiros (comissão, horários)      |
| `barbeiro_permissoes` | Permissões granulares por barbeiro              |
| `barbeiro_bloqueios`  | Bloqueios de agenda (dia inteiro ou parcial)    |
| `servicos`            | Catálogo de serviços (nome, preço, duração)     |
| `clientes`            | Cadastro de clientes                            |
| `agendamentos`        | Agendamentos com status e preço                 |

### Funções de Segurança

| Função                    | Descrição                                           |
|---------------------------|-----------------------------------------------------|
| `get_user_barbearia_id()` | Retorna o `barbearia_id` do usuário autenticado     |
| `has_role()`              | Verifica se o usuário tem um papel específico        |
| `get_barbeiro_id()`       | Retorna o `barbeiro.id` a partir do `user_id`       |
| `barbeiro_has_permission()` | Verifica permissão granular do barbeiro           |
| `handle_new_user()`       | Trigger: cria profile automaticamente no signup     |

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

> **Arquivo completo de criação do banco**: veja [`database-schema.sql`](./database-schema.sql)

---

## 🔐 Autenticação e Roles

### Fluxo de Criação de Admin

1. Chamar a edge function `create-admin` com header `x-admin-secret`
2. A função cria: usuário auth → barbearia → atualiza profile → atribui role `admin`

### Fluxo de Criação de Barbeiro

1. Admin autenticado chama a edge function `create-barbeiro`
2. A função cria: usuário auth → atualiza profile → atribui role `barbeiro` → cria registro em `barbeiros` + `barbeiro_permissoes`

### Permissões de Barbeiro

| Permissão               | Descrição                                |
|--------------------------|------------------------------------------|
| `ver_agenda_outros`      | Ver agendamentos de outros barbeiros     |
| `ver_faturamento_total`  | Ver relatórios financeiros da barbearia  |
| `editar_propria_agenda`  | Editar sua própria agenda e bloqueios    |

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
# Instale o CLI do Supabase
npm install -g supabase

# Login e link
supabase login
supabase link --project-ref SEU_PROJECT_REF

# Deploy
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

### 6. Rodar o projeto

```bash
bun run dev
```

Acesse `http://localhost:5173` e faça login com o admin criado.

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
       ├── "agendar" ──▶ [Supabase] Buscar horários livres
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

**Buscar horários disponíveis de um barbeiro:**

```sql
-- Agendamentos existentes no dia
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
- [ ] Notificações push/email para lembrar agendamentos
- [ ] Tema claro (light mode toggle)
- [ ] Exportar relatórios em PDF/Excel
- [ ] Upload de foto de perfil para barbeiros
- [ ] Página de recuperação de senha

### Médio Prazo
- [ ] App mobile (React Native ou PWA)
- [ ] Página pública de agendamento (link compartilhável)
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
