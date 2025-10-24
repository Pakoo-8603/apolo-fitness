<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1">
      <div class="mx-auto w-full max-w-[1300px] px-5 py-6 space-y-6">
        <div class="card">
          <div class="card-head">
            <h3 class="card-title" :style="{ color: theme.text }">Filtros de comparación</h3>
            <button class="icon-btn" :style="iconBtnStyle" title="Actualizar tablero" @click="loadDashboard">⟳</button>
          </div>
          <div class="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="field-group">
              <label class="field-label" :style="{ color: subtext }">Ingresos · Mes base</label>
              <select v-model="comparacionIngresos.desde" class="field-select" :style="selectStyle">
                <option v-for="opt in ingresosMonthOptions" :key="`ing-base-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" :style="{ color: subtext }">Ingresos · Mes comparación</label>
              <select v-model="comparacionIngresos.hasta" class="field-select" :style="selectStyle">
                <option v-for="opt in ingresosMonthOptions" :key="`ing-comp-${opt.value}`" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" :style="{ color: subtext }">Inscripciones · Mes base</label>
              <select v-model="comparacionInscripciones.desde" class="field-select" :style="selectStyle">
                <option
                  v-for="opt in inscripcionesMonthOptions"
                  :key="`ins-base-${opt.value}`"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label class="field-label" :style="{ color: subtext }">Inscripciones · Mes comparación</label>
              <select v-model="comparacionInscripciones.hasta" class="field-select" :style="selectStyle">
                <option
                  v-for="opt in inscripcionesMonthOptions"
                  :key="`ins-comp-${opt.value}`"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div class="card-kpi xl:col-span-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="kpi-title" :style="{ color: subtext }">
                  Ingresos vs gastos ({{ currentMonthLabel }})
                </div>
                <div class="kpi-value" :style="{ color: theme.text }">
                  {{ loadingDashboard ? '—' : money(ingresosResumen.current?.ingresos || 0) }}
                </div>
                <div class="text-xs mt-2" :style="{ color: subtext }">
                  Gastos: {{ loadingDashboard ? '—' : money(ingresosResumen.current?.gastos || 0) }}
                </div>
              </div>
              <div class="text-right space-y-1 text-xs">
                <div :style="{ color: subtext }">Margen</div>
                <div class="text-base font-semibold" :style="{ color: theme.text }">
                  {{ loadingDashboard ? '—' : money(ingresosResumen.diff || 0) }}
                </div>
                <div class="flex items-center justify-end gap-1">
                  <span
                    class="delta-badge"
                    :class="{
                      'delta-positive': (ingresosResumen.ingresoDelta || 0) >= 0,
                      'delta-negative': (ingresosResumen.ingresoDelta || 0) < 0,
                    }"
                  >
                    {{ loadingDashboard || ingresosResumen.ingresoDelta == null
                      ? '—'
                      : formatPercent(ingresosResumen.ingresoDelta) }}
                  </span>
                  <span class="text-[11px]" :style="{ color: subtext }">vs mes previo</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Variación de ingresos</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || variacionIngresosResumen.delta == null
                ? '—'
                : formatPercent(variacionIngresosResumen.delta) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ formatMonthLabel(variacionIngresosResumen.base?.month) }} →
              {{ formatMonthLabel(variacionIngresosResumen.target?.month) }}
            </div>
          </div>

          <div class="card-kpi xl:col-span-2">
            <div class="kpi-title" :style="{ color: subtext }">Activos / cancelados / suspendidos</div>
            <ul class="stat-list">
              <li>
                <span>Activos</span>
                <strong>{{ loadingDashboard ? '—' : formatMiles(estadoMembresias.activos) }}</strong>
              </li>
              <li>
                <span>Cancelados</span>
                <strong>{{ loadingDashboard ? '—' : formatMiles(estadoMembresias.cancelados) }}</strong>
              </li>
              <li>
                <span>Suspendidos</span>
                <strong>{{ loadingDashboard ? '—' : formatMiles(estadoMembresias.suspendidos) }}</strong>
              </li>
            </ul>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Activos con pagos al día</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard ? '—' : formatPercent(pagosResumen.porcentaje) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ loadingDashboard
                ? '—'
                : `${formatMiles(pagosResumen.alDia)} de ${formatMiles(pagosResumen.activos)} activos` }}
            </div>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Personal en el gimnasio</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard ? '—' : formatMiles(personalResumen.dentro) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              de {{ loadingDashboard ? '—' : formatMiles(personalResumen.total) }} colaboradores
            </div>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Hora pico del personal</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || !personalHoraPico.hour ? '—' : personalHoraPico.hour }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ loadingDashboard ? '—' : `${formatMiles(personalHoraPico.personal)} personas` }}
            </div>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Plan con más personas</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || !planesRanking.top ? '—' : formatMiles(planesRanking.top.personas) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ loadingDashboard || !planesRanking.top ? '—' : planesRanking.top.plan_nombre }}
            </div>
          </div>

          <div class="card-kpi">
            <div class="kpi-title" :style="{ color: subtext }">Plan con menos personas</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || !planesRanking.bottom ? '—' : formatMiles(planesRanking.bottom.personas) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ loadingDashboard || !planesRanking.bottom ? '—' : planesRanking.bottom.plan_nombre }}
            </div>
          </div>

          <div class="card-kpi xl:col-span-2">
            <div class="kpi-title" :style="{ color: subtext }">Crecimiento de inscripciones</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || inscripcionesComparativo.delta == null
                ? '—'
                : formatPercent(inscripcionesComparativo.delta) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              {{ loadingDashboard
                ? '—'
                : `${formatMiles(inscripcionesComparativo.targetValue)} vs ${formatMiles(inscripcionesComparativo.baseValue)}` }}
            </div>
          </div>

          <div class="card-kpi xl:col-span-3">
            <div class="kpi-title" :style="{ color: subtext }">Bajas del mes</div>
            <div class="kpi-value" :style="{ color: theme.text }">
              {{ loadingDashboard || !bajasResumen.current ? '—' : formatMiles(bajasResumen.currentValue) }}
            </div>
            <div class="text-xs mt-2" :style="{ color: subtext }">
              vs {{ formatMonthLabel(bajasResumen.prev?.month) }}:
              {{ loadingDashboard || bajasResumen.prev == null ? '—' : formatMiles(bajasResumen.prevValue) }}
            </div>
            <div class="mt-2">
              <span
                class="delta-badge"
                :class="{
                  'delta-positive': (bajasResumen.delta || 0) <= 0,
                  'delta-negative': (bajasResumen.delta || 0) > 0,
                }"
              >
                {{ loadingDashboard || bajasResumen.delta == null ? '—' : formatPercent(bajasResumen.delta) }}
              </span>
              <span class="text-[11px] ml-2" :style="{ color: subtext }">variación vs mes anterior</span>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div class="card">
            <div class="card-head">
              <h3 class="card-title" :style="{ color: theme.text }">Ingresos vs gastos</h3>
              <span class="text-xs" :style="{ color: subtext }">Mock mensual</span>
            </div>
            <div class="p-5">
              <VChart v-if="!loadingDashboard" :option="ingresosVsGastosOption" autoresize class="h-64" />
              <SkeletonCard v-else class="h-64" />
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title" :style="{ color: theme.text }">Personal en el gimnasio por horas</h3>
              <span class="text-xs" :style="{ color: subtext }">{{ personalPorHoraLabel }}</span>
            </div>
            <div class="p-5">
              <VChart v-if="!loadingDashboard" :option="personalPorHoraOption" autoresize class="h-64" />
              <SkeletonCard v-else class="h-64" />
            </div>
          </div>
        </section>

        <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div class="card">
            <div class="card-head">
              <h3 class="card-title" :style="{ color: theme.text }">Inscripciones vs bajas</h3>
              <span class="text-xs" :style="{ color: subtext }">Evolución mensual</span>
            </div>
            <div class="p-5">
              <VChart v-if="!loadingDashboard" :option="inscripcionesBajasOption" autoresize class="h-64" />
              <SkeletonCard v-else class="h-64" />
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3 class="card-title" :style="{ color: theme.text }">Ranking de planes</h3>
            </div>
            <div class="p-5 overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="table-row">
                    <th class="table-header">Plan</th>
                    <th class="table-header text-right">Personas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingDashboard" class="table-row">
                    <td colspan="2" class="py-4 text-center" :style="{ color: subtext }">Cargando…</td>
                  </tr>
                  <tr v-else-if="!planesDetalle.length" class="table-row">
                    <td colspan="2" class="py-4 text-center" :style="{ color: subtext }">Sin datos</td>
                  </tr>
                  <tr v-else v-for="plan in planesDetalle" :key="plan.plan_id || plan.plan_nombre" class="table-row">
                    <td class="py-3 pr-3" :style="{ color: theme.text }">{{ plan.plan_nombre }}</td>
                    <td class="py-3 text-right" :style="{ color: theme.text }">{{ formatMiles(plan.personas || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div class="text-right">
          <RouterLink :to="{ name: 'PlanesLista' }" class="link-theme">Ver todos los planes</RouterLink>
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
    <button class="fab fab--secondary" title="Buscar cliente" @click="openBuscarModal" :style="fabSecondaryStyle">
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
                  <div class="text-[12px] truncate" :style="{ color: subtext }">{{ c.email || '—' }}</div>
                </div>
                <span class="text-[11px] px-2 py-1 rounded-md border" :style="{ borderColor, background: chipBg, color: chipText }"
                  >Ver</span
                >
              </button>
              <div v-if="!resultados.length" class="px-4 py-8 text-center text-[13px]" :style="{ color: subtext }">
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
          <button class="icon-btn" :style="iconBtnStyle" title="Cerrar" @click="closePanelCliente">✕</button>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { useUiConfigStore } from '@/stores/uiConfig'
import ClienteCrearModal from '@/views/clientes/modals/ClienteCrearModal.vue'
import ClientSummaryCard from '@/components/ClientSummaryCard.vue'
import SkeletonCard from '@/components/dashboard/SkeletonCard.vue'
import api from '@/api/services'
import http from '@/api/http'
import { fetchDashboardSnapshot, dashboardApiContract } from '@/api/dashboard'

import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const router = useRouter()
const auth = useAuthStore()
const ws = useWorkspaceStore()
const ui = useUiConfigStore()

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

function hexToRgb(hex) {
  const h = hex?.replace('#', '')
  if (!h || (h.length !== 6 && h.length !== 3)) return { r: 15, g: 23, b: 42 }
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  return { r, g, b }
}
function isDark(hex) {
  const { r, g, b } = hexToRgb(hex)
  const L = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
  return L < 0.6
}
const subtext = computed(() => theme.value.subtext || (isDark(theme.value.text) ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.55)'))
const borderColor = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)'))
const trackBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.12)' : '#eef2f7'))
const skeletonBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.10)' : '#eef2f7'))
const chipBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.08)' : '#fafbfe'))
const chipText = computed(() => theme.value.cardText)
const rowHoverStyle = computed(() => ({ background: 'transparent' }))
const iconBtnStyle = computed(() => ({
  color: theme.value.cardText,
  borderColor: borderColor.value,
  background: 'transparent',
}))
const fabSecondaryStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
  border: `1px solid ${borderColor.value}`,
  boxShadow: '0 8px 24px rgba(0,0,0,.08)',
}))
const contrastOnPrimary = computed(() => (isDark(theme.value.primary) ? '#fff' : '#0f172a'))
const selectStyle = computed(() => ({
  color: theme.value.cardText,
  borderColor: borderColor.value,
  background: theme.value.cardBg,
}))

