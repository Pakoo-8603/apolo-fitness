<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1">
      <div class="mx-auto w-full max-w-[1200px] px-5 py-6 space-y-6">
        <header class="dashboard-head">
          <div>
            <h1 class="dashboard-title" :style="{ color: theme.text }">Panel principal</h1>
            <p class="dashboard-subtitle" :style="{ color: subtext }">
              KPIs dinámicos para monitorear tu operación.
            </p>
          </div>

          <button
            class="edit-toggle"
            :class="{ 'is-active': isEditing }"
            :style="editButtonStyle"
            type="button"
            @click="toggleEditing"
          >
            <i class="fa-solid" :class="isEditing ? 'fa-lock-open' : 'fa-grip'" />
            <span>{{ isEditing ? 'Bloquear layout' : 'Editar layout' }}</span>
          </button>
        </header>

        <section class="gridstack-wrapper">
          <div ref="gridRef" class="grid-stack" :class="{ 'is-editing': isEditing }"></div>
        </section>

        <transition name="fade">
          <div
            v-if="isEditing && hiddenModules.length"
            class="hidden-modules"
            :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
          >
            <div class="hidden-modules__head">
              <span class="hidden-modules__title">KPIs ocultos</span>
              <span class="hidden-modules__hint" :style="{ color: subtext }">
                Puedes restaurarlos cuando los necesites.
              </span>
            </div>
            <div class="hidden-modules__list">
              <button
                v-for="item in hiddenModules"
                :key="item.id"
                type="button"
                class="hidden-chip"
                :style="{ background: chipBg, color: chipText, borderColor }"
                @click="restoreModule(item.id)"
              >
                <i class="fa-regular fa-eye"></i>
                <span>{{ moduleMap.get(item.id)?.title || item.id }}</span>
              </button>
            </div>
          </div>
        </transition>

        <!-- Gráficas + Clases -->
        <section class="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Columna izquierda -->
          <div class="lg:col-span-2 space-y-5">
            <!-- Ingresos / Plan -->
            <div class="card overflow-hidden">
              <div class="grid grid-cols-1 md:grid-cols-2">
                <!-- Línea -->
                <div class="p-4 sm:p-5">
                  <VChart :option="lineOption" autoresize class="h-56" />
                </div>
                <!-- Dona -->
                <div class="p-4 sm:p-5">
                  <VChart :option="pieOption" autoresize class="h-56" />
                </div>
              </div>
            </div>

            <!-- Próximos cobros / Equipos -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Próximos cobros -->
              <div class="card">
                <div class="card-head">
                  <h3 class="card-title" :style="{ color: theme.text }">Próximos cobros</h3>
                  <button class="icon-btn" @click="loadCobros" title="Actualizar" :style="iconBtnStyle">⟳</button>
                </div>

                <div class="p-4 sm:p-5 space-y-4 max-h-64 overflow-auto" v-if="!loading.cobros">
                  <div v-for="c in proximosCobros" :key="c.id" class="flex items-center justify-between">
                    <div class="min-w-0">
                      <div class="font-medium truncate max-w-[260px]" :style="{ color: theme.text }">{{ c.nombre }}</div>
                      <div class="text-xs truncate" :style="{ color: subtext }">{{ fmtFecha(c.fecha) }}<span v-if="c.tipo"> ({{ c.tipo }})</span></div>
                    </div>
                    <button class="btn-ghost">Cobrar</button>
                  </div>
                  <div v-if="!proximosCobros.length" class="text-[13px]" :style="{ color: subtext }">Sin cobros próximos</div>
                </div>
                <div v-else class="p-4 text-sm" :style="{ color: subtext }">Cargando…</div>
              </div>

              <!-- Equipos (hardcode) con filtros -->
              <div class="card">
                <div class="card-head">
                  <h3 class="card-title" :style="{ color: theme.text }">Equipos</h3>
                  <div class="flex gap-2">
                    <button
                      v-for="f in filtrosEquipos"
                      :key="f.key"
                      @click="toggleFiltroEquipo(f.key)"
                      class="text-[11px] px-2 py-1 rounded-md text-white"
                      :style="{ background: eqFilter === f.key ? f.color : '#a3a3a3' }"
                    >
                      {{ f.text }}
                    </button>
                  </div>
                </div>
                <div class="p-4 sm:p-5 space-y-3">
                  <div v-for="e in equiposFiltrados" :key="e.id" class="flex items-center justify-between">
                    <div>
                      <div class="font-medium" :style="{ color: theme.text }">{{ e.nombre }}</div>
                      <div class="text-xs" :style="{ color: subtext }">{{ e.estadoTexto }}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        v-for="b in e.badges"
                        :key="b.text"
                        class="text-[11px] px-2 py-1 rounded-md text-white"
                        :style="{ background: b.color }"
                      >
                        {{ b.text }}
                      </span>
                      <button class="btn-ghost">Ver</button>
                    </div>
                  </div>
                  <div v-if="!equiposFiltrados.length" class="text-[13px]" :style="{ color: subtext }">Sin equipos</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna derecha: Clases (disciplinas) -->
          <div class="card">
            <div class="card-head">
              <h3 class="card-title" :style="{ color: theme.text }">Clases</h3>
              <button class="icon-btn" @click="loadClases" title="Recargar" :style="iconBtnStyle">≡</button>
            </div>
            <div class="p-4 sm:p-5 space-y-4" v-if="!loading.clases">
              <div
                v-for="clase in clases"
                :key="clase.id"
                class="rounded-2xl border p-4"
                :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
              >
                <div class="text-[12px] mb-1" :style="{ color: subtext }">
                  {{ clase.hora_inicio }}–{{ clase.hora_fin }} — {{ clase.sede || 'Gimnasio' }}
                </div>
                <div class="font-semibold mb-1" :style="{ color: theme.text }">{{ clase.nombre }}</div>
                <div class="text-[12px] mb-2" :style="{ color: subtext }">{{ clase.instructor || '—' }}</div>

                <div v-if="clase.cupo && clase.inscritos != null" class="flex items-center justify-between text-[12px] mb-1">
                  <span :style="{ color: clase.delta>0 ? '#059669' : (clase.delta<0 ? '#e11d48' : subtext) }">
                    {{ clase.delta>0 ? ('+'+clase.delta) : (clase.delta<0 ? clase.delta : '0') }}
                  </span>
                  <span :style="{ color: subtext }">({{ formatMiles(clase.inscritos) }}/{{ formatMiles(clase.cupo) }})</span>
                </div>

                <div v-if="clase.cupo && clase.inscritos != null" class="h-2 rounded-full overflow-hidden" :style="{ background: trackBg }">
                  <div
                    class="h-full rounded-full"
                    :style="{ width: Math.min(100, Math.round((clase.inscritos / Math.max(1, clase.cupo)) * 100)) + '%', background: clase.colorBarra }"
                  />
                </div>
              </div>
              <div v-if="!clases.length" class="text-[13px]" :style="{ color: subtext }">No hay clases para mostrar.</div>
            </div>
            <div v-else class="p-4 text-sm" :style="{ color: subtext }">Cargando…</div>
          </div>
        </section>

        <div class="mt-5 text-right">
          <RouterLink :to="{ name: 'ClientesLista' }" class="link-theme">Ver todos los clientes</RouterLink>
        </div>
      </div>
    </main>

    <button
      class="fab"
      :style="{ backgroundColor: primary, color: contrastOnPrimary }"
      title="Nuevo miembro"
      @click="modalCliente = true"
    >
      <i class="fa-solid fa-plus"></i>
    </button>
    <button
      class="fab fab--secondary"
      title="Buscar cliente"
      @click="openBuscarModal"
      :style="fabSecondaryStyle"
    >
      <i class="fa-regular fa-clipboard"></i>
    </button>

    <ClienteCrearModal
      v-if="modalCliente"
      v-model:open="modalCliente"
      @close="modalCliente = false"
      @cancel="modalCliente = false"
      @created="onClienteCreado"
      @saved="onClienteCreado"
    />

    <div v-if="modalBuscar" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeBuscarModal"></div>
      <div class="absolute right-6 bottom-24 sm:bottom-28 w-[92vw] max-w-md">
        <div
          class="rounded-2xl border shadow-xl overflow-hidden"
          :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
        >
          <div class="px-4 py-3 border-b flex items-center gap-2" :style="{ borderColor }">
            <i class="fa fa-magnifying-glass" :style="{ color: subtext }"></i>
            <input
              v-model="buscarInput"
              type="text"
              placeholder="Buscar cliente por nombre, email, RFC o CURP…"
              class="flex-1 outline-none text-[14px]"
              :style="{ color: theme.cardText }"
              autofocus
            />
            <button class="icon-btn" :style="iconBtnStyle" @click="closeBuscarModal">✕</button>
          </div>

          <div class="max-h-72 overflow-auto">
            <div v-if="loading.buscar" class="p-3 space-y-2">
              <div class="h-4 rounded animate-pulse" :style="{ background: skeletonBg }"></div>
              <div class="h-4 rounded animate-pulse w-2/3" :style="{ background: skeletonBg }"></div>
              <div class="h-4 rounded animate-pulse w-1/2" :style="{ background: skeletonBg }"></div>
            </div>

            <template v-else>
              <button
                v-for="c in resultados"
                :key="c.id"
                class="w-full text-left px-4 py-2 flex items-center justify-between"
                :style="rowHoverStyle"
                @click="selectCliente(c)"
              >
                <div class="min-w-0">
                  <div class="font-medium truncate" :style="{ color: theme.cardText }">
                    {{ c.nombre }} {{ c.apellidos }}
                  </div>
                  <div class="text-[12px] truncate" :style="{ color: subtext }">
                    {{ c.email || '—' }}
                  </div>
                </div>
                <span
                  class="text-[11px] px-2 py-1 rounded-md border"
                  :style="{ borderColor, background: chipBg, color: chipText }"
                >
                  Ver
                </span>
              </button>
              <div
                v-if="!resultados.length"
                class="px-4 py-8 text-center text-[13px]"
                :style="{ color: subtext }"
              >
                Sin resultados
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition transform duration-200"
      enter-from-class="opacity-0 translate-x-3"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition transform duration-150"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-3"
    >
      <aside
        v-if="panelClienteOpen"
        class="fixed top-0 right-0 h-full w-[420px] shadow-2xl z-40 border-l"
        :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
      >
        <div class="px-4 py-3 border-b flex items-center justify-between" :style="{ borderColor }">
          <div class="font-semibold truncate max-w-[300px]" :style="{ color: theme.cardText }">
            {{ (resumen && (resumen.nombre + ' ' + (resumen.apellidos || ''))) || 'Cliente' }}
          </div>
          <button class="icon-btn" :style="iconBtnStyle" title="Cerrar" @click="closePanelCliente">
            ✕
          </button>
        </div>
        <div class="p-4 overflow-auto h-[calc(100%-52px)]">
          <ClientSummaryCard
            v-if="resumen"
            :cliente="resumen"
            @ver="verEditar"
            @contacto="() => {}"
            @fiscales="() => {}"
            @cobrar="() => cobrar({ id: resumen.id, nombre: (resumen.nombre || '') + ' ' + (resumen.apellidos || '') })"
            @renovar="() => {}"
          />
        </div>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { computed, createApp, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'

import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { useUiConfigStore } from '@/stores/uiConfig'
import ClienteCrearModal from '@/views/clientes/modals/ClienteCrearModal.vue'
import ClientSummaryCard from '@/components/ClientSummaryCard.vue'
import KpiModuleCard from '@/components/dashboard/KpiModuleCard.vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent as EGridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import api from '@/api/services'
import http from '@/api/http'
import { fetchDashboardSnapshot, dashboardApiContract } from '@/api/dashboard'
import {
  kpiDefinitions,
  defaultLayout,
  defaultFilters,
  createFilterOptions,
  initialFilterOptions,
  formatDateLabel,
  formatMonthLabel,
} from '@/data/dashboard'

use([CanvasRenderer, LineChart, PieChart, EGridComponent, TooltipComponent, LegendComponent, TitleComponent])

const GRID_COLUMNS = 24
const ROW_HEIGHT = 10
const GRID_MARGIN = 3
const MAX_COL_SPAN = 24
const MAX_ROW_SPAN = 24
const LAYOUT_STORAGE_KEY = 'apolo.dashboard.layout.v1'

const router = useRouter()
const auth = useAuthStore()
const ws = useWorkspaceStore()
const ui = useUiConfigStore()

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function hexToRgb(hex) {
  const h = hex?.replace('#', '')
  if (!h || (h.length !== 6 && h.length !== 3)) return { r: 15, g: 23, b: 42 }
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function isDark(hex) {
  const { r, g, b } = hexToRgb(hex)
  const L = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
  return L < 0.6
}

const theme = computed(() => {
  const t = ui.theme?.value || ui.theme || {}
  return {
    primary: t.primary || '#1a5eff',
    secondary: t.secondary || '#4ae364',
    text: t.text || '#0f172a',
    cardBg: t.cardBg || '#ffffff',
    cardText: t.cardText || '#0f172a',
    subtext: t.subtext || null,
  }
})

const primary = computed(() => theme.value.primary)
const contrastOnPrimary = computed(() => (isDark(theme.value.primary) ? '#fff' : '#0f172a'))
const subtext = computed(() => theme.value.subtext || 'rgba(15, 23, 42, 0.56)')
const borderColor = computed(() => `rgba(15, 23, 42, ${isDark(theme.value.cardBg) ? 0.24 : 0.08})`)
const cardStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
}))
const iconBtnStyle = computed(() => ({
  background: 'transparent',
  border: `1px solid ${borderColor.value}`,
  color: subtext.value,
}))
const selectStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
  borderColor: borderColor.value,
}))
const chipBg = computed(() => `rgba(148, 163, 184, ${isDark(theme.value.cardBg) ? 0.2 : 0.12})`)
const chipText = computed(() => theme.value.cardText)
const skeletonBg = computed(() => `rgba(148, 163, 184, ${isDark(theme.value.cardBg) ? 0.18 : 0.12})`)
const rowHoverStyle = computed(() => ({
  color: theme.value.cardText,
  borderBottom: `1px solid ${borderColor.value}`,
  background: 'transparent',
}))
const fabSecondaryStyle = computed(() => ({
  backgroundColor: theme.value.cardBg,
  color: theme.value.cardText,
  border: `1px solid ${borderColor.value}`,
}))

