<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Dimensiones</h3>
      <button type="button" class="text-sm text-primary-600 hover:underline" @click="addDimension">Agregar dimensión</button>
    </div>
    <p class="text-xs text-slate-500">Las dimensiones permiten agrupar resultados. El límite controla cuántos elementos se muestran en gráficos/tablas.</p>
    <div v-if="!localDimensions.length" class="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">Sin dimensiones configuradas.</div>
    <div v-for="dimension in localDimensions" :key="dimension._localKey" class="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div class="flex flex-wrap gap-3">
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Campo
          <select v-model.number="dimension.field_id" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <option disabled value="">Selecciona campo</option>
            <option v-for="field in fields" :key="field.id" :value="field.id">{{ field.label }} ({{ field.name }})</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Granularidad
          <select v-model="dimension.granularity" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <option v-for="option in granularities" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300 w-24">
          Límite
          <input v-model.number="dimension.limit" type="number" min="0" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300 w-16">
          Orden
          <input v-model.number="dimension.order" type="number" min="1" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
        </label>
        <button type="button" class="ml-auto text-xs text-rose-500 hover:underline" @click="removeDimension(dimension._localKey)">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, nextTick } from 'vue'
import { GRANULARITY_OPTIONS } from '@/mocks/kpiCatalog'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  fields: { type: Array, default: () => [] },
  granularities: { type: Array, default: () => GRANULARITY_OPTIONS },
})

const emit = defineEmits(['update:modelValue'])

let seq = 1
const localDimensions = reactive([])

function syncFromProps () {
  localDimensions.splice(0, localDimensions.length)
  for (const dimension of props.modelValue) {
    localDimensions.push({
      ...dimension,
      granularity: dimension.granularity || 'exact',
      limit: dimension.limit ?? null,
      order: dimension.order ?? localDimensions.length + 1,
      _localKey: `dimension-${seq++}`,
    })
  }
}

watch(() => props.modelValue, syncFromProps, { immediate: true })

function emitChange () {
  const payload = localDimensions.map(({ _localKey, ...rest }) => ({ ...rest }))
  emit('update:modelValue', payload)
}

function addDimension () {
  localDimensions.push({
    id: null,
    field_id: '',
    granularity: 'exact',
    limit: null,
    order: localDimensions.length + 1,
    _localKey: `dimension-${seq++}`,
  })
  nextTick(emitChange)
}

function removeDimension (key) {
  const index = localDimensions.findIndex(dimension => dimension._localKey === key)
  if (index >= 0) {
    localDimensions.splice(index, 1)
    nextTick(() => {
      localDimensions.forEach((dimension, idx) => { dimension.order = idx + 1 })
      emitChange()
    })
  }
}

watch(localDimensions, emitChange, { deep: true })
</script>