const loading = ref({ dashboard: true, buscar: false, resumen: false })
const dashboardData = ref(null)
const comparacionIngresos = reactive({ desde: '', hasta: '' })
const comparacionInscripciones = reactive({ desde: '', hasta: '' })

const variacionDataset = computed(
  () => dashboardData.value?.variacionIngresos ?? dashboardData.value?.ingresosVsGastos ?? [],
)
const ingresosMonthOptions = computed(() => {
  const seen = new Set()
  const opts = []
  for (const item of variacionDataset.value) {
    if (!item?.month || seen.has(item.month)) continue
    seen.add(item.month)
    opts.push({ value: item.month, label: formatMonthLabel(item.month) })
  }
  return opts
})
const inscripcionesMonthOptions = computed(() => {
  const seen = new Set()
  const dataset = dashboardData.value?.inscripcionesMensuales ?? []
  const opts = []
  for (const item of dataset) {
    if (!item?.month || seen.has(item.month)) continue
    seen.add(item.month)
    opts.push({ value: item.month, label: formatMonthLabel(item.month) })
  }
  return opts
})
const timelineMonths = computed(() => {
  const meta = dashboardData.value?.metadata?.months
  if (meta?.length) return [...meta]
  const set = new Set()
  ingresosMonthOptions.value.forEach((opt) => set.add(opt.value))
  inscripcionesMonthOptions.value.forEach((opt) => set.add(opt.value))
  return Array.from(set).sort()
})
const currentMonthKey = computed(() => {
  return (
    dashboardData.value?.metadata?.currentMonth ||
    timelineMonths.value[timelineMonths.value.length - 1] ||
    variacionDataset.value[variacionDataset.value.length - 1]?.month ||
    null
  )
})

