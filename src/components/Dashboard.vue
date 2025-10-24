<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1">
      <div class="mx-auto w-full max-w-[1300px] px-5 py-6 space-y-6">
        <section class="grid auto-rows-fr gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <article class="kpi-module lg:col-span-2 xl:col-span-3">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Ingresos vs gastos</h3>
                <p class="module-subtitle" :style="{ color: subtext }">
                  Selecciona el rango para analizar los resultados financieros.
                </p>
              </div>
              <div class="module-filters">
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Desde</label>
                  <select v-model="filters.ingresos.desde" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in ingresosMonthOptions"
                      :key="`ing-from-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Hasta</label>
                  <select v-model="filters.ingresos.hasta" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in ingresosMonthOptions"
                      :key="`ing-to-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <button class="icon-btn" :style="iconBtnStyle" title="Actualizar tablero" @click="loadDashboard">
                  ⟳
                </button>
              </div>
            </header>
            <div class="module-body">
              <div class="module-metrics">
                <div class="metric">
                  <span class="metric-label" :style="{ color: subtext }">Ingresos</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard ? '—' : money(ingresosResumen.ingresos) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">{{ ingresosResumen.periodLabel }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label" :style="{ color: subtext }">Gastos</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard ? '—' : money(ingresosResumen.gastos) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">{{ ingresosResumen.periodLabel }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label" :style="{ color: subtext }">Margen</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard ? '—' : money(ingresosResumen.diff) }}
                  </span>
                  <div class="metric-diff">
                    <span class="delta-badge" :class="deltaTone(ingresosResumen.ingresoDelta, false)">
                      {{ loadingDashboard || ingresosResumen.ingresoDelta == null
                        ? '—'
                        : formatPercent(ingresosResumen.ingresoDelta) }}
                    </span>
                    <span class="metric-caption" :style="{ color: subtext }">vs {{ ingresosResumen.prevLabel }}</span>
                  </div>
                </div>
              </div>
              <div class="module-chart">
                <VChart v-if="!loadingDashboard" :option="ingresosVsGastosOption" autoresize class="h-64" />
                <SkeletonCard v-else class="h-64" />
              </div>
            </div>
          </article>

          <article class="kpi-module">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Variación de los ingresos</h3>
                <p class="module-subtitle" :style="{ color: subtext }">Comparación libre por mes</p>
              </div>
              <div class="module-filters">
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Mes base</label>
                  <select v-model="filters.variacionIngresos.desde" class="field-select" :style="selectStyle">
                    <option v-for="opt in ingresosMonthOptions" :key="`var-base-${opt.value}`" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Mes comparación</label>
                  <select v-model="filters.variacionIngresos.hasta" class="field-select" :style="selectStyle">
                    <option v-for="opt in ingresosMonthOptions" :key="`var-target-${opt.value}`" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </header>
            <div class="module-body module-body--simple">
              <div class="metric metric--stacked">
                <span class="metric-value" :style="{ color: theme.text }">
                  {{ loadingDashboard || variacionIngresosResumen.delta == null
                    ? '—'
                    : formatPercent(variacionIngresosResumen.delta) }}
                </span>
                <span class="metric-caption" :style="{ color: subtext }">
                  {{ variacionIngresosResumen.baseLabel }} → {{ variacionIngresosResumen.targetLabel }}
                </span>
                <span class="metric-caption" :style="{ color: subtext }">
                  {{ loadingDashboard ? '—' : money(variacionIngresosResumen.targetValue) }}
                  vs {{ loadingDashboard ? '—' : money(variacionIngresosResumen.baseValue) }}
                </span>
              </div>
            </div>
          </article>

          <article class="kpi-module">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Estado de membresías</h3>
                <p class="module-subtitle" :style="{ color: subtext }">Activos, cancelados y suspendidos</p>
              </div>
              <div class="module-filters">
                <div class="field-inline field-inline--full">
                  <label class="field-label" :style="{ color: subtext }">Corte</label>
                  <select v-model="filters.membresias.corte" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in membresiaCorteOptions"
                      :key="`membresia-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </header>
            <div class="module-body module-body--split">
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
              <div class="metric metric--stacked">
                <span class="metric-label" :style="{ color: subtext }">Pagos al día</span>
                <span class="metric-value" :style="{ color: theme.text }">
                  {{ loadingDashboard ? '—' : formatPercent(pagosResumen.porcentaje) }}
                </span>
                <span class="metric-caption" :style="{ color: subtext }">
                  {{ loadingDashboard
                    ? '—'
                    : `${formatMiles(pagosResumen.alDia)} de ${formatMiles(pagosResumen.activos)} activos` }}
                </span>
              </div>
            </div>
          </article>

          <article class="kpi-module lg:col-span-2">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Personal en el gimnasio</h3>
                <p class="module-subtitle" :style="{ color: subtext }">Visión por sucursal y fecha</p>
              </div>
              <div class="module-filters">
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Sucursal</label>
                  <select v-model="filters.personal.sucursalId" class="field-select" :style="selectStyle">
                    <option v-for="opt in personalSucursalOptions" :key="`sucursal-${opt.value}`" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Fecha</label>
                  <select v-model="filters.personal.fecha" class="field-select" :style="selectStyle">
                    <option v-for="opt in personalDateOptions" :key="`personal-date-${opt.value}`" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </header>
            <div class="module-body module-body--stacked">
              <div class="module-metrics module-metrics--compact">
                <div class="metric">
                  <span class="metric-label" :style="{ color: subtext }">Dentro del gimnasio</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard ? '—' : formatMiles(personalResumen.dentro) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">
                    de {{ loadingDashboard ? '—' : formatMiles(personalResumen.total) }} colaboradores
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label" :style="{ color: subtext }">Hora pico</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard || !personalHoraPico.hour ? '—' : personalHoraPico.hour }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">
                    {{ loadingDashboard ? '—' : `${formatMiles(personalHoraPico.personal)} personas` }}
                  </span>
                </div>
              </div>
              <div class="module-chart">
                <VChart v-if="!loadingDashboard" :option="personalPorHoraOption" autoresize class="h-64" />
                <SkeletonCard v-else class="h-64" />
              </div>
            </div>
          </article>

          <article class="kpi-module">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Ranking de planes</h3>
                <p class="module-subtitle" :style="{ color: subtext }">Planes con más y menos personas</p>
              </div>
              <div class="module-filters">
                <div class="field-inline field-inline--full">
                  <label class="field-label" :style="{ color: subtext }">Mes</label>
                  <select v-model="filters.planes.month" class="field-select" :style="selectStyle">
                    <option v-for="opt in planesMonthOptions" :key="`plan-period-${opt.value}`" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </header>
            <div class="module-body module-body--stacked">
              <div class="module-metrics module-metrics--compact">
                <div class="metric metric--stacked">
                  <span class="metric-label" :style="{ color: subtext }">Plan con más personas</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard || !planesRanking.top ? '—' : formatMiles(planesRanking.top.personas) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">
                    {{ loadingDashboard || !planesRanking.top ? '—' : planesRanking.top.plan_nombre }}
                  </span>
                </div>
                <div class="metric metric--stacked">
                  <span class="metric-label" :style="{ color: subtext }">Plan con menos personas</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard || !planesRanking.bottom ? '—' : formatMiles(planesRanking.bottom.personas) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">
                    {{ loadingDashboard || !planesRanking.bottom ? '—' : planesRanking.bottom.plan_nombre }}
                  </span>
                </div>
              </div>
              <div class="module-table">
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
                    <tr
                      v-else
                      v-for="plan in planesDetalle"
                      :key="plan.plan_id || plan.plan_nombre"
                      class="table-row"
                    >
                      <td class="py-3 pr-3" :style="{ color: theme.text }">{{ plan.plan_nombre }}</td>
                      <td class="py-3 text-right" :style="{ color: theme.text }">
                        {{ formatMiles(plan.personas || 0) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <article class="kpi-module lg:col-span-2 xl:col-span-2">
            <header class="module-head">
              <div>
                <h3 class="module-title" :style="{ color: theme.text }">Inscripciones y bajas</h3>
                <p class="module-subtitle" :style="{ color: subtext }">Mide el crecimiento y las bajas mensuales</p>
              </div>
              <div class="module-filters module-filters--wrap">
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Inscripciones · Mes base</label>
                  <select v-model="filters.inscripciones.desde" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in inscripcionesMonthOptions"
                      :key="`ins-base-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Inscripciones · Mes comparación</label>
                  <select v-model="filters.inscripciones.hasta" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in inscripcionesMonthOptions"
                      :key="`ins-target-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div class="field-inline">
                  <label class="field-label" :style="{ color: subtext }">Bajas · Mes</label>
                  <select v-model="filters.bajas.month" class="field-select" :style="selectStyle">
                    <option
                      v-for="opt in inscripcionesMonthOptions"
                      :key="`baja-${opt.value}`"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </header>
            <div class="module-body module-body--stacked">
              <div class="module-metrics module-metrics--compact">
                <div class="metric metric--stacked">
                  <span class="metric-label" :style="{ color: subtext }">Crecimiento de inscripciones</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard || inscripcionesComparativo.delta == null
                      ? '—'
                      : formatPercent(inscripcionesComparativo.delta) }}
                  </span>
                  <span class="metric-caption" :style="{ color: subtext }">
                    {{ loadingDashboard
                      ? '—'
                      : `${formatMiles(inscripcionesComparativo.targetValue)} vs ${formatMiles(inscripcionesComparativo.baseValue)}` }}
                  </span>
                </div>
                <div class="metric metric--stacked">
                  <span class="metric-label" :style="{ color: subtext }">Bajas del mes</span>
                  <span class="metric-value" :style="{ color: theme.text }">
                    {{ loadingDashboard ? '—' : formatMiles(bajasResumen.currentValue) }}
                  </span>
                  <div class="metric-diff">
                    <span class="delta-badge" :class="deltaTone(bajasResumen.delta, true)">
                      {{ loadingDashboard || bajasResumen.delta == null ? '—' : formatPercent(bajasResumen.delta) }}
                    </span>
                    <span class="metric-caption" :style="{ color: subtext }">vs {{ bajasResumen.prevLabel }}</span>
                  </div>
                </div>
              </div>
              <div class="module-chart">
                <VChart v-if="!loadingDashboard" :option="inscripcionesBajasOption" autoresize class="h-64" />
                <SkeletonCard v-else class="h-64" />
              </div>
            </div>
          </article>
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
const filters = reactive({
  ingresos: { desde: '', hasta: '' },
  variacionIngresos: { desde: '', hasta: '' },
  membresias: { corte: '' },
  personal: { sucursalId: '', fecha: '' },
  planes: { month: '' },
  inscripciones: { desde: '', hasta: '' },
  bajas: { month: '' },
})

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
const membresiaCorteOptions = computed(() => {
  const registros = [
    ...(dashboardData.value?.estadoMembresias?.cortes ?? []),
    ...(dashboardData.value?.pagosAlDia?.cortes ?? []),
  ]
  const map = new Map()
  for (const item of registros) {
    if (!item?.corte) continue
    if (!map.has(item.corte)) {
      map.set(item.corte, {
        value: item.corte,
        label: formatDateLabel(item.corte),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.value.localeCompare(b.value))
})
const personalSnapshots = computed(() => dashboardData.value?.personalEnGimnasio?.snapshots ?? [])
const personalSucursalOptions = computed(() => {
  const sucursales = dashboardData.value?.personalEnGimnasio?.sucursales ?? []
  const opts = [{ value: 'all', label: 'Todas las sucursales' }]
  for (const suc of sucursales) {
    if (!suc?.id) continue
    opts.push({ value: String(suc.id), label: suc.nombre || `Sucursal ${suc.id}` })
  }
  return opts
})
const personalDateOptions = computed(() => {
  const seen = new Set()
  const opts = []
  const snapshots = personalSnapshots.value
  for (const snap of snapshots) {
    if (!snap?.date || seen.has(snap.date)) continue
    seen.add(snap.date)
    opts.push({ value: snap.date, label: formatDateLabel(snap.date) })
  }
  return opts.sort((a, b) => a.value.localeCompare(b.value))
})
const planesMonthOptions = computed(() => {
  const series = dashboardData.value?.planesRanking?.series ?? []
  const seen = new Set()
  const opts = []
  for (const item of series) {
    if (!item?.month || seen.has(item.month)) continue
    seen.add(item.month)
    opts.push({ value: item.month, label: formatMonthLabel(item.month) })
  }
  return opts.sort((a, b) => a.value.localeCompare(b.value))
})
const timelineMonths = computed(() => {
  const meta = dashboardData.value?.metadata?.months
  if (meta?.length) return [...meta]
  const set = new Set()
  ;(dashboardData.value?.ingresosVsGastos ?? []).forEach((item) => {
    if (item?.month) set.add(item.month)
  })
  ;(dashboardData.value?.inscripcionesMensuales ?? []).forEach((item) => {
    if (item?.month) set.add(item.month)
  })
  return Array.from(set).sort()
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
  if (target.desde && target.hasta && target.desde > target.hasta) {
    ;[target.desde, target.hasta] = [target.hasta, target.desde]
  }
}

watch(
  ingresosMonthOptions,
  (opts) => {
    ensureComparison(filters.ingresos, opts)
    ensureComparison(filters.variacionIngresos, opts)
  },
  { immediate: true },
)
watch(inscripcionesMonthOptions, (opts) => ensureComparison(filters.inscripciones, opts), { immediate: true })
watch(
  inscripcionesMonthOptions,
  (opts) => {
    if (!opts.length) {
      filters.bajas.month = ''
      return
    }
    if (!opts.some((o) => o.value === filters.bajas.month)) {
      filters.bajas.month = opts[opts.length - 1].value
    }
  },
  { immediate: true },
)
watch(
  membresiaCorteOptions,
  (opts) => {
    if (!opts.length) {
      filters.membresias.corte = ''
      return
    }
    if (!opts.some((o) => o.value === filters.membresias.corte)) {
      filters.membresias.corte = opts[opts.length - 1].value
    }
  },
  { immediate: true },
)
watch(
  personalSucursalOptions,
  (opts) => {
    if (!opts.length) {
      filters.personal.sucursalId = ''
      return
    }
    if (!opts.some((o) => String(o.value) === String(filters.personal.sucursalId))) {
      filters.personal.sucursalId = opts[0].value
    }
  },
  { immediate: true },
)
watch(
  personalDateOptions,
  (opts) => {
    if (!opts.length) {
      filters.personal.fecha = ''
      return
    }
    if (!opts.some((o) => o.value === filters.personal.fecha)) {
      filters.personal.fecha = opts[opts.length - 1].value
    }
  },
  { immediate: true },
)
watch(
  planesMonthOptions,
  (opts) => {
    if (!opts.length) {
      filters.planes.month = ''
      return
    }
    if (!opts.some((o) => o.value === filters.planes.month)) {
      filters.planes.month = opts[opts.length - 1].value
    }
  },
  { immediate: true },
)

watch(
  () => filters.inscripciones.hasta,
  (val) => {
    if (val && filters.bajas.month !== val) {
      filters.bajas.month = val
    }
  },
)

const loadingDashboard = computed(() => loading.value.dashboard)

const ingresosResumen = computed(() => {
  const dataset = dashboardData.value?.ingresosVsGastos ?? []
  if (!dataset.length) {
    return {
      ingresos: 0,
      gastos: 0,
      diff: 0,
      ingresoDelta: null,
      gastoDelta: null,
      periodLabel: 'Sin datos',
      prevLabel: 'Sin comparación',
      prevIngresos: 0,
      prevGastos: 0,
    }
  }
  const months = [...new Set(dataset.map((d) => d.month).filter(Boolean))].sort()
  const [from, to] = ensureRange(filters.ingresos.desde, filters.ingresos.hasta, months)
  const selectedMonths = months.filter((m) => (!from || m >= from) && (!to || m <= to))
  const map = new Map(dataset.map((d) => [d.month, d]))
  const selected = selectedMonths.map((m) => map.get(m)).filter(Boolean)
  const ingresos = selected.reduce((sum, item) => sum + Number(item?.ingresos ?? item?.total ?? 0), 0)
  const gastos = selected.reduce((sum, item) => sum + Number(item?.gastos ?? 0), 0)
  const diff = ingresos - gastos

  const rangeLength = selectedMonths.length || 1
  const startIdx = selectedMonths.length ? months.indexOf(selectedMonths[0]) : months.length - 1
  const prevEndIdx = startIdx - 1
  const prevStartIdx = prevEndIdx - (rangeLength - 1)
  let prevMonths = []
  if (prevStartIdx >= 0) {
    prevMonths = months.slice(Math.max(0, prevStartIdx), prevEndIdx + 1)
  }
  const prevSelected = prevMonths.map((m) => map.get(m)).filter(Boolean)
  const prevIngresos = prevSelected.reduce((sum, item) => sum + Number(item?.ingresos ?? item?.total ?? 0), 0)
  const prevGastos = prevSelected.reduce((sum, item) => sum + Number(item?.gastos ?? 0), 0)
  const ingresoDelta = prevMonths.length ? calcPercentChange(prevIngresos, ingresos) : null
  const gastoDelta = prevMonths.length ? calcPercentChange(prevGastos, gastos) : null

  return {
    ingresos,
    gastos,
    diff,
    ingresoDelta,
    gastoDelta,
    periodLabel: formatRangeLabel(selectedMonths),
    prevLabel: prevMonths.length ? formatRangeLabel(prevMonths) : 'Sin comparación',
    prevIngresos,
    prevGastos,
  }
})

const variacionIngresosResumen = computed(() => {
  const dataset = variacionDataset.value
  if (!dataset.length) {
    return {
      base: null,
      target: null,
      baseValue: 0,
      targetValue: 0,
      diff: 0,
      delta: null,
      baseLabel: '—',
      targetLabel: '—',
    }
  }
  const baseKey = filters.variacionIngresos.desde
  const targetKey = filters.variacionIngresos.hasta
  const base = dataset.find((d) => d.month === baseKey) ?? dataset[0]
  const target = dataset.find((d) => d.month === targetKey) ?? dataset[dataset.length - 1]
  const baseValue = Number(base?.total ?? base?.ingresos ?? 0)
  const targetValue = Number(target?.total ?? target?.ingresos ?? 0)
  const diff = targetValue - baseValue
  const delta = base && target ? calcPercentChange(baseValue, targetValue) : null
  return {
    base,
    target,
    baseValue,
    targetValue,
    diff,
    delta,
    baseLabel: formatMonthLabel(base?.month),
    targetLabel: formatMonthLabel(target?.month),
  }
})

const estadoMembresias = computed(() => {
  const cortes = dashboardData.value?.estadoMembresias?.cortes ?? []
  const corteKey = filters.membresias.corte
  const registro = corteKey ? cortes.find((c) => c.corte === corteKey) : cortes[cortes.length - 1]
  return {
    activos: Number(registro?.activos ?? 0),
    cancelados: Number(registro?.cancelados ?? 0),
    suspendidos: Number(registro?.suspendidos ?? 0),
    corte: registro?.corte ?? null,
  }
})

const pagosResumen = computed(() => {
  const cortes = dashboardData.value?.pagosAlDia?.cortes ?? []
  const corteKey = filters.membresias.corte
  const registro = corteKey ? cortes.find((c) => c.corte === corteKey) : cortes[cortes.length - 1]
  const activos = Number(registro?.activos_totales ?? registro?.activos ?? 0)
  const alDia = Number(registro?.activos_al_corriente ?? registro?.al_dia ?? 0)
  const porcentaje = activos ? (alDia / activos) * 100 : 0
  return {
    corte: registro?.corte ?? null,
    activos,
    alDia,
    porcentaje,
  }
})

function aggregateSnapshots(list) {
  if (!list.length) {
    return { personal_total: 0, personal_en_gimnasio: 0, personal_fuera: 0, timestamp: null }
  }
  return list.reduce(
    (acc, item) => ({
      personal_total: acc.personal_total + Number(item?.personal_total ?? item?.total ?? 0),
      personal_en_gimnasio: acc.personal_en_gimnasio + Number(item?.personal_en_gimnasio ?? item?.dentro ?? 0),
      personal_fuera: acc.personal_fuera + Number(item?.personal_fuera ?? 0),
      timestamp: item?.timestamp || acc.timestamp,
    }),
    { personal_total: 0, personal_en_gimnasio: 0, personal_fuera: 0, timestamp: null },
  )
}

const personalSnapshotSeleccionado = computed(() => {
  const snapshots = personalSnapshots.value
  if (!snapshots.length) return null
  const fecha = filters.personal.fecha
  const sucursalId = filters.personal.sucursalId
  const byDate = fecha ? snapshots.filter((s) => s.date === fecha) : snapshots
  const pool = byDate.length ? byDate : snapshots
  if (!sucursalId || sucursalId === 'all') {
    const agg = aggregateSnapshots(pool)
    return { ...agg, date: fecha || pool[pool.length - 1]?.date || null, sucursal_id: 'all' }
  }
  const match = pool.find((s) => String(s.sucursal_id) === String(sucursalId))
  if (match) return match
  const fallback = snapshots.filter((s) => String(s.sucursal_id) === String(sucursalId))
  return fallback.length ? fallback[fallback.length - 1] : pool[pool.length - 1]
})

const personalResumen = computed(() => {
  const snapshot = personalSnapshotSeleccionado.value
  if (!snapshot) return { total: 0, dentro: 0, fuera: 0, timestamp: null }
  const total = Number(snapshot?.personal_total ?? snapshot?.total ?? 0)
  const dentro = Number(snapshot?.personal_en_gimnasio ?? snapshot?.dentro ?? 0)
  const fuera = snapshot?.personal_fuera != null ? Number(snapshot.personal_fuera) : Math.max(0, total - dentro)
  return { total, dentro, fuera, timestamp: snapshot?.timestamp ?? null }
})

const personalPorHoraSerie = computed(() => {
  const series = dashboardData.value?.personalPorHora?.series ?? []
  if (!series.length) return null
  const fecha = filters.personal.fecha
  const sucursalId = filters.personal.sucursalId
  const match = series.find((item) => {
    const sameDate = fecha ? item.date === fecha : true
    const sameSucursal = !sucursalId || sucursalId === 'all' ? true : String(item.sucursal_id) === String(sucursalId)
    return sameDate && sameSucursal
  })
  if (match) return match
  if (sucursalId && sucursalId !== 'all') {
    const fallback = series.filter((item) => String(item.sucursal_id) === String(sucursalId))
    if (fallback.length) return fallback[fallback.length - 1]
  }
  if (fecha) {
    const byDate = series.filter((item) => item.date === fecha)
    if (byDate.length) return byDate[byDate.length - 1]
  }
  return series[series.length - 1]
})

const personalPorHoraBuckets = computed(() => personalPorHoraSerie.value?.buckets ?? [])
const personalHoraPico = computed(() => {
  const buckets = personalPorHoraBuckets.value
  if (!buckets.length) return { hour: null, personal: 0 }
  return buckets.reduce((acc, item) => (item.personal > (acc.personal ?? -Infinity) ? item : acc), {
    hour: null,
    personal: 0,
  })
})
const personalPorHoraLabel = computed(() => {
  const serie = personalPorHoraSerie.value
  if (!serie?.date) return 'Sin fecha'
  return formatDateLabel(serie.date)
})

const planesRanking = computed(() => {
  const series = dashboardData.value?.planesRanking?.series ?? []
  const monthKey = filters.planes.month
  const registro = monthKey ? series.find((item) => item.month === monthKey) : series[series.length - 1]
  return {
    month: registro?.month ?? null,
    top: registro?.top || null,
    bottom: registro?.bottom || null,
    detalle: Array.isArray(registro?.detalle) ? registro.detalle : [],
  }
})
const planesDetalle = computed(() => {
  const items = [...(planesRanking.value.detalle || [])]
  return items.sort((a, b) => Number(b.personas || 0) - Number(a.personas || 0))
})

const inscripcionesComparativo = computed(() => {
  const dataset = dashboardData.value?.inscripcionesMensuales ?? []
  if (!dataset.length) {
    return { base: null, target: null, baseValue: 0, targetValue: 0, diff: 0, delta: null }
  }
  const baseKey = filters.inscripciones.desde
  const targetKey = filters.inscripciones.hasta
  const base = dataset.find((d) => d.month === baseKey) ?? dataset[0]
  const target = dataset.find((d) => d.month === targetKey) ?? dataset[dataset.length - 1]
  const baseValue = Number(base?.altas ?? 0)
  const targetValue = Number(target?.altas ?? 0)
  const diff = targetValue - baseValue
  const delta = base && target ? calcPercentChange(baseValue, targetValue) : null
  return { base, target, baseValue, targetValue, diff, delta }
})

const bajasResumen = computed(() => {
  const dataset = dashboardData.value?.bajasMensuales ?? []
  if (!dataset.length) {
    return { current: null, prev: null, currentValue: 0, prevValue: 0, delta: null, prevLabel: 'Sin comparación' }
  }
  const months = [...new Set(dataset.map((d) => d.month).filter(Boolean))].sort()
  const map = new Map(dataset.map((d) => [d.month, d]))
  const targetKey = filters.bajas.month || months[months.length - 1]
  let current = targetKey ? map.get(targetKey) : null
  if (!current) current = dataset[dataset.length - 1]
  const idx = months.indexOf(current?.month)
  const prevKey = idx > 0 ? months[idx - 1] : null
  const prev = prevKey ? map.get(prevKey) : null
  const currentValue = Number(current?.bajas ?? 0)
  const prevValue = Number(prev?.bajas ?? 0)
  const delta = prev ? calcPercentChange(prevValue, currentValue) : null
  return {
    current,
    prev,
    currentValue,
    prevValue,
    delta,
    prevLabel: prev ? formatMonthLabel(prev.month) : 'Sin comparación',
    currentLabel: current ? formatMonthLabel(current.month) : '—',
  }
})

const ingresosVsGastosOption = computed(() => {
  const dataset = dashboardData.value?.ingresosVsGastos ?? []
  const allMonths = timelineMonths.value.length ? timelineMonths.value : dataset.map((d) => d.month)
  const [from, to] = ensureRange(filters.ingresos.desde, filters.ingresos.hasta, allMonths)
  const months = allMonths.filter((m) => (!from || m >= from) && (!to || m <= to))
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
function formatDateLabel(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}
function formatRangeLabel(months) {
  if (!months?.length) return '—'
  if (months.length === 1) return formatMonthLabel(months[0])
  return `${formatMonthShort(months[0])} → ${formatMonthShort(months[months.length - 1])}`
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
function ensureRange(from, to, orderedValues) {
  if (!orderedValues?.length) return [from || '', to || '']
  let start = from && orderedValues.includes(from) ? from : orderedValues[0]
  let end = to && orderedValues.includes(to) ? to : orderedValues[orderedValues.length - 1]
  if (start > end) {
    const tmp = start
    start = end
    end = tmp
  }
  return [start, end]
}
function deltaTone(value, invert = false) {
  if (value == null) return ''
  const num = Number(value)
  if (!Number.isFinite(num) || num === 0) return ''
  const positive = num > 0
  if ((positive && !invert) || (!positive && invert && num < 0)) return 'delta-positive'
  if ((num < 0 && !invert) || (positive && invert)) return 'delta-negative'
  return ''
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
.kpi-module {
  @apply rounded-2xl border shadow-sm flex flex-col;
  background: v-bind('theme.cardBg');
  color: v-bind('theme.cardText');
  border-color: v-bind('borderColor');
}

.module-head {
  @apply px-4 sm:px-5 py-4 border-b flex flex-wrap items-start justify-between gap-4;
  border-color: v-bind('borderColor');
}

.module-title {
  @apply text-lg font-semibold capitalize;
}

.module-subtitle {
  @apply text-sm;
  color: v-bind('subtext');
}

.module-filters {
  @apply flex items-end gap-3;
}

.module-filters--wrap {
  @apply flex-wrap;
}

.field-inline {
  @apply flex flex-col gap-1 min-w-[140px];
}

.field-inline--full {
  @apply w-full;
}

.field-label {
  @apply text-[11px] uppercase tracking-wide font-semibold;
  color: v-bind('subtext');
}

.field-select {
  @apply w-full rounded-lg border px-3 py-2 text-sm focus:outline-none;
  border-color: v-bind('borderColor');
  background: v-bind('theme.cardBg');
  color: v-bind('theme.cardText');
}

.field-select:focus {
  outline: none;
  border-color: v-bind(primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, v-bind(primary) 20%, transparent);
}

.icon-btn {
  @apply h-8 w-8 rounded-lg grid place-items-center text-sm font-semibold;
  border: 1px solid v-bind('borderColor');
  background: v-bind('chipBg');
  color: v-bind('theme.cardText');
  transition: filter 0.2s ease;
}

.icon-btn:hover {
  filter: brightness(0.95);
}

.module-body {
  @apply px-4 sm:px-5 py-4 flex-1 flex flex-col gap-4;
}

.module-body--simple {
  @apply justify-center items-center text-center;
}

.module-body--split {
  @apply gap-6 sm:flex-row flex-col sm:items-start;
}

.module-body--stacked {
  @apply gap-6;
}

.module-metrics {
  @apply grid gap-4 sm:grid-cols-2 lg:grid-cols-3;
}

.module-metrics--compact {
  @apply flex flex-wrap gap-6;
}

.metric {
  @apply flex flex-col gap-1;
}

.metric--stacked {
  @apply items-start;
}

.metric-label {
  @apply text-xs uppercase tracking-wide font-semibold;
  color: v-bind('subtext');
}

.metric-value {
  @apply text-3xl font-semibold tracking-tight;
}

.metric-caption {
  @apply text-sm;
  color: v-bind('subtext');
}

.metric-diff {
  @apply flex items-center gap-2;
}

.module-chart {
  @apply mt-2;
}

.module-table {
  @apply mt-2 overflow-hidden rounded-xl border;
  border-color: v-bind('borderColor');
}

.stat-list {
  @apply space-y-3 text-sm;
  color: v-bind('theme.cardText');
}

.stat-list li {
  @apply flex items-center justify-between;
}

.stat-list strong {
  @apply font-semibold;
}

.delta-badge {
  @apply inline-flex items-center justify-center px-2 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wide;
}

.delta-positive {
  background: rgba(16, 185, 129, 0.18);
  color: #047857;
}

.delta-negative {
  background: rgba(239, 68, 68, 0.18);
  color: #b91c1c;
}

.table-header {
  @apply text-left text-[11px] uppercase tracking-wide py-3 px-3;
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

@media (max-width: 640px) {
  .module-filters {
    @apply w-full flex-wrap;
  }

  .field-inline {
    @apply flex-1 min-w-[120px];
  }
}
</style>
