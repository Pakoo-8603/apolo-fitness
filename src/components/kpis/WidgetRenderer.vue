<template>
  <div :class="containerClass">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-100">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-slate-500">{{ subtitle }}</p>
      </div>
      <div v-if="model.summary" class="text-right">
        <p class="text-3xl font-semibold text-slate-900 dark:text-slate-50">{{ formattedValue }}</p>
        <p v-if="model.summary.deltaPct != null" :class="deltaClass" class="text-xs font-medium">
          {{ model.summary.deltaPct > 0 ? '+' : '' }}{{ (model.summary.deltaPct * 100).toFixed(1) }}%
          <span class="text-slate-400">vs previo</span>
        </p>
        <p v-else-if="model.summary.baselineValue != null" class="text-xs text-slate-500">
          Base: {{ formatValue(model.summary.baselineValue, definitionFormatType, definitionFormatExtra) }}
        </p>
      </div>
    </div>
    <div class="relative min-h-[160px] flex-1">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Cargando…</div>
      <div v-else-if="error" class="absolute inset-0 flex items-center justify-center text-sm text-rose-500">{{ error }}</div>
      <div v-else class="h-full w-full">
        <VChart v-if="chartOptions" :option="chartOptions" autoresize class="h-full w-full" />
        <table v-else-if="isTable" class="w-full table-fixed text-sm text-slate-600 dark:text-slate-200">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wide text-slate-400">
              <th class="pb-2">Etiqueta</th>
              <th class="pb-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in displayBreakdown" :key="item.label" class="border-t border-slate-100 dark:border-slate-800">
              <td class="py-1">{{ item.label }}</td>
              <td class="py-1 text-right font-medium">{{ formatValue(item.value, definitionFormatType, definitionFormatExtra) }}</td>
            </tr>
          </tbody>
        </table>
        <ul v-else-if="displayBreakdown.length" class="space-y-1 text-sm text-slate-600 dark:text-slate-200">
          <li v-for="item in displayBreakdown" :key="item.label" class="flex items-center justify-between">
            <span>{{ item.label }}</span>
            <span class="font-medium">{{ formatValue(item.value, definitionFormatType, definitionFormatExtra) }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500">Sin datos disponibles.</p>
      </div>
    </div>
    <div v-if="componentRows.length" class="mt-3">
      <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Detalles</h4>
      <ul class="space-y-1 text-xs text-slate-600 dark:text-slate-200">
        <li v-for="row in componentRows" :key="row.label" class="flex items-center justify-between">
          <span>{{ row.label }}</span>
          <span class="font-medium">{{ row.formatted }}</span>
        </li>
      </ul>
    </div>
    <div v-if="derivedRows.length" class="mt-2">
      <h4 class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Indicadores derivados</h4>
      <ul class="space-y-1 text-xs text-slate-600 dark:text-slate-200">
        <li v-for="row in derivedRows" :key="row.label" class="flex items-center justify-between">
          <span>{{ row.label }}</span>
          <span class="font-medium">{{ row.formatted }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const props = defineProps({
  model: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const title = computed(() => props.model?.widget?.title || props.model?.definition?.name || 'Widget')
const subtitle = computed(() => props.model?.widget?.subtitle || props.model?.definition?.description || '')

const visualization = computed(() => props.model?.widget?.options?.visualization || (props.model?.series?.length ? 'line' : 'kpi'))
const sortDirection = computed(() => props.model?.widget?.options?.sortDirection || null)
const limitRows = computed(() => props.model?.widget?.options?.limitRows || null)

const accentClass = computed(() => {
  const accent = props.model?.widget?.options?.accent
  const map = {
    emerald: 'border-emerald-200/80 dark:border-emerald-500/40',
    teal: 'border-teal-200/80 dark:border-teal-500/40',
    amber: 'border-amber-200/80 dark:border-amber-500/40',
    sky: 'border-sky-200/80 dark:border-sky-500/40',
    rose: 'border-rose-200/80 dark:border-rose-500/40',
  }
  return map[accent] || 'border-slate-200 dark:border-slate-700'
})
const containerClass = computed(() => `flex h-full flex-col gap-4 rounded-xl border ${accentClass.value} bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70`)

const definitionFormatType = computed(() => props.model?.definition?.format_type || 'value')
const definitionFormatExtra = computed(() => props.model?.definition?.extra_config || {})

const formattedValue = computed(() => props.model?.summary?.formattedValue ?? formatValue(props.model?.summary?.value, definitionFormatType.value, definitionFormatExtra.value))
const deltaClass = computed(() => {
  if (!props.model?.summary || props.model.summary.deltaPct == null) return 'text-slate-400'
  return props.model.summary.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-500'
})

const isTable = computed(() => visualization.value === 'table')

const baseBreakdown = computed(() => props.model?.breakdown ? [...props.model.breakdown] : [])
const baseSeries = computed(() => props.model?.series ? [...props.model.series] : [])

function applySorting (items) {
  if (!items.length || !sortDirection.value) return items
  const sorted = [...items].sort((a, b) => {
    if (sortDirection.value === 'asc') return (a.value ?? 0) - (b.value ?? 0)
    if (sortDirection.value === 'desc') return (b.value ?? 0) - (a.value ?? 0)
    return 0
  })
  if (limitRows.value) {
    return sorted.slice(0, limitRows.value)
  }
  return sorted
}

const displayBreakdown = computed(() => applySorting(baseBreakdown.value))

const displaySeries = computed(() => {
  if (!baseSeries.value.length) return []
  if (!sortDirection.value || visualization.value === 'line') return baseSeries.value
  return applySorting(baseSeries.value)
})

const chartOptions = computed(() => {
  if (!props.model || !displaySeries.value.length) return null
  if (visualization.value === 'kpi' || visualization.value === 'table') return null
  const labels = displaySeries.value.map(item => item.label)
  const values = displaySeries.value.map(item => item.value)
  if (visualization.value === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: displaySeries.value.map(item => ({ value: item.value, name: item.label })),
      }],
    }
  }
  const baseOptions = {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24 },
    xAxis: { type: 'category', data: labels, boundaryGap: visualization.value === 'bar' },
    yAxis: { type: 'value' },
    series: [{
      name: props.model.definition?.name || '',
      type: visualization.value === 'bar' ? 'bar' : 'line',
      smooth: props.model.widget?.options?.smooth ?? false,
      data: values,
      areaStyle: visualization.value === 'line' && props.model.widget?.options?.area ? {} : undefined,
    }],
  }
  return baseOptions
})