function ensureComparison(target, options) {
  if (!options.length) {
    target.desde = ''
    target.hasta = ''
    return
  }
  if (!options.some((o) => o.value === target.desde)) {
    target.desde = options.length >= 2 ? options[options.length - 2].value : options[0].value
  }
  if (!options.some((o) => o.value === target.hasta)) {
    target.hasta = options[options.length - 1].value
  }
}

watch(ingresosMonthOptions, (opts) => ensureComparison(comparacionIngresos, opts), { immediate: true })
watch(inscripcionesMonthOptions, (opts) => ensureComparison(comparacionInscripciones, opts), { immediate: true })

const loadingDashboard = computed(() => loading.value.dashboard)

const ingresosResumen = computed(() => {
  const dataset = dashboardData.value?.ingresosVsGastos ?? []
  if (!dataset.length) {
    return { current: { ingresos: 0, gastos: 0, month: null }, prev: null, diff: 0, ingresoDelta: null, gastoDelta: null }
  }
  const months = timelineMonths.value.length ? timelineMonths.value : dataset.map((d) => d.month)
  const map = new Map(dataset.map((d) => [d.month, d]))
  const current = map.get(currentMonthKey.value) || dataset[dataset.length - 1]
  const idx = months.indexOf(current?.month)
  const prevKey = idx > 0 ? months[idx - 1] : null
  const prev = prevKey ? map.get(prevKey) : null
  const ingresos = Number(current?.ingresos ?? current?.total ?? 0)
  const gastos = Number(current?.gastos ?? 0)
  const diff = ingresos - gastos
  const ingresoDelta = prev ? calcPercentChange(Number(prev.ingresos ?? prev.total ?? 0), ingresos) : null
  const gastoDelta = prev ? calcPercentChange(Number(prev.gastos ?? 0), gastos) : null
  return { current, prev, diff, ingresoDelta, gastoDelta }
})
const currentMonthLabel = computed(() => formatMonthLabel(ingresosResumen.value.current?.month))

