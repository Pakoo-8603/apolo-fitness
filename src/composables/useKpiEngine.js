import { computed } from 'vue'
import { useKpiStore } from '@/stores/kpis'

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function startOfDay (date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay (date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek (date) {
  const d = startOfDay(date)
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - day)
  return d
}

function endOfWeek (date) {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function startOfMonth (date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

function endOfMonth (date) {
  const d = endOfDay(date)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return d
}

function startOfYear (date) {
  const d = startOfDay(date)
  d.setMonth(0, 1)
  return d
}

function endOfYear (date) {
  const d = endOfDay(date)
  d.setMonth(11, 31)
  return d
}

function computeRangeFromWindow (windowKey, now = new Date()) {
  const current = new Date(now)
  switch (windowKey) {
    case 'today':
      return { start: startOfDay(current), end: endOfDay(current) }
    case 'yesterday': {
      const start = startOfDay(current)
      start.setDate(start.getDate() - 1)
      return { start, end: endOfDay(start) }
    }
    case 'this_week':
      return { start: startOfWeek(current), end: endOfWeek(current) }
    case 'last_7_days': {
      const end = endOfDay(current)
      const start = startOfDay(current)
      start.setDate(start.getDate() - 6)
      return { start, end }
    }
    case 'this_month':
      return { start: startOfMonth(current), end: endOfMonth(current) }
    case 'last_30_days': {
      const end = endOfDay(current)
      const start = startOfDay(current)
      start.setDate(start.getDate() - 29)
      return { start, end }
    }
    case 'this_year':
      return { start: startOfYear(current), end: endOfYear(current) }
    default:
      return { start: null, end: null }
  }
}

function shiftRangeBack (range) {
  if (!range.start || !range.end) return { start: null, end: null }
  const duration = range.end.getTime() - range.start.getTime()
  const end = new Date(range.start.getTime() - 1)
  const start = new Date(end.getTime() - duration)
  return { start: startOfDay(start), end: endOfDay(end) }
}

function getValueFromRecord (record, fieldName) {
  if (!record) return null
  const parts = fieldName.split(/__|\./)
  let value = record
  for (const part of parts) {
    if (value == null) return null
    value = value[part]
  }
  return value
}

function normalizeValue (value, field) {
  if (value == null) return value
  if (!field) return value
  switch (field.field_type) {
    case 'numeric':
      return Number(value)
    case 'date':
      return new Date(value)
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      return Boolean(value)
    default:
      return value
  }
}

function satisfiesOperator (recordValue, operator, expected, field) {
  if (operator === 'is_null') return recordValue == null
  if (operator === 'is_not_null') return recordValue != null

  if (field?.field_type === 'date') {
    recordValue = recordValue ? new Date(recordValue) : null
    if (Array.isArray(expected)) {
      expected = expected.map(value => value ? new Date(value) : value)
    } else if (expected != null) {
      expected = new Date(expected)
    }
  }

  switch (operator) {
    case 'eq':
      return recordValue === expected
    case 'ne':
      return recordValue !== expected
    case 'gt':
      return recordValue > expected
    case 'gte':
      return recordValue >= expected
    case 'lt':
      return recordValue < expected
    case 'lte':
      return recordValue <= expected
    case 'in':
      return Array.isArray(expected) ? expected.includes(recordValue) : false
    case 'not_in':
      return Array.isArray(expected) ? !expected.includes(recordValue) : true
    case 'between':
      return Array.isArray(expected) && expected.length === 2 && recordValue >= expected[0] && recordValue <= expected[1]
    case 'contains':
      return String(recordValue || '').includes(String(expected || ''))
    case 'icontains':
      return String(recordValue || '').toLowerCase().includes(String(expected || '').toLowerCase())
    case 'startswith':
      return String(recordValue || '').startsWith(String(expected || ''))
    case 'endswith':
      return String(recordValue || '').endsWith(String(expected || ''))
    default:
      return true
  }
}

function applyFilterArray (records, filters = [], fieldMap = {}, fieldByName = {}) {
  if (!filters.length) return records
  return records.filter(record => {
    let isValid = true
    for (const filter of filters) {
      const field = filter.field_id ? fieldMap[filter.field_id] : (filter.field_name ? fieldByName[filter.field_name] : null)
      if (!field) continue
      const rawValue = getValueFromRecord(record, field.name)
      const normalized = normalizeValue(rawValue, field)
      const expected = filter.value
      const ok = satisfiesOperator(normalized, filter.operator, expected, field)
      if (!ok) {
        isValid = false
        if (filter.connector !== 'or') break
      }
    }
    return isValid
  })
}

function aggregateRecords (records, aggregation, field) {
  if (aggregation === 'count') {
    return records.length
  }
  const values = field ? records.map(item => Number(getValueFromRecord(item, field.name) ?? 0)) : []
  if (aggregation === 'distinct_count') {
    const distinct = new Set(values.map(value => JSON.stringify(value)))
    return distinct.size
  }
  if (!values.length) return 0
  switch (aggregation) {
    case 'sum':
      return values.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0)
    case 'avg':
      return values.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0) / values.length
    case 'max':
      return Math.max(...values)
    case 'min':
      return Math.min(...values)
    default:
      return 0
  }
}

function bucketByGranularity (records, field, granularity, valueField, aggregation, limit) {
  if (!field) return []
  const buckets = {}
  for (const record of records) {
    const raw = getValueFromRecord(record, field.name)
    if (raw == null) continue
    let key = raw
    let label = raw
    if (granularity && granularity !== 'exact') {
      const date = new Date(raw)
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`
          label = `${date.getHours().toString().padStart(2, '0')}:00`
          break
        case 'day':
          key = date.toISOString().slice(0, 10)
          label = key
          break
        case 'week': {
          const weekStart = startOfWeek(date)
          key = weekStart.toISOString().slice(0, 10)
          label = `Sem ${Math.ceil((weekStart.getDate() + 6) / 7)} ${weekStart.getFullYear()}`
          break
        }
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
          label = key
          break
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
          label = key
          break
        case 'year':
          key = String(date.getFullYear())
          label = key
          break
        default:
          key = raw
          label = raw
      }
    }
    if (!buckets[key]) {
      buckets[key] = { key, label, records: [] }
    }
    buckets[key].records.push(record)
  }
  const groups = Object.values(buckets)
  for (const group of groups) {
    group.value = aggregateRecords(group.records, aggregation, valueField)
  }
  groups.sort((a, b) => b.value - a.value)
  if (limit) {
    return groups.slice(0, limit).map(group => ({ label: group.label, value: group.value }))
  }
  if (granularity && granularity !== 'exact') {
    groups.sort((a, b) => (a.key > b.key ? 1 : -1))
  }
  return groups.map(group => ({ label: group.label, value: group.value }))
}

function formatValue (value, formatType, extra = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  const decimals = typeof extra.decimals === 'number'
    ? extra.decimals
    : (formatType === 'currency' ? 2 : formatType === 'percentage' ? 1 : 0)
  if (formatType === 'currency') {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: extra.currency || 'MXN',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }
  if (formatType === 'percentage') {
    const pct = value * 100
    return `${pct.toFixed(decimals)}%`
  }
  if (formatType === 'duration') {
    const totalMinutes = Math.round(value)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: Math.max(decimals, 0),
  }).format(value)
}

function evaluateFormula (expression, scope) {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('scope', `with(scope){ return ${expression} }`)
    return fn(scope)
  } catch (err) {
    console.warn('[kpiEngine] Error al evaluar fórmula', err)
    return 0
  }
}

function resolveTimeSettings (metric, widget, context = {}) {
  const overrideWindow = widget?.time_window_override && widget.time_window_override.length ? widget.time_window_override : null
  const windowKey = overrideWindow || context.timeWindow || metric.time_window || 'this_month'
  let range = computeRangeFromWindow(windowKey, context.now || new Date())
  let customStart = widget?.custom_start_override || context.customRange?.start || metric.custom_start
  let customEnd = widget?.custom_end_override || context.customRange?.end || metric.custom_end
  if (windowKey === 'custom') {
    if (customStart && customEnd) {
      range = { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) }
    } else {
      range = { start: null, end: null }
    }
  }
  return { windowKey, range }
}

function buildContextFilters (context, fields) {
  const filters = []
  if (context?.sucursal) {
    const sucursalField = fields.find(field => field.name === 'sucursal')
    if (sucursalField) {
      filters.push({ field_id: sucursalField.id, operator: 'eq', value: context.sucursal, connector: 'and' })
    }
  }
  if (Array.isArray(context?.filters)) {
    for (const filter of context.filters) {
      if (filter.field_id || filter.field_name) {
        filters.push(filter)
      } else if (filter.name) {
        const field = fields.find(item => item.name === filter.name)
        if (field) {
          filters.push({ field_id: field.id, operator: filter.operator || 'eq', value: filter.value, connector: filter.connector || 'and' })
        }
      }
    }
  }
  return filters
}

export function useKpiEngine () {
  const kpiStore = useKpiStore()

  const sourceFieldsBySource = computed(() => {
    const groups = {}
    for (const field of kpiStore.state.sourceFields) {
      if (!groups[field.source_id]) groups[field.source_id] = []
      groups[field.source_id].push(field)
    }
    return groups
  })

  function resolveMetric (metric, { widget = null, widgetFilters = [], context = {}, localFilters = null, localDimensions = null } = {}) {
    if (!metric) {
      return {
        metric,
        records: [],
        total: 0,
        previousTotal: null,
        delta: null,
        deltaPct: null,
        breakdown: [],
        series: [],
        range: { start: null, end: null },
      }
    }

    const source = kpiStore.sourcesById.value[metric.source_id]
    const fields = sourceFieldsBySource.value[metric.source_id] || []
    const fieldMap = fields.reduce((acc, field) => ({ ...acc, [field.id]: field }), {})
    const fieldByName = fields.reduce((acc, field) => ({ ...acc, [field.name]: field }), {})

    const sampleKey = source?.metadata?.sample_records || source?.code
    let records = clone(kpiStore.state.sourceSamples[sampleKey] || [])

    if (source?.base_filters) {
      records = records.filter(record => {
        return Object.entries(source.base_filters).every(([key, value]) => {
          const val = getValueFromRecord(record, key)
          return Array.isArray(value) ? value.includes(val) : val === value
        })
      })
    }

    const metricFilters = (localFilters != null ? localFilters : (kpiStore.metricFiltersByMetric.value[metric.id] || []))
    const contextFilters = buildContextFilters(context, fields)
    const allFilters = [...metricFilters, ...widgetFilters, ...contextFilters]
    const recordsWithoutTime = applyFilterArray(records, allFilters, fieldMap, fieldByName)

    const dateField = metric.date_field_id ? fieldMap[metric.date_field_id] : null
    const { range, windowKey } = resolveTimeSettings(metric, widget, context)
    let filteredRecords = recordsWithoutTime
    if (dateField && range.start && range.end) {
      filteredRecords = recordsWithoutTime.filter(record => {
        const value = getValueFromRecord(record, dateField.name)
        if (!value) return false
        const dateValue = new Date(value)
        return dateValue >= range.start && dateValue <= range.end
      })
    }

    const valueField = metric.value_field_id ? fieldMap[metric.value_field_id] : null
    const total = aggregateRecords(filteredRecords, metric.aggregation, valueField)

    let previousTotal = null
    if (metric.compare_against_previous && range.start && range.end && dateField) {
      const previousRange = shiftRangeBack(range)
      const previousRecords = recordsWithoutTime.filter(record => {
        const value = getValueFromRecord(record, dateField.name)
        if (!value) return false
        const dateValue = new Date(value)
        return dateValue >= previousRange.start && dateValue <= previousRange.end
      })
      previousTotal = aggregateRecords(previousRecords, metric.aggregation, valueField)
    }

    const dimensions = (localDimensions != null ? localDimensions : (kpiStore.metricDimensionsByMetric.value[metric.id] || []))
    const primaryDimension = dimensions.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
    let breakdown = []
    let series = []
    if (primaryDimension) {
      const dimensionField = fieldMap[primaryDimension.field_id]
      const groups = bucketByGranularity(filteredRecords, dimensionField, primaryDimension.granularity, valueField, metric.aggregation, primaryDimension.limit)
      breakdown = groups
      series = groups
    } else if (dateField) {
      const groups = bucketByGranularity(filteredRecords, dateField, 'day', valueField, metric.aggregation)
      series = groups
    }

    const delta = previousTotal != null ? total - previousTotal : null
    const deltaPct = previousTotal && previousTotal !== 0 ? (total - previousTotal) / previousTotal : null

    return {
      metric,
      records: filteredRecords,
      total,
      previousTotal,
      delta,
      deltaPct,
      breakdown,
      series,
      range: { ...range, windowKey },
    }
  }

  function resolveWidget (model, context = {}) {
    const { widget, definition, metric, components } = model
    const filters = model.filters || []
    if (!definition) {
      return { widget, definition, error: 'Definición no encontrada' }
    }

    if (definition.calculation_type === 'metric') {
      const metricFilters = filters.filter(filter => !filter.target_alias)
      const result = resolveMetric(metric, { widget, widgetFilters: metricFilters, context })
      let baseline = null
      if (definition.baseline_metric_id) {
        const baselineMetric = kpiStore.metricsById.value[definition.baseline_metric_id]
        baseline = resolveMetric(baselineMetric, { widget: null, widgetFilters: metricFilters, context })
      }
      const formattedValue = formatValue(result.total, definition.format_type, definition.extra_config)
      const formattedPrev = result.previousTotal != null ? formatValue(result.previousTotal, definition.format_type, definition.extra_config) : null
      const formattedBaseline = baseline ? formatValue(baseline.total, definition.format_type, definition.extra_config) : null
      return {
        widget,
        definition,
        metric,
        result,
        summary: {
          value: result.total,
          formattedValue,
          previousValue: result.previousTotal,
          previousFormatted: formattedPrev,
          delta: result.delta,
          deltaPct: result.deltaPct,
          baselineValue: baseline?.total ?? null,
          baselineFormatted: formattedBaseline,
        },
        breakdown: result.breakdown,
        series: result.series,
      }
    }

    const componentSummaries = []
    for (const component of components) {
      const targetMetric = kpiStore.metricsById.value[component.metric_id]
      const componentFilters = filters.filter(filter => filter.target_alias === component.alias || (!filter.target_alias && !component.alias))
      const metricResult = resolveMetric(targetMetric, { widget, widgetFilters: componentFilters, context })
      componentSummaries.push({ alias: component.alias, metric: targetMetric, result: metricResult })
    }
    const scope = {}
    for (const summary of componentSummaries) {
      scope[summary.alias] = summary.result.total
    }
    const formulaValue = evaluateFormula(definition.expression, scope)
    const baselineMetric = definition.baseline_metric_id ? kpiStore.metricsById.value[definition.baseline_metric_id] : null
    const baselineResult = baselineMetric ? resolveMetric(baselineMetric, { widget, widgetFilters: [], context }) : null
    const formattedValue = formatValue(formulaValue, definition.format_type, definition.extra_config)
    const breakdown = componentSummaries[0]?.result.breakdown || []
    const series = componentSummaries[0]?.result.series || []

    return {
      widget,
      definition,
      metric: null,
      components: componentSummaries,
      summary: {
        value: formulaValue,
        formattedValue,
        previousValue: null,
        previousFormatted: null,
        delta: null,
        deltaPct: null,
        baselineValue: baselineResult?.total ?? null,
        baselineFormatted: baselineResult ? formatValue(baselineResult.total, definition.format_type, definition.extra_config) : null,
      },
      breakdown,
      series,
    }
  }

  return {
    resolveMetric,
    resolveWidget,
    formatValue,
  }
}

export default useKpiEngine
