<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-4">
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Dashboard
        <select v-model.number="selectedDashboardId" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <option v-for="dashboard in dashboards" :key="dashboard.id" :value="dashboard.id">{{ dashboard.name }}</option>
        </select>
      </label>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Rango temporal
        <select v-model="selectedTimeWindow" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <option v-for="option in timeWindowOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <div v-if="selectedTimeWindow === 'custom'" class="flex flex-col gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        <span>Rango personalizado</span>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="customRange.start" type="date" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <input v-model="customRange.end" type="date" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        </div>
      </div>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Sucursal
        <select v-model="selectedSucursal" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <option value="">Todas</option>
          <option v-for="sucursal in sucursales" :key="sucursal.id" :value="sucursal.nombre">{{ sucursal.nombre }}</option>
        </select>
      </label>
    </section>

    <section v-if="loading" class="py-24 text-center text-sm text-slate-500">Cargando dashboard…</section>
    <section v-else-if="!dashboard" class="py-24 text-center text-sm text-slate-500">No hay dashboards configurados para esta empresa.</section>
    <section v-else class="grid gap-4" :style="gridTemplateStyle">
      <WidgetRenderer
        v-for="card in widgetResults"
        :key="card.output.widget.id"
        :model="card.output"
        :loading="false"
        :style="card.layout"
        class="min-h-[200px]"
      />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspace'
import { useKpiStore } from '@/stores/kpis'
import { useKpiEngine } from '@/composables/useKpiEngine'
import WidgetRenderer from '@/components/kpis/WidgetRenderer.vue'
import { TIME_WINDOW_OPTIONS } from '@/mocks/kpiCatalog'

const workspace = useWorkspaceStore()
const kpiStore = useKpiStore()
const engine = useKpiEngine()

const { dashboardsForActiveEmpresa, lastUpdated, activeDashboard, generatedAt } = storeToRefs(kpiStore)
const { sucursales } = storeToRefs(workspace)

const selectedDashboardId = ref(null)
const selectedTimeWindow = ref('this_month')
const customRange = ref({ start: '', end: '' })
const selectedSucursal = ref('')

const dashboard = ref(null)
const widgetModels = ref([])
const loading = ref(true)
const initialized = ref(false)

const dashboards = computed(() => dashboardsForActiveEmpresa.value)
const timeWindowOptions = TIME_WINDOW_OPTIONS

const gridTemplateStyle = computed(() => {
  const columns = dashboard.value?.layout?.columns || 12
  const rowHeight = dashboard.value?.layout?.rowHeight || 180
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridAutoRows: `minmax(${rowHeight}px, auto)`,
  }
})

const context = computed(() => {
  const ctx = { timeWindow: selectedTimeWindow.value }
  if (generatedAt.value instanceof Date && !Number.isNaN(generatedAt.value.getTime())) {
    ctx.now = generatedAt.value
  }
  if (selectedTimeWindow.value === 'custom' && customRange.value.start && customRange.value.end) {
    ctx.customRange = { start: customRange.value.start, end: customRange.value.end }
  }
  if (selectedSucursal.value) ctx.sucursal = selectedSucursal.value
  return ctx
})

function styleForWidget (widget) {
  if (!widget) return {}
  const columns = dashboard.value?.layout?.columns || 12
  const rowHeight = dashboard.value?.layout?.rowHeight || 180
  const width = Math.max(1, Math.min(widget.size?.w ?? Math.ceil(columns / 3), columns))
  const height = Math.max(1, widget.size?.h ?? 1)
  const startX = Math.min(columns, (widget.position?.x ?? 0) + 1)
  const availableSpan = Math.max(1, columns - startX + 1)
  const spanX = Math.min(width, availableSpan)
  const startY = Math.max(1, (widget.position?.y ?? 0) + 1)
  return {
    gridColumn: `${startX} / span ${spanX}`,
    gridRow: `${startY} / span ${height}`,
    minHeight: `${rowHeight * height}px`,
  }
}

const widgetResults = computed(() => widgetModels.value.map(model => ({
  output: engine.resolveWidget(model, context.value),
  layout: styleForWidget(model.widget),
})))

async function loadDashboard () {
  if (!initialized.value) return
  loading.value = true
  const targetId = selectedDashboardId.value || activeDashboard.value?.id
  const data = await kpiStore.fetchDashboard({ dashboardId: targetId })
  dashboard.value = data?.dashboard || null
  widgetModels.value = data?.widgets || []
  if (!selectedDashboardId.value && dashboard.value) {
    selectedDashboardId.value = dashboard.value.id
  }
  loading.value = false
}

watch(selectedDashboardId, async () => {
  await loadDashboard()
})

watch(lastUpdated, async () => {
  await loadDashboard()
})

watch(dashboards, (items) => {
  if (!items.length) {
    selectedDashboardId.value = null
    dashboard.value = null
    widgetModels.value = []
    return
  }
  const exists = items.some(item => item.id === selectedDashboardId.value)
  if (!exists) {
    selectedDashboardId.value = items[0].id
  }
})

onMounted(async () => {
  await workspace.ensureEmpresaSet()
  await kpiStore.ensureHydrated()
  if (!selectedDashboardId.value && activeDashboard.value) {
    selectedDashboardId.value = activeDashboard.value.id
  }
  initialized.value = true
  await loadDashboard()
})
</script>
