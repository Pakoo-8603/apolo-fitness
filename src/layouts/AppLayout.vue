<!-- src/layouts/AppLayout.vue -->
<template>
  <div class="min-h-screen flex" :style="{ color: theme.text }">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 border-r',
        'transition-transform duration-200 md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
      :style="{
        background: theme.cardBg,
        color: theme.cardText,
        borderColor: 'rgba(15, 23, 42, 0.08)'
      }"
    >
      <!-- Brand -->
      <div
        class="h-16 px-5 flex items-center gap-3 border-b"
        :style="{ borderColor: 'rgba(15, 23, 42, 0.08)' }"
      >
        <div
          class="h-9 w-9 rounded-full grid place-items-center overflow-hidden"
          :style="{ background: '#f1f5f9', border: '1px solid rgba(15,23,42,0.08)' }"
        >
          <img v-if="ui.logoUrl" :src="ui.logoUrl" alt="logo" class="h-9 w-9 object-contain" />
          <i v-else class="fa-solid fa-chart-line" :style="{ color: '#64748b' }"></i>
        </div>
        <div class="leading-tight min-w-0">
          <div class="text-xs truncate" :style="{ color: subtext }">
            {{ ui.appName || 'Mi App' }}
          </div>
          <div class="text-[11px] truncate" :style="{ color: subtext }">
            Empresa: {{ empresaLabel }}
          </div>
        </div>
      </div>

      <!-- Menu -->
      <nav class="px-3 py-3 overflow-y-auto h-[calc(100vh-4rem)]">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.routeName || item.label"
          :to="{ name: item.routeName }"
          class="group flex items-center gap-3 px-3 py-2 rounded-lg mb-1"
          :class="route.name === item.routeName ? 'font-medium' : ''"
          :style="route.name === item.routeName
            ? { background: activeBg, color: theme.cardText }
            : { color: theme.cardText, background: 'transparent' }"
          @click="closeOnMobile"
        >
          <i
            :class="['fa-solid', item.icon || 'fa-circle', 'w-5']"
            :style="{ color: route.name === item.routeName ? theme.primary : iconColor }"
          ></i>
          <span class="text-sm truncate">{{ item.label }}</span>
        </RouterLink>

        <div v-if="!visibleNav.length" class="text-xs px-3 pt-2" :style="{ color: subtext }">
          Sin opciones de menú.
        </div>
      </nav>
    </aside>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 backdrop-blur-[2px] md:hidden"
      style="background: rgba(0,0,0,.30)"
      @click="sidebarOpen=false"
    ></div>

    <!-- Main -->
    <div class="flex-1 md:pl-64 min-h-screen flex flex-col">
      <!-- Topbar -->
      <header
        class="h-16 border-b"
        :style="{
          background: `linear-gradient(90deg, ${theme.topStart}, ${theme.topEnd})`,
          borderColor: 'rgba(15, 23, 42, 0.08)',
          color: topbarText
        }"
      >
        <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              class="md:hidden p-2 rounded-lg border"
              :style="{
                background: theme.cardBg,
                color: theme.cardText,
                borderColor: 'rgba(15,23,42,0.12)'
              }"
              @click="sidebarOpen=true"
              aria-label="Abrir menú"
            >
              <i class="fa-solid fa-bars"></i>
            </button>
            <h1 class="text-[15px] font-semibold tracking-tight">{{ currentTitle }}</h1>
          </div>

          <div class="flex items-center gap-3">
            <!-- Chips -->
            <div class="hidden sm:flex text-[11px] mr-1" :style="{ color: topbarChipText }">
              <span class="px-2 py-1 rounded-full border" :style="{ background: chipBg, borderColor: chipBorder }">
                Rol: {{ ws.rol || '—' }}
              </span>

              <!-- Muestra 'Todas las sucursales' cuando el header actual es 'all' -->
              <span
                v-if="isAllSucursales || sucursalNombre"
                class="ml-2 px-2 py-1 rounded-full border"
                :style="{ background: chipBg, borderColor: chipBorder }"
              >
                {{ isAllSucursales ? 'Sucursales: Todas' : `Sucursal: ${sucursalNombre}` }}
              </span>
            </div>

            <!-- Selects Empresa/Sucursal -->
            <div class="hidden md:flex items-center gap-2 mr-2">
              <select
                v-model="tmpEmpresaId"
                @change="onEmpresaSelect"
                class="h-9 text-xs rounded-md px-2"
                :style="selectStyle"
              >
                <option disabled value="">Empresa…</option>
                <option v-for="e in empresas" :key="e.id" :value="String(e.id)">{{ e.nombre }}</option>
              </select>

              <select
                v-model="tmpSucursalId"
                @change="onSucursalSelect"
                class="h-9 text-xs rounded-md px-2"
                :style="selectStyle"
                :disabled="!tmpEmpresaId"
              >
                <option value="all">Todas las sucursales</option>
                <option v-for="s in sucursales" :key="s.id" :value="String(s.id)">{{ s.nombre }}</option>
              </select>
            </div>

            <!-- User -->
            <div class="relative" data-user-menu>
              <button
                class="flex items-center gap-2 h-9 px-3 rounded-md border"
                :style="{
                  background: theme.cardBg,
                  color: theme.cardText,
                  borderColor: 'rgba(15,23,42,0.12)'
                }"
                @click.stop="userMenuOpen = !userMenuOpen"
              >
                <div class="h-6 w-6 rounded-full grid place-items-center"
                     :style="{ background: '#f1f5f9', border: '1px solid rgba(15,23,42,0.08)' }">
                  <i class="fa-solid fa-user text-[13px]" :style="{ color: '#64748b' }"></i>
                </div>
                <span class="text-sm hidden sm:inline">{{ username || 'Usuario' }}</span>
                <i class="fa-solid fa-chevron-down text-[11px]" :style="{ color: subtext }"></i>
              </button>

              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-52 rounded-xl shadow-lg border overflow-hidden"
                :style="{
                  background: theme.cardBg,
                  color: theme.cardText,
                  borderColor: 'rgba(15,23,42,0.12)'
                }"
              >
                <RouterLink
                  :to="{name:'Perfil'}"
                  class="block px-3 py-2 text-sm"
                  :style="hoverItem"
                  @click="userMenuOpen=false"
                >
                  <i class="fa-solid fa-id-badge mr-2" :style="{ color: iconColor }"></i> Perfil
                </RouterLink>
                <button class="w-full text-left px-3 py-2 text-sm" :style="hoverItem" @click="logout">
                  <i class="fa-solid fa-right-from-bracket mr-2" :style="{ color: iconColor }"></i> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1">
        <div class="px-4 sm:px-6 lg:px-8 py-5">
          <RouterView />
        </div>
      </main>
    </div>
  </div>

  <Toasts />
  <ConfirmDialog />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import { useUiConfigStore } from '@/stores/uiConfig'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/services'
