<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtros de métrica</h3>
      <button type="button" class="text-sm text-primary-600 hover:underline" @click="addFilter">Agregar filtro</button>
    </div>
    <p class="text-xs text-slate-500">Usa notación JSON para valores complejos (arrays, objetos). Los filtros se aplican en el orden configurado.</p>
    <div v-if="!localFilters.length" class="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">Sin filtros aplicados.</div>
    <div v-for="(filter, idx) in localFilters" :key="filter._localKey" class="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
      <div class="flex flex-wrap gap-3">
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Campo
          <select v-model.number="filter.field_id" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <option disabled value="">Selecciona campo</option>
            <option v-for="field in fields" :key="field.id" :value="field.id">{{ field.label }} ({{ field.name }})</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Operador
          <select v-model="filter.operator" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <option v-for="op in operators" :key="op.value" :value="op.value">{{ op.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300" :class="{ 'opacity-50': filter.operator === 'is_null' || filter.operator === 'is_not_null' }">
          Valor
          <input
            :disabled="filter.operator === 'is_null' || filter.operator === 'is_not_null'"
            v-model="filter._valueInput"
            @blur="commitValue(filter)"
            placeholder='123, "texto" o [1,2]'
            class="mt-1 w-48 rounded border border-slate-300 bg-white px-2 py-1 text-sm font-mono dark:border-slate-600 dark:bg-slate-800"
          >
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300">
          Conector
          <select v-model="filter.connector" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
            <option v-for="item in connectors" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-300 w-16">
          Orden
          <input v-model.number="filter.order" type="number" min="1" class="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800">
        </label>
        <button type="button" class="ml-auto text-xs text-rose-500 hover:underline" @click="removeFilter(filter._localKey)">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, nextTick } from 'vue'
import { OPERATOR_OPTIONS, CONNECTOR_OPTIONS } from '@/mocks/kpiCatalog'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  fields: { type: Array, default: () => [] },
  operators: { type: Array, default: () => OPERATOR_OPTIONS },
  connectors: { type: Array, default: () => CONNECTOR_OPTIONS },
})

const emit = defineEmits(['update:modelValue'])

let seq = 1
const localFilters = reactive([])

function serializeValue (value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch (err) {
    return String(value)
  }
}

function parseValue (input) {
  if (input === '' || input == null) return null
  const trimmed = String(input).trim()
  if (trimmed === '') return null
  try {
    return JSON.parse(trimmed)
  } catch (err) {
    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric)) return numeric
    return trimmed
  }
}

function syncFromProps () {
  localFilters.splice(0, localFilters.length)
  for (const filter of props.modelValue) {
    localFilters.push({
      ...filter,
      connector: filter.connector || 'and',
      order: filter.order ?? localFilters.length + 1,
      _localKey: `filter-${seq++}`,
      _valueInput: serializeValue(filter.value),
    })
  }
}

watch(() => props.modelValue, syncFromProps, { immediate: true })

function emitChange () {
  const payload = localFilters.map(({ _localKey, _valueInput, ...rest }) => ({ ...rest }))
  emit('update:modelValue', payload)
}

function addFilter () {
  localFilters.push({
    id: null,
    field_id: '',
    operator: 'eq',
    value: null,
    connector: 'and',
    order: localFilters.length + 1,
    _localKey: `filter-${seq++}`,
    _valueInput: '',
  })
  nextTick(emitChange)
}

function removeFilter (key) {
  const index = localFilters.findIndex(filter => filter._localKey === key)
  if (index >= 0) {
    localFilters.splice(index, 1)
    nextTick(() => {
      localFilters.forEach((filter, idx) => { filter.order = idx + 1 })
      emitChange()
    })
  }
}

function commitValue (filter) {
  filter.value = parseValue(filter._valueInput)
  emitChange()
}

watch(localFilters, emitChange, { deep: true })
</script>