const gridRef = ref(null)
const gridInstance = ref(null)
const isEditing = ref(false)
let previousRenderCallback = null
const widgetApps = new Map()

const dashboardData = ref(null)
const loading = reactive({ dashboard: false, buscar: false, resumen: false, ingresos: true, cobros: false, clases: true })

const moduleMap = new Map(kpiDefinitions.map((def) => [def.id, def]))
const filters = reactive(cloneDeep(defaultFilters))
const filterOptionsState = reactive({ ...initialFilterOptions })
const layoutState = ref(normalizeLayout(loadStoredLayout() || defaultLayout))
const hiddenModules = computed(() => layoutState.value.filter((item) => item.visible === false))

const loadingDashboard = computed(() => loading.dashboard)

const moduleOutputs = computed(() => {
  const data = dashboardData.value || {}
  const result = {}
  for (const def of kpiDefinitions) {
    const resolver = moduleResolvers[def.id]
    if (typeof resolver === 'function') {
      result[def.id] = resolver(data, filters[def.id])
    }
  }
  return result
})

const proximosCobros = ref([])
const clases = ref([])

const filtrosEquipos = [
  { key: 'piso', text: 'En piso', color: '#10b981' },
  { key: 'manto', text: 'Mantenimiento', color: '#f59e0b' },
  { key: 'da', text: 'Dañado', color: '#ef4444' },
]
const eqFilter = ref('piso')
const equipos = ref([
  {
    id: 1,
    nombre: 'Cinta de correr (#0012)',
    estadoTexto: 'En mantenimiento',
    tags: ['manto', 'piso'],
    badges: [
      { text: 'En piso', color: '#10b981' },
      { text: 'Mantenimiento', color: '#f59e0b' },
    ],
  },
  {
    id: 2,
    nombre: 'Bicicleta estática (#0007)',
    estadoTexto: 'Dañado',
    tags: ['da'],
    badges: [{ text: 'Dañado', color: '#ef4444' }],
  },
  {
    id: 3,
    nombre: 'Máquina de remo (#0102)',
    estadoTexto: 'En piso',
    tags: ['piso'],
    badges: [{ text: 'En piso', color: '#10b981' }],
  },
  {
    id: 4,
    nombre: 'Prensa de piernas (#0110)',
    estadoTexto: 'En piso',
    tags: ['piso'],
    badges: [{ text: 'En piso', color: '#10b981' }],
  },
])

