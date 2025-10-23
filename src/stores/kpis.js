import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { kpiMock } from '@/api/kpiMock'
import { useWorkspaceStore } from './workspace'

const COLLECTIONS = [
  'sources',
  'sourceFields',
  'metrics',
  'metricFilters',
  'metricDimensions',
  'definitions',
  'definitionMetrics',
  'dashboards',
  'widgets',
  'widgetFilters',
]

function createEmptyState () {
  return {
    sources: [],
    sourceFields: [],
    metrics: [],
    metricFilters: [],
    metricDimensions: [],
    definitions: [],
    definitionMetrics: [],
    dashboards: [],
    widgets: [],
    widgetFilters: [],
    sourceSamples: {},
    generatedAt: null,
  }
}

function mapBy (items, key = 'id') {
  const record = {}
  for (const item of items) {
    record[item[key]] = item
  }
  return record
}

function groupBy (items, key) {
  const groups = {}
  for (const item of items) {
    const groupKey = item[key]
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
  }
  return groups
}

async function snapshotDataset () {
  const { data } = await kpiMock.getAll()
  return data
}

export const useKpiStore = defineStore('kpis', () => {
  const workspace = useWorkspaceStore()

  const state = reactive(createEmptyState())
  const ready = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(0)

  const history = reactive({ past: [], future: [] })
  const maxHistory = 25

  function applyDataset (dataset) {
    for (const collection of COLLECTIONS) {
      state[collection] = Array.isArray(dataset[collection]) ? dataset[collection] : []
    }
    state.sourceSamples = dataset.sourceSamples || {}
    state.generatedAt = dataset.generated_at || null
    lastUpdated.value = Date.now()
  }

  async function hydrate () {
    loading.value = true
    try {
      const dataset = await snapshotDataset()
      applyDataset(dataset)
      ready.value = true
      error.value = null
    } catch (err) {
      console.error('[kpiStore] No fue posible cargar el dataset de KPIs', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function ensureHydrated () {
    if (ready.value || loading.value) return
    await hydrate()
  }

  async function withHistory (label, mutator) {
    const before = await snapshotDataset()
    history.past.push({ label, data: before })
    if (history.past.length > maxHistory) history.past.shift()
    history.future.length = 0
    try {
      const result = await mutator()
      await hydrate()
      return result
    } catch (err) {
      history.past.pop()
      throw err
    }
  }

  async function undo () {
    if (!history.past.length) return false
    const previous = history.past.pop()
    const current = await snapshotDataset()
    history.future.push({ label: previous.label, data: current })
    await kpiMock.replaceAll(previous.data)
    await hydrate()
    return true
  }

  async function redo () {
    if (!history.future.length) return false
    const next = history.future.pop()
    const current = await snapshotDataset()
    history.past.push({ label: next.label, data: current })
    await kpiMock.replaceAll(next.data)
    await hydrate()
    return true
  }

  function isTemplate (record) {
    return record?.is_template || record?.empresa_id == null
  }

  const activeEmpresaId = computed(() => workspace.empresaId || null)

  const sourcesById = computed(() => mapBy(state.sources))
  const fieldsById = computed(() => mapBy(state.sourceFields))
  const metricsById = computed(() => mapBy(state.metrics))
  const definitionsById = computed(() => mapBy(state.definitions))
  const dashboardsById = computed(() => mapBy(state.dashboards))
  const generatedAt = computed(() => (state.generatedAt ? new Date(state.generatedAt) : null))

  const definitionComponents = computed(() => groupBy(state.definitionMetrics, 'definition_id'))
  const metricFiltersByMetric = computed(() => groupBy(state.metricFilters, 'metric_id'))
  const metricDimensionsByMetric = computed(() => groupBy(state.metricDimensions, 'metric_id'))
  const widgetsByDashboard = computed(() => {
    const groups = groupBy(state.widgets, 'dashboard_id')
    for (const key of Object.keys(groups)) {
      groups[key] = groups[key].slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return groups
  })
  const widgetFiltersByWidget = computed(() => groupBy(state.widgetFilters, 'widget_id'))

  const metricsForActiveEmpresa = computed(() => {
    const empresaId = activeEmpresaId.value
    return state.metrics.filter(metric => {
      if (empresaId == null) return true
      if (Number(metric.empresa_id) === Number(empresaId)) return true
      return metric.empresa_id == null && isTemplate(metric)
    })
  })

  const definitionsForActiveEmpresa = computed(() => {
    const empresaId = activeEmpresaId.value
    return state.definitions.filter(definition => {
      if (empresaId == null) return true
      if (Number(definition.empresa_id) === Number(empresaId)) return true
      return definition.empresa_id == null && isTemplate(definition)
    })
  })

  const dashboardsForActiveEmpresa = computed(() => {
    const empresaId = activeEmpresaId.value
    return state.dashboards.filter(dashboard => {
      if (empresaId == null) return true
      return Number(dashboard.empresa_id) === Number(empresaId)
    }).sort((a, b) => a.name.localeCompare(b.name))
  })

  const dashboardTemplates = computed(() => state.dashboards.filter(d => d.empresa_id == null))

  const activeDashboard = computed(() => {
    const empresaId = activeEmpresaId.value
    if (!empresaId) return dashboardsForActiveEmpresa.value[0] || null
    const preferred = dashboardsForActiveEmpresa.value.find(d => d.is_default)
    return preferred || dashboardsForActiveEmpresa.value[0] || null
  })

  function composeWidgetModel (widget) {
    const definition = definitionsById.value[widget.definition_id]
    const metric = definition?.metric_id ? metricsById.value[definition.metric_id] : null
    const components = definitionComponents.value[definition?.id] || []
    const filters = widgetFiltersByWidget.value[widget.id] || []
    return { widget, definition, metric, components, filters }
  }

  function composeMetricBundle (definitionId) {
    const definition = definitionsById.value[definitionId]
    if (!definition) return null
    const metric = definition.metric_id ? metricsById.value[definition.metric_id] : null
    const metricId = metric?.id
    return {
      definition,
      metric,
      filters: metricId ? (metricFiltersByMetric.value[metricId] || []) : [],
      dimensions: metricId ? (metricDimensionsByMetric.value[metricId] || []) : [],
      components: definitionComponents.value[definition.id] || [],
    }
  }

  async function persistMetricFilters (metricId, filters = []) {
    const existing = state.metricFilters.filter(filter => filter.metric_id === metricId)
    const retained = []
    for (const filter of filters) {
      if (filter.id) {
        await kpiMock.metricFilters.update(filter.id, { ...filter, metric_id: metricId })
        retained.push(filter.id)
      } else {
        const { data } = await kpiMock.metricFilters.create({ ...filter, metric_id: metricId })
        retained.push(data.id)
      }
    }
    for (const filter of existing) {
      if (!retained.includes(filter.id)) {
        await kpiMock.metricFilters.delete(filter.id)
      }
    }
  }

  async function persistMetricDimensions (metricId, dimensions = []) {
    const existing = state.metricDimensions.filter(dimension => dimension.metric_id === metricId)
    const retained = []
    for (const dimension of dimensions) {
      if (dimension.id) {
        await kpiMock.metricDimensions.update(dimension.id, { ...dimension, metric_id: metricId })
        retained.push(dimension.id)
      } else {
        const { data } = await kpiMock.metricDimensions.create({ ...dimension, metric_id: metricId })
        retained.push(data.id)
      }
    }
    for (const dimension of existing) {
      if (!retained.includes(dimension.id)) {
        await kpiMock.metricDimensions.delete(dimension.id)
      }
    }
  }

  async function persistDefinitionComponents (definitionId, components = []) {
    const existing = state.definitionMetrics.filter(component => component.definition_id === definitionId)
    const retained = []
    for (const component of components) {
      if (component.id) {
        await kpiMock.definitionMetrics.update(component.id, { ...component, definition_id: definitionId })
        retained.push(component.id)
      } else {
        const { data } = await kpiMock.definitionMetrics.create({ ...component, definition_id: definitionId })
        retained.push(data.id)
      }
    }
    for (const component of existing) {
      if (!retained.includes(component.id)) {
        await kpiMock.definitionMetrics.delete(component.id)
      }
    }
  }

  async function persistWidgetFilters (widgetId, filters = []) {
    const existing = state.widgetFilters.filter(filter => filter.widget_id === widgetId)
    const retained = []
    for (const filter of filters) {
      if (filter.id) {
        await kpiMock.widgetFilters.update(filter.id, { ...filter, widget_id: widgetId })
        retained.push(filter.id)
      } else {
        const { data } = await kpiMock.widgetFilters.create({ ...filter, widget_id: widgetId })
        retained.push(data.id)
      }
    }
    for (const filter of existing) {
      if (!retained.includes(filter.id)) {
        await kpiMock.widgetFilters.delete(filter.id)
      }
    }
  }

  async function persistWidget (payload) {
    const { filters = [], ...widgetData } = payload
    let widgetId = widgetData.id || null
    if (widgetId) {
      await kpiMock.widgets.update(widgetId, widgetData)
    } else {
      const { data } = await kpiMock.widgets.create(widgetData)
      widgetId = data.id
    }
    await persistWidgetFilters(widgetId, filters)
    return widgetId
  }

  async function saveWidget (payload) {
    return withHistory('widget', async () => {
      const widgetId = await persistWidget(payload)
      return { widgetId }
    })
  }

  async function deleteWidget (widgetId) {
    return withHistory('widget:delete', async () => {
      await kpiMock.widgets.delete(widgetId)
    })
  }

  async function saveDashboardLayout ({ dashboard, widgets }) {
    return withHistory('dashboard', async () => {
      let dashboardId = dashboard.id || null
      if (dashboardId) {
        await kpiMock.dashboards.update(dashboardId, dashboard)
      } else {
        const { data } = await kpiMock.dashboards.create(dashboard)
        dashboardId = data.id
      }
      const existingWidgets = state.widgets.filter(widget => widget.dashboard_id === dashboardId)
      const retained = []
      for (const widget of widgets) {
        const widgetPayload = { ...widget, dashboard_id: dashboardId }
        const persistedId = await persistWidget(widgetPayload)
        retained.push(persistedId)
      }
      for (const widget of existingWidgets) {
        if (!retained.includes(widget.id)) {
          await kpiMock.widgets.delete(widget.id)
        }
      }
      return { dashboardId }
    })
  }

  async function saveMetricBundle ({ metric, filters = [], dimensions = [], definition, components = [] }) {
    return withHistory('metric', async () => {
      let metricId = metric?.id || null
      const metricPayload = { ...metric }
      if (metricId) {
        await kpiMock.metrics.update(metricId, metricPayload)
      } else {
        const { data } = await kpiMock.metrics.create(metricPayload)
        metricId = data.id
      }
      await persistMetricFilters(metricId, filters)
      await persistMetricDimensions(metricId, dimensions)

      const definitionPayload = { ...definition }
      if (definitionPayload.calculation_type === 'metric') {
        definitionPayload.metric_id = metricId
      }
      let definitionId = definitionPayload.id || null
      if (definitionId) {
        await kpiMock.definitions.update(definitionId, definitionPayload)
      } else {
        const { data } = await kpiMock.definitions.create(definitionPayload)
        definitionId = data.id
      }

      if (definitionPayload.calculation_type === 'formula') {
        await persistDefinitionComponents(definitionId, components)
      } else {
        await persistDefinitionComponents(definitionId, [])
      }

      return { metricId, definitionId }
    })
  }

  async function fetchDashboard ({ dashboardId = null, slug = null } = {}) {
    await ensureHydrated()
    const empresaId = activeEmpresaId.value
    const dashboards = dashboardsForActiveEmpresa.value
    let dashboard = null
    if (dashboardId) {
      dashboard = dashboards.find(d => Number(d.id) === Number(dashboardId)) || null
    }
    if (!dashboard && slug) {
      dashboard = dashboards.find(d => d.slug === slug) || null
    }
    if (!dashboard) {
      dashboard = dashboards.find(d => d.is_default) || dashboards[0] || null
    }
    if (!dashboard && dashboardTemplates.value.length) {
      dashboard = dashboardTemplates.value[0]
    }
    if (!dashboard) return null
    const widgets = (widgetsByDashboard.value[dashboard.id] || []).map(composeWidgetModel)
    return { dashboard, widgets, empresaId }
  }

  async function restoreSeedDataset () {
    history.past.length = 0
    history.future.length = 0
    await kpiMock.reset()
    await hydrate()
  }

  return {
    // state
    state,
    ready,
    loading,
    error,
    lastUpdated,
    history,
    generatedAt,

    // getters
    activeEmpresaId,
    sourcesById,
    fieldsById,
    metricsById,
    definitionsById,
    dashboardsById,
    definitionComponents,
    metricFiltersByMetric,
    metricDimensionsByMetric,
    widgetsByDashboard,
    widgetFiltersByWidget,
    metricsForActiveEmpresa,
    definitionsForActiveEmpresa,
    dashboardsForActiveEmpresa,
    dashboardTemplates,
    activeDashboard,
    composeWidgetModel,
    composeMetricBundle,

    // actions
    hydrate,
    ensureHydrated,
    withHistory,
    undo,
    redo,
    saveMetricBundle,
    saveDashboardLayout,
    saveWidget,
    deleteWidget,
    fetchDashboard,
    restoreSeedDataset,
  }
})
