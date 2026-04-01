# cursinhoFEAUSP — Backend

## O que é este projeto

API REST do Cursinho FEA USP. Gerencia inscrições de alunos, turmas (SchoolClass), doações, admins, cupons de desconto e autenticação. Integra com múltiplos provedores de pagamento (Stripe, PIX via EFI e Santander) e envia e-mails transacionais via MailerSend.

## Stack

- **Node.js 18** + **TypeScript** + **Express**
- **Prisma 5** com **MongoDB** (Atlas) — ORM principal
- **JWT** (`jsonwebtoken`) — autenticação de admins
- **bcryptjs** — hash de senhas
- **tsyringe** — instalado mas não configurado; injeção de dependência manual
- **node-cron** — jobs agendados
- **multer** — upload de arquivos
- **exceljs** — exportação de relatórios Excel
- **socket.io** — suporte a real-time (presente, uso limitado)
- **swagger-ui-express** — documentação da API

## Estrutura de pastas

```
src/
├── controllers/         # Handlers HTTP (padrão fino, delegam para use cases)
├── errors/              # AppError (error customizado com statusCode)
├── hooks/               # Integrações externas (Stripe, EFI, Santander)
├── jobs/                # Cron jobs (cron.ts)
├── lib/                 # Clients de terceiros (santanderApiClient.ts)
├── middlewares/         # Middlewares Express
├── modules/
│   ├── donations/       # Domínio de doações (repository, use cases)
│   └── registrations/   # Domínio de alunos, admins, turmas
│       ├── middleware/  # ensureAuthenticate.ts
│       └── provider/    # GenerateTokenProvider.ts
├── routes/              # Definição de todas as rotas (index.ts + arquivos por resource)
├── services/            # Serviços de negócio (Stripe, ASAAS, Mail, Coupon, Automation)
├── types/               # Tipos globais TypeScript
├── prisma.ts            # Singleton do Prisma Client
└── server.ts            # Bootstrap do Express
```

## Entidades (MongoDB via Prisma)

| Coleção | Descrição |
|---------|-----------|
| `Students` | Aluno com dados pessoais, educacionais e `PurchasedSubscriptions[]` aninhadas |
| `Donations` | Doação com dados pessoais, status de pagamento, integração Stripe/PIX |
| `SchoolClass` | Turma com informações, etapas seletivas, documentos e status de inscrição |
| `Admins` | Usuário administrador com username/senha |
| `RefreshToken` | Token de refresh vinculado a um Admin |
| `DiscountCoupons` | Cupom com código, valor de desconto, limite de usos |

Tipos aninhados (Prisma, sem coleção própria): `SchoolClassInformations`, `SchoolClassSubscriptionInformations`, `SchoolClassSelectiveStages`, `DocumentsTypes`, `PurchasedSubscriptions`.

## Autenticação

- **JWT HS256** com expiração de 1 dia; payload: `{ id: adminID }`
- Chave privada: `process.env.TOKEN_PRIVATE_KEY`
- Refresh token armazenado no banco com TTL configurável via `REFRESHTOKEN_EXPIRATION_TIME_NUMBER`
- Middleware `ensureAuthenticated` em `src/modules/registrations/middleware/ensureAuthenticate.ts`:
  - Lê header `Authorization: Bearer <token>`
  - Retorna 401 se ausente ou inválido

Endpoints **sem** autenticação: `POST /students/create`, `POST /donates/create`, `POST /donates/checkout`, `GET /schoolClass/`, `POST /admins/login`, todos os webhooks.

## Rotas

Registradas em `src/routes/index.ts`. Webhooks são montados **antes** do `json()` parser (necessário para validação de assinatura Stripe).

| Prefixo | Principais operações |
|---------|---------------------|
| `/admins` | Login, CRUD de admins, troca de senha |
| `/students` | Criar aluno/inscrição, listar, cancelar, reembolso, exportar Excel |
| `/donates` | Criar doação, PIX, checkout Stripe, portal, cancelar, reembolso, exportar Excel |
| `/schoolClass` | CRUD de turmas, documentos, etapas seletivas |
| `/coupons` | CRUD de cupons |
| `/refresh-token` | Renovar JWT |
| `/webhooks` | Stripe + Santander |
| `/webhooks/asaas` | ASAAS |
| `/webhook-efi` | EFI/Gerencianet |

