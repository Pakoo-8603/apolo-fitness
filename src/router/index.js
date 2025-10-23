// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'

// Públicas
import HomePage  from '@/components/landing/HomePage.vue'
import LoginPage from '@/components/LoginPage.vue'

// Layout protegido
const AppLayout       = () => import('@/layouts/AppLayout.vue')

// Vistas protegidas (lazy)
const Dashboard       = () => import('@/components/Dashboard.vue')
const EmpresasLista = () => import('@/views/empresas/EmpresasLista.vue')
const EmpresaDetalle = () => import('@/views/empresas/EmpresaDetalle.vue')
const ClientesLista   = () => import('@/views/clientes/ClientesLista.vue')
const ConveniosLista   = () => import('@/views/clientes/ConveniosLista.vue')
// const ClienteCrear    = () => import('@/views/clientes/ClienteCrear.vue')
const ClienteEditar = () => import('@/views/clientes/ClienteEditar.vue') 
const ClienteDetalle = () => import('@/views/clientes/ClienteDetalle.vue') 
const ClienteDatos   = () => import('@/views/clientes/ClienteDatos.vue')
const PlanesLista     = () => import('@/views/planes/PlanesLista.vue')
const PlanDetalle = () => import('@/views/planes/PlanDetalle.vue')
const PlanCrear = () => import('@/views/planes/PlanCrear.vue')
const PlanEditar = () => import('@/views/planes/PlanEditar.vue')
const ServiciosLista   = () => import('@/views/servicios/ServiciosLista.vue')
const DisciplinasLista   = () => import('@/views/disciplinas/DisciplinasLista.vue')
const BeneficiosLista  = () => import('@/views/beneficios/BeneficiosLista.vue')
const MembresiasLista = () => import('@/views/membresias/MembresiasLista.vue')
const POS = () => import('@/views/ventas/POS.vue')
const AlmacenesLista = () => import('@/views/inventario/AlmacenesLista.vue')
const ProductosLista = () => import('@/views/inventario/ProductoLista.vue')
const MembresiaCrear  = () => import('@/views/membresias/MembresiaCrear.vue')
const UsuariosEmpresa = () => import('@/views/usuarios/UsuariosEmpresa.vue')
const Configuraciones = () => import('@/views/config/Configuraciones.vue')
const UiConfigurator = () => import('@/views/config/UiConfigurator.vue')
const ReportesAuditoria = () => import('@/views/reportes/ReportesAuditoria.vue')
const Perfil          = () => import('@/views/cuenta/Perfil.vue')
const KpisLayout = () => import('@/views/kpis/KpisLayout.vue')
const KpiDashboardView = () => import('@/views/kpis/KpiDashboardView.vue')
const KpiMetricEditor = () => import('@/views/kpis/KpiMetricEditor.vue')
const KpiDashboardEditor = () => import('@/views/kpis/KpiDashboardEditor.vue')