const equiposFiltrados = computed(() => equipos.value.filter((equipo) => equipo.tags.includes(eqFilter.value)))

function toggleFiltroEquipo(key) {
  eqFilter.value = key
}

const ingresosFechas = ref([])
const ingresosSerie = ref([])
const planesDona = ref([])

const trackBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.12)' : '#eef2f7'))

const lineOption = computed(() => ({
  color: [theme.value.primary],
  title: {
    text: 'Ingresos – Últimos 30 días',
    left: 'left',
    top: 6,
    textStyle: { fontSize: 14, fontWeight: 600, color: theme.value.cardText },
  },
  grid: { left: 28, right: 12, top: 38, bottom: 22 },
  tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
  xAxis: {
    type: 'category',
    data: ingresosFechas.value.map((date) =>
      new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    ),
    boundaryGap: false,
    axisLabel: { fontSize: 11, color: subtext.value },
    axisLine: { lineStyle: { color: borderColor.value } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value) => formatMiles(value),
      fontSize: 11,
      color: subtext.value,
    },
    splitLine: { lineStyle: { color: borderColor.value } },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: theme.value.primary },
      areaStyle: {
        opacity: 0.35,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: theme.value.primary },
            { offset: 1, color: theme.value.cardBg },
          ],
        },
      },
      data: ingresosSerie.value,
    },
  ],
}))

const pieOption = computed(() => ({
  color: [theme.value.primary, '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#f97316'],
  title: {
    text: 'Plan',
    left: 'center',
    top: 6,
    textStyle: { fontSize: 14, fontWeight: 600, color: theme.value.cardText },
  },
  tooltip: { trigger: 'item', valueFormatter: (value) => formatMiles(value) },
  legend: {
    top: 6,
    right: 10,
    orient: 'horizontal',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontSize: 12, color: subtext.value },
  },
  series: [
    {
      name: 'Plan',
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['50%', '58%'],
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          formatter: '{b}: {d}%',
          color: theme.value.cardText,
        },
      },
      data: planesDona.value,
    },
  ],
}))

async function loadIngresos() {
  loading.ingresos = true
  try {
    const empresa = ws.empresaId
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicio = new Date(hoy)
    inicio.setDate(inicio.getDate() - 29)
    const fin = new Date(hoy)
    fin.setDate(fin.getDate() + 1)

    const { data } = await api.ventas.ventas.list({
      empresa,
      fecha_after: inicio.toISOString(),
      fecha_before: fin.toISOString(),
      page_size: 1000,
      ordering: 'fecha',
    })
    const rows = data?.results || data || []
    const map = new Map()
    for (const venta of rows) {
      const key = (venta.fecha || '').slice(0, 10)
      map.set(key, (map.get(key) || 0) + Number(venta.total ?? venta.importe ?? 0))
    }

    const fechas = []
    const valores = []
    for (let i = 0; i < 30; i += 1) {
      const fecha = new Date(inicio)
      fecha.setDate(inicio.getDate() + i)
      const key = fecha.toISOString().slice(0, 10)
      fechas.push(key)
      valores.push(Number(map.get(key) || 0))
    }
    ingresosFechas.value = fechas
    ingresosSerie.value = valores

    const { data: altasData } = await api.altasPlan.list({
      fecha_after: inicio.toISOString(),
      fecha_before: fin.toISOString(),
      page_size: 1000,
    })
    const altas = altasData?.results || altasData || []
    const cuenta = new Map()
    for (const alta of altas) {
      const nombre = alta.plan_nombre || `Plan ${alta.plan}`
      cuenta.set(nombre, (cuenta.get(nombre) || 0) + 1)
    }
    planesDona.value = Array.from(cuenta.entries()).map(([name, value]) => ({ name, value }))
  } finally {
    loading.ingresos = false
  }
}

