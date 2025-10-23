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
          Base: {{ formatBaseline(model.summary.baselineValue) }}
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
            <tr v-for="item in model.breakdown" :key="item.label" class="border-t border-slate-100 dark:border-slate-800">
              <td class="py-1">{{ item.label }}</td>
              <td class="py-1 text-right font-medium">{{ formatValue(item.value) }}</td>
            </tr>
          </tbody>
        </table>
        <ul v-else-if="model.breakdown?.length" class="space-y-1 text-sm text-slate-600 dark:text-slate-200">
          <li v-for="item in model.breakdown" :key="item.label" class="flex items-center justify-between">
            <span>{{ item.label }}</span>
            <span class="font-medium">{{ formatValue(item.value) }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-500">Sin datos disponibles.</p>
      </div>
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
const accentClass = computed(() => {
  const accent = props.model?.widget?.options?.accent
  const map = {
    emerald: 'border-emerald-200/80 dark:border-emerald-500/40',
    teal: 'border-teal-200/80 dark:border-teal-500/40',
    amber: 'border-amber-200/80 dark:border-amber-500/40',
    sky: 'border-sky-200/80 dark:border-sky-500/40',
  }
  return map[accent] || 'border-slate-200 dark:border-slate-700'
})
const containerClass = computed(() => `flex h-full flex-col gap-4 rounded-xl border ${accentClass.value} bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/70`)

const formattedValue = computed(() => props.model?.summary?.formattedValue ?? formatValue(props.model?.summary?.value))
const deltaClass = computed(() => {
  if (!props.model?.summary || props.model.summary.deltaPct == null) return 'text-slate-400'
  return props.model.summary.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-500'
})

const isTable = computed(() => visualization.value === 'table')

const chartOptions = computed(() => {
  if (!props.model || !props.model.series?.length) return null
  if (visualization.value === 'kpi' || visualization.value === 'table') return null
  const labels = props.model.series.map(item => item.label)
  const values = props.model.series.map(item => item.value)
  if (visualization.value === 'pie') {
    return {
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: props.model.series.map(item => ({ value: item.value, name: item.label })),
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

function formatValue (value) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value)
}

function formatBaseline (value) {
  if (props.model?.summary?.baselineFormatted) return props.model.summary.baselineFormatted
  return formatValue(value)
}
</script>
