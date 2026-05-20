# RoleZero — Documentação do Projeto Frontend

---

## 1. Conceito e Problema

**RoleZero** é um facilitador de experiências coletivas. O app conecta pessoas por interesses comuns para ocupar vagas em mesas e grupos, **reduzindo o custo social e a ansiedade de frequentar lugares sozinho**.

- **Problema:** pessoas evitam sair sozinhas para bares, shows e eventos por barreiras sociais.
- **Solução:** unir desconhecidos com interesses em comum em torno de um rolê específico — com foco no grupo e na segurança, sem a pressão do match individual.
- **Diferencial:** sistema de **TrustScore** que mede a reputação de cada usuário com base em avaliações de quem já rolou junto.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 15** (App Router) |
| UI | **Chakra UI 2.x** (tema customizado, sem Tailwind) |
| Linguagem | **TypeScript 5.x** |
| Mapas | **Google Maps JavaScript API** + HeatmapLayer |
| Animações | **Framer Motion** |
| Runtime | Node.js 18+ |
| Porta de dev | `4000` (`npm run dev`) |

### Backend
- API REST hospedada em: `https://rolezero-backend-core.onrender.com`
- Autenticação via **JWT Bearer Token** armazenado em `localStorage`
- Todas as chamadas encapsuladas em funções tipadas em `src/lib/api/`

---

## 3. Identidade Visual

Tema escuro forçado (sem toggle claro/escuro), com paleta de três tokens principais:

| Token | Cor | Uso |
|-------|-----|-----|
| `brand.500` | `#e03800` — Laranja Vibrante | CTAs, destaques, ativo |
| `surface.bg` | `#0B0B0F` — Preto profundo | Background da aplicação |
| `surface.card` | `#12121a` — Cinza muito escuro | Cards, sheets, modais |
| `surface.input` | `#1a1a24` | Campos de formulário |

Tipografia: sistema sans-serif do OS. Botões com `colorScheme="brand"` por padrão, inputs com `variant="filled"`.

---

## 4. Estrutura de Pastas

```
src/
├── app/                     # Rotas (Next.js App Router)
│   ├── page.tsx             # Redirect → /home
│   ├── layout.tsx           # Root layout + ChakraProvider + dark mode
│   ├── providers.tsx        # CacheProvider + ChakraProvider
│   ├── globals.css          # Reset global
│   ├── home/                # Mapa principal + descoberta de rolês
│   ├── login/               # Autenticação
│   ├── register/            # Cadastro
│   ├── create/              # Criar novo rolê
│   ├── my-events/           # Meus Rolês (host + participante)
│   └── profile/
│       ├── page.tsx         # Perfil próprio
│       └── [userId]/        # Perfil público de qualquer usuário
│           └── page.tsx
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx    # HOC de proteção de rota
│   ├── layout/
│   │   ├── BottomNav.tsx    # Navegação inferior (4 tabs + FAB)
│   │   └── Header.tsx
│   └── map/
│       ├── MapView.tsx      # Google Maps + pins + heatmap
│       └── EventBottomSheet.tsx  # Sheet de detalhes + todas as ações
├── hooks/
│   └── useGeolocation.ts    # Geolocalização do usuário (GPS)
├── lib/
│   └── api/
│       ├── client.ts        # apiFetch() base
│       ├── auth.ts          # login, register, logout
│       ├── events.ts        # Todas as operações de eventos
│       └── users.ts         # Perfil, avaliações, biometria
├── theme/
│   └── index.ts             # Tema Chakra customizado
└── types/
    └── index.ts             # VibeTag, RoleEvent
```

---

## 5. Telas e Funcionalidades

### 5.1 Tela de Login (`/login`)
- Formulário email + senha
- JWT salvo em `localStorage` (chaves `token` e `userId`)
- Toast de sucesso/erro
- Link para cadastro

### 5.2 Tela de Cadastro (`/register`)
- Formulário nome + email + senha
- Após registro: salva token e busca `userId` via `/api/v1/users/me`
- Redirect automático para `/home`

### 5.3 Mapa Principal (`/home`)
- **Google Maps** com tema dark customizado
- Filtros de **Vibe** como chips horizontais: 🍺 Beer, 🎵 Música, 🎲 Jogos, 😌 Chill, 🎉 Festa, ⚽ Esportes
- **Pins de evento** com a inicial do nome do rolê, coloridos por disponibilidade:
  - 🟠 Laranja → muitas vagas (>40%)
  - 🟡 Amarelo → poucas vagas (10–40%)
  - ⚫ Cinza → quase cheio (<10%)
- **HeatmapLayer** de concentração de eventos
- Pins de POI filtrados para estabelecimentos de entretenimento (bares, restaurantes, atrações)
- Ponto azul de localização do usuário
- Geocoding automático de endereços sem coordenadas (com cache)
- **Bottom Sheet** abre ao clicar em qualquer evento

### 5.4 EventBottomSheet (componente central)
Sheet deslizante com detalhes do evento e todas as ações contextuais:

