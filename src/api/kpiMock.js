import { buildSeedData, KPI_STORAGE_KEY } from '@/mocks/kpiData'

const COLLECTION_KEYS = [
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

const LATENCY_RANGE = [120, 260]
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
const persistenceFlag = typeof import.meta !== 'undefined' &&
  import.meta?.env?.VITE_KPI_PERSISTENCE === 'true'
const usePersistence = isBrowser && persistenceFlag

if (isBrowser && !usePersistence) {
  try {
    window.localStorage.removeItem(KPI_STORAGE_KEY)
  } catch (err) {
    console.warn('[kpiMock] No se pudo limpiar localStorage:', err)
  }
}

let database = (usePersistence && loadFromStorage()) || buildSeedData()
let sequences = computeSequences(database)

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function randomLatency () {
  const [min, max] = LATENCY_RANGE
  return Math.floor(Math.random() * (max - min)) + min
}

function withLatency (payload) {
  return new Promise(resolve => setTimeout(() => resolve(payload), randomLatency()))
}

function loadFromStorage () {
  if (!usePersistence) return null
  try {
    const raw = window.localStorage.getItem(KPI_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (err) {
    console.warn('[kpiMock] No se pudo leer localStorage:', err)
    return null
  }
}

function persist () {
  if (!usePersistence) return
  try {
    window.localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(database))
  } catch (err) {
    console.warn('[kpiMock] No se pudo persistir dataset en localStorage:', err)
  }
}

function computeSequences (data) {
  const seq = {}
  for (const key of COLLECTION_KEYS) {
    const items = data[key] || []
    const next = items.reduce((acc, item) => Math.max(acc, Number(item.id) || 0), 0) + 1
    seq[key] = next
  }
  return seq
}

function nextId (collection) {
  const value = sequences[collection] || 1
  sequences[collection] = value + 1
  return value
}

function assert (condition, message) {
  if (!condition) throw new Error(`[kpiMock] ${message}`)
}

function getCollection (collection) {
  assert(COLLECTION_KEYS.includes(collection), `Colección desconocida: ${collection}`)
  if (!database[collection]) database[collection] = []
  return database[collection]
}

function findById (collection, id) {
  const items = getCollection(collection)
  return items.find(item => Number(item.id) === Number(id)) || null
}

function ensureUnique (collection, predicate, message, ignoreId = null) {
  const items = getCollection(collection)
  const exists = items.some(item => {
    if (ignoreId && Number(item.id) === Number(ignoreId)) return false
    return predicate(item)
  })
  assert(!exists, message)
}

function validateMetric (record, { ignoreId } = {}) {
  const source = findById('sources', record.source_id)
  assert(source, 'El origen seleccionado no existe')
  if (source.empresa_id && source.empresa_id !== record.empresa_id) {
    throw new Error('[kpiMock] El origen de datos pertenece a otra empresa')
  }

  if (record.code) {
    ensureUnique(
      'metrics',
      other => other.code === record.code && other.empresa_id === record.empresa_id,
      'El código de la métrica ya está en uso para la empresa',
      ignoreId,
    )
  }

  if (record.value_field_id) {
    const valueField = findById('sourceFields', record.value_field_id)
    assert(valueField, 'El campo numérico no existe')
    assert(valueField.source_id === record.source_id, 'El campo numérico pertenece a otro origen')
    assert(valueField.field_type === 'numeric', 'El campo seleccionado debe ser numérico')
  }

  if (record.date_field_id) {
    const dateField = findById('sourceFields', record.date_field_id)
    assert(dateField, 'El campo de fecha no existe')
    assert(dateField.source_id === record.source_id, 'El campo de fecha pertenece a otro origen')
    assert(dateField.field_type === 'date', 'El campo seleccionado debe ser de tipo fecha')
  }

  if (record.aggregation === 'count') {
    assert(!record.value_field_id, 'COUNT no requiere campo numérico específico')
  } else if (record.aggregation === 'distinct_count') {
    assert(!!record.value_field_id, 'DISTINCT COUNT requiere un campo numérico/dimensional')
  } else {
    assert(!!record.value_field_id, 'Debes seleccionar el campo numérico a agregar')
  }

  if (record.time_window === 'custom') {
    assert(record.custom_start && record.custom_end, 'Las fechas personalizadas son obligatorias para rango custom')
    assert(new Date(record.custom_start) <= new Date(record.custom_end), 'La fecha inicial debe ser menor o igual a la final')
  } else {
    assert(!record.custom_start && !record.custom_end, 'Las fechas personalizadas solo aplican en rango custom')
  }
}

function validateDefinition (record, { ignoreId } = {}) {
  if (record.code) {
    ensureUnique(
      'definitions',
      other => other.code === record.code && other.empresa_id === record.empresa_id,
      'El código del KPI ya está en uso para la empresa',
      ignoreId,
    )
  }
  if (record.calculation_type === 'metric') {
    assert(record.metric_id, 'Debes seleccionar la métrica principal')
  } else {
    assert(record.expression, 'Debes definir la expresión de la fórmula')
    assert(!record.metric_id, 'Las fórmulas no deben tener métrica directa asociada')
  }
  if (record.metric_id) {
    const metric = findById('metrics', record.metric_id)
    assert(metric, 'La métrica vinculada no existe')
    assert(metric.empresa_id === record.empresa_id, 'La métrica debe pertenecer a la misma empresa')
  }
  if (record.baseline_metric_id) {
    const baseline = findById('metrics', record.baseline_metric_id)
    assert(baseline, 'La métrica de referencia no existe')
    assert(baseline.empresa_id === record.empresa_id, 'La métrica de referencia debe pertenecer a la empresa')
  }
}

function validateDashboard (record, { ignoreId } = {}) {
  if (record.slug) {
    ensureUnique(
      'dashboards',
      other => other.slug === record.slug && other.empresa_id === record.empresa_id,
      'El slug del dashboard ya existe para la empresa',
      ignoreId,
    )
  }
}

function validateWidget (record) {
  const dashboard = findById('dashboards', record.dashboard_id)
  assert(dashboard, 'El dashboard no existe')
  const definition = findById('definitions', record.definition_id)
  assert(definition, 'El KPI asociado no existe')
  if (dashboard.empresa_id !== definition.empresa_id) {
    throw new Error('[kpiMock] El KPI debe pertenecer a la misma empresa que el dashboard')
  }
}

const validators = {
  metrics: validateMetric,
  definitions: validateDefinition,
  dashboards: validateDashboard,
  widgets: validateWidget,
}

const cascadeBeforeDelete = {
  metrics: (metric) => {
    database.metricFilters = getCollection('metricFilters').filter(item => item.metric_id !== metric.id)
    database.metricDimensions = getCollection('metricDimensions').filter(item => item.metric_id !== metric.id)

    const linkedDefinitionIds = new Set([
      ...getCollection('definitions')
        .filter(def => def.metric_id === metric.id)
        .map(def => def.id),
      ...getCollection('definitionMetrics')
        .filter(component => component.metric_id === metric.id)
        .map(component => component.definition_id),
    ])
    for (const definitionId of linkedDefinitionIds) {
      deleteInternal('definitions', definitionId)
    }
  },
  definitions: (definition) => {
    database.definitionMetrics = getCollection('definitionMetrics').filter(item => item.definition_id !== definition.id)
    const relatedWidgetIds = getCollection('widgets')
      .filter(widget => widget.definition_id === definition.id)
      .map(widget => widget.id)
    for (const widgetId of relatedWidgetIds) {
      deleteInternal('widgets', widgetId)
    }
  },
  dashboards: (dashboard) => {
    const widgetIds = getCollection('widgets')
      .filter(widget => widget.dashboard_id === dashboard.id)
      .map(widget => widget.id)
    for (const widgetId of widgetIds) {
      deleteInternal('widgets', widgetId)
    }
  },
  widgets: (widget) => {
    database.widgetFilters = getCollection('widgetFilters').filter(item => item.widget_id !== widget.id)
  },
}

function applyFilters (collectionName, items, params = {}) {
  const filters = { ...params }
  const includeTemplates = !!filters.includeTemplates
  delete filters.includeTemplates

  return items.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (value == null || value === '') continue
      if (key === 'empresa_id') {
        const matchesEmpresa = Number(item.empresa_id) === Number(value)
        if (matchesEmpresa) continue
        if (includeTemplates && (item.empresa_id === null || item.empresa_id === undefined)) continue
        return false
      }
      if (Array.isArray(value)) {
        if (!value.includes(item[key])) return false
      } else if (typeof value === 'object' && value !== null) {
        if (item[key] !== value) return false
      } else if (Number.isFinite(Number(value)) && value !== '') {
        if (Number(item[key]) !== Number(value)) return false
      } else if (item[key] !== value) {
        return false
      }
    }
    return true
  })
}