async function loadCobros() {
  loading.cobros = true
  try {
    const { data } = await api.altasPlan.list({ ordering: 'fecha_limite_pago', page_size: 50 })
    const arr = data?.results || data || []
    const items = arr
      .filter((item) => !!item.fecha_limite_pago)
      .map((item) => ({
        id: item.id,
        clienteId: item.cliente,
        nombre: item.cliente_nombre || null,
        fecha: item.fecha_limite_pago,
        tipo: item.renovacion ? 'Renovación' : 'Prepago',
      }))

    for (const cobro of items) {
      if (!cobro.nombre && cobro.clienteId) {
        try {
          const { data: cli } = await api.clientes.retrieve(cobro.clienteId)
          cobro.nombre = `${cli?.nombre || ''} ${cli?.apellidos || ''}`.trim() || `Cliente ${cobro.clienteId}`
        } catch {
          // ignore individual failures
        }
      }
    }

    proximosCobros.value = items
      .filter((item) => !!item.nombre && !!item.fecha)
      .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
      .slice(0, 20)
  } finally {
    loading.cobros = false
  }
}

async function loadClases() {
  loading.clases = true
  try {
    const [horariosRes, disciplinasRes] = await Promise.all([
      api.horariosDisciplinas.list({ page_size: 500, ordering: 'hora_inicio' }),
      api.disciplinas.list({ page_size: 500, ordering: 'nombre' }),
    ])
    const horarios = horariosRes.data?.results || horariosRes.data || []
    const disciplinas = disciplinasRes.data?.results || disciplinasRes.data || []
    const mapDisc = new Map(disciplinas.map((disc) => [disc.id, disc]))
    const palette = ['#22c55e', '#ef4444', '#f59e0b']
    let i = 0
    clases.value = horarios.map((horario) => {
      const disciplina = mapDisc.get(horario.disciplina) || {}
      const color = palette[i % palette.length]
      const delta = i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : -1
      i += 1
      return {
        id: horario.id,
        nombre: horario.disciplina_nombre || disciplina.nombre || 'Clase',
        instructor: disciplina.instructor_nombre || '—',
        sede: disciplina.empresa_nombre || 'Gimnasio',
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        inscritos: horario.inscritos != null ? Number(horario.inscritos) : null,
        cupo:
          disciplina.limite_personas != null
            ? Number(disciplina.limite_personas)
            : horario.cupo != null
            ? Number(horario.cupo)
            : null,
        delta,
        colorBarra: color,
      }
    })
  } finally {
    loading.clases = false
  }
}

watch(
  () => dashboardData.value,
  (data) => {
    const options = createFilterOptions(data)
    Object.assign(filterOptionsState, options)
    ensureFiltersValid()
  },
  { immediate: true },
)

function ensureFiltersValid() {
  for (const def of kpiDefinitions) {
    if (!filters[def.id]) {
      filters[def.id] = { ...(defaultFilters[def.id] || {}) }
    }
    for (const filterDef of def.filters || []) {
      const current = filters[def.id][filterDef.key]
      const options = filterOptionsState[filterDef.optionsKey] || []
      if (!options.find((opt) => String(opt.value) === String(current))) {
        filters[def.id][filterDef.key] = options[0]?.value ?? ''
      }
    }
  }
}

function updateModuleFilter(id, key, value) {
  if (!filters[id]) {
    filters[id] = { ...(defaultFilters[id] || {}) }
  }
  filters[id][key] = value
}

function hideModule(id) {
  if (id == null || !moduleMap.has(String(id))) return
  if (!isEditing.value) return
  const moduleId = String(id)
  const updated = layoutState.value.map((item) =>
    item.id === moduleId ? { ...item, visible: false } : { ...item },
  )
  layoutState.value = updated
  detachWidgetApp(moduleId)
}

function restoreModule(id) {
  if (id == null || !moduleMap.has(String(id))) return
  const moduleId = String(id)
  const target = layoutState.value.find((item) => item.id === moduleId)
  if (!target) return

  const w = clamp(Number(target.w ?? target.colSpan ?? 1) || 1, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))
  const h = clamp(Number(target.h ?? target.rowSpan ?? 1) || 1, 1, MAX_ROW_SPAN)

  const occupied = layoutState.value
    .filter((item) => item.id !== moduleId && item.visible !== false)
    .map((item) => ({
      x: clamp(Number(item.x) || 0, 0, GRID_COLUMNS - 1),
      y: Math.max(0, Number(item.y) || 0),
      w: clamp(Number(item.w) || 1, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS)),
      h: clamp(Number(item.h) || 1, 1, MAX_ROW_SPAN),
    }))

  let x = Number(target.x)
  let y = Number(target.y)
  if (!Number.isFinite(x)) x = 0
  if (!Number.isFinite(y)) y = 0
  x = clamp(x, 0, GRID_COLUMNS - w)
  y = Math.max(0, y)

  if (overlaps(x, y, w, h, occupied)) {
    const spot = findSpot(w, h, occupied)
    x = spot.x
    y = spot.y
  }

  const updated = layoutState.value.map((item) => {
    if (item.id !== moduleId) return { ...item }
    return { ...item, visible: true, x, y, w, h }
  })
  layoutState.value = updated
}

const sharedDashboardState = {
  moduleMap,
  filters,
  filterOptionsState,
  defaultFilters,
  moduleOutputs,
  cardStyle,
  iconBtnStyle,
  selectStyle,
  subtext,
  borderColor,
  loadingDashboard,
  isEditing: computed(() => isEditing.value),
  updateFilter: updateModuleFilter,
  hideModule,
}

const editButtonStyle = computed(() => ({
  borderColor: borderColor.value,
  color: theme.value.cardText,
  background: isEditing.value ? chipBg.value : theme.value.cardBg,
}))

function renderModuleInto(el, moduleId) {
  detachWidgetApp(moduleId)
  el.classList.add('kpi-card-host')
  const app = createApp(KpiModuleCard, { moduleId: String(moduleId) })
  app.provide('dashboardState', sharedDashboardState)
  app.mount(el)
  widgetApps.set(String(moduleId), { app, el })
}

function detachWidgetApp(id) {
  const entry = widgetApps.get(String(id))
  if (!entry) return
  entry.app.unmount()
  entry.el.classList.remove('kpi-card-host')
  widgetApps.delete(String(id))
}

function detachAllWidgetApps() {
  for (const id of Array.from(widgetApps.keys())) {
    detachWidgetApp(id)
  }
}

function installRenderCallback() {
  previousRenderCallback = GridStack.renderCB
  GridStack.renderCB = (el, widget) => {
    const id = widget?.id ?? widget?.el?.dataset?.gsId
    if (id != null && moduleMap.has(String(id))) {
      renderModuleInto(el, String(id))
      return
    }
    if (previousRenderCallback) {
      previousRenderCallback(el, widget)
    } else if (widget?.content) {
      el.textContent = widget.content
    } else {
      el.textContent = ''
    }
  }
}