## Provedores de pagamento

### Stripe (principal)
- Variável: `STRIPE_SECRET_KEY`
- Funcionalidades: checkout sessions, assinaturas recorrentes, portal do cliente, reembolsos
- Webhook valida assinatura com `STRIPE_WEBHOOK_SECRET`
- Eventos tratados: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
- Metadado `session.metadata.type` roteia para fluxo de inscrição (`inscription`) ou doação (`donation`)

### ASAAS (alternativo)
- Configurado via `PAYMENT_PROVIDER=asaas` (ou `stripe`)
- Endpoint de sandbox ou produção configurável
- Suporta magic link para portal do pagador
- Webhook: `POST /webhooks/asaas`

### EFI / Gerencianet (PIX)
- Autenticação: client_id + client_secret + certificado `.p12`
- Variáveis: `EFI_CLIENT_ID`, `EFI_CLIENT_SECRET`
- Certificado: `producao-600665-Awer Pay Prod.p12`
- Endpoint: `https://pix.api.efipay.com.br`
- Webhook: `POST /webhook-efi`

### Santander Trust PIX (PIX)
- Autenticação: OAuth 2.0 (client_credentials) + certificados PEM
- Arquivos: `chave_publica_producao.pem`, `chave_privada_producao.pem`
- Client: `src/lib/santanderApiClient.ts`
- Webhook: `POST /webhooks` (Santander)

## Serviços

| Serviço | Arquivo | Responsabilidade |
|---------|---------|-----------------|
| `StripeDonationService` | `src/services/` | Checkout e portal para doações |
| `StripeInscriptionService` | `src/services/` | Checkout para inscrições |
| `AsaasService` | `src/services/` | Pagamentos via ASAAS |
| `MailService` | `src/services/MailService.ts` | E-mails transacionais via MailerSend |
| `CouponService` | `src/services/CouponService.ts` | CRUD e validação de cupons |
| `AutomationService` | `src/services/AutomationService.ts` | E-mails automáticos (aniversários, relatórios) |

## Jobs agendados (node-cron)

Definidos em `src/jobs/cron.ts`:
- **09:00 diário** — envia e-mails de aniversário de doação
- **10:00 no dia 5** — envia relatório mensal (placeholder)

## Padrão arquitetural

Camadas por domínio:

```
Route → Controller → UseCase → Repository → Prisma
                  ↘ Service (Stripe, Mail, etc.)
```

- **Controller**: recebe Request/Response, delega ao UseCase
- **UseCase**: orquestra regras de negócio
- **Repository**: abstrai queries Prisma via interface `I{Entity}Repository`
- **Service**: integrações externas (Stripe, MailerSend, ASAAS, EFI)

Resposta padrão:
```typescript
{ isValid: boolean, statusCode: number, data?: any, errorMessage?: string }
```

Erros: `throw new AppError(message, statusCode)` capturado pelo middleware global em `server.ts`.

## Variáveis de ambiente relevantes

```
DATABASE_URL=mongodb+srv://...
TOKEN_PRIVATE_KEY=...
REFRESHTOKEN_EXPIRATION_TIME_NUMBER=30
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_PROVIDER=stripe         # ou asaas
EFI_CLIENT_ID=...
EFI_CLIENT_SECRET=...
MAILERSEND_API_KEY=...
```

## Comandos

```bash
npm run dev      # ts-node-dev com hot reload
npm run build    # tsc
npm run prod     # node ./build/server.js
```

## Convenções

- `AppError` para todos os erros de negócio; nunca `throw new Error()` diretamente
- Validação de payload com Yup antes de chegar no UseCase
- Repositórios sempre implementam interface (`I{Entity}Repository`)
- Controllers são finos: apenas extrai params/body e chama UseCase
- `prisma.ts` exporta singleton; nunca instanciar `PrismaClient` diretamente nos módulos