import Toasts from '@/components/ui/Toasts.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useThemeCssVars } from '@/composables/useThemeCssVars'
import { setEmpresaId, getEmpresaId, setSucursalId, getSucursalId } from '@/api/http'

const route = useRoute()
const router = useRouter()
const ws = useWorkspaceStore()
const ui = useUiConfigStore()
const auth = useAuthStore()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)

const username = ref('')
const empresas = ref([])
const sucursales = ref([])

/* THEME */
const theme = computed(() => ({
  primary:   ui.theme?.primary   || '#2563eb',
  secondary: ui.theme?.secondary || '#10b981',
  bgStart:   ui.theme?.bgStart   || '#f6f7fb',
  bgEnd:     ui.theme?.bgEnd     || '#f6f7fb',
  topStart:  ui.theme?.topStart  || '#ffffff',
  topEnd:    ui.theme?.topEnd    || '#ffffff',
  text:      ui.theme?.text      || '#0f172a',
  cardBg:    ui.theme?.cardBg    || '#ffffff',
  cardText:  ui.theme?.cardText  || '#0f172a',
  bgMode:    ui.theme?.bgMode    || 'gradient',
  bgSolid:   ui.theme?.bgSolid   || '#f6f7fb',
  subtext:   ui.theme?.subtext   || 'rgba(15,23,42,0.55)',
}))
const subtext = computed(() => theme.value.subtext)
const iconColor = computed(() => '#64748b')
const activeBg = computed(() => '#eef2ff')
const topbarText = computed(() => theme.value.text)
const chipBg = computed(() => '#f8fafc')
const chipBorder = computed(() => 'rgba(15,23,42,0.08)')
const topbarChipText = computed(() => 'rgba(15,23,42,.75)')
const selectStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
  border: '1px solid rgba(15,23,42,0.12)'
}))

