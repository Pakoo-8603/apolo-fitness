<template>
  <div class="space-y-8">
    <section class="grid gap-4 md:grid-cols-4">
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Dashboard
        <select v-model.number="selectedDashboardId" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <option v-for="item in dashboardOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Nombre
        <input v-model="editingDashboard.name" type="text" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
      </label>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Slug
        <input v-model="editingDashboard.slug" type="text" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
      </label>
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        <input v-model="editingDashboard.is_default" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
        Dashboard por defecto
      </label>
      <label class="md:col-span-4 flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Descripción
        <textarea v-model="editingDashboard.description" rows="2" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
      </label>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-100">Widgets disponibles</h2>
          <p class="text-xs text-slate-500">Arrastra widgets para reordenarlos. Selecciona uno para editar sus propiedades.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="definitionToAdd" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option disabled :value="null">Selecciona KPI</option>
            <option v-for="definition in availableDefinitions" :key="definition.id" :value="definition.id">{{ definition.name }}</option>
          </select>
          <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="handleAddWidget" :disabled="!definitionToAdd">Agregar widget</button>
        </div>
      </header>
      <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div class="min-h-[280px]">
          <Draggable v-model="editingWidgets" item-key="localKey" class="grid gap-4 auto-rows-[minmax(200px,auto)]" @end="reorderWidgets">
            <template #item="{ element }">
              <div :class="['rounded-xl border p-3 transition dark:border-slate-700 dark:bg-slate-900/60', element.localKey === selectedWidgetKey ? 'ring-2 ring-primary-500' : 'border-slate-200 bg-white/80']" @click="selectWidget(element.localKey)">
                <WidgetRenderer :model="widgetPreviewMap.get(element.localKey)" :loading="false" />
              </div>
            </template>
          </Draggable>
          <p v-if="!editingWidgets.length" class="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Aún no hay widgets en este dashboard.</p>
        </div>
        <aside v-if="selectedWidget" class="space-y-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-100">Propiedades del widget</h3>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            KPI asociado
            <select v-model.number="selectedWidget.definition_id" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" @change="handleDefinitionChange(selectedWidget)">
              <option v-for="definition in availableDefinitions" :key="definition.id" :value="definition.id">{{ definition.name }}</option>
            </select>
          </label>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Título
            <input v-model="selectedWidget.title" type="text" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </label>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Subtítulo
            <input v-model="selectedWidget.subtitle" type="text" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              Ancho (grid span)
              <input v-model.number="selectedWidget.size.w" type="number" min="1" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            </label>
            <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              Alto (filas)
              <input v-model.number="selectedWidget.size.h" type="number" min="1" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            </label>
          </div>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Visualización
            <select v-model="selectedWidget.options.visualization" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="kpi">KPI numérico</option>
              <option value="line">Línea</option>
              <option value="bar">Barras</option>
              <option value="pie">Donut</option>
              <option value="table">Tabla</option>
            </select>
          </label>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Rango temporal del widget
            <select v-model="selectedWidget.time_window_override" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="">Usar valor del KPI</option>
              <option v-for="option in timeWindowOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <div v-if="selectedWidget.time_window_override === 'custom'" class="grid grid-cols-2 gap-3">
            <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              Desde
              <input v-model="selectedWidget.custom_start_override" type="date" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            </label>
            <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
              Hasta
              <input v-model="selectedWidget.custom_end_override" type="date" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            </label>
          </div>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Opciones adicionales (JSON)
            <textarea v-model="selectedWidget._optionsText" @blur="commitWidgetOptions(selectedWidget)" rows="3" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            <span v-if="selectedWidget._optionsError" class="mt-1 text-xs text-rose-500">{{ selectedWidget._optionsError }}</span>
          </label>
          <WidgetFiltersEditor v-model="selectedWidget.filters" :fields="selectedWidgetFields" :aliases="selectedWidgetAliases" />
          <div class="flex justify-between">
            <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-rose-500 shadow-sm transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-600 dark:bg-slate-900 dark:text-rose-300" @click="removeWidget(selectedWidget.localKey)">Eliminar widget</button>
          </div>
        </aside>
      </div>
    </section>

    <section class="flex items-center justify-end gap-3">
      <button type="button" class="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="resetLayout">Descartar cambios</button>
      <button type="button" class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300" @click="save" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar dashboard' }}</button>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Draggable from 'vuedraggable'
import { useWorkspaceStore } from '@/stores/workspace'
import { useKpiStore } from '@/stores/kpis'
import { useKpiEngine } from '@/composables/useKpiEngine'
import WidgetRenderer from '@/components/kpis/WidgetRenderer.vue'
import WidgetFiltersEditor from '@/components/kpis/WidgetFiltersEditor.vue'
import { TIME_WINDOW_OPTIONS } from '@/mocks/kpiCatalog'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const workspace = useWorkspaceStore()
const kpiStore = useKpiStore()
const engine = useKpiEngine()
const uiStore = useUiStore()