const variacionIngresosResumen = computed(() => {
  const dataset = variacionDataset.value
  if (!dataset.length) return { base: null, target: null, baseValue: 0, targetValue: 0, diff: 0, delta: null }
  const base = dataset.find((d) => d.month === comparacionIngresos.desde)
  const target = dataset.find((d) => d.month === comparacionIngresos.hasta)
  const baseValue = Number(base?.total ?? base?.ingresos ?? 0)
  const targetValue = Number(target?.total ?? target?.ingresos ?? 0)
  const diff = targetValue - baseValue
  const delta = base && target ? calcPercentChange(baseValue, targetValue) : null
  return { base, target, baseValue, targetValue, diff, delta }
})

const estadoMembresias = computed(() => {
  const data = dashboardData.value?.estadoMembresias ?? {}
  const counts = data.counts || {}
  return {
    activos: Number(data.activos ?? counts.activos ?? 0),
    cancelados: Number(data.cancelados ?? counts.cancelados ?? 0),
    suspendidos: Number(data.suspendidos ?? counts.suspendidos ?? 0),
    corte: data.corte || null,
  }
})

const pagosResumen = computed(() => {
  const data = dashboardData.value?.pagosAlDia ?? {}
  const activos = Number(data.activos_totales ?? data.activos ?? 0)
  const alDia = Number(data.activos_al_corriente ?? data.al_dia ?? 0)
  const porcentaje = activos ? (alDia / activos) * 100 : 0
  return { corte: data.corte || null, activos, alDia, porcentaje }
})