useThemeCssVars(() => ({
  primary: theme.value.primary,
  secondary: theme.value.secondary,
  bgStart: theme.value.bgStart,
  bgEnd: theme.value.bgEnd,
  topStart: theme.value.topStart,
  topEnd: theme.value.topEnd,
  text: theme.value.text,
  cardBg: theme.value.cardBg,
  cardText: theme.value.cardText,
  bgMode: theme.value.bgMode,
  bgSolid: theme.value.bgSolid,
}))

/* NAV */
const visibleNav = computed(() => Array.isArray(ui.menu) ? ui.menu : [])
const currentTitle = computed(() => {
  const found = visibleNav.value.find(n => route.name === n.routeName)
  return found?.label || ui.appName || 'Dashboard'
})
function closeOnMobile () {
  if (window.innerWidth < 768) sidebarOpen.value = false
}

/* Labels en header */
const empresaLabel = computed(() => ws.empresaNombre || ws.empresaId || getEmpresaId() || '—')
const sucursalNombre = computed(() => ws.sucursalNombre || '')

/* “Todas” helper para chip */
const isAllSucursales = computed(() => (getSucursalId() || '') === 'all')

/* Perfil / username */
async function loadProfileHeader () {
  try {
    const { data: pr } = await api.accounts.perfil()
    username.value = pr?.username || ''
  } catch {}
}

/* Selects controlados (defaults desde localStorage o store) */
const tmpEmpresaId = ref(ws.empresaId ? String(ws.empresaId) : (getEmpresaId() || ''))
const tmpSucursalId = ref(getSucursalId() || (ws.sucursalId ? String(ws.sucursalId) : 'all'))

async function loadEmpresas () {
  try {
    const { data } = await api.empresas.list({ page_size: 200 })
    empresas.value = data?.results || data || []
    // Set default si no hay
    if (!tmpEmpresaId.value) tmpEmpresaId.value = getEmpresaId() || ''
  } catch { empresas.value = [] }
}

async function loadSucursales () {
  const empresa = tmpEmpresaId.value || getEmpresaId() || ws.empresaId
  if (!empresa) { sucursales.value = []; tmpSucursalId.value = 'all'; return }
  try {
    const { data } = await api.sucursales.list({ empresa, page_size: 200, ordering: 'nombre' })
    sucursales.value = data?.results || data || []
    // si no hay sucursal previa, default a 'all'
    if (!getSucursalId() && !ws.sucursalId) tmpSucursalId.value = 'all'
  } catch { sucursales.value = [] }
}

async function onEmpresaSelect () {
  // Persistir empresa y resetear sucursal a 'all', recargar
  setEmpresaId(tmpEmpresaId.value)
  setSucursalId('all')
  window.location.reload()
}

function onSucursalSelect () {
  // Guardar 'all' o id seleccionado, recargar
  setSucursalId(tmpSucursalId.value || 'all')
  window.location.reload()
}

function onClickOutside (e) {
  if (!e.target.closest?.('[data-user-menu]')) userMenuOpen.value = false
}

function logout () {
  auth.logout()
  router.replace({ name: 'Login' })
}

/* Lifecycle */
onMounted(async () => {
  await ws.ensureEmpresaSet()
  await ui.loadForActiveCompany()
  await loadProfileHeader()

  await loadEmpresas()
  await loadSucursales()

  document.addEventListener('click', onClickOutside)
})
</script>

<style scoped>
.card {
  @apply rounded-2xl border shadow-sm;
  border-color: rgba(15, 23, 42, 0.08);
  background: v-bind('theme.cardBg');
  color: v-bind('theme.cardText');
}
.card-header {
  @apply px-4 py-3 border-b text-[13px] font-semibold;
  border-color: rgba(15, 23, 42, 0.08);
  color: v-bind('theme.cardText');
}
.card-body { @apply p-4; color: v-bind('theme.cardText'); }
</style>