function list (collection, params = {}) {
  const items = getCollection(collection)
  const filtered = applyFilters(collection, items, params)
  return withLatency({ data: clone(filtered) })
}

function retrieve (collection, id) {
  const found = findById(collection, id)
  assert(found, `No existe registro en ${collection} con id ${id}`)
  return withLatency({ data: clone(found) })
}

function create (collection, payload) {
  const entry = { ...payload }
  entry.id = nextId(collection)
  validators[collection]?.(entry, { ignoreId: null })
  const items = getCollection(collection)
  items.push(clone(entry))
  persist()
  return withLatency({ data: clone(entry) })
}

function update (collection, id, payload) {
  const items = getCollection(collection)
  const idx = items.findIndex(item => Number(item.id) === Number(id))
  assert(idx !== -1, `No existe registro en ${collection} con id ${id}`)
  const updated = { ...items[idx], ...payload, id: Number(id) }
  validators[collection]?.(updated, { ignoreId: id })
  items[idx] = clone(updated)
  persist()
  return withLatency({ data: clone(updated) })
}

function deleteInternal (collection, id) {
  const items = getCollection(collection)
  const idx = items.findIndex(item => Number(item.id) === Number(id))
  if (idx === -1) return
  const record = items[idx]
  cascadeBeforeDelete[collection]?.(record)
  items.splice(idx, 1)
}