const personalResumen = computed(() => {
  const data = dashboardData.value?.personalEnGimnasio ?? {}
  const total = Number(data.personal_total ?? data.total ?? 0)
  const dentro = Number(data.personal_en_gimnasio ?? data.dentro ?? 0)
  const fuera = data.personal_fuera != null ? Number(data.personal_fuera) : Math.max(0, total - dentro)
  return { total, dentro, fuera, timestamp: data.timestamp || null }
})
const personalPorHoraBuckets = computed(() => dashboardData.value?.personalPorHora?.buckets ?? [])
const personalHoraPico = computed(() => {
  const buckets = personalPorHoraBuckets.value
  if (!buckets.length) return { hour: null, personal: 0 }
  return buckets.reduce((acc, item) => (item.personal > (acc.personal ?? -Infinity) ? item : acc), {
    hour: null,
    personal: 0,
  })
})
const personalPorHoraLabel = computed(() => {
  const date = dashboardData.value?.personalPorHora?.date
  if (!date) return 'Sin fecha'
  try {
    return new Date(date).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' })
  } catch {
    return date
  }
})

const planesRanking = computed(() => {
  const data = dashboardData.value?.planesRanking ?? {}
  return {
    top: data.top || null,
    bottom: data.bottom || null,
    detalle: Array.isArray(data.detalle) ? data.detalle : [],
  }
})
const planesDetalle = computed(() => {
  const items = [...(planesRanking.value.detalle || [])]
  return items.sort((a, b) => Number(b.personas || 0) - Number(a.personas || 0))
})

const inscripcionesComparativo = computed(() => {
  const dataset = dashboardData.value?.inscripcionesMensuales ?? []
  if (!dataset.length) return { base: null, target: null, baseValue: 0, targetValue: 0, diff: 0, delta: null }
  const base = dataset.find((d) => d.month === comparacionInscripciones.desde)
  const target = dataset.find((d) => d.month === comparacionInscripciones.hasta)
  const baseValue = Number(base?.altas ?? 0)
  const targetValue = Number(target?.altas ?? 0)
  const diff = targetValue - baseValue
  const delta = base && target ? calcPercentChange(baseValue, targetValue) : null
  return { base, target, baseValue, targetValue, diff, delta }
})

