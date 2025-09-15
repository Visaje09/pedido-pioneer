# ERP Órdenes - Sistema de Gestión

Un sistema ERP moderno para gestión completa de órdenes de pedido con flujo de trabajo basado en roles.

## Características Principales

### 🔐 Sistema de Autenticación
- Autenticación con email/contraseña usando Supabase Auth
- Sistema de roles: Admin, Comercial, Inventarios, Producción, Logística, Facturación, Financiera
- Persistencia de sesión y guards por rol
- Rutas protegidas según permisos

### 📋 Gestión de Órdenes
- **Vista Kanban** por estados del flujo de trabajo
- **Creación de órdenes** con formularios estructurados
- **Seguimiento completo** desde borrador hasta cierre
- **Productos polimórficos**: Equipos y Líneas de Servicio

### 👥 Panel de Administración
- Gestión de usuarios y cambio de roles
- Administración de catálogos maestros
- Configuración del sistema

### 🎯 Flujo de Trabajo por Roles
1. **Comercial**: Crea órdenes, gestiona clientes y proyectos
2. **Inventarios**: Valida disponibilidad de productos
3. **Producción**: Genera órdenes de producción
4. **Logística**: Maneja remisiones y envíos
5. **Facturación**: Procesa facturación
6. **Financiera**: Cierre y seguimiento financiero

## Estados de Órdenes

- 📝 **Borrador** → Creación inicial
- ✅ **Validación Comercial** → Revisión comercial
- 📦 **Inventarios Pendiente** → Validación de inventarios
- 🏭 **Producción Pendiente** → En proceso de producción
- 🚚 **Logística Pendiente** → Preparación para envío
- 📤 **Enviada** → En tránsito
- 🧾 **Facturación Pendiente** → Proceso de facturación
- ✅ **Facturada** → Facturación completada
- 💰 **Financiera Pendiente** → Revisión financiera
- ✔️ **Cerrada** → Proceso completado
- ❌ **Anulada** → Orden cancelada

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + shadcn/ui
- **Base de Datos**: Supabase (PostgreSQL + RLS)
- **Autenticación**: Supabase Auth
- **Routing**: React Router v6
- **Formularios**: React Hook Form + Zod
- **Estado**: React Query (TanStack Query)

## Estructura del Proyecto

```
src/
├── components/
│   ├── auth/          # Componentes de autenticación
│   └── ui/            # Componentes de interfaz (shadcn/ui)
├── contexts/          # Contextos de React
├── hooks/             # Hooks personalizados
├── integrations/      # Configuración de Supabase
├── lib/              # Utilidades
└── pages/            # Páginas principales
    ├── Login.tsx     # Autenticación
    ├── Dashboard.tsx # Panel principal
    ├── Ordenes.tsx   # Vista de órdenes
    ├── NuevaOrden.tsx # Creación de órdenes
    ├── Admin.tsx     # Panel de administración
    └── NotFound.tsx  # Página 404
```

## Base de Datos

### Tablas Principales
- `profiles` - Perfiles de usuario con roles
- `ordenpedido` - Órdenes principales con estado y workflow
- `detalleorden` - Líneas de detalle de productos
- `producto` - Catálogo de productos (polimórfico)
- `equipo` / `lineaservicio` - Tipos específicos de producto

### Catálogos Maestros
- `cliente` - Clientes
- `proyecto` - Proyectos por cliente
- `claseorden` - Tipos de orden
- `tipopago` - Formas de pago
- `operador` / `plan` / `apn` - Configuración líneas de servicio
- `transportadora` / `metododespacho` - Logística

## Seguridad

- **Row Level Security (RLS)** en todas las tablas
- **Políticas granulares** por rol y estado
- **Validación en cliente y servidor**
- **Tokens JWT** manejados por Supabase

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (ya configuradas)
# El proyecto está conectado a Supabase

# Iniciar desarrollo
npm run dev
```

## Usuarios de Prueba

El sistema permite registro de nuevos usuarios. Los usuarios creados tienen rol `comercial` por defecto. Un administrador puede cambiar roles desde el panel de administración.

## Características de Diseño

- **Design System** consistente con tokens semánticos
- **Tema corporativo** con colores azul/gris
- **Responsive** para móviles y desktop
- **Animaciones suaves** y transiciones
- **Componentes reutilizables** con variantes

## Próximas Funcionalidades

- [ ] Kanban con drag & drop
- [ ] Detalle completo de órdenes por tabs
- [ ] Catálogos CRUD completos
- [ ] Reportes y analytics
- [ ] Notificaciones en tiempo real
- [ ] APIs REST para integraciones

---

Sistema desarrollado con React + Supabase para gestión empresarial de órdenes de pedido.