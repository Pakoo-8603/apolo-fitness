<template>
  <div class="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-100">{{ title }}</h3>
        <p v-if="description" class="text-xs text-slate-500">{{ description }}</p>
      </div>
      <div v-if="summary" class="text-right">
        <p class="text-3xl font-semibold text-slate-900 dark:text-slate-50">{{ summary.formattedValue ?? format(summary.value) }}</p>
        <p v-if="summary.deltaPct != null" :class="deltaClass" class="text-xs font-medium">
          {{ summary.deltaPct > 0 ? '+' : '' }}{{ (summary.deltaPct * 100).toFixed(1) }}%
          <span class="text-slate-500">vs periodo previo</span>
        </p>
      </div>
    </div>
    <div v-if="loading" class="py-6 text-center text-sm text-slate-500">Calculando vista previa…</div>
    <div v-else>
      <div v-if="!breakdown || !breakdown.length" class="text-sm text-slate-500">No hay datos para mostrar.</div>
      <ul v-else class="space-y-1 text-sm">
        <li v-for="item in breakdown" :key="item.label" class="flex items-center justify-between text-slate-600 dark:text-slate-200">
          <span>{{ item.label }}</span>
          <span class="font-medium">{{ format(item.value) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Vista previa' },
  description: { type: String, default: '' },
  summary: { type: Object, default: null },
  breakdown: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  formatter: { type: Function, default: null },
})

const deltaClass = computed(() => {
  if (!props.summary || props.summary.deltaPct == null) return 'text-slate-400'
  return props.summary.deltaPct >= 0 ? 'text-emerald-600' : 'text-rose-500'
})

function format (value) {
  if (props.formatter) return props.formatter(value)
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value)
}
</script>
