<template>
  <div class="kpi-card" :class="{ editing: isEditing }" :style="cardStyle" @mouseleave="handleMouseLeave">
    <header class="kpi-card__head" :style="{ borderColor }">
      <div class="kpi-card__title-wrap">
        <button v-if="isEditing" class="drag-handle" type="button" title="Mover KPI">
          <i class="fa-solid fa-grip-dots"></i>
        </button>
        <div>
          <h3 class="kpi-card__title">{{ moduleTitle }}</h3>
          <p class="kpi-card__subtitle" :style="{ color: subtext }">
            {{ moduleSubtitle }}
          </p>
        </div>
      </div>
      <div class="kpi-card__actions">
        <button
          v-if="hasFilters"
          class="icon-btn filter-toggle"
          type="button"
          :style="iconBtnStyle"
          :class="{ 'is-active': showFilters }"
          title="Ajustar filtros"
          @click.stop="toggleFilters"
        >
          <i class="fa-solid fa-sliders"></i>
        </button>
        <button
          v-if="isEditing"
          class="icon-btn eye-btn"
          type="button"
          :style="iconBtnStyle"
          title="Ocultar KPI"
          @click.stop="hideModule"
        >
          <i class="fa-regular fa-eye"></i>
        </button>
      </div>
    </header>

    <transition name="fade">
      <div
        v-if="hasFilters && showFilters"
        class="kpi-card__filters floating"
        @mouseenter="cancelHide"
        @mouseleave="scheduleHide"
      >
        <div
          v-for="filterDef in moduleFilters"
          :key="`${moduleId}-${filterDef.key}`"
          class="field-inline"
        >
          <label class="field-label" :style="{ color: subtext }">
            {{ filterDef.label }}
          </label>
          <select
            :value="filterValues[filterDef.key]"
            class="field-select"
            :style="selectStyle"
            @change="onFilterChange(filterDef.key, $event)"
            @blur="scheduleHide"
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

    <div class="kpi-card__body">
      <p v-if="context" class="kpi-card__context" :style="{ color: subtext }">
        {{ context }}
      </p>

      <div class="metric-grid">
        <div
          v-for="metric in metrics"
          :key="metric.id || `${moduleId}-${metric.label}`"
          class="metric-block"
        >
          <span class="metric-label" :style="{ color: subtext }">
            {{ metric.label }}
          </span>
          <span class="metric-value">{{ metric.value }}</span>
          <span v-if="metric.caption" class="metric-caption" :style="{ color: subtext }">
            {{ metric.caption }}
          </span>
        </div>
      </div>

      <div v-if="loadingDashboard" class="kpi-loading" :style="{ color: subtext }">
        Cargando…
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

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

const isEditing = computed(() => Boolean(dashboardState.isEditing.value))
const showFilters = computed(() => dashboardState.activeFilterPanel.value === props.moduleId)

const cardStyle = computed(() => dashboardState.cardStyle.value)
const iconBtnStyle = computed(() => dashboardState.iconBtnStyle.value)
const selectStyle = computed(() => dashboardState.selectStyle.value)
const subtext = computed(() => dashboardState.subtext.value)
const borderColor = computed(() => dashboardState.borderColor.value)
const loadingDashboard = computed(() => Boolean(dashboardState.loadingDashboard.value))

function getOptions(optionsKey) {
  return dashboardState.filterOptionsState[optionsKey] || []
}

function toggleFilters() {
  dashboardState.toggleFilterPanel(props.moduleId)
}

function hideModule() {
  dashboardState.toggleVisibility(props.moduleId)
}

function cancelHide() {
  dashboardState.cancelFilterHide()
}

function scheduleHide() {
  dashboardState.scheduleFilterHide()
}

function onFilterChange(key, event) {
  dashboardState.updateFilter(props.moduleId, key, event.target.value)
  dashboardState.handleFilterInteraction(props.moduleId)
}

function handleMouseLeave() {
  dashboardState.onModuleLeave(props.moduleId)
}
</script>

<style scoped>
.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 1.25rem;
  border: 1px solid transparent;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  background: transparent;
}

.kpi-card:hover {
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.08);
}

.kpi-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom-width: 1px;
}

.kpi-card.editing .kpi-card__head {
  cursor: grab;
}

.kpi-card.editing .kpi-card__head:active {
  cursor: grabbing;
}

.kpi-card__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.kpi-card__title {
  font-size: 1.1rem;
  font-weight: 600;
}

.kpi-card__subtitle {
  font-size: 0.85rem;
}

.kpi-card__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-toggle {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.filter-toggle.is-active,
.kpi-card:hover .filter-toggle {
  opacity: 1;
}

.kpi-card__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.25rem 0.75rem;
}

.kpi-card__filters.floating {
  position: absolute;
  top: 10px;
  right: 18px;
  z-index: 10;
  min-width: 220px;
  border-radius: 1rem;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.15);
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: inherit;
}

.field-inline {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 150px;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-select {
  font-size: 0.82rem;
  border-radius: 0.75rem;
  padding: 0.45rem 0.6rem;
  border-width: 1px;
}

.kpi-card__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem 1.25rem 1.5rem;
}

.kpi-card__context {
  font-size: 0.85rem;
  opacity: 0.9;
}

.metric-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 72px;
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 600;
}

.metric-caption {
  font-size: 0.75rem;
}

.kpi-loading {
  font-size: 0.82rem;
  font-style: italic;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px dashed rgba(15, 23, 42, 0.25);
  cursor: grab;
  background: transparent;
}

.drag-handle:active {
  cursor: grabbing;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 0.85rem;
  transition: filter 0.15s ease;
}

.icon-btn:hover {
  filter: brightness(0.95);
}

@media (max-width: 640px) {
  .kpi-card__filters.floating {
    left: 16px;
    right: 16px;
    width: auto;
  }

  .field-inline {
    width: 100%;
  }
}
</style>