**Para qualquer usuário:**
- Título, status badge, data/hora, endereço, nome do host (clicável → perfil público)
- TrustScore do host (estrela laranja)
- Barra de ocupação colorida (verde → amarelo → vermelho)
- Previsão do tempo com emoji
- Descrição do rolê

**Para o Host (dono do evento):**
- Botão **Editar** → modal inline com campos título, descrição, capacidade
- Botão **Cancelar Rolê**
- Botão **Ver Solicitações** com badge de contagem de pendentes em tempo real
  - Aprovar ou rejeitar cada solicitante com nome e TrustScore visíveis
- Botão **Ver Participantes**
- Botão **🚨 SOS — Emergência** (panic mode)

**Para Convidado (não participante):**
- Botão **Pedir para Participar** com contagem de vagas restantes
- Rolê lotado → botão desabilitado
- Já solicitado → badge "Solicitação enviada ✓"

**Para Participante aprovado:**
- Botão **Check-in →** (valida proximidade via GPS)
- Botão **Ver Participantes**
- Botão **🚨 SOS — Emergência**

### 5.5 Criar Rolê (`/create`)
- Formulário completo: título, descrição, data/hora, endereço, capacidade máxima
- Seletor múltiplo de **VibeTags** (chips clicáveis)
- Geocoding do endereço digitado via Google Maps Geocoder
- Toast de confirmação ("Rolê criado! 🎉") ou erro

### 5.6 Meus Rolês (`/my-events`)
- Lista de eventos que o usuário **hospeda** ou **participa**
- Separação visual: ativos × encerrados (EXPIRADO)
- Para cada rolê ativo como host:
  - **Botão lápis** → modal de edição inline (título, descrição, capacidade)
  - **Botão lixeira** → modal de confirmação de cancelamento
- Página 100% scrollável dentro da viewport (`overflow: hidden` no container, `overflowY: auto` no conteúdo)

### 5.7 Perfil Próprio (`/profile`)
- Avatar com inicial do nome
- TrustScore com barra visual
- Chips de vibes do usuário
- Modal de edição: nome e vibes
- Botão de logout

### 5.8 Perfil Público (`/profile/[userId]`)
- Avatar, nome, badge de identidade verificada
- **TrustScoreBar** visual com porcentagem
- Chips de vibes
- Seção de avaliações (nota média, total, lista de reviews)
- Botão **★ Avaliar** aparece apenas quando acessado com `?eventId=` na URL
  - Modal: seletor de estrelas (1–5) + comentário + contador de caracteres
  - Só pode avaliar quem rolou junto (vinculado ao evento)

---

## 6. Fluxos de Usuário

### Fluxo de Descoberta e Participação
```
Abrir app → /home (mapa)
→ Ver pins de eventos próximos
→ Clicar em um pin → EventBottomSheet abre
→ "Pedir para Participar"
→ Host recebe notificação na sheet ("🔔 X solicitações pendentes")
→ Host aprova/rejeita
→ Participante aprovado faz Check-in no dia
→ Após o evento, pode avaliar o host
```

### Fluxo de Criação de Evento
```
BottomNav → + (FAB) → /create
→ Preencher dados + vibes + endereço
→ Criar Rolê
→ Volta ao mapa; evento aparece como pin
→ Gerenciar pelo /my-events ou pelo sheet no mapa
```

---

## 7. Sistema de VibeTags

Tags de interesse que definem o "vibe" do rolê:

| Tag | Descrição |
|-----|-----------|
| `CRAFT_BEER` | 🍺 Cervejas artesanais |
| `MUSICA_AO_VIVO` | 🎵 Shows e música ao vivo |
| `BOARDGAMES` | 🎲 Jogos de tabuleiro |
| `CHILL` | 😌 Ambiente tranquilo |
| `FESTA` | 🎉 Festa |
| `ESPORTES` | ⚽ Atividades esportivas |
| `PAGODE` | Pagode |
| `SERTANEJO` | Sertanejo |
| `FUNK` | Funk |
| `ROCK` | Rock |
| `ELETRONICA` | Eletrônica |
| `CULTURA` | Arte e cultura |

---

## 8. Sistema de TrustScore

- Cada usuário possui uma pontuação de reputação (0.0–5.0)
- Calculada com base nas avaliações recebidas após eventos
- Avaliação vinculada a um `eventId` específico → só quem rolou junto pode avaliar
- Exibida com estrela laranja (★) em todos os contextos: pins, sheets, listas de solicitação, perfis
- Influencia a visibilidade e credibilidade do usuário na plataforma

---

## 9. API — Endpoints Consumidos

### Autenticação (`/api/v1/auth`)
| Método | Rota | Uso |
|--------|------|-----|
| `POST` | `/login` | Login com email + senha |
| `POST` | `/register` | Cadastro de novo usuário |
| `DELETE` | `/session` | Logout (revoga JWT) |