const bajasResumen = computed(() => {
  const dataset = dashboardData.value?.bajasMensuales ?? []
  if (!dataset.length) return { current: null, prev: null, currentValue: 0, prevValue: 0, delta: null }
  const months = timelineMonths.value.length ? timelineMonths.value : dataset.map((d) => d.month)
  const map = new Map(dataset.map((d) => [d.month, d]))
  const targetKey = comparacionInscripciones.hasta || currentMonthKey.value || months[months.length - 1]
  let current = targetKey ? map.get(targetKey) : null
  if (!current) current = dataset[dataset.length - 1]
  const idx = months.indexOf(current?.month)
  const prevKey = idx > 0 ? months[idx - 1] : null
  const prev = prevKey ? map.get(prevKey) : null
  const currentValue = Number(current?.bajas ?? 0)
  const prevValue = Number(prev?.bajas ?? 0)
  const delta = prev ? calcPercentChange(prevValue, currentValue) : null
  return { current, prev, currentValue, prevValue, delta }
})

const ingresosVsGastosOption = computed(() => {
  const dataset = dashboardData.value?.ingresosVsGastos ?? []
  const months = timelineMonths.value.length ? timelineMonths.value : dataset.map((d) => d.month)
  const map = new Map(dataset.map((d) => [d.month, d]))
  const axisLabels = months.map((m) => formatMonthShort(m))
  const ingresosSeries = months.map((m) => Number(map.get(m)?.ingresos ?? 0))
  const gastosSeries = months.map((m) => Number(map.get(m)?.gastos ?? 0))
  return {
    color: [theme.value.primary, '#ef4444'],
    tooltip: { trigger: 'axis', valueFormatter: (v) => money(v) },
    legend: { top: 8, right: 10, textStyle: { color: subtext.value } },
    grid: { left: 40, right: 16, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: axisLabels,
      boundaryGap: true,
      axisLabel: { fontSize: 11, color: subtext.value },
      axisLine: { lineStyle: { color: borderColor.value } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: subtext.value },
      splitLine: { lineStyle: { color: borderColor.value } },
    },
    series: [
      { name: 'Ingresos', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: ingresosSeries },
      { name: 'Gastos', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: gastosSeries },
    ],
  }
})

const personalPorHoraOption = computed(() => {
  const buckets = personalPorHoraBuckets.value
  return {
    color: [theme.value.primary],
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 16, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: buckets.map((b) => b.hour),
      axisLabel: { fontSize: 11, color: subtext.value },
      axisLine: { lineStyle: { color: borderColor.value } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: subtext.value },
      splitLine: { lineStyle: { color: borderColor.value } },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: buckets.map((b) => b.personal),
      },
    ],
  }
})

const inscripcionesBajasOption = computed(() => {
  const inscripciones = dashboardData.value?.inscripcionesMensuales ?? []
  const bajas = dashboardData.value?.bajasMensuales ?? []
  const months = timelineMonths.value.length
    ? timelineMonths.value
    : Array.from(new Set([...inscripciones.map((d) => d.month), ...bajas.map((d) => d.month)])).sort()
  const inscMap = new Map(inscripciones.map((d) => [d.month, d]))
  const bajasMap = new Map(bajas.map((d) => [d.month, d]))
  return {
    color: [theme.value.primary, '#f97316'],
    tooltip: { trigger: 'axis' },
    legend: { top: 8, right: 10, textStyle: { color: subtext.value } },
    grid: { left: 40, right: 16, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: months.map((m) => formatMonthShort(m)),
      axisLabel: { fontSize: 11, color: subtext.value },
      axisLine: { lineStyle: { color: borderColor.value } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: subtext.value },
      splitLine: { lineStyle: { color: borderColor.value } },
    },
    series: [
      {
        name: 'Inscripciones',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: months.map((m) => Number(inscMap.get(m)?.altas ?? 0)),
      },
      {
        name: 'Bajas',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: months.map((m) => Number(bajasMap.get(m)?.bajas ?? 0)),
      },
    ],
  }
})

async function loadDashboard() {
  loading.value.dashboard = true
  try {
    const data = await fetchDashboardSnapshot()
    dashboardData.value = data
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__DASHBOARD_API_CONTRACT__ = dashboardApiContract
    }
  } finally {
    loading.value.dashboard = false
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated) return
  await ws.ensureEmpresaSet()
  await loadDashboard()
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
  (v) => {
    clearTimeout(tDebounce)
    tDebounce = setTimeout(() => {
      doSearch(v)
    }, 300)
  },
  { flush: 'post' },
)

async function doSearch(q) {
  if (!q || !q.trim()) {
    resultados.value = []
    return
  }
  loading.value.buscar = true
  try {
    const { data } = await api.clientes.list({ search: q.trim(), page_size: 10, ordering: '-id' })
    resultados.value = (data?.results || data || []).map((r) => ({
      id: r.id,
      nombre: r.nombre ?? '',
      apellidos: r.apellidos ?? '',
      email: r.email || '—',
    }))
  } finally {
    loading.value.buscar = false
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
  loading.value.resumen = true
  try {
    const { data } = await http.get(`clientes/${id}/resumen/`)
    resumen.value = data || null
  } catch {
    resumen.value = null
  } finally {
    loading.value.resumen = false
  }
}

function verEditar() {
  const id = resumen.value?.id
  if (!id) return
  try {
    router.push({ name: 'ClientesLista', query: { sel: id } })
  } catch {}
}

function onClienteCreado() {
  modalCliente.value = false
}
function cobrar(c) {
  console.log('Cobrar a:', c)
}

function money(n) {
  return Number(n || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}
function formatMiles(n) {
  return Number(n || 0).toLocaleString('es-MX')
}
function formatPercent(value, decimals = 1) {
  if (value == null) return '0%'
  const num = Number(value)
  if (!Number.isFinite(num)) return '0%'
  const prefix = num > 0 ? '+' : ''
  return `${prefix}${num.toFixed(decimals)}%`
}
function formatMonthLabel(key) {
  if (!key) return '—'
  try {
    return new Date(`${key}-01T00:00:00`).toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return key
  }
}
function formatMonthShort(key) {
  if (!key) return '—'
  try {
    return new Date(`${key}-01T00:00:00`).toLocaleDateString('es-MX', {
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return key
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
</script>

<style scoped>
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

.icon-btn {
  @apply h-8 w-8 rounded-lg grid place-items-center;
  border: 1px solid;
}

.field-group {
  @apply flex flex-col gap-1;
}
.field-label {
  @apply text-[11px] uppercase tracking-wide font-medium;
}
.field-select {
  @apply w-full rounded-lg border px-3 py-2 text-sm focus:outline-none;
  transition: border-color 0.2s ease;
}

.card-kpi {
  @apply rounded-2xl border shadow-sm px-4 py-3;
  background: v-bind('theme.cardBg');
  color: v-bind('theme.cardText');
  border-color: v-bind('borderColor');
}
.kpi-title {
  @apply text-[13px] mb-2 font-medium;
}
.kpi-value {
  @apply text-3xl font-semibold tracking-tight;
}

.stat-list {
  @apply mt-2 space-y-2;
}
.stat-list li {
  @apply flex items-center justify-between text-sm;
  color: v-bind('theme.cardText');
}
.stat-list strong {
  @apply font-semibold;
}

.delta-badge {
  @apply inline-flex items-center justify-center px-2 py-1 text-[11px] font-semibold rounded-full;
}
.delta-positive {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}
.delta-negative {
  background: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.table-header {
  @apply text-left text-xs uppercase tracking-wide py-3;
  color: v-bind('subtext');
}
.table-row {
  @apply border-b;
  border-color: v-bind('borderColor');
}

.link-theme {
  color: v-bind(primary);
}
.link-theme:hover {
  text-decoration: underline;
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

.fab {
  position: fixed;
  right: 1.5rem;
  bottom: 6.5rem;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.fab--secondary {
  right: 1.5rem;
  bottom: 1.5rem;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 9999px;
}
</style>
