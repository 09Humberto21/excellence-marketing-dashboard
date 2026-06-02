# Excellence Marketing Dashboard

Dashboard de administración completo para la plataforma de marketing Excellence. Interfaz moderna y responsiva para gestionar campañas Nostr, recompensas Lightning, referrals, y más.

## 🎯 Features

- 📊 **Dashboard en tiempo real** — Estadísticas de plataforma, campañas activas, top referrers
- 🎪 **Gestión de campañas** — CRUD completo con ciclo de vida (draft → active → paused → completed)
- 💼 **Empresas** — Crear y listar empresas asociadas
- ⚡ **Acciones y rewards** — Registro de acciones del usuario, verificación y distribución de recompensas
- 🔍 **Reglas de detección** — Configurar keywords, hashtags, event references para scanning automático
- 🤖 **Workers internos** — Disparar manualmente scan, verify-pending y process-rewards
- 🚀 **Ark / Lightning** — Integración completa: board, pay, receive, VTXOs, offboard, emergency exit
- 🛡️ **Admin API** — Vistas agregadas: campaign summary, referral stats
- ⚙️ **Configuración** — Gestionar URLs de API y credenciales de admin

## 🛠️ Stack Tecnológico

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **CSS**: Tailwind CSS (dark theme)
- **State & Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Package Manager**: npm

## 📋 Requisitos

- **Node.js** v18+ (se recomienda v24 LTS)
- **npm** v11+
- **Excellence Backend** corriendo en:
  - Marketing API: `http://localhost:8006`
  - Admin API: `http://localhost:8010`

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/09Humberto21/excellence-marketing-dashboard
cd excellence-marketing-dashboard

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El dashboard estará disponible en **http://localhost:3000**

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Badge.tsx       # Badges de estado/tipo
│   ├── Layout.tsx      # Layout, Card, Btn, Input, Select, Textarea
│   ├── Modal.tsx       # Modal reutilizable
│   ├── Sidebar.tsx     # Navegación lateral
│   ├── Spinner.tsx     # Loader y estados vacíos
│   └── Toast.tsx       # Sistema de notificaciones
├── lib/
│   ├── api.ts          # Cliente HTTP con todos los endpoints
│   ├── types.ts        # Tipos TypeScript de la API
│   └── utils.ts        # Utilidades (format, truncate, config)
├── pages/              # Páginas por ruta
│   ├── Dashboard.tsx   # Resumen de plataforma
│   ├── Campaigns.tsx   # CRUD de campañas
│   ├── CampaignDetail.tsx  # Detalle + acciones/rewards/reglas/monitor/NWC
│   ├── Companies.tsx   # Gestión de empresas
│   ├── Workers.tsx     # Workers internos (scan/verify/process)
│   ├── Ark.tsx        # Integración Ark/Lightning
│   ├── Admin.tsx      # Admin dashboard
│   └── Settings.tsx   # Configuración de API
├── App.tsx            # Router y setup de React Query
├── main.tsx           # Entry point
└── index.css          # Estilos globales + Tailwind

tailwind.config.js     # Configuración de Tailwind
vite.config.ts        # Configuración de Vite
tsconfig.json         # Configuración de TypeScript
```

## ⚙️ Configuración

### Variables de ambiente (localStorage)

El dashboard guarda la configuración en `localStorage` bajo la clave `api_config`:

```json
{
  "marketingBaseUrl": "http://localhost:8006",
  "adminBaseUrl": "http://localhost:8010",
  "adminApiKey": ""
}
```

**Configurar en UI**: Ir a **Configuración** (`/settings`) y completar:
- Marketing API URL (default: `http://localhost:8006`)
- Admin API URL (default: `http://localhost:8010`)
- Admin API Key (requerido para endpoints protegidos)

### Admin API Key

Los endpoints protegidos requieren `X-Admin-Api-Key` o `Authorization: Bearer <token>`:

```typescript
// El cliente lo envía automáticamente en ambos headers
headers: {
  'X-Admin-Api-Key': apiKey,
  'Authorization': `Bearer ${apiKey}`
}
```

**En desarrollo** (`env_profile=local`): Si no está configurado, el acceso admin queda abierto automáticamente.

## 📑 Páginas y Funcionalidades

### Dashboard (`/`)
- Stats en grid: Total campañas, activas, presupuesto, empresas, referrals
- Campañas recientes con ciclo de vida
- Breakdown de estado
- Top referrers
- Desglose por reward mode