const { empresaId } = storeToRefs(workspace)
const { dashboardsForActiveEmpresa, definitionsForActiveEmpresa, lastUpdated, activeDashboard } = storeToRefs(kpiStore)

const timeWindowOptions = TIME_WINDOW_OPTIONS
const selectedDashboardId = ref(route.params.id ? Number(route.params.id) : null)
const loadingDashboard = ref(false)

const editingDashboard = reactive({
  id: null,
  empresa_id: null,
  name: '',
  slug: '',
  description: '',
  is_default: false,
  layout: { columns: 12, rowHeight: 120 },
})

const editingWidgets = ref([])
const selectedWidgetKey = ref(null)
const definitionToAdd = ref(null)
const saving = ref(false)
let widgetSeq = 1

const dashboardOptions = computed(() => dashboardsForActiveEmpresa.value)

const definitionsMap = computed(() => kpiStore.definitionsById.value)
const metricsMap = computed(() => kpiStore.metricsById.value)
const definitionComponentsMap = computed(() => kpiStore.definitionComponents.value)

const availableDefinitions = computed(() => definitionsForActiveEmpresa.value.filter(definition => definition.empresa_id == null || Number(definition.empresa_id) === Number(editingDashboard.empresa_id)))

const selectedWidget = computed(() => editingWidgets.value.find(widget => widget.localKey === selectedWidgetKey.value) || null)

const selectedWidgetFields = computed(() => {
  const widget = selectedWidget.value
  if (!widget) return []
  const definition = definitionsMap.value[widget.definition_id]
  if (!definition) return []
  if (definition.calculation_type === 'metric') {
    const metric = metricsMap.value[definition.metric_id]
    if (!metric) return []
    return kpiStore.state.sourceFields.filter(field => Number(field.source_id) === Number(metric.source_id))
  }
  const components = definitionComponentsMap.value[definition.id] || []
  const sourceIds = new Set()
  components.forEach(component => {
    const metric = metricsMap.value[component.metric_id]
    if (metric) sourceIds.add(metric.source_id)
  })
  return kpiStore.state.sourceFields.filter(field => sourceIds.has(field.source_id))
})

const selectedWidgetAliases = computed(() => {
  const widget = selectedWidget.value
  if (!widget) return []
  const definition = definitionsMap.value[widget.definition_id]
  if (!definition) return []
  const components = definitionComponentsMap.value[definition.id] || []
  return components.map(component => component.alias)
})

const widgetPreviewMap = computed(() => {
  const map = new Map()
  for (const widget of editingWidgets.value) {
    const definition = definitionsMap.value[widget.definition_id]
    if (!definition) {
      map.set(widget.localKey, { widget, definition: null, summary: null, breakdown: [] })
      continue
    }
    const model = {
      widget,
      definition,
      metric: definition.calculation_type === 'metric' ? metricsMap.value[definition.metric_id] : null,
      components: definitionComponentsMap.value[definition.id] || [],
      filters: widget.filters,
    }
    const context = {}
    if (widget.time_window_override) context.timeWindow = widget.time_window_override
    map.set(widget.localKey, engine.resolveWidget(model, context))
  }
  return map
})

function toJSON (value) {
  try { return JSON.stringify(value || {}, null, 2) } catch (err) { return '{}' }
}

function hydrateDashboard (data) {
  editingDashboard.id = data?.id || null
  editingDashboard.empresa_id = data?.empresa_id ?? empresaId.value ?? null
  editingDashboard.name = data?.name || ''
  editingDashboard.slug = data?.slug || ''
  editingDashboard.description = data?.description || ''
  editingDashboard.is_default = !!data?.is_default
  editingDashboard.layout = data?.layout || { columns: 12, rowHeight: 120 }
}

function createWidgetModel (model) {
  const localKey = `widget-${model.id || `new-${widgetSeq++}`}`
  return {
    id: model.id || null,
    dashboard_id: model.dashboard_id || editingDashboard.id,
    definition_id: model.definition_id,
    title: model.title || '',
    subtitle: model.subtitle || '',
    order: model.order ?? editingWidgets.value.length + 1,
    size: { w: model.size?.w || 4, h: model.size?.h || 2 },
    position: { x: model.position?.x || 0, y: model.position?.y || 0 },
    time_window_override: model.time_window_override || '',
    custom_start_override: model.custom_start_override || '',
    custom_end_override: model.custom_end_override || '',
    options: { ...(model.options || {}) },
    filters: (model.filters || []).map(filter => ({ ...filter })),
    localKey,
    _optionsText: toJSON(model.options || {}),
    _optionsError: '',
  }
}