### Usuários (`/api/v1/users`)
| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/me` | Perfil do usuário logado |
| `PATCH` | `/me` | Atualizar nome e vibes |
| `POST` | `/me/biometria` | Validar identidade biométrica |
| `GET` | `/{userId}` | Perfil público |
| `GET` | `/{userId}/avaliacoes` | Reviews de um usuário |
| `POST` | `/{userId}/avaliacoes` | Avaliar usuário após evento |

### Eventos (`/api/v1/events`)
| Método | Rota | Uso |
|--------|------|-----|
| `POST` | `/` | Criar evento |
| `GET` | `/nearby` | Eventos próximos (com filtros) |
| `GET` | `/my` | Meus eventos (host + participante) |
| `GET` | `/{id}` | Detalhes de um evento |
| `PATCH` | `/{id}` | Editar evento (host) |
| `DELETE` | `/{id}` | Cancelar evento (host) |
| `POST` | `/{id}/check-in` | Check-in com GPS |
| `POST` | `/{id}/join-requests` | Solicitar participação |
| `GET` | `/{id}/requests` | Listar solicitações pendentes (host) |
| `PUT` | `/{id}/requests/{reqId}` | Aprovar/rejeitar solicitação (host) |
| `GET` | `/{id}/participants` | Listar participantes aprovados |
| `POST` | `/{id}/panic` | SOS / modo pânico |

---

## 10. Status de Evento

O ciclo de vida de um evento passa pelos seguintes estados:

```
CRIADO → ABERTO_PARA_VAGAS → FECHADO_PREGAME → EM_ANDAMENTO → EXPIRADO
```

| Status | Descrição |
|--------|-----------|
| `CRIADO` | Recém-criado, aceita solicitações |
| `ABERTO_PARA_VAGAS` | Aberto para novos participantes |
| `FECHADO_PREGAME` | Vagas encerradas, evento prestes a começar |
| `EM_ANDAMENTO` | Evento em curso |
| `EXPIRADO` | Encerrado |

---

## 11. Componentes e Padrões Técnicos

### AuthGuard
HOC que verifica a presença do token em `localStorage` e redireciona para `/login` caso ausente. Envolve todas as páginas protegidas.

### useGeolocation
Hook customizado que utiliza `navigator.geolocation.watchPosition` para monitorar a posição do usuário em tempo real e fornecer `{ lat, lng }` para o mapa e check-in.

### apiFetch
Função base de todas as chamadas à API. Lança `Error` com status HTTP em caso de falha. Todas as funções de API são fortemente tipadas com TypeScript.

### Persistência de sessão
- `localStorage.token` — JWT de autenticação
- `localStorage.userId` — ID do usuário logado (salvo no login/registro para uso síncrono, evitando race conditions)

### Toast notifications
Todas as ações com feedback ao usuário (criar, editar, cancelar, entrar, check-in, avaliar, login) utilizam `useToast` do Chakra UI. Nenhum estado de erro inline nos formulários — tudo via toast.

---

## 12. Decisões de Design Notáveis

- **Mobile-first:** interface projetada para 390px de largura (iPhone padrão), usável em desktop
- **Bottom sheet animado:** o `EventBottomSheet` usa transform CSS (`translateY`) para entrar/sair da tela com animação suave, sem libraries de terceiros
- **Sem página de evento separada:** todos os detalhes e ações acontecem no sheet deslizante sobre o mapa — experiência fluida sem quebrar o contexto do mapa
- **Otimismo nas mutações:** edições e cancelamentos refletem imediatamente na UI sem esperar refetch
- **Geocoding com cache:** endereços digitados são geocodificados uma vez e cacheados em `useRef` durante a sessão
- **BottomNav com FAB central:** layout de 3 zonas (tabs esquerda | FAB central | tabs direita) usando `flex` para alinhamento perfeito

---

## 13. O que está implementado

- ✅ Autenticação completa (login, cadastro, logout)
- ✅ Mapa com pins, heatmap, filtros de vibe
- ✅ Detalhes do evento em bottom sheet
- ✅ Criar rolê com geolocalização e VibeTags
- ✅ Fluxo de participação (solicitação → aprovação → check-in)
- ✅ Dashboard do host (solicitações pendentes, aprovar/rejeitar)
- ✅ Editar e cancelar eventos (mapa e Meus Rolês)
- ✅ Meus Rolês (lista paginada, ações inline)
- ✅ Perfil próprio com edição
- ✅ Perfil público com avaliações
- ✅ Sistema de reviews com estrelas e comentário
- ✅ TrustScore visual em todos os contextos
- ✅ SOS / modo pânico
- ✅ Previsão do tempo no evento
- ✅ Toast notifications em todas as ações
- ✅ Navegação por bottom bar com FAB

---

## 14. Próximos Passos (não implementados)

- ❌ **Chat do evento** — `GET /api/v1/events/{id}/chat/history` (mensagens em tempo real entre host e participantes)
- ❌ Notificações push
- ❌ Modo de busca textual de eventos/locais
