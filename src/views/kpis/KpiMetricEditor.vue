<template>
  <div class="space-y-8">
    <section class="grid gap-4 md:grid-cols-3">
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Código
        <input v-model="definitionForm.code" type="text" placeholder="kpi_ingresos" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
      </label>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Nombre
        <input v-model="definitionForm.name" type="text" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
      </label>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Tipo de cálculo
        <select v-model="definitionForm.calculation_type" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          <option v-for="option in calculationTypes" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="md:col-span-3 flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Descripción
        <textarea v-model="definitionForm.description" rows="2" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
      </label>
      <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        <input v-model="definitionForm.is_template" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
        Disponible como plantilla para otras empresas
      </label>
    </section>

    <section v-if="!isFormula" class="space-y-6">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-100">Configuración de métrica base</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Origen de datos
          <select v-model.number="metricForm.source_id" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option disabled value="">Selecciona origen</option>
            <option v-for="source in availableSources" :key="source.id" :value="source.id">{{ source.name }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Agregación
          <select v-model="metricForm.aggregation" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option v-for="option in aggregationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300" :class="{ 'opacity-50': aggregationWithoutField }">
          Campo numérico
          <select v-model.number="metricForm.value_field_id" :disabled="aggregationWithoutField" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option disabled value="">Selecciona campo</option>
            <option v-for="field in numericFields" :key="field.id" :value="field.id">{{ field.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Campo de fecha
          <select v-model.number="metricForm.date_field_id" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option disabled value="">Selecciona campo</option>
            <option v-for="field in dateFields" :key="field.id" :value="field.id">{{ field.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Ventana de tiempo
          <select v-model="metricForm.time_window" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option v-for="option in timeWindowOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <div v-if="metricForm.time_window === 'custom'" class="grid grid-cols-2 gap-3">
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Desde
            <input v-model="metricForm.custom_start" type="date" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </label>
          <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
            Hasta
            <input v-model="metricForm.custom_end" type="date" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
          </label>
        </div>
        <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input v-model="metricForm.compare_against_previous" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
          Comparar contra periodo anterior
        </label>
      </div>
      <MetricFiltersEditor v-model="filters" :fields="availableFields" />
      <MetricDimensionsEditor v-model="dimensions" :fields="availableFields" />
      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Orden de despliegue
          <input v-model.number="metricForm.order" type="number" min="0" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        </label>
        <label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input v-model="metricForm.is_template" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500">
          Métrica disponible como plantilla
        </label>
      </div>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Extra config (JSON)
        <textarea v-model="metricExtraConfigText" rows="3" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        <span v-if="metricExtraConfigError" class="mt-1 text-xs text-rose-500">{{ metricExtraConfigError }}</span>
      </label>
    </section>

    <section class="space-y-6">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-100">Definición del KPI</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300" v-if="!isFormula">
          Métrica base
          <select v-model.number="definitionForm.metric_id" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option disabled value="">Selecciona métrica</option>
            <option v-for="metric in ownedMetrics" :key="metric.id" :value="metric.id">{{ metric.name }}</option>
          </select>
        </label>
        <label v-else class="md:col-span-2 flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Expresión (usar alias definidos abajo)
          <textarea v-model="definitionForm.expression" rows="2" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Formato
          <select v-model="definitionForm.format_type" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option v-for="option in formatOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Métrica base de comparación
          <select v-model.number="definitionForm.baseline_metric_id" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="">Sin comparación</option>
            <option v-for="metric in ownedMetrics" :key="metric.id" :value="metric.id">{{ metric.name }}</option>
          </select>
        </label>
      </div>
      <div v-if="isFormula" class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-600 dark:text-slate-300">Componentes de la fórmula</h3>
        <div class="rounded-lg border border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60">
          <table class="w-full table-fixed text-sm text-slate-600 dark:text-slate-200">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
                <th class="p-3">Alias</th>
                <th class="p-3">Métrica</th>
                <th class="p-3 w-20">Orden</th>
                <th class="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="component in components" :key="component._localKey" class="border-t border-slate-100 dark:border-slate-800">
                <td class="p-3">
                  <input v-model="component.alias" type="text" placeholder="ingresos" class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                </td>
                <td class="p-3">
                  <select v-model.number="component.metric_id" class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                    <option disabled value="">Selecciona métrica</option>
                    <option v-for="metric in ownedMetrics" :key="metric.id" :value="metric.id">{{ metric.name }}</option>
                  </select>
                </td>
                <td class="p-3">
                  <input v-model.number="component.order" type="number" min="1" class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                </td>
                <td class="p-3 text-right">
                  <button type="button" class="text-xs text-rose-500 hover:underline" @click="removeComponent(component._localKey)">Quitar</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="border-t border-slate-200 p-3 text-right dark:border-slate-700">
            <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="addComponent">Agregar métrica</button>
          </div>
        </div>
      </div>
      <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
        Extra config (JSON)
        <textarea v-model="definitionExtraConfigText" rows="3" class="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        <span v-if="definitionExtraConfigError" class="mt-1 text-xs text-rose-500">{{ definitionExtraConfigError }}</span>
      </label>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <MetricPreviewCard
        :title="previewTitle"
        :description="definitionForm.description"
        :summary="previewData?.summary"
        :breakdown="previewData?.breakdown"
        :formatter="previewFormatter"
      />
      <div class="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <p class="font-semibold text-slate-700 dark:text-slate-200">Consejos</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Guarda la métrica para reutilizarla en otros dashboards.</li>
          <li>Para fórmulas, asegúrate de definir un alias único por componente.</li>
          <li>El dataset demo se actualiza en memoria; restáuralo desde el encabezado si necesitas volver al estado inicial.</li>
        </ul>
      </div>
    </section>

    <section class="flex items-center justify-end gap-3">
      <button type="button" class="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="resetForms">Descartar cambios</button>
      <button type="button" class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:bg-slate-300" @click="save" :disabled="saving">
        {{ saving ? 'Guardando…' : 'Guardar KPI' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspace'
import { useKpiStore } from '@/stores/kpis'
import { useKpiEngine } from '@/composables/useKpiEngine'
import MetricFiltersEditor from '@/components/kpis/MetricFiltersEditor.vue'
import MetricDimensionsEditor from '@/components/kpis/MetricDimensionsEditor.vue'
import MetricPreviewCard from '@/components/kpis/MetricPreviewCard.vue'
import { AGGREGATION_OPTIONS, TIME_WINDOW_OPTIONS, FORMAT_OPTIONS, CALCULATION_TYPES } from '@/mocks/kpiCatalog'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const workspace = useWorkspaceStore()
const kpiStore = useKpiStore()
const uiStore = useUiStore()
const engine = useKpiEngine()

const { empresaId } = storeToRefs(workspace)

const aggregationOptions = AGGREGATION_OPTIONS
const timeWindowOptions = TIME_WINDOW_OPTIONS
const formatOptions = FORMAT_OPTIONS
const calculationTypes = CALCULATION_TYPES

const metricForm = reactive({
  id: null,
  empresa_id: null,
  code: '',
  name: '',
  description: '',
  source_id: '',
  aggregation: 'sum',
  value_field_id: '',
  date_field_id: '',
  time_window: 'this_month',
  custom_start: '',
  custom_end: '',
  compare_against_previous: false,
  extra_config: {},
  order: 0,
  is_template: false,
})

const definitionForm = reactive({
  id: null,
  empresa_id: null,
  code: '',
  name: '',
  description: '',
  calculation_type: 'metric',
  metric_id: '',
  expression: '',
  format_type: 'value',
  baseline_metric_id: '',
  extra_config: {},
  is_template: false,
})

const filters = ref([])
const dimensions = ref([])
const components = ref([])

const metricExtraConfigText = ref('{}')
const definitionExtraConfigText = ref('{}')
const metricExtraConfigError = ref('')
const definitionExtraConfigError = ref('')
const saving = ref(false)

const isFormula = computed(() => definitionForm.calculation_type === 'formula')
const definitionIdParam = computed(() => route.params.id ? Number(route.params.id) : null)
const isEditing = computed(() => !!definitionIdParam.value)

const availableSources = computed(() => kpiStore.state.sources.filter(source => source.empresa_id == null || Number(source.empresa_id) === Number(empresaId.value)))
const availableFields = computed(() => kpiStore.state.sourceFields.filter(field => Number(field.source_id) === Number(metricForm.source_id)))
const numericFields = computed(() => availableFields.value.filter(field => field.field_type === 'numeric'))
const dateFields = computed(() => availableFields.value.filter(field => field.field_type === 'date'))
const ownedMetrics = computed(() => kpiStore.metricsForActiveEmpresa.value.filter(metric => metric.empresa_id == null || Number(metric.empresa_id) === Number(empresaId.value)))

const aggregationWithoutField = computed(() => metricForm.aggregation === 'count')

const previewContext = computed(() => {
  const ctx = { timeWindow: metricForm.time_window }
  if (metricForm.time_window === 'custom' && metricForm.custom_start && metricForm.custom_end) {
    ctx.customRange = { start: metricForm.custom_start, end: metricForm.custom_end }
  }
  return ctx
})

const previewData = computed(() => {
  if (isFormula.value) {
    if (!components.value.length || !definitionForm.expression) return null
    const model = {
      widget: { options: {} },
      definition: { ...definitionForm },
      metric: null,
      components: components.value.map(component => ({ ...component })),
      filters: [],
    }
    const result = engine.resolveWidget(model, previewContext.value)
    return { summary: result.summary, breakdown: result.breakdown }
  }
  if (!metricForm.source_id) return null
  const metric = { ...metricForm }
  metric.extra_config = metricForm.extra_config || {}
  const result = engine.resolveMetric(metric, { localFilters: filters.value, localDimensions: dimensions.value, context: previewContext.value })
  return {
    summary: {
      value: result.total,
      formattedValue: engine.formatValue(result.total, definitionForm.format_type, definitionForm.extra_config),
      deltaPct: result.deltaPct,
    },
    breakdown: result.breakdown,
  }
})

const previewTitle = computed(() => definitionForm.name || 'Vista previa')
const previewFormatter = value => engine.formatValue(value, definitionForm.format_type, definitionForm.extra_config)

function toJSONText (data) {
  try {
    return JSON.stringify(data || {}, null, 2)
  } catch (err) {
    return '{}'
  }
}

function hydrateFromBundle (bundle) {
  metricForm.id = bundle.metric?.id || null
  metricForm.empresa_id = bundle.metric?.empresa_id ?? empresaId.value ?? null
  metricForm.code = bundle.metric?.code || ''
  metricForm.name = bundle.metric?.name || ''
  metricForm.description = bundle.metric?.description || ''
  metricForm.source_id = bundle.metric?.source_id || ''
  metricForm.aggregation = bundle.metric?.aggregation || 'sum'
  metricForm.value_field_id = bundle.metric?.value_field_id || ''
  metricForm.date_field_id = bundle.metric?.date_field_id || ''
  metricForm.time_window = bundle.metric?.time_window || 'this_month'
  metricForm.custom_start = bundle.metric?.custom_start || ''
  metricForm.custom_end = bundle.metric?.custom_end || ''
  metricForm.compare_against_previous = !!bundle.metric?.compare_against_previous
  metricForm.extra_config = bundle.metric?.extra_config || {}
  metricForm.order = bundle.metric?.order || 0
  metricForm.is_template = !!bundle.metric?.is_template

  definitionForm.id = bundle.definition?.id || null
  definitionForm.empresa_id = bundle.definition?.empresa_id ?? empresaId.value ?? null
  definitionForm.code = bundle.definition?.code || ''
  definitionForm.name = bundle.definition?.name || ''
  definitionForm.description = bundle.definition?.description || ''
  definitionForm.calculation_type = bundle.definition?.calculation_type || 'metric'
  definitionForm.metric_id = bundle.definition?.metric_id || ''
  definitionForm.expression = bundle.definition?.expression || ''
  definitionForm.format_type = bundle.definition?.format_type || 'value'
  definitionForm.baseline_metric_id = bundle.definition?.baseline_metric_id || ''
  definitionForm.extra_config = bundle.definition?.extra_config || {}
  definitionForm.is_template = !!bundle.definition?.is_template

  filters.value = bundle.filters?.map(item => ({ ...item })) || []
  dimensions.value = bundle.dimensions?.map(item => ({ ...item })) || []
  components.value = bundle.components?.map(component => ({ ...component, _localKey: `component-${component.id || Math.random()}` })) || []

  metricExtraConfigText.value = toJSONText(metricForm.extra_config)
  definitionExtraConfigText.value = toJSONText(definitionForm.extra_config)
  metricExtraConfigError.value = ''
  definitionExtraConfigError.value = ''
}

function setDefaults () {
  metricForm.id = null
  metricForm.empresa_id = empresaId.value ?? null
  metricForm.code = ''
  metricForm.name = ''
  metricForm.description = ''
  metricForm.source_id = ''
  metricForm.aggregation = 'sum'
  metricForm.value_field_id = ''
  metricForm.date_field_id = ''
  metricForm.time_window = 'this_month'
  metricForm.custom_start = ''
  metricForm.custom_end = ''
  metricForm.compare_against_previous = false
  metricForm.extra_config = {}
  metricForm.order = 0
  metricForm.is_template = false

  definitionForm.id = null
  definitionForm.empresa_id = empresaId.value ?? null
  definitionForm.code = ''
  definitionForm.name = ''
  definitionForm.description = ''
  definitionForm.calculation_type = 'metric'
  definitionForm.metric_id = ''
  definitionForm.expression = ''
  definitionForm.format_type = 'value'
  definitionForm.baseline_metric_id = ''
  definitionForm.extra_config = {}
  definitionForm.is_template = false

  filters.value = []
  dimensions.value = []
  components.value = []

  metricExtraConfigText.value = '{}'
  definitionExtraConfigText.value = '{}'
  metricExtraConfigError.value = ''
  definitionExtraConfigError.value = ''
}

watch(metricExtraConfigText, text => {
  try {
    metricForm.extra_config = text.trim() ? JSON.parse(text) : {}
    metricExtraConfigError.value = ''
  } catch (err) {
    metricExtraConfigError.value = 'JSON inválido'
  }
})

watch(definitionExtraConfigText, text => {
  try {
    definitionForm.extra_config = text.trim() ? JSON.parse(text) : {}
    definitionExtraConfigError.value = ''
  } catch (err) {
    definitionExtraConfigError.value = 'JSON inválido'
  }
})

watch(() => metricForm.aggregation, aggregation => {
  if (aggregation === 'count') metricForm.value_field_id = ''
})

watch(() => metricForm.source_id, () => {
  const fieldIds = new Set(availableFields.value.map(field => field.id))
  if (!fieldIds.has(metricForm.value_field_id)) metricForm.value_field_id = ''
  if (!fieldIds.has(metricForm.date_field_id)) metricForm.date_field_id = ''
  filters.value = filters.value.filter(filter => fieldIds.has(filter.field_id))
  dimensions.value = dimensions.value.filter(dimension => fieldIds.has(dimension.field_id))
})

let componentSeq = 1

watch(() => definitionForm.calculation_type, type => {
  if (type === 'metric') {
    definitionForm.expression = ''
    definitionForm.metric_id = definitionForm.metric_id || metricForm.id || ''
    components.value = []
  } else {
    definitionForm.metric_id = ''
  }
})

function addComponent () {
  components.value.push({
    id: null,
    definition_id: definitionForm.id,
    metric_id: '',
    alias: `alias_${componentSeq}`,
    order: components.value.length + 1,
    _localKey: `component-${Date.now()}-${componentSeq++}`,
  })
}

function removeComponent (key) {
  const index = components.value.findIndex(component => component._localKey === key)
  if (index >= 0) {
    components.value.splice(index, 1)
    components.value.forEach((component, idx) => { component.order = idx + 1 })
  }
}

async function loadData () {
  await kpiStore.ensureHydrated()
  if (definitionIdParam.value) {
    const bundle = kpiStore.composeMetricBundle(definitionIdParam.value)
    if (bundle) {
      hydrateFromBundle(bundle)
    }
  } else {
    setDefaults()
  }
}

function resetForms () {
  if (definitionIdParam.value) {
    const bundle = kpiStore.composeMetricBundle(definitionIdParam.value)
    if (bundle) hydrateFromBundle(bundle)
  } else {
    setDefaults()
  }
}

function parseTextConfig (text) {
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error('JSON inválido')
  }
}

function validateForms () {
  if (!definitionForm.code.trim()) return 'El código del KPI es obligatorio'
  if (!definitionForm.name.trim()) return 'El nombre del KPI es obligatorio'

  if (!isFormula.value) {
    if (!metricForm.source_id) return 'Selecciona el origen de datos para la métrica'
    if (metricForm.aggregation !== 'count' && !metricForm.value_field_id) {
      return 'Selecciona el campo numérico que se agregará'
    }
    if (metricForm.time_window !== 'all_time' && !metricForm.date_field_id) {
      return 'Selecciona el campo de fecha para la métrica'
    }
    if (metricForm.time_window === 'custom') {
      if (!metricForm.custom_start || !metricForm.custom_end) {
        return 'Completa el rango personalizado de fechas'
      }
      if (metricForm.custom_start > metricForm.custom_end) {
        return 'La fecha inicial debe ser menor o igual a la final'
      }
    }
    if (!definitionForm.metric_id && metricForm.id) {
      return 'Selecciona la métrica base que utilizará el KPI'
    }
  } else {
    if (!definitionForm.expression.trim()) {
      return 'Define la expresión de la fórmula'
    }
    if (!components.value.length) {
      return 'Agrega al menos una métrica a la fórmula'
    }
    const aliases = new Set()
    for (const component of components.value) {
      if (!component.metric_id) {
        return 'Cada componente de la fórmula debe apuntar a una métrica válida'
      }
      const alias = (component.alias || '').trim()
      if (!alias) {
        return 'Cada componente de la fórmula necesita un alias'
      }
      const normalized = alias.toLowerCase()
      if (aliases.has(normalized)) {
        return 'Los alias de la fórmula deben ser únicos'
      }
      aliases.add(normalized)
    }
  }

  if (metricExtraConfigError.value) return 'Corrige el JSON de configuración de la métrica'
  if (definitionExtraConfigError.value) return 'Corrige el JSON de configuración del KPI'

  return null
}

async function save () {
  if (!empresaId.value) {
    uiStore.toast({ title: 'Selecciona una empresa para guardar el KPI', type: 'error' })
    return
  }
  const validationMessage = validateForms()
  if (validationMessage) {
    uiStore.toast({ title: validationMessage, type: 'error' })
    return
  }
  saving.value = true
  try {
    const metricPayload = { ...metricForm }
    metricPayload.empresa_id = empresaId.value
    metricPayload.extra_config = parseTextConfig(metricExtraConfigText.value)
    if (metricPayload.aggregation === 'count') {
      metricPayload.value_field_id = null
    }
    if (!metricPayload.value_field_id) metricPayload.value_field_id = null
    if (!metricPayload.date_field_id) metricPayload.date_field_id = null
    if (metricPayload.time_window !== 'custom') {
      metricPayload.custom_start = null
      metricPayload.custom_end = null
    } else {
      metricPayload.custom_start = metricPayload.custom_start || null
      metricPayload.custom_end = metricPayload.custom_end || null
    }

    const definitionPayload = { ...definitionForm }
    definitionPayload.empresa_id = empresaId.value
    definitionPayload.extra_config = parseTextConfig(definitionExtraConfigText.value)
    if (!isFormula.value) {
      definitionPayload.expression = ''
    } else {
      definitionPayload.metric_id = null
    }
    if (!definitionPayload.metric_id) {
      definitionPayload.metric_id = definitionPayload.metric_id || null
    }
    if (!definitionPayload.baseline_metric_id) {
      definitionPayload.baseline_metric_id = null
    }

    const payload = {
      metric: metricPayload,
      filters: filters.value.map(filter => ({ ...filter })),
      dimensions: dimensions.value.map(dimension => ({ ...dimension })),
      definition: definitionPayload,
      components: isFormula.value ? components.value.map(component => ({ id: component.id || null, definition_id: definitionPayload.id, metric_id: component.metric_id, alias: component.alias, order: component.order })) : [],
    }

    const result = await kpiStore.saveMetricBundle(payload)
    uiStore.toast({ title: 'KPI guardado correctamente', type: 'success' })
    if (!isEditing.value && result?.definitionId) {
      router.replace({ name: 'KpiMetricEditor', params: { id: result.definitionId } })
    }
    await loadData()
  } catch (err) {
    console.error(err)
    uiStore.toast({ title: 'No fue posible guardar el KPI', message: err.message, type: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!empresaId.value) await workspace.ensureEmpresaSet()
  await loadData()
})
</script>