const componentRows = computed(() => {
  if (!props.model?.widget?.options?.showComponents || !props.model?.components?.length) return []
  const labels = props.model.widget.options.componentLabels || {}
  const defaultFormat = props.model.widget.options.componentFormat || 'value'
  const formats = props.model.widget.options.componentFormats || {}
  const decimalsConfig = props.model.widget.options.componentDecimals || {}
  return props.model.components.map(component => {
    const alias = component.alias
    const label = labels[alias] || alias
    const formatType = formats[alias] || defaultFormat
    const decimals = decimalsConfig[alias]
    const extra = buildFormatExtra(formatType, decimals, component.metric?.extra_config || {})
    return {
      label,
      value: component.result.total,
      formatted: formatValue(component.result.total, formatType, extra),
    }
  })
})

const derivedRows = computed(() => {
  const rows = props.model?.widget?.options?.derivedRows
  if (!rows?.length || !props.model?.components?.length) return []
  const scope = props.model.components.reduce((acc, component) => {
    acc[component.alias] = component.result.total
    return acc
  }, {})
  return rows
    .map(row => {
      const value = evaluate(row.expression, scope)
      if (value == null || Number.isNaN(value)) return null
      const formatType = row.format || 'value'
      const extra = buildFormatExtra(formatType, row.decimals, {})
      return {
        label: row.label,
        value,
        formatted: formatValue(value, formatType, extra),
      }
    })
    .filter(Boolean)
})

function formatValue (value, formatType = 'value', extra = {}) {
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

function buildFormatExtra (formatType, decimals, extraConfig = {}) {
  const extra = { ...extraConfig }
  if (typeof decimals === 'number') {
    extra.decimals = decimals
  }
  if (formatType === 'currency' && !extra.currency) {
    extra.currency = 'MXN'
  }
  return extra
}

function evaluate (expression, scope) {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('scope', `with(scope){ return ${expression} }`)
    return fn(scope)
  } catch (err) {
    console.warn('[WidgetRenderer] Error al evaluar expresión derivada', err)
    return null
  }
}
</script>