### Campañas (`/campaigns`)
- Lista con filtros por status y campaign_type
- Tarjetas con:
  - Ciclo de vida completo
  - Progreso de presupuesto (barra visual)
  - Acciones y reward per acción
  - Botones contextuales (Activar, Pausar, Reanudar, Completar, Cancelar)
- Modal para crear nuevas campañas
  - Campos: Nombre, Empresa, Tipo, Detección, Reward mode, Funding mode
  - Budget, reward/acción, máx acciones
  - Target keywords y comment templates (para nostr_promotion)
  - NWC URI (requerido para reward_mode=zap)

### Detalle de Campaña (`/campaigns/:id`)
Tabs:
1. **Resumen** — Datos completos, keywords, templates
2. **Acciones** — Listado de acciones con status, botón para verificar
3. **Reglas** — Reglas de detección, crear nuevas
4. **Rewards** — Intentos de pago con status y monto
5. **Monitor** — Estado del relay monitor job
6. **NWC** — Test y rotación de NWC URI

Botones de ciclo de vida contextuales según el estado actual.

### Empresas (`/companies`)
- Listado en grid
- Filtro por status
- Crear nueva empresa con modal

### Workers (`/workers`)
Tres workers internos (requieren Admin API Key):

1. **Scan active campaigns**
   - Configurable duration (1-300 segundos)
   - Retorna detecciones encontradas en relays

2. **Verify pending events**
   - Filtra por campaign (opcional)
   - Verifica eventos contra reglas de detección

3. **Process verified rewards**
   - Filtra por campaign (opcional)
   - Dispara pagos vía NWC/zap para acciones verificadas

### Ark / Lightning (`/ark`)
Operaciones Ark con campos por endpoint:
- **Board** — Crear dirección de depósito
- **Pay** — Enviar pago BOLT11
- **Receive** — Recibir satoshis
- **VTXOs** — Consultar virtual UTXOs
- **Offboard** — Sacar fondos a Bitcoin on-chain
- **Emergency Exit** — Recuperación unilateral (irreversible)
- **Round Info** y **Ark Info** — Estado del sistema

### Admin Dashboard (`/admin`)
**Requiere Admin API (puerto 8010)**:
- Campaign summary: Total, activas, presupuesto, gastado
- Listado de campañas con actions_count
- Referral summary: Total referrals, total pagado
- Top 20 referrers con stats

### Settings (`/settings`)
- URLs de ambas APIs
- Admin API Key (guardada segura en localStorage)
- Botón para resguardar defaults

## 🔌 Endpoints de API Integrados

El cliente `src/lib/api.ts` cubre:

### Marketing API (8006)
- `/health`, `/ready`, `/metrics`
- `/companies` — CRUD
- `/campaigns` — CRUD + lifecycle (activate, pause, resume, complete)
- `/campaigns/{id}/actions` — Crear acciones, listar, verificar
- `/campaigns/{id}/rewards` — Listar rewards
- `/campaigns/{id}/detection-rules` — CRUD de reglas
- `/campaigns/{id}/monitor-job` — Estado del monitor
- `/campaigns/{id}/test-nwc` — Testear/rotar NWC URI
- `/internal/workers/*` — Scan, verify, process (requieren admin)
- `/ark/*` — Todas las operaciones Ark

### Admin API (8010)
- `/health`
- `/campaigns/summary` — Campaign summary agregado
- `/referrals/summary` — Referral stats

## 🎨 Diseño

- **Color scheme**: Dark theme con acentos orange (`#fb923c`)
- **Componentes**: Badges animados, modales, toasts, spinners
- **Responsivo**: Grid CSS adaptable (mobile, tablet, desktop)
- **Animaciones**: Fade-in, slide-in en modales y componentes

## 🔐 Seguridad

- **Admin Key**: Guardada en localStorage, enviada en headers
- **Validaciones**: Helpers en `common/security.py` del backend validan:
  - nostr_pubkey, user_pubkey (format)
  - Direcciones Bitcoin
  - BOLT11 invoices
  - NWC URIs (formato nostr+walletconnect://)
- **No expone rutas públicas**: No hay `/auth/register` ni endpoints de user auth

## 📦 Build para producción

```bash
npm run build
```

Genera `dist/` listo para deployment.

## 🐛 Desarrollo

```bash
npm run dev
```

- Hot Module Replacement (HMR) automático
- TypeScript strict mode activado
- ESLint y strict type checking

## 📄 Licencia

Proyecto Excellence © 2026

---

**Construido con ❤️ para la plataforma Excellence**

Para issues, feature requests o contribuciones:  
https://github.com/09Humberto21/excellence-marketing-dashboard