async function loadDashboard (overrideId = null) {
  if (loadingDashboard.value) return
  loadingDashboard.value = true
  try {
    await kpiStore.ensureHydrated()
    const target = overrideId ?? selectedDashboardId.value ?? activeDashboard.value?.id
    const data = await kpiStore.fetchDashboard({ dashboardId: target })
    if (!data?.dashboard) {
      hydrateDashboard({ id: null, empresa_id: empresaId.value })
      editingWidgets.value = []
      selectedWidgetKey.value = null
      return
    }
    hydrateDashboard(data.dashboard)
    editingWidgets.value = data.widgets.map(widget => createWidgetModel({ ...widget.widget, filters: widget.filters }))
    if (editingWidgets.value.length) {
      selectedWidgetKey.value = editingWidgets.value[0].localKey
    } else {
      selectedWidgetKey.value = null
    }
    if (data.dashboard.id && selectedDashboardId.value !== data.dashboard.id) {
      selectedDashboardId.value = data.dashboard.id
    }
  } finally {
    loadingDashboard.value = false
  }
}

function selectWidget (localKey) {
  selectedWidgetKey.value = localKey
}

function reorderWidgets () {
  editingWidgets.value.forEach((widget, index) => { widget.order = index + 1 })
}

function inferVisualization (definition) {
  if (!definition) return 'kpi'
  if (definition.calculation_type === 'metric') {
    return ['currency', 'percentage'].includes(definition.format_type) ? 'kpi' : 'line'
  }
  return 'kpi'
}

function handleAddWidget () {
  const definitionId = Number(definitionToAdd.value)
  if (!definitionId) return
  const definition = definitionsMap.value[definitionId]
  if (!definition) return
  const widget = createWidgetModel({
    id: null,
    dashboard_id: editingDashboard.id,
    definition_id: definition.id,
    title: definition.name,
    subtitle: '',
    order: editingWidgets.value.length + 1,
    size: { w: 4, h: 2 },
    position: { x: 0, y: 0 },
    time_window_override: '',
    custom_start_override: '',
    custom_end_override: '',
    options: { visualization: inferVisualization(definition) },
    filters: [],
  })
  editingWidgets.value.push(widget)
  selectedWidgetKey.value = widget.localKey
  definitionToAdd.value = null
}

function handleDefinitionChange (widget) {
  const definition = definitionsMap.value[widget.definition_id]
  if (!definition) return
  widget.filters = []
  widget.options = { visualization: inferVisualization(definition) }
  widget._optionsText = toJSON(widget.options)
  widget._optionsError = ''
}

function removeWidget (localKey) {
  const index = editingWidgets.value.findIndex(widget => widget.localKey === localKey)
  if (index >= 0) {
    editingWidgets.value.splice(index, 1)
    reorderWidgets()
    if (selectedWidgetKey.value === localKey) {
      selectedWidgetKey.value = editingWidgets.value[0]?.localKey || null
    }
  }
}

function commitWidgetOptions (widget) {
  try {
    widget.options = widget._optionsText.trim() ? JSON.parse(widget._optionsText) : {}
    widget._optionsError = ''
  } catch (err) {
    widget._optionsError = 'JSON inválido'
  }
}

async function resetLayout () {
  await loadDashboard()
}

async function save () {
  editingWidgets.value.forEach(widget => commitWidgetOptions(widget))
  if (editingWidgets.value.some(widget => widget._optionsError)) {
    uiStore.toast({ title: 'Revisa el JSON de opciones del widget seleccionado', type: 'error' })
    return
  }
  saving.value = true
  try {
    const dashboardPayload = { ...editingDashboard }
    dashboardPayload.empresa_id = dashboardPayload.empresa_id || empresaId.value
    const widgetsPayload = editingWidgets.value.map(widget => {
      const { localKey, _optionsText, _optionsError, ...rest } = widget
      const filters = widget.filters.map(filter => ({ ...filter }))
      const payload = { ...rest, filters }
      if (!payload.id) delete payload.id
      return payload
    })
    await kpiStore.saveDashboardLayout({ dashboard: dashboardPayload, widgets: widgetsPayload })
    uiStore.toast({ title: 'Dashboard guardado', type: 'success' })
    await loadDashboard()
  } catch (err) {
    console.error(err)
    uiStore.toast({ title: 'No fue posible guardar el dashboard', message: err.message, type: 'error' })
  } finally {
    saving.value = false
  }
}

watch(() => route.params.id, value => {
  if (value === undefined) return
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    if (numeric !== selectedDashboardId.value) {
      selectedDashboardId.value = numeric
    }
  } else if (!dashboardOptions.value.length) {
    selectedDashboardId.value = null
  }
})

watch(dashboardOptions, options => {
  if (!options.length) {
    selectedDashboardId.value = null
    hydrateDashboard({ id: null, empresa_id: empresaId.value })
    editingWidgets.value = []
    selectedWidgetKey.value = null
    return
  }
  const exists = options.some(option => option.id === selectedDashboardId.value)
  if (!exists) {
    selectedDashboardId.value = options[0].id
  }
})

watch(selectedDashboardId, async value => {
  if (!value) return
  if (Number(route.params.id) !== Number(value)) {
    await router.replace({ name: 'KpiDashboardEditor', params: { id: value } })
  }
  await loadDashboard(value)
})

watch(lastUpdated, async () => {
  await loadDashboard()
})

onMounted(async () => {
  if (!empresaId.value) await workspace.ensureEmpresaSet()
  await loadDashboard(selectedDashboardId.value)
})
</script>