function uninstallRenderCallback() {
  if (previousRenderCallback) {
    GridStack.renderCB = previousRenderCallback
    previousRenderCallback = null
  } else {
    GridStack.renderCB = undefined
  }
}

function initGrid() {
  if (!gridRef.value) return
  const grid = GridStack.init(
    {
      column: GRID_COLUMNS,
      margin: GRID_MARGIN,
      cellHeight: ROW_HEIGHT,
      float: false,
      staticGrid: !isEditing.value,
      disableOneColumnMode: false,
    },
    gridRef.value,
  )
  gridInstance.value = grid
  attachGridEvents()
  renderGrid()
}

function destroyGrid() {
  const grid = gridInstance.value
  if (!grid) return
  detachAllWidgetApps()
  detachGridEvents()
  grid.destroy(false)
  gridInstance.value = null
}

function renderGrid() {
  const grid = gridInstance.value
  if (!grid) return
  const visibleItems = layoutState.value.filter((item) => item.visible !== false)
  const nodes = visibleItems.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }))
  ignoreGridEvents = true
  detachAllWidgetApps()
  grid.load(nodes)
  mountRenderedWidgets()
  ignoreGridEvents = false
  applyGridMode()
}

function mountRenderedWidgets() {
  const grid = gridInstance.value
  if (!grid) return
  const nodes = grid.engine?.nodes || []
  for (const node of nodes) {
    const id = node?.id ?? node?.el?.dataset?.gsId
    if (id == null || !moduleMap.has(String(id))) continue
    const host = node?.el?.querySelector('.grid-stack-item-content')
    if (!host) continue
    renderModuleInto(host, String(id))
  }
}

function normalizeLayout(entries) {
  const map = new Map((entries || []).map((item) => [item.id, item]))
  const prepared = kpiDefinitions.map((def, index) => {
    const saved = map.get(def.id) || {}
    const baseCol = Math.round(saved.w ?? saved.colSpan ?? def.layout.colSpan ?? 1)
    const baseRow = Math.round(saved.h ?? saved.rowSpan ?? def.layout.rowSpan ?? 1)
    const savedColumns = Number(saved.gridColumns)
    const previousColumns =
      Number.isFinite(savedColumns) && savedColumns > 0
        ? savedColumns
        : baseCol <= 6 && GRID_COLUMNS > 6
        ? 6
        : GRID_COLUMNS
    let w = baseCol
    if (previousColumns !== GRID_COLUMNS && previousColumns > 0) {
      w = Math.max(1, Math.round((baseCol / previousColumns) * GRID_COLUMNS))
    }
    w = clamp(w, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))

    const savedRowHeight = Number(saved.rowHeight)
    const legacyRowHeight = 108
    const previousRowHeight =
      Number.isFinite(savedRowHeight) && savedRowHeight > 0
        ? savedRowHeight
        : baseRow <= 4 && ROW_HEIGHT < legacyRowHeight
        ? legacyRowHeight
        : ROW_HEIGHT
    let h = baseRow
    if (previousRowHeight !== ROW_HEIGHT && previousRowHeight > 0) {
      h = Math.max(1, Math.round((baseRow * previousRowHeight) / ROW_HEIGHT))
    }
    h = clamp(h, 1, MAX_ROW_SPAN)
    const orderValue = Number(saved.order)
    const order = Number.isFinite(orderValue) ? orderValue : def.layout.order ?? index + 1
    const savedX = Number(saved.x)
    const savedY = Number(saved.y)
    const columnScale = previousColumns !== GRID_COLUMNS && previousColumns > 0 ? GRID_COLUMNS / previousColumns : 1
    const rowScale = previousRowHeight !== ROW_HEIGHT && previousRowHeight > 0 ? previousRowHeight / ROW_HEIGHT : 1
    let x = Number.isFinite(savedX) ? savedX : undefined
    if (x != null) {
      x = columnScale !== 1 ? Math.round(x * columnScale) : x
      x = clamp(x, 0, GRID_COLUMNS - w)
    }
    let y = Number.isFinite(savedY) ? savedY : undefined
    if (y != null) {
      y = rowScale !== 1 ? Math.round(y * rowScale) : y
      y = Math.max(0, y)
    }
    const visible = saved.visible === false ? false : true
    return { id: def.id, w, h, order, x, y, visible }
  })
  return placeItems(prepared)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function placeItems(items) {
  const ordered = items.slice().sort((a, b) => a.order - b.order)
  const occupied = []
  const result = []
  for (const item of ordered) {
    if (item.visible === false) {
      result.push({ ...item, x: item.x ?? 0, y: item.y ?? 0, visible: false })
      continue
    }
    const w = clamp(item.w, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))
    const h = clamp(item.h, 1, MAX_ROW_SPAN)
    let x = clamp(item.x ?? 0, 0, GRID_COLUMNS - w)
    let y = Math.max(0, item.y ?? 0)
    if (overlaps(x, y, w, h, occupied)) {
      const spot = findSpot(w, h, occupied)
      x = spot.x
      y = spot.y
    }
    occupied.push({ x, y, w, h })
    result.push({ id: item.id, w, h, x, y, order: item.order, visible: true })
  }
  return result
}

function overlaps(x, y, w, h, nodes) {
  return nodes.some((node) => {
    const xOverlap = x < node.x + node.w && x + w > node.x
    const yOverlap = y < node.y + node.h && y + h > node.y
    return xOverlap && yOverlap
  })
}

function findSpot(w, h, nodes) {
  let y = 0
  while (true) {
    for (let x = 0; x <= GRID_COLUMNS - w; x += 1) {
      if (!overlaps(x, y, w, h, nodes)) {
        return { x, y }
      }
    }
    y += 1
  }
}

function sumBy(list, key) {
  return (list || []).reduce((sum, item) => sum + Number(item?.[key] ?? 0), 0)
}

function money(value) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '—'
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return num.toLocaleString('es-MX')
}

function formatMiles(value) {
  return Number(value || 0).toLocaleString('es-MX')
}