const routes = [
  // Públicas
  { path: '/landing', name: 'Home',  component: HomePage,  meta: { requiresGuest: true } },
  { path: '/login',   name: 'Login', component: LoginPage, meta: { requiresGuest: true } },

  // Protegidas envueltas por el layout
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'empresas', name: 'EmpresasLista', component: EmpresasLista },
      { path: '/empresas/:id', name: 'EmpresaDetalle', component: EmpresaDetalle, props: true },
      // Clientes
      { path: 'clientes',       name: 'ClientesLista', component: ClientesLista, meta: { perms: ['clientes:read'] } },
      { path: 'convenios',       name: 'ConveniosLista', component: ConveniosLista, meta: { perms: ['clientes:read'] } },
      // { path: 'clientes/nuevo', name: 'ClienteCrear',  component: ClienteCrear,  meta: { perms: ['clientes:create'] } },
      // { path: 'clientes/:id',        name: 'ClienteDetalle',component:ClienteDetalle,  props: true },
      { path: 'clientes/:id/editar', name: 'ClienteEditar',  component: ClienteEditar, props: true },
      { path: 'clientes/:id', name: 'ClienteDatos', component: ClienteDatos, props: true },
      // Planes
      { path: 'planes', name: 'PlanesLista', component: PlanesLista, meta: { perms: ['planes:read'] } },
      { path: 'planes/:id', name: 'PlanDetalle', component: PlanDetalle, props: true, meta: { perms: ['planes:read'] } },
      { path: 'planes/nuevo', name: 'PlanCrear', component: PlanCrear, meta: { perms: ['planes:create'] } },
      { path: 'planes/:id/editar', name: 'PlanEditar', component: PlanEditar, meta: { perms: ['planes:update'] }, props: true },
      { path: 'servicios',  name: 'ServiciosLista',  component: ServiciosLista,  meta: { perms: ['planes:read'] } },
      { path: 'beneficios', name: 'BeneficiosLista', component: BeneficiosLista, meta: { perms: ['planes:read'] } },
      { path: 'disciplinas', name: 'DisciplinasLista', component: DisciplinasLista, meta: { perms: ['planes:read'] } },
      { path: 'almacenes', name: 'AlmacenesLista', component: AlmacenesLista, meta: { perms: ['productos:read'] } },
      { path: 'productos', name: 'ProductosLista', component: ProductosLista, meta: { perms: ['productos:read'] } },
      { path: 'pos', name: 'Pos', component: POS, meta: { perms: ['productos:read'] } },
      { path: 'membresias',       name: 'MembresiasLista', component: MembresiasLista, meta: { perms: ['membresias:read'] } },
      { path: 'membresias/nueva', name: 'MembresiaCrear',  component: MembresiaCrear,  meta: { perms: ['membresias:create'] } },
      // Administración
      { path: 'usuarios', name: 'UsuariosEmpresa', component: UsuariosEmpresa, meta: { perms: ['usuarios:manage'] } },
      { path: 'config',   name: 'Configuraciones', component: Configuraciones, meta: { perms: ['config:manage'] } },
      // Config
      { path: 'config/ui', name: 'UiConfigurator', component: UiConfigurator, meta: { perms: ['config:manage'] } },
      // Cuenta
      { path: 'perfil', name: 'Perfil', component: Perfil },
      { path: 'reportes', name: 'Reportes', component: ReportesAuditoria },
      {
        path: 'kpis',
        component: KpisLayout,
        children: [
          { path: 'dashboard', name: 'KpiDashboard', component: KpiDashboardView, meta: { perms: ['kpis:read'] } },
          { path: 'metricas/:id?', name: 'KpiMetricEditor', component: KpiMetricEditor, props: true, meta: { perms: ['kpis:manage'] } },
          { path: 'dashboards/:id/editar', name: 'KpiDashboardEditor', component: KpiDashboardEditor, props: true, meta: { perms: ['kpis:manage'] } },
          { path: '', redirect: { name: 'KpiDashboard' } },
        ],
      },

      // default child
      { path: '', redirect: { name: 'Dashboard' } },
    ],
  },

  // Atajos para URLs antiguas (compat)
  { path: '/dashboard',      redirect: { name: 'Dashboard' } },
  { path: '/clientes',       redirect: { name: 'ClientesLista' } },
  // { path: '/clientes/nuevo', redirect: { name: 'ClienteCrear' } },
  { path: '/planes',         redirect: { name: 'PlanesLista' } },
  { path: '/usuarios',       redirect: { name: 'UsuariosEmpresa' } },
  { path: '/config',         redirect: { name: 'Configuraciones' } },
  { path: '/perfil',         redirect: { name: 'Perfil' } },
  { path: '/kpis',           redirect: { name: 'KpiDashboard' } },

  // Raíz -> dashboard (guard decidirá login si no hay sesión)
  { path: '/', redirect: '/dashboard' },

  // 404
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// ===== Guards =====
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  auth.init?.()

  const isAuthenticated = auth.isAuthenticated
  const requiresAuth  = !!to.matched.find(r => r.meta?.requiresAuth)
  const requiresGuest = !!to.matched.find(r => r.meta?.requiresGuest)

  // Público: impide acceder a login/landing si ya está logueado
  if (requiresGuest && isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  if (requiresAuth) {
    if (!isAuthenticated) {
      // Guarda a dónde quería ir para redirigir tras login
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    // Asegura empresa (perfil -> header X-Empresa-Id) en rutas protegidas
    const ws = useWorkspaceStore()
    try { await ws.ensureEmpresaSet() } catch {}

    // === RBAC por ruta (opcional si creaste src/rbac/permissions.js) ===
    const needsPerms = to.matched.flatMap(r => r.meta?.perms || [])
    if (needsPerms.length) {
      const { buildAbility } = await import('@/rbac/permissions')
      const ability = buildAbility({ role: ws.rol, isSuperuser: !!ws.isSuperuser })
      const ok = needsPerms.every(p => ability.has('*') || ability.has(p))
      if (!ok) return next({ name: 'Dashboard' })
    }
  }

  next()
})

export default router