function remove (collection, id) {
  deleteInternal(collection, id)
  persist()
  return withLatency({ data: true })
}

function cloneRecord (collection, id, overrides = {}) {
  const items = getCollection(collection)
  const original = items.find(item => Number(item.id) === Number(id))
  assert(original, `No existe registro en ${collection} con id ${id}`)
  const baseCopy = { ...original, ...overrides }
  baseCopy.id = nextId(collection)

  if (collection === 'metrics') {
    baseCopy.code = overrides.code || `${original.code}-copy-${baseCopy.id}`
    baseCopy.name = overrides.name || `${original.name} (copia)`
    validators.metrics?.(baseCopy, { ignoreId: null })
    items.push(clone(baseCopy))
    const relatedFilters = getCollection('metricFilters')
      .filter(filter => filter.metric_id === original.id)
      .map(filter => ({ ...filter, metric_id: baseCopy.id, id: nextId('metricFilters') }))
    database.metricFilters.push(...relatedFilters.map(clone))
    const relatedDimensions = getCollection('metricDimensions')
      .filter(dimension => dimension.metric_id === original.id)
      .map(dimension => ({ ...dimension, metric_id: baseCopy.id, id: nextId('metricDimensions') }))
    database.metricDimensions.push(...relatedDimensions.map(clone))
    persist()
    return withLatency({ data: clone(baseCopy) })
  }

  if (collection === 'definitions') {
    baseCopy.code = overrides.code || `${original.code}-copy-${baseCopy.id}`
    baseCopy.name = overrides.name || `${original.name} (copia)`
    validators.definitions?.(baseCopy, { ignoreId: null })
    items.push(clone(baseCopy))
    const components = getCollection('definitionMetrics')
      .filter(component => component.definition_id === original.id)
      .map(component => ({ ...component, definition_id: baseCopy.id, id: nextId('definitionMetrics') }))
    database.definitionMetrics.push(...components.map(clone))
    persist()
    return withLatency({ data: clone(baseCopy) })
  }

  if (collection === 'dashboards') {
    baseCopy.slug = overrides.slug || `${original.slug}-copy-${baseCopy.id}`
    baseCopy.name = overrides.name || `${original.name} (copia)`
    validators.dashboards?.(baseCopy, { ignoreId: null })
    items.push(clone(baseCopy))
    const widgets = getCollection('widgets')
      .filter(widget => widget.dashboard_id === original.id)
      .map(widget => {
        const widgetCopy = { ...widget, dashboard_id: baseCopy.id, id: nextId('widgets') }
        const widgetFilters = getCollection('widgetFilters')
          .filter(filter => filter.widget_id === widget.id)
          .map(filter => ({ ...filter, widget_id: widgetCopy.id, id: nextId('widgetFilters') }))
        database.widgetFilters.push(...widgetFilters.map(clone))
        return widgetCopy
      })
    database.widgets.push(...widgets.map(clone))
    persist()
    return withLatency({ data: clone(baseCopy) })
  }

  validators[collection]?.(baseCopy, { ignoreId: null })
  items.push(clone(baseCopy))
  persist()
  return withLatency({ data: clone(baseCopy) })
}

function replaceAll (newData) {
  database = clone(newData)
  sequences = computeSequences(database)
  persist()
  return withLatency({ data: clone(database) })
}

function reset () {
  database = buildSeedData()
  sequences = computeSequences(database)
  persist()
  return withLatency({ data: clone(database) })
}

function getAll () {
  return withLatency({ data: clone(database) })
}

function makeCollectionApi (collection) {
  return {
    list: (params) => list(collection, params),
    retrieve: (id) => retrieve(collection, id),
    create: (payload) => create(collection, payload),
    update: (id, payload) => update(collection, id, payload),
    delete: (id) => remove(collection, id),
    clone: (id, overrides) => cloneRecord(collection, id, overrides),
  }
}

export const kpiMock = {
  list,
  retrieve,
  create,
  update,
  delete: remove,
  clone: cloneRecord,
  replaceAll,
  reset,
  getAll,
  sources: makeCollectionApi('sources'),
  sourceFields: makeCollectionApi('sourceFields'),
  metrics: makeCollectionApi('metrics'),
  metricFilters: makeCollectionApi('metricFilters'),
  metricDimensions: makeCollectionApi('metricDimensions'),
  definitions: makeCollectionApi('definitions'),
  definitionMetrics: makeCollectionApi('definitionMetrics'),
  dashboards: makeCollectionApi('dashboards'),
  widgets: makeCollectionApi('widgets'),
  widgetFilters: makeCollectionApi('widgetFilters'),
}

export default kpiMock