function fmtFecha(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function calcPercentChange(base, value) {
  const b = Number(base ?? 0)
  const v = Number(value ?? 0)
  if (!Number.isFinite(b) || !Number.isFinite(v)) return null
  if (b === 0) {
    if (v === 0) return 0
    return 100
  }
  return ((v - b) / Math.abs(b)) * 100
}

function formatPercent(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  const prefix = num > 0 ? '+' : ''
  return `${prefix}${num.toFixed(decimals)}%`
}

function monthRangeLabel(months) {
  const ordered = Array.from(new Set((months || []).filter(Boolean))).sort()
  if (!ordered.length) return 'Sin rango'
  if (ordered.length === 1) return formatMonthLabel(ordered[0])
  return `${formatMonthLabel(ordered[0])} → ${formatMonthLabel(ordered[ordered.length - 1])}`
}

function findByMonth(dataset, month) {
  return (dataset || []).find((item) => item?.month === month)
}

function findByDate(dataset, date) {
  return (dataset || []).find((item) => item?.corte === date || item?.date === date)
}

function resolveFinancialTotals(data, filter) {
  const dataset = Array.isArray(data?.ingresosVsGastos) ? data.ingresosVsGastos : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Ingresos', value: '—' },
        { label: 'Gastos', value: '—' },
        { label: 'Margen', value: '—' },
      ],
    }
  }
  let from = filter?.from
  let to = filter?.to
  if (from && to && from > to) [from, to] = [to, from]
  const selection = dataset.filter((item) => {
    if (from && item.month < from) return false
    if (to && item.month > to) return false
    return true
  })
  const range = selection.length ? selection : dataset
  const totalIngresos = sumBy(range, 'ingresos')
  const totalGastos = sumBy(range, 'gastos')
  return {
    context: monthRangeLabel(range.map((item) => item.month)),
    metrics: [
      { label: 'Ingresos', value: money(totalIngresos) },
      { label: 'Gastos', value: money(totalGastos) },
      { label: 'Margen', value: money(totalIngresos - totalGastos) },
    ],
  }
}

function resolveIncomeVariation(data, filter) {
  const baseDataset = Array.isArray(data?.variacionIngresos) && data.variacionIngresos.length
    ? data.variacionIngresos
    : Array.isArray(data?.ingresosVsGastos)
    ? data.ingresosVsGastos.map((item) => ({ month: item.month, total: item.ingresos }))
    : []
  if (!baseDataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Variación', value: '—' },
        { label: 'Mes base', value: '—' },
        { label: 'Mes comparación', value: '—' },
      ],
    }
  }
  const base = findByMonth(baseDataset, filter?.base) ?? baseDataset[0]
  const target = findByMonth(baseDataset, filter?.target) ?? baseDataset[baseDataset.length - 1]
  const baseValue = Number(base?.total ?? base?.ingresos ?? 0)
  const targetValue = Number(target?.total ?? target?.ingresos ?? 0)
  const diff = targetValue - baseValue
  const delta = calcPercentChange(baseValue, targetValue)
  return {
    context: `Comparación ${formatMonthLabel(base?.month)} → ${formatMonthLabel(target?.month)}`,
    metrics: [
      { label: 'Variación', value: formatPercent(delta) },
      { label: formatMonthLabel(base?.month), value: money(baseValue) },
      {
        label: formatMonthLabel(target?.month),
        value: money(targetValue),
        caption: `Diferencia: ${money(diff)}`,
      },
    ],
  }
}

function resolveMemberships(data, filter) {
  const cortesEstado = Array.isArray(data?.estadoMembresias?.cortes) ? data.estadoMembresias.cortes : []
  const cortesPagos = Array.isArray(data?.pagosAlDia?.cortes) ? data.pagosAlDia.cortes : []
  const corteKey = filter?.corte
  const estado = findByDate(cortesEstado, corteKey) ?? cortesEstado[cortesEstado.length - 1] ?? null
  const pagos = findByDate(cortesPagos, corteKey) ?? cortesPagos[cortesPagos.length - 1] ?? null
  const activos = Number(estado?.activos ?? pagos?.activos_totales ?? 0)
  const cancelados = Number(estado?.cancelados ?? 0)
  const suspendidos = Number(estado?.suspendidos ?? 0)
  const activosAlDia = Number(pagos?.activos_al_corriente ?? pagos?.al_dia ?? 0)
  const porcentaje = activos ? (activosAlDia / activos) * 100 : null
  const context = estado?.corte ? `Corte: ${formatDateLabel(estado.corte)}` : 'Sin fecha de corte'
  return {
    context,
    metrics: [
      { label: 'Activos', value: formatNumber(activos) },
      { label: 'Cancelados', value: formatNumber(cancelados) },
      { label: 'Suspendidos', value: formatNumber(suspendidos) },
      {
        label: 'Pagos al día',
        value: formatPercent(porcentaje),
        caption: activos ? `${formatNumber(activosAlDia)} de ${formatNumber(activos)} activos` : 'Sin datos',
      },
    ],
  }
}

function resolveStaffPresence(data, filter) {
  const snapshots = Array.isArray(data?.personalEnGimnasio?.snapshots) ? data.personalEnGimnasio.snapshots : []
  const series = Array.isArray(data?.personalPorHora?.series) ? data.personalPorHora.series : []
  if (!snapshots.length && !series.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'En el gimnasio', value: '—' },
        { label: 'Fuera', value: '—' },
        { label: 'Hora pico', value: '—' },
        { label: 'Promedio por hora', value: '—' },
      ],
    }
  }
  const sucursalId = filter?.sucursalId ?? 'all'
  const targetDate = filter?.fecha || snapshots[snapshots.length - 1]?.date || null

  let selectedSnapshots = []
  if (sucursalId && sucursalId !== 'all') {
    selectedSnapshots = snapshots.filter(
      (snap) => (!targetDate || snap.date === targetDate) && String(snap.sucursal_id) === String(sucursalId),
    )
    if (!selectedSnapshots.length) {
      selectedSnapshots = snapshots.filter((snap) => String(snap.sucursal_id) === String(sucursalId))
    }
  } else {
    selectedSnapshots = snapshots.filter((snap) => !targetDate || snap.date === targetDate)
    if (!selectedSnapshots.length) selectedSnapshots = snapshots
  }

  const contextDate = targetDate || selectedSnapshots[selectedSnapshots.length - 1]?.date || null

  let total = 0
  let dentro = 0
  let fuera = 0
  if (sucursalId && sucursalId !== 'all') {
    const snapshot = selectedSnapshots[selectedSnapshots.length - 1] || null
    total = Number(snapshot?.personal_total ?? 0)
    dentro = Number(snapshot?.personal_en_gimnasio ?? 0)
    fuera =
      snapshot?.personal_fuera != null
        ? Number(snapshot.personal_fuera)
        : Math.max(0, total - dentro)
  } else {
    const aggregated = selectedSnapshots.reduce(
      (acc, item) => {
        const totalItem = Number(item?.personal_total ?? 0)
        const dentroItem = Number(item?.personal_en_gimnasio ?? 0)
        const fueraItem =
          item?.personal_fuera != null
            ? Number(item.personal_fuera)
            : Math.max(0, totalItem - dentroItem)
        acc.total += totalItem
        acc.dentro += dentroItem
        acc.fuera += fueraItem
        return acc
      },
      { total: 0, dentro: 0, fuera: 0 },
    )
    total = aggregated.total
    dentro = aggregated.dentro
    fuera = aggregated.fuera
  }

  let targetSerie = series.find(
    (serie) =>
      (!targetDate || serie.date === targetDate) &&
      (sucursalId === 'all' || String(serie.sucursal_id) === String(sucursalId)),
  )
  if (!targetSerie && sucursalId && sucursalId !== 'all') {
    targetSerie = series.filter((serie) => String(serie.sucursal_id) === String(sucursalId)).pop()
  }
  if (!targetSerie && targetDate) {
    targetSerie = series.filter((serie) => serie.date === targetDate).pop()
  }
  if (!targetSerie) {
    targetSerie = series[series.length - 1]
  }

  const buckets = Array.isArray(targetSerie?.buckets) ? targetSerie.buckets : []
  const busiest = buckets.reduce(
    (acc, bucket) => (bucket.personal > (acc.personal ?? -Infinity) ? bucket : acc),
    { hour: null, personal: 0 },
  )
  const avg = buckets.length
    ? buckets.reduce((sum, bucket) => sum + Number(bucket.personal ?? 0), 0) / buckets.length
    : null

  return {
    context: contextDate ? formatDateLabel(contextDate) : 'Sin fecha seleccionada',
    metrics: [
      {
        label: 'En el gimnasio',
        value: formatNumber(dentro),
        caption: total ? `de ${formatNumber(total)} colaboradores` : '',
      },
      { label: 'Fuera', value: formatNumber(fuera) },
      {
        label: 'Hora pico',
        value: busiest.hour || '—',
        caption: busiest.hour ? `${formatNumber(busiest.personal)} personas` : 'Sin datos',
      },
      {
        label: 'Promedio por hora',
        value: avg != null ? formatNumber(Math.round(avg)) : '—',
        caption: buckets.length ? `${buckets.length} tramos analizados` : 'Sin tramos registrados',
      },
    ],
  }
}

