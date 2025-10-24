<template>
  <div class="kpi-card" :style="cardStyle" @mouseleave="scheduleHide">
    <header class="kpi-card__head" :style="{ borderColor }">
      <div>
        <h3 class="kpi-card__title">{{ moduleTitle }}</h3>
        <p class="kpi-card__subtitle" :style="{ color: subtext }">{{ moduleSubtitle }}</p>
      </div>
      <div v-if="hasActions" class="kpi-card__actions">
        <button
          v-if="isEditing"
          type="button"
          class="icon-btn icon-btn--ghost"
          title="Ocultar KPI"
          @click.stop.prevent="requestHide"
        >
          <i class="fa-regular fa-eye-slash"></i>
        </button>
        <div v-if="hasFilters" class="filter-trigger" @mouseenter="showFilters" @mouseleave="scheduleHide">
          <button class="icon-btn" :style="iconBtnStyle" type="button" title="Ajustar filtros">
            <i class="fa-solid fa-sliders"></i>
          </button>
          <transition name="fade">
            <div
              v-if="filtersVisible"
              class="kpi-card__filters"
              :style="{ background: cardStyle.background, borderColor }"
              @mouseenter="cancelHide"
              @mouseleave="scheduleHide"
            >
              <div v-for="filterDef in moduleFilters" :key="`${moduleId}-${filterDef.key}`" class="field-inline">
                <label class="field-label" :style="{ color: subtext }">{{ filterDef.label }}</label>
                <select
                  :value="filterValues[filterDef.key]"
                  class="field-select"
                  :style="selectStyle"
                  @change="onFilterChange(filterDef.key, $event)"
                >
                  <option
                    v-for="opt in getOptions(filterDef.optionsKey)"
                    :key="`${moduleId}-${filterDef.key}-${opt.value}`"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </header>

    <div class="kpi-card__body">
      <p v-if="context" class="kpi-card__context" :style="{ color: subtext }">{{ context }}</p>
      <div class="metric-grid">
        <div v-for="metric in metrics" :key="metric.id || `${moduleId}-${metric.label}`" class="metric-block">
          <span class="metric-label" :style="{ color: subtext }">{{ metric.label }}</span>
          <span class="metric-value">{{ metric.value }}</span>
          <span v-if="metric.caption" class="metric-caption" :style="{ color: subtext }">{{ metric.caption }}</span>
        </div>
      </div>
      <div v-if="loadingDashboard" class="kpi-loading" :style="{ color: subtext }">Cargando…</div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  moduleId: {
    type: String,
    required: true,
  },
})

const dashboardState = inject('dashboardState')

if (!dashboardState) {
  throw new Error('Dashboard state is not provided')
}

const moduleDef = computed(() => dashboardState.moduleMap.get(props.moduleId) || null)
const moduleTitle = computed(() => moduleDef.value?.title || props.moduleId)
const moduleSubtitle = computed(() => moduleDef.value?.subtitle || '')
const moduleFilters = computed(() => (Array.isArray(moduleDef.value?.filters) ? moduleDef.value.filters : []))
const hasFilters = computed(() => moduleFilters.value.length > 0)
const isEditing = computed(() => Boolean(dashboardState.isEditing?.value))
const hasActions = computed(() => isEditing.value || hasFilters.value)

const filterValues = computed(() => {
  if (!dashboardState.filters[props.moduleId]) {
    dashboardState.filters[props.moduleId] = {
      ...(dashboardState.defaultFilters?.[props.moduleId] || {}),
    }
  }
  return dashboardState.filters[props.moduleId]
})

const moduleOutput = computed(() => dashboardState.moduleOutputs.value?.[props.moduleId] || {})
const metrics = computed(() => (Array.isArray(moduleOutput.value?.metrics) ? moduleOutput.value.metrics : []))
const context = computed(() => moduleOutput.value?.context || '')

const cardStyle = computed(() => dashboardState.cardStyle.value)
const iconBtnStyle = computed(() => dashboardState.iconBtnStyle.value)
const selectStyle = computed(() => dashboardState.selectStyle.value)
const subtext = computed(() => dashboardState.subtext.value)
const borderColor = computed(() => dashboardState.borderColor.value)
const loadingDashboard = computed(() => Boolean(dashboardState.loadingDashboard.value))

const filtersVisible = ref(false)
let hideTimer = null

function getOptions(optionsKey) {
  return dashboardState.filterOptionsState[optionsKey] || []
}

function onFilterChange(key, event) {
  const value = event?.target?.value
  dashboardState.updateFilter(props.moduleId, key, value)
}

function showFilters() {
  filtersVisible.value = true
  cancelHide()
}

function scheduleHide() {
  cancelHide()
  hideTimer = setTimeout(() => {
    filtersVisible.value = false
  }, 220)
}

function cancelHide() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function requestHide() {
  dashboardState.hideModule?.(props.moduleId)
  cancelHide()
  filtersVisible.value = false
}

onBeforeUnmount(() => {
  cancelHide()
})
</script>

<style scoped>
.kpi-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.2rem 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid currentColor;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.kpi-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid;
}

.kpi-card__title {
  font-size: 1rem;
  font-weight: 600;
}

.kpi-card__subtitle {
  font-size: 0.85rem;
}

.kpi-card__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.filter-trigger {
  position: relative;
}

.icon-btn--ghost {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  padding: 0.3rem 0.45rem;
  border-radius: 0.6rem;
  transition: transform 0.18s ease;
}

.icon-btn--ghost:hover {
  transform: translateY(-1px);
}

.kpi-card__filters {
  position: absolute;
  top: 115%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 220px;
  padding: 0.9rem;
  border-radius: 0.9rem;
  border: 1px solid;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  z-index: 20;
}

.field-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-select {
  width: 100%;
  font-size: 0.85rem;
  border-radius: 0.65rem;
  padding: 0.35rem 0.6rem;
}

.kpi-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.kpi-card__context {
  font-size: 0.8rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem 1.2rem;
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-label {
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
}

.metric-caption {
  font-size: 0.75rem;
}

.kpi-loading {
  font-size: 0.78rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