function resolvePlanHighlights(data, filter) {
  const series = Array.isArray(data?.planesRanking?.series) ? data.planesRanking.series : []
  if (!series.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Plan con más personas', value: '—' },
        { label: 'Plan con menos personas', value: '—' },
      ],
    }
  }
  const registro = series.find((item) => item.month === filter?.month) ?? series[series.length - 1]
  const top = registro?.top
  const bottom = registro?.bottom
  return {
    context: registro?.month ? formatMonthLabel(registro.month) : 'Sin mes seleccionado',
    metrics: [
      {
        label: 'Plan con más personas',
        value: top ? formatNumber(top.personas || 0) : '—',
        caption: top?.plan_nombre || '',
      },
      {
        label: 'Plan con menos personas',
        value: bottom ? formatNumber(bottom.personas || 0) : '—',
        caption: bottom?.plan_nombre || '',
      },
    ],
  }
}

function resolveInscriptionGrowth(data, filter) {
  const dataset = Array.isArray(data?.inscripcionesMensuales) ? data.inscripcionesMensuales : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Crecimiento', value: '—' },
        { label: 'Mes base', value: '—' },
        { label: 'Mes comparación', value: '—' },
      ],
    }
  }
  const base = findByMonth(dataset, filter?.from) ?? dataset[0]
  const target = findByMonth(dataset, filter?.to) ?? dataset[dataset.length - 1]
  const baseValue = Number(base?.altas ?? 0)
  const targetValue = Number(target?.altas ?? 0)
  const delta = calcPercentChange(baseValue, targetValue)
  const diff = targetValue - baseValue
  return {
    context: `${formatMonthLabel(base?.month)} → ${formatMonthLabel(target?.month)}`,
    metrics: [
      { label: 'Crecimiento', value: formatPercent(delta) },
      { label: formatMonthLabel(base?.month), value: formatNumber(baseValue) },
      {
        label: formatMonthLabel(target?.month),
        value: formatNumber(targetValue),
        caption: `Diferencia: ${formatNumber(diff)}`,
      },
    ],
  }
}

function resolveCancellations(data, filter) {
  const dataset = Array.isArray(data?.bajasMensuales) ? data.bajasMensuales : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Bajas del mes', value: '—' },
        { label: 'Variación', value: '—' },
        { label: 'Mes anterior', value: '—' },
      ],
    }
  }
  const months = Array.from(new Set(dataset.map((item) => item.month).filter(Boolean))).sort()
  const targetKey = filter?.month || months[months.length - 1]
  let current = dataset.find((item) => item.month === targetKey)
  if (!current) current = dataset[dataset.length - 1]
  const idx = months.indexOf(current?.month)
  const prevKey = idx > 0 ? months[idx - 1] : null
  const prev = prevKey ? dataset.find((item) => item.month === prevKey) : null
  const currentValue = Number(current?.bajas ?? 0)
  const prevValue = Number(prev?.bajas ?? 0)
  const delta = prev ? calcPercentChange(prevValue, currentValue) : null
  return {
    context: formatMonthLabel(current?.month),
    metrics: [
      { label: 'Bajas del mes', value: formatNumber(currentValue) },
      {
        label: 'Variación',
        value: formatPercent(delta),
        caption: prev ? `vs ${formatMonthLabel(prev.month)}` : 'Sin comparación',
      },
      {
        label: prev ? formatMonthLabel(prev.month) : 'Mes anterior',
        value: prev ? formatNumber(prevValue) : '—',
      },
    ],
  }
}

const moduleResolvers = {
  financialTotals: resolveFinancialTotals,
  incomeVariation: resolveIncomeVariation,
  membershipsOverview: resolveMemberships,
  staffPresence: resolveStaffPresence,
  planHighlights: resolvePlanHighlights,
  inscriptionGrowth: resolveInscriptionGrowth,
  cancellations: resolveCancellations,
}

async function loadDashboard() {
  loading.dashboard = true
  try {
    const data = await fetchDashboardSnapshot()
    dashboardData.value = data
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__DASHBOARD_API_CONTRACT__ = dashboardApiContract
    }
  } finally {
    loading.dashboard = false
  }
}

onMounted(async () => {
  installRenderCallback()
  await nextTick()
  initGrid()
  applyGridMode()
  if (!auth.isAuthenticated) return
  await ws.ensureEmpresaSet()
  await Promise.all([loadDashboard(), loadIngresos(), loadCobros(), loadClases()])
})

onBeforeUnmount(() => {
  destroyGrid()
  uninstallRenderCallback()
})

const modalCliente = ref(false)
const modalBuscar = ref(false)
const buscarInput = ref('')
const resultados = ref([])
let tDebounce = null

function openBuscarModal() {
  modalBuscar.value = true
  buscarInput.value = ''
  resultados.value = []
}

function closeBuscarModal() {
  modalBuscar.value = false
}

watch(
  buscarInput,
  (value) => {
    clearTimeout(tDebounce)
    tDebounce = setTimeout(() => {
      doSearch(value)
    }, 300)
  },
  { flush: 'post' },
)

async function doSearch(q) {
  if (!q || !q.trim()) {
    resultados.value = []
    return
  }
  loading.buscar = true
  try {
    const { data } = await api.clientes.list({ search: q.trim(), page_size: 10, ordering: '-id' })
    resultados.value = (data?.results || data || []).map((r) => ({
      id: r.id,
      nombre: r.nombre ?? '',
      apellidos: r.apellidos ?? '',
      email: r.email || '—',
    }))
  } finally {
    loading.buscar = false
  }
}

const panelClienteOpen = ref(false)
const resumen = ref(null)

function closePanelCliente() {
  panelClienteOpen.value = false
  resumen.value = null
}

async function selectCliente(c) {
  modalBuscar.value = false
  await openResumen(c.id)
}

async function openResumen(id) {
  panelClienteOpen.value = true
  loading.resumen = true
  try {
    const { data } = await http.get(`clientes/${id}/resumen/`)
    resumen.value = data || null
  } catch {
    resumen.value = null
  } finally {
    loading.resumen = false
  }
}

function verEditar() {
  if (!resumen.value?.id) return
  router.push({ name: 'ClientesDetalle', params: { id: resumen.value.id } })
  closePanelCliente()
}

function cobrar(cliente) {
  router.push({ name: 'VentasCrear', query: { cliente: cliente.id } })
  closePanelCliente()
}

function onClienteCreado(cliente) {
  if (!cliente?.id) return
  openResumen(cliente.id)
}

let ignoreGridEvents = false
let updatingFromGrid = false

function toggleEditing() {
  isEditing.value = !isEditing.value
}

function applyGridMode() {
  const grid = gridInstance.value
  if (!grid) return
  const editing = isEditing.value
  grid.setStatic(!editing)
  grid.enableMove(editing)
  grid.enableResize(editing)
  grid.getGridItems().forEach((el) => {
    grid.movable(el, editing)
    grid.resizable(el, editing)
  })
}

function loadStoredLayout() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch (err) {
    console.warn('No se pudo cargar el layout del dashboard', err)
    return null
  }
}

function persistLayout(value) {
  if (typeof window === 'undefined') return
  try {
    const serialized = Array.isArray(value)
      ? value.map((item) => ({
          ...item,
          gridColumns: GRID_COLUMNS,
          rowHeight: ROW_HEIGHT,
        }))
      : value
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(serialized))
  } catch (err) {
    console.warn('No se pudo guardar el layout del dashboard', err)
  }
}

function attachGridEvents() {
  const grid = gridInstance.value
  if (!grid) return
  grid.on('change', onGridChange)
  grid.on('dragstop', onGridChange)
  grid.on('resizestop', onGridChange)
  grid.on('removed', onGridRemoved)
}

function detachGridEvents() {
  const grid = gridInstance.value
  if (!grid) return
  grid.off('change', onGridChange)
  grid.off('dragstop', onGridChange)
  grid.off('resizestop', onGridChange)
  grid.off('removed', onGridRemoved)
}

function onGridRemoved(event, items) {
  if (!Array.isArray(items)) return
  for (const item of items) {
    const id = item?.id ?? item?.el?.dataset?.gsId
    if (id != null) {
      detachWidgetApp(id)
    }
  }
}

function onGridChange() {
  if (ignoreGridEvents) return
  const grid = gridInstance.value
  if (!grid) return
  const nodes = grid.engine?.nodes || []
  const sorted = nodes
    .filter((node) => {
      const id = node?.id ?? node?.el?.dataset?.gsId
      return id != null && moduleMap.has(String(id))
    })
    .slice()
    .sort((a, b) => (a.y - b.y === 0 ? a.x - b.x : a.y - b.y))
  const updates = sorted.map((node, index) => {
    const id = String(node.id ?? node.el?.dataset?.gsId)
    return {
      id,
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
      order: index + 1,
      visible: true,
    }
  })
  updatingFromGrid = true
  layoutState.value = mergeLayout(layoutState.value, updates)
  nextTick(() => {
    updatingFromGrid = false
  })
  persistLayout(layoutState.value)
}

function mergeLayout(current, updates) {
  const updateMap = new Map(updates.map((item) => [String(item.id), item]))
  const merged = current.map((entry) => {
    const update = updateMap.get(String(entry.id))
    if (!update) return { ...entry }
    updateMap.delete(String(entry.id))
    return { ...entry, ...update }
  })
  for (const extra of updateMap.values()) {
    merged.push({ ...extra })
  }
  return merged
}

watch(
  isEditing,
  () => {
    applyGridMode()
  },
  { flush: 'post' },
)

watch(
  layoutState,
  (value) => {
    if (updatingFromGrid) return
    persistLayout(value)
    if (gridInstance.value) {
      nextTick(() => renderGrid())
    }
  },
  { deep: true },
)
</script>

<style scoped>
.dashboard-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.dashboard-title {
  font-size: clamp(1.75rem, 2vw + 1rem, 2.25rem);
  font-weight: 700;
}

.dashboard-subtitle {
  font-size: 0.95rem;
}

.edit-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid;
  border-radius: 9999px;
  padding: 0.45rem 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.edit-toggle span {
  white-space: nowrap;
}

.edit-toggle:is(:hover, :focus-visible) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.edit-toggle.is-active {
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.gridstack-wrapper {
  position: relative;
}

.grid-stack {
  min-height: 360px;
}

.grid-stack.is-editing .grid-stack-item {
  cursor: move;
}

.grid-stack.is-editing .grid-stack-item .ui-resizable-handle {
  opacity: 1;
}

.grid-stack-item-content {
  height: 100%;
}

.kpi-card-host {
  height: 100%;
}

.hidden-modules {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.hidden-modules__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.hidden-modules__title {
  font-weight: 600;
  font-size: 0.95rem;
}

.hidden-modules__hint {
  font-size: 0.8rem;
}

.hidden-modules__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hidden-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 9999px;
  border: 1px solid;
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.hidden-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.card {
  @apply rounded-2xl border shadow-sm;
  background: v-bind('theme.cardBg');
  color: v-bind('theme.cardText');
  border-color: v-bind('borderColor');
}

.card-head {
  @apply px-4 sm:px-5 py-4 border-b flex items-center justify-between;
  border-color: v-bind('borderColor');
}

.card-title {
  @apply font-semibold;
}

.btn-ghost {
  @apply px-3 py-1.5 rounded-md text-[13px] border;
  border-color: v-bind('borderColor');
  background: v-bind('chipBg');
  color: v-bind('theme.cardText');
}

.btn-ghost:hover {
  filter: brightness(0.97);
}

.link-theme {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--apolo-primary, #1a5eff);
}

.link-theme:hover {
  text-decoration: underline;
}

.fab {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3.25rem;
  width: 3.25rem;
  border-radius: 9999px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 40;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
}

.fab--secondary {
  bottom: 6.5rem;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  transition: all 0.18s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
}
</style>
