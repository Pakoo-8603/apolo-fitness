<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1">
      <div class="mx-auto w-full max-w-[1300px] px-5 py-6 space-y-6">
        <header class="dashboard-head">
          <div>
            <h1 class="dashboard-title" :style="{ color: theme.text }">Panel principal</h1>
            <p class="dashboard-subtitle" :style="{ color: subtext }">
              KPIs dinámicos para monitorear tu operación.
            </p>
          </div>
          <div class="dashboard-actions">
            <button
              v-if="isEditing"
              class="action-btn"
              :style="iconBtnStyle"
              @click="resetLayout"
            >
              Restablecer
            </button>
            <button
              class="action-btn action-btn--primary"
              :class="{ 'is-active': isEditing }"
              :style="editBtnStyle"
              @click="toggleEdit"
              :title="isEditing ? 'Cerrar edición' : 'Editar layout'"
            >
              <span v-if="isEditing">✔</span>
              <span v-else>✎</span>
            </button>
          </div>
        </header>

        <section class="gridstack-wrapper" :class="{ editing: isEditing }">
          <div ref="gridRef" class="grid-stack">
            <div
              v-for="module in renderedModules"
              :key="module.id"
              class="grid-stack-item"
              :data-gs-id="module.id"
              :data-gs-w="module.layout.w"
              :data-gs-h="module.layout.h"
              :data-gs-x="module.layout.x"
              :data-gs-y="module.layout.y"
              data-gs-auto-position="true"
            >
              <div
                class="grid-stack-item-content kpi-card"
                :class="{ editing: isEditing }"
                :style="cardStyle"
                @mouseleave="onModuleLeave(module.id)"
              >
                <header class="kpi-card__head" :style="{ borderColor }">
                  <div class="kpi-card__title-wrap">
                    <button v-if="isEditing" class="drag-handle" type="button" title="Mover KPI">
                      <i class="fa-solid fa-grip-dots"></i>
                    </button>
                    <div>
                      <h3 class="kpi-card__title">{{ module.title }}</h3>
                      <p class="kpi-card__subtitle" :style="{ color: subtext }">
                        {{ module.subtitle }}
                      </p>
                    </div>
                  </div>
                  <div class="kpi-card__actions">
                    <button
                      v-if="module.filters?.length"
                      class="icon-btn filter-toggle"
                      type="button"
                      :style="iconBtnStyle"
                      :class="{ 'is-active': activeFilterPanel === module.id }"
                      title="Ajustar filtros"
                      @click.stop="toggleFilterPanel(module.id)"
                    >
                      <i class="fa-solid fa-sliders"></i>
                    </button>
                    <button
                      v-if="isEditing"
                      class="icon-btn eye-btn"
                      type="button"
                      :style="iconBtnStyle"
                      title="Ocultar KPI"
                      @click.stop="toggleVisibility(module.id)"
                    >
                      <i class="fa-regular fa-eye"></i>
                    </button>
                    <button
                      v-else
                      class="icon-btn refresh-btn"
                      type="button"
                      :style="iconBtnStyle"
                      title="Actualizar KPI"
                      @click="refreshModule(module.id)"
                    >
                      ⟳
                    </button>
                  </div>
                </header>

                <transition name="fade">
                  <div
                    v-if="module.filters?.length && activeFilterPanel === module.id"
                    class="kpi-card__filters floating"
                    @mouseenter="cancelFilterHide"
                    @mouseleave="scheduleFilterHide"
                  >
                    <div
                      v-for="filterDef in module.filters"
                      :key="`${module.id}-${filterDef.key}`"
                      class="field-inline"
                    >
                      <label class="field-label" :style="{ color: subtext }">
                        {{ filterDef.label }}
                      </label>
                      <select
                        v-model="filters[module.id][filterDef.key]"
                        class="field-select"
                        :style="selectStyle"
                        @change="handleFilterInteraction(module.id)"
                        @blur="scheduleFilterHide"
                      >
                        <option
                          v-for="opt in filterOptionsState[filterDef.optionsKey] || []"
                          :key="`${module.id}-${filterDef.key}-${opt.value}`"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                </transition>

                <div class="kpi-card__body">
                  <p
                    v-if="moduleOutputs[module.id]?.context"
                    class="kpi-card__context"
                    :style="{ color: subtext }"
                  >
                    {{ moduleOutputs[module.id].context }}
                  </p>

                  <div class="metric-grid">
                    <div
                      v-for="metric in moduleOutputs[module.id]?.metrics || []"
                      :key="metric.id || `${module.id}-${metric.label}`"
                      class="metric-block"
                    >
                      <span class="metric-label" :style="{ color: subtext }">
                        {{ metric.label }}
                      </span>
                      <span class="metric-value">{{ metric.value }}</span>
                      <span
                        v-if="metric.caption"
                        class="metric-caption"
                        :style="{ color: subtext }"
                      >
                        {{ metric.caption }}
                      </span>
                    </div>
                  </div>

                  <div v-if="loadingDashboard" class="kpi-loading" :style="{ color: subtext }">
                    Cargando…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="isEditing && hiddenModules.length"
          class="hidden-summary"
          :style="{ color: subtext }"
        >
          <span class="hidden-summary__title">KPI ocultos</span>
          <button
            v-for="item in hiddenModules"
            :key="`hidden-${item.id}`"
            type="button"
            class="hidden-chip"
            :style="{ borderColor, background: chipBg, color: chipText }"
            @click="restoreModule(item.id)"
          >
            {{ moduleMap.get(item.id)?.title || item.id }}
          </button>
        </div>

        <div class="text-right">
          <RouterLink :to="{ name: 'PlanesLista' }" class="link-theme">Ver todos los planes</RouterLink>
        </div>
      </div>
    </main>

    <button
      class="fab"
      :style="{ backgroundColor: primary, color: contrastOnPrimary }"
      title="Nuevo miembro"
      @click="modalCliente = true"
    >
      <i class="fa-solid fa-plus"></i>
    </button>
    <button
      class="fab fab--secondary"
      title="Buscar cliente"
      @click="openBuscarModal"
      :style="fabSecondaryStyle"
    >
      <i class="fa-regular fa-clipboard"></i>
    </button>

    <ClienteCrearModal
      v-if="modalCliente"
      v-model:open="modalCliente"
      @close="modalCliente = false"
      @cancel="modalCliente = false"
      @created="onClienteCreado"
      @saved="onClienteCreado"
    />

    <div v-if="modalBuscar" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeBuscarModal"></div>
      <div class="absolute right-6 bottom-24 sm:bottom-28 w-[92vw] max-w-md">
        <div
          class="rounded-2xl border shadow-xl overflow-hidden"
          :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
        >
          <div class="px-4 py-3 border-b flex items-center gap-2" :style="{ borderColor }">
            <i class="fa fa-magnifying-glass" :style="{ color: subtext }"></i>
            <input
              v-model="buscarInput"
              type="text"
              placeholder="Buscar cliente por nombre, email, RFC o CURP…"
              class="flex-1 outline-none text-[14px]"
              :style="{ color: theme.cardText }"
              autofocus
            />
            <button class="icon-btn" :style="iconBtnStyle" @click="closeBuscarModal">✕</button>
          </div>

          <div class="max-h-72 overflow-auto">
            <div v-if="loading.buscar" class="p-3 space-y-2">
              <div class="h-4 rounded animate-pulse" :style="{ background: skeletonBg }"></div>
              <div class="h-4 rounded animate-pulse w-2/3" :style="{ background: skeletonBg }"></div>
              <div class="h-4 rounded animate-pulse w-1/2" :style="{ background: skeletonBg }"></div>
            </div>

            <template v-else>
              <button
                v-for="c in resultados"
                :key="c.id"
                class="w-full text-left px-4 py-2 flex items-center justify-between"
                :style="rowHoverStyle"
                @click="selectCliente(c)"
              >
                <div class="min-w-0">
                  <div class="font-medium truncate" :style="{ color: theme.cardText }">
                    {{ c.nombre }} {{ c.apellidos }}
                  </div>
                  <div class="text-[12px] truncate" :style="{ color: subtext }">
                    {{ c.email || '—' }}
                  </div>
                </div>
                <span
                  class="text-[11px] px-2 py-1 rounded-md border"
                  :style="{ borderColor, background: chipBg, color: chipText }"
                >
                  Ver
                </span>
              </button>
              <div
                v-if="!resultados.length"
                class="px-4 py-8 text-center text-[13px]"
                :style="{ color: subtext }"
              >
                Sin resultados
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition transform duration-200"
      enter-from-class="opacity-0 translate-x-3"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition transform duration-150"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-3"
    >
      <aside
        v-if="panelClienteOpen"
        class="fixed top-0 right-0 h-full w-[420px] shadow-2xl z-40 border-l"
        :style="{ background: theme.cardBg, color: theme.cardText, borderColor }"
      >
        <div class="px-4 py-3 border-b flex items-center justify-between" :style="{ borderColor }">
          <div class="font-semibold truncate max-w-[300px]" :style="{ color: theme.cardText }">
            {{ (resumen && (resumen.nombre + ' ' + (resumen.apellidos || ''))) || 'Cliente' }}
          </div>
          <button class="icon-btn" :style="iconBtnStyle" title="Cerrar" @click="closePanelCliente">
            ✕
          </button>
        </div>
        <div class="p-4 overflow-auto h-[calc(100%-52px)]">
          <ClientSummaryCard
            v-if="resumen"
            :cliente="resumen"
            @ver="verEditar"
            @contacto="() => {}"
            @fiscales="() => {}"
            @cobrar="() => cobrar({ id: resumen.id, nombre: (resumen.nombre || '') + ' ' + (resumen.apellidos || '') })"
            @renovar="() => {}"
          />
        </div>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'
import { useUiConfigStore } from '@/stores/uiConfig'
import ClienteCrearModal from '@/views/clientes/modals/ClienteCrearModal.vue'
import ClientSummaryCard from '@/components/ClientSummaryCard.vue'
import api from '@/api/services'
import http from '@/api/http'
import { fetchDashboardSnapshot, dashboardApiContract, dashboardMock } from '@/api/dashboard'
import {
  kpiDefinitions,
  defaultLayout,
  defaultFilters,
  createFilterOptions,
  initialFilterOptions,
  formatDateLabel,
  formatMonthLabel,
} from '@/data/dashboard'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'

const GRID_COLUMNS = 6
const ROW_HEIGHT = 170
const MAX_COL_SPAN = 3
const MAX_ROW_SPAN = 3
const GRID_MARGIN = 16
const LAYOUT_STORAGE_KEY = 'apolo.dashboard.layout.v3'
const FILTER_STORAGE_KEY = 'apolo.dashboard.filters.v2'

const router = useRouter()
const auth = useAuthStore()
const ws = useWorkspaceStore()
const ui = useUiConfigStore()

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function hexToRgb(hex) {
  const h = hex?.replace('#', '')
  if (!h || (h.length !== 6 && h.length !== 3)) return { r: 15, g: 23, b: 42 }
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function isDark(hex) {
  const { r, g, b } = hexToRgb(hex)
  const L = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
  return L < 0.6
}

const theme = computed(() => {
  const t = ui.theme?.value || ui.theme || {}
  return {
    primary: t.primary || '#1a5eff',
    secondary: t.secondary || '#4ae364',
    text: t.text || '#0f172a',
    cardBg: t.cardBg || '#ffffff',
    cardText: t.cardText || '#0f172a',
    subtext: t.subtext || null,
  }
})

const primary = computed(() => theme.value.primary)
const contrastOnPrimary = computed(() => (isDark(theme.value.primary) ? '#fff' : '#0f172a'))
const subtext = computed(
  () => theme.value.subtext || (isDark(theme.value.text) ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.55)'),
)
const borderColor = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)'))
const skeletonBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.10)' : '#eef2f7'))
const chipBg = computed(() => (isDark(theme.value.text) ? 'rgba(255,255,255,0.08)' : '#fafbfe'))
const chipText = computed(() => theme.value.cardText)
const rowHoverStyle = computed(() => ({ background: 'transparent' }))
const iconBtnStyle = computed(() => ({
  color: theme.value.cardText,
  borderColor: borderColor.value,
  background: 'transparent',
}))
const fabSecondaryStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
  border: `1px solid ${borderColor.value}`,
  boxShadow: '0 8px 24px rgba(0,0,0,.08)',
}))
const selectStyle = computed(() => ({
  color: theme.value.cardText,
  borderColor: borderColor.value,
  background: theme.value.cardBg,
}))

const loading = ref({ dashboard: true, buscar: false, resumen: false })
const dashboardData = ref(null)
const isEditing = ref(false)

const filters = reactive(loadFilters())
const layoutState = ref(loadLayout())
const filterOptionsState = reactive(cloneDeep(initialFilterOptions))
const gridRef = ref(null)
const gridInstance = ref(null)
const activeFilterPanel = ref(null)

let filterHideTimer = null
let pendingGridRefresh = false
let suppressGridSync = false

ensureFiltersStructure()

const moduleMap = new Map(kpiDefinitions.map((def) => [def.id, def]))

const cardStyle = computed(() => ({
  background: theme.value.cardBg,
  color: theme.value.cardText,
  borderColor: borderColor.value,
}))

const editBtnStyle = computed(() => ({
  borderColor: borderColor.value,
  color: isEditing.value ? contrastOnPrimary.value : theme.value.cardText,
  background: isEditing.value ? theme.value.primary : 'transparent',
}))

const layoutOrdered = computed(() => [...layoutState.value].sort((a, b) => a.order - b.order))
const hiddenModules = computed(() => layoutState.value.filter((item) => !item.visible))

const renderedModules = computed(() => {
  const modules = []
  for (const entry of layoutOrdered.value) {
    if (!entry.visible) continue
    const meta = moduleMap.get(entry.id)
    if (!meta) continue
    if (!filters[entry.id]) filters[entry.id] = { ...defaultFilters[entry.id] }
    modules.push({ ...meta, layout: entry })
  }
  return modules
})

const loadingDashboard = computed(() => loading.value.dashboard)

const moduleOutputs = computed(() => {
  const data = dashboardData.value || dashboardMock
  const outputs = {}
  for (const def of kpiDefinitions) {
    const resolver = moduleResolvers[def.id]
    outputs[def.id] = resolver ? resolver(data, filters[def.id] || {}, filterOptionsState) : { metrics: [] }
  }
  return outputs
})

watch(
  () => dashboardData.value,
  (data) => {
    const updated = createFilterOptions(data || dashboardMock)
    for (const key of Object.keys(updated)) {
      filterOptionsState[key] = updated[key]
    }
    ensureFiltersValid()
  },
  { immediate: true },
)

watch(
  layoutState,
  (value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

watch(
  filters,
  (value) => {
    if (typeof window === 'undefined') return
    const plain = {}
    for (const def of kpiDefinitions) {
      plain[def.id] = { ...value[def.id] }
    }
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(plain))
  },
  { deep: true },
)

watch(
  layoutState,
  () => {
    if (suppressGridSync) return
    scheduleGridSync()
  },
  { deep: true },
)

watch(
  () => renderedModules.value.length,
  () => {
    queueGridRefresh()
  },
  { immediate: true },
)

watch(isEditing, (active) => {
  if (gridInstance.value) {
    gridInstance.value.setStatic(!active)
  }
  if (!active) {
    activeFilterPanel.value = null
  }
})

function toggleEdit() {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    activeFilterPanel.value = null
  }
}

function refreshModule() {
  loadDashboard()
}

function toggleVisibility(id) {
  const entry = layoutState.value.find((item) => item.id === id)
  if (!entry) return
  entry.visible = false
  if (activeFilterPanel.value === id) {
    activeFilterPanel.value = null
  }
  reflowLayout()
  queueGridRefresh()
}

function restoreModule(id) {
  const entry = layoutState.value.find((item) => item.id === id)
  if (!entry) return
  entry.visible = true
  if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
    const baseline = layoutState.value
      .filter((item) => item.visible && item.id !== id)
      .reduce((max, item) => Math.max(max, (item.y ?? 0) + item.h), 0)
    entry.x = 0
    entry.y = baseline
  }
  reflowLayout()
  queueGridRefresh()
}

function resetLayout() {
  layoutState.value = normalizeLayout(defaultLayout)
  for (const def of kpiDefinitions) {
    filters[def.id] = { ...defaultFilters[def.id] }
  }
  ensureFiltersValid()
  queueGridRefresh()
}

async function queueGridRefresh() {
  if (pendingGridRefresh) return
  pendingGridRefresh = true
  await nextTick()
  pendingGridRefresh = false
  await rebuildGrid()
}

function scheduleGridSync() {
  if (!gridInstance.value) {
    queueGridRefresh()
    return
  }
  nextTick(() => {
    applyStateToGrid()
  })
}

async function rebuildGrid() {
  destroyGrid()
  if (!renderedModules.value.length) return
  await nextTick()
  initGrid()
}

function reflowLayout() {
  layoutState.value = placeItems(
    layoutState.value.map((item, index) => ({
      ...item,
      order: index + 1,
    })),
  )
}

function initGrid() {
  if (!gridRef.value) return
  const grid = GridStack.init(
    {
      column: GRID_COLUMNS,
      margin: GRID_MARGIN,
      cellHeight: ROW_HEIGHT,
      float: true,
      disableOneColumnMode: false,
      staticGrid: !isEditing.value,
      draggable: { handle: '.drag-handle' },
      resizable: { handles: 'se, e, s' },
    },
    gridRef.value,
  )
  gridInstance.value = grid
  grid.on('change', handleGridChange)
  applyStateToGrid()
}

function destroyGrid() {
  if (!gridInstance.value) return
  gridInstance.value.off('change', handleGridChange)
  gridInstance.value.destroy(false)
  gridInstance.value = null
}

function applyStateToGrid() {
  const grid = gridInstance.value
  if (!grid) return
  grid.batchUpdate()
  for (const entry of layoutState.value) {
    if (!entry.visible) continue
    const el = gridRef.value?.querySelector(`.grid-stack-item[data-gs-id="${entry.id}"]`)
    if (!el) continue
    const width = clamp(entry.w ?? entry.colSpan ?? 1, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))
    const height = clamp(entry.h ?? entry.rowSpan ?? 1, 1, MAX_ROW_SPAN)
    const x = clamp(entry.x ?? 0, 0, GRID_COLUMNS - width)
    const y = Math.max(0, entry.y ?? 0)
    grid.update(el, { x, y, w: width, h: height })
  }
  grid.commit()
}

function handleGridChange() {
  const grid = gridInstance.value
  if (!grid) return
  const nodes = grid.engine?.nodes || []
  suppressGridSync = true
  layoutState.value.forEach((entry) => {
    if (!entry.visible) return
    const node = nodes.find((n) => {
      const id = n.id ?? n.el?.dataset.gsId ?? n.el?.getAttribute('data-gs-id')
      return String(id) === String(entry.id)
    })
    if (!node) return
    entry.x = node.x
    entry.y = node.y
    entry.w = node.w
    entry.h = node.h
  })
  const visible = layoutState.value
    .filter((entry) => entry.visible)
    .slice()
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
  visible.forEach((entry, index) => {
    entry.order = index + 1
  })
  const hidden = layoutState.value.filter((entry) => !entry.visible)
  hidden.forEach((entry, index) => {
    entry.order = visible.length + index + 1
  })
  nextTick(() => {
    suppressGridSync = false
  })
}

function toggleFilterPanel(id) {
  if (activeFilterPanel.value === id) {
    activeFilterPanel.value = null
    return
  }
  cancelFilterHide()
  activeFilterPanel.value = id
}

function scheduleFilterHide() {
  cancelFilterHide()
  if (!activeFilterPanel.value) return
  filterHideTimer = setTimeout(() => {
    activeFilterPanel.value = null
  }, 220)
}

function cancelFilterHide() {
  if (filterHideTimer) {
    clearTimeout(filterHideTimer)
    filterHideTimer = null
  }
}

function handleFilterInteraction() {
  scheduleFilterHide()
}

function onModuleLeave(id) {
  if (activeFilterPanel.value === id) {
    scheduleFilterHide()
  }
}

function normalizeLayout(entries) {
  const map = new Map((entries || []).map((item) => [item.id, item]))
  const prepared = kpiDefinitions.map((def, index) => {
    const saved = map.get(def.id) || {}
    const baseCol = Math.round(saved.w ?? saved.colSpan ?? def.layout.colSpan ?? 1)
    const baseRow = Math.round(saved.h ?? saved.rowSpan ?? def.layout.rowSpan ?? 1)
    const w = clamp(baseCol, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))
    const h = clamp(baseRow, 1, MAX_ROW_SPAN)
    const orderValue = Number(saved.order)
    const order = Number.isFinite(orderValue) ? orderValue : def.layout.order ?? index + 1
    const visible = saved.visible !== false
    const xValue = Number(saved.x)
    const yValue = Number(saved.y)
    const x = Number.isFinite(xValue) ? clamp(Math.round(xValue), 0, GRID_COLUMNS - w) : null
    const y = Number.isFinite(yValue) ? Math.max(0, Math.round(yValue)) : null
    return { id: def.id, w, h, order, visible, x, y }
  })
  return placeItems(prepared)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function placeItems(items) {
  const visible = items.filter((item) => item.visible).sort((a, b) => a.order - b.order)
  const hidden = items.filter((item) => !item.visible).sort((a, b) => a.order - b.order)
  const result = []
  const occupied = []

  const placeGroup = (group) => {
    for (const item of group) {
      const w = clamp(item.w, 1, Math.min(MAX_COL_SPAN, GRID_COLUMNS))
      const h = clamp(item.h, 1, MAX_ROW_SPAN)
      let x = item.x
      let y = item.y
      if (x == null || y == null || overlaps(x, y, w, h, occupied)) {
        const spot = findSpot(w, h, occupied)
        x = spot.x
        y = spot.y
      }
      occupied.push({ x, y, w, h })
      result.push({ ...item, w, h, x, y })
    }
  }

  placeGroup(visible)
  placeGroup(hidden)

  result.sort((a, b) => a.order - b.order)
  result.forEach((entry, index) => {
    entry.order = index + 1
  })
  return result
}

function findSpot(w, h, occupied) {
  let y = 0
  while (true) {
    for (let x = 0; x <= GRID_COLUMNS - w; x += 1) {
      if (!overlaps(x, y, w, h, occupied)) {
        return { x, y }
      }
    }
    y += 1
  }
}

function overlaps(x, y, w, h, nodes) {
  return nodes.some((node) => {
    const intersectsX = x < node.x + node.w && x + w > node.x
    const intersectsY = y < node.y + node.h && y + h > node.y
    return intersectsX && intersectsY
  })
}

function loadLayout() {
  if (typeof window === 'undefined') return normalizeLayout(defaultLayout)
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return normalizeLayout(defaultLayout)
    const parsed = JSON.parse(raw)
    return normalizeLayout(parsed)
  } catch {
    return normalizeLayout(defaultLayout)
  }
}

function loadFilters() {
  const base = cloneDeep(defaultFilters)
  if (typeof window === 'undefined') return base
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    for (const def of kpiDefinitions) {
      base[def.id] = { ...base[def.id], ...(parsed?.[def.id] || {}) }
    }
    return base
  } catch {
    return base
  }
}

function ensureFiltersStructure() {
  for (const def of kpiDefinitions) {
    if (!filters[def.id]) filters[def.id] = { ...defaultFilters[def.id] }
  }
}

function ensureFiltersValid() {
  for (const def of kpiDefinitions) {
    const moduleFilters = filters[def.id] || (filters[def.id] = {})
    const defaults = defaultFilters[def.id] || {}
    for (const filterDef of def.filters || []) {
      const options = filterOptionsState[filterDef.optionsKey] || []
      const current = moduleFilters[filterDef.key]
      const exists = options.some((opt) => String(opt.value) === String(current))
      if (!exists) {
        const fallback =
          defaults[filterDef.key] ??
          options[options.length - 1]?.value ??
          options[0]?.value ??
          ''
        moduleFilters[filterDef.key] = fallback
      }
    }
  }
}
function sumBy(list, key) {
  return (list || []).reduce((sum, item) => sum + Number(item?.[key] ?? 0), 0)
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-MX')
}

function money(value) {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })
}

function calcPercentChange(base, value) {
  const b = Number(base ?? 0)
  const v = Number(value ?? 0)
  if (!Number.isFinite(b) || !Number.isFinite(v)) return null
  if (b === 0) {
    if (v === 0) return 0
    return 100
  }
  return ((v - b) / Math.abs(b)) * 100
}

function formatPercent(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  const prefix = num > 0 ? '+' : ''
  return `${prefix}${num.toFixed(decimals)}%`
}

function monthRangeLabel(months) {
  const ordered = Array.from(new Set((months || []).filter(Boolean))).sort()
  if (!ordered.length) return 'Sin rango'
  if (ordered.length === 1) return formatMonthLabel(ordered[0])
  return `${formatMonthLabel(ordered[0])} → ${formatMonthLabel(ordered[ordered.length - 1])}`
}

function findByMonth(dataset, month) {
  return (dataset || []).find((item) => item?.month === month)
}

function findByDate(dataset, date) {
  return (dataset || []).find((item) => item?.corte === date || item?.date === date)
}

function resolveFinancialTotals(data, filter) {
  const dataset = Array.isArray(data?.ingresosVsGastos) ? data.ingresosVsGastos : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Ingresos', value: '—' },
        { label: 'Gastos', value: '—' },
        { label: 'Margen', value: '—' },
      ],
    }
  }
  let from = filter?.from
  let to = filter?.to
  if (from && to && from > to) [from, to] = [to, from]
  const selection = dataset.filter((item) => {
    if (from && item.month < from) return false
    if (to && item.month > to) return false
    return true
  })
  const range = selection.length ? selection : dataset
  const totalIngresos = sumBy(range, 'ingresos')
  const totalGastos = sumBy(range, 'gastos')
  return {
    context: monthRangeLabel(range.map((item) => item.month)),
    metrics: [
      { label: 'Ingresos', value: money(totalIngresos) },
      { label: 'Gastos', value: money(totalGastos) },
      { label: 'Margen', value: money(totalIngresos - totalGastos) },
    ],
  }
}

function resolveIncomeVariation(data, filter) {
  const baseDataset = Array.isArray(data?.variacionIngresos) && data.variacionIngresos.length
    ? data.variacionIngresos
    : Array.isArray(data?.ingresosVsGastos)
    ? data.ingresosVsGastos.map((item) => ({ month: item.month, total: item.ingresos }))
    : []
  if (!baseDataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Variación', value: '—' },
        { label: 'Mes base', value: '—' },
        { label: 'Mes comparación', value: '—' },
      ],
    }
  }
  const base = findByMonth(baseDataset, filter?.base) ?? baseDataset[0]
  const target = findByMonth(baseDataset, filter?.target) ?? baseDataset[baseDataset.length - 1]
  const baseValue = Number(base?.total ?? base?.ingresos ?? 0)
  const targetValue = Number(target?.total ?? target?.ingresos ?? 0)
  const diff = targetValue - baseValue
  const delta = calcPercentChange(baseValue, targetValue)
  return {
    context: `Comparación ${formatMonthLabel(base?.month)} → ${formatMonthLabel(target?.month)}`,
    metrics: [
      { label: 'Variación', value: formatPercent(delta) },
      { label: formatMonthLabel(base?.month), value: money(baseValue) },
      {
        label: formatMonthLabel(target?.month),
        value: money(targetValue),
        caption: `Diferencia: ${money(diff)}`,
      },
    ],
  }
}

function resolveMemberships(data, filter) {
  const cortesEstado = Array.isArray(data?.estadoMembresias?.cortes) ? data.estadoMembresias.cortes : []
  const cortesPagos = Array.isArray(data?.pagosAlDia?.cortes) ? data.pagosAlDia.cortes : []
  const corteKey = filter?.corte
  const estado = findByDate(cortesEstado, corteKey) ?? cortesEstado[cortesEstado.length - 1] ?? null
  const pagos = findByDate(cortesPagos, corteKey) ?? cortesPagos[cortesPagos.length - 1] ?? null
  const activos = Number(estado?.activos ?? pagos?.activos_totales ?? 0)
  const cancelados = Number(estado?.cancelados ?? 0)
  const suspendidos = Number(estado?.suspendidos ?? 0)
  const activosAlDia = Number(pagos?.activos_al_corriente ?? pagos?.al_dia ?? 0)
  const porcentaje = activos ? (activosAlDia / activos) * 100 : null
  const context = estado?.corte ? `Corte: ${formatDateLabel(estado.corte)}` : 'Sin fecha de corte'
  return {
    context,
    metrics: [
      { label: 'Activos', value: formatNumber(activos) },
      { label: 'Cancelados', value: formatNumber(cancelados) },
      { label: 'Suspendidos', value: formatNumber(suspendidos) },
      {
        label: 'Pagos al día',
        value: formatPercent(porcentaje),
        caption: activos ? `${formatNumber(activosAlDia)} de ${formatNumber(activos)} activos` : 'Sin datos',
      },
    ],
  }
}

function resolveStaffPresence(data, filter) {
  const snapshots = Array.isArray(data?.personalEnGimnasio?.snapshots) ? data.personalEnGimnasio.snapshots : []
  const series = Array.isArray(data?.personalPorHora?.series) ? data.personalPorHora.series : []
  if (!snapshots.length && !series.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'En el gimnasio', value: '—' },
        { label: 'Fuera', value: '—' },
        { label: 'Hora pico', value: '—' },
        { label: 'Promedio por hora', value: '—' },
      ],
    }
  }
  const sucursalId = filter?.sucursalId ?? 'all'
  const targetDate = filter?.fecha || snapshots[snapshots.length - 1]?.date || null

  let selectedSnapshots = []
  if (sucursalId && sucursalId !== 'all') {
    selectedSnapshots = snapshots.filter(
      (snap) => (!targetDate || snap.date === targetDate) && String(snap.sucursal_id) === String(sucursalId),
    )
    if (!selectedSnapshots.length) {
      selectedSnapshots = snapshots.filter((snap) => String(snap.sucursal_id) === String(sucursalId))
    }
  } else {
    selectedSnapshots = snapshots.filter((snap) => !targetDate || snap.date === targetDate)
    if (!selectedSnapshots.length) selectedSnapshots = snapshots
  }

  const contextDate = targetDate || selectedSnapshots[selectedSnapshots.length - 1]?.date || null

  let total = 0
  let dentro = 0
  let fuera = 0
  if (sucursalId && sucursalId !== 'all') {
    const snapshot = selectedSnapshots[selectedSnapshots.length - 1] || null
    total = Number(snapshot?.personal_total ?? 0)
    dentro = Number(snapshot?.personal_en_gimnasio ?? 0)
    fuera =
      snapshot?.personal_fuera != null
        ? Number(snapshot.personal_fuera)
        : Math.max(0, total - dentro)
  } else {
    const aggregated = selectedSnapshots.reduce(
      (acc, item) => {
        const totalItem = Number(item?.personal_total ?? 0)
        const dentroItem = Number(item?.personal_en_gimnasio ?? 0)
        const fueraItem =
          item?.personal_fuera != null
            ? Number(item.personal_fuera)
            : Math.max(0, totalItem - dentroItem)
        acc.total += totalItem
        acc.dentro += dentroItem
        acc.fuera += fueraItem
        return acc
      },
      { total: 0, dentro: 0, fuera: 0 },
    )
    total = aggregated.total
    dentro = aggregated.dentro
    fuera = aggregated.fuera
  }

  let targetSerie = series.find(
    (serie) =>
      (!targetDate || serie.date === targetDate) &&
      (sucursalId === 'all' || String(serie.sucursal_id) === String(sucursalId)),
  )
  if (!targetSerie && sucursalId && sucursalId !== 'all') {
    targetSerie = series.filter((serie) => String(serie.sucursal_id) === String(sucursalId)).pop()
  }
  if (!targetSerie && targetDate) {
    targetSerie = series.filter((serie) => serie.date === targetDate).pop()
  }
  if (!targetSerie) {
    targetSerie = series[series.length - 1]
  }

  const buckets = Array.isArray(targetSerie?.buckets) ? targetSerie.buckets : []
  const busiest = buckets.reduce(
    (acc, bucket) => (bucket.personal > (acc.personal ?? -Infinity) ? bucket : acc),
    { hour: null, personal: 0 },
  )
  const avg = buckets.length
    ? buckets.reduce((sum, bucket) => sum + Number(bucket.personal ?? 0), 0) / buckets.length
    : null

  return {
    context: contextDate ? formatDateLabel(contextDate) : 'Sin fecha seleccionada',
    metrics: [
      {
        label: 'En el gimnasio',
        value: formatNumber(dentro),
        caption: total ? `de ${formatNumber(total)} colaboradores` : '',
      },
      { label: 'Fuera', value: formatNumber(fuera) },
      {
        label: 'Hora pico',
        value: busiest.hour || '—',
        caption: busiest.hour ? `${formatNumber(busiest.personal)} personas` : 'Sin datos',
      },
      {
        label: 'Promedio por hora',
        value: avg != null ? formatNumber(Math.round(avg)) : '—',
        caption: buckets.length ? `${buckets.length} tramos analizados` : 'Sin tramos registrados',
      },
    ],
  }
}

function resolvePlanHighlights(data, filter) {
  const series = Array.isArray(data?.planesRanking?.series) ? data.planesRanking.series : []
  if (!series.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Plan con más personas', value: '—' },
        { label: 'Plan con menos personas', value: '—' },
      ],
    }
  }
  const registro = series.find((item) => item.month === filter?.month) ?? series[series.length - 1]
  const top = registro?.top
  const bottom = registro?.bottom
  return {
    context: registro?.month ? formatMonthLabel(registro.month) : 'Sin mes seleccionado',
    metrics: [
      {
        label: 'Plan con más personas',
        value: top ? formatNumber(top.personas || 0) : '—',
        caption: top?.plan_nombre || '',
      },
      {
        label: 'Plan con menos personas',
        value: bottom ? formatNumber(bottom.personas || 0) : '—',
        caption: bottom?.plan_nombre || '',
      },
    ],
  }
}

function resolveInscriptionGrowth(data, filter) {
  const dataset = Array.isArray(data?.inscripcionesMensuales) ? data.inscripcionesMensuales : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Crecimiento', value: '—' },
        { label: 'Mes base', value: '—' },
        { label: 'Mes comparación', value: '—' },
      ],
    }
  }
  const base = findByMonth(dataset, filter?.from) ?? dataset[0]
  const target = findByMonth(dataset, filter?.to) ?? dataset[dataset.length - 1]
  const baseValue = Number(base?.altas ?? 0)
  const targetValue = Number(target?.altas ?? 0)
  const delta = calcPercentChange(baseValue, targetValue)
  const diff = targetValue - baseValue
  return {
    context: `${formatMonthLabel(base?.month)} → ${formatMonthLabel(target?.month)}`,
    metrics: [
      { label: 'Crecimiento', value: formatPercent(delta) },
      { label: formatMonthLabel(base?.month), value: formatNumber(baseValue) },
      {
        label: formatMonthLabel(target?.month),
        value: formatNumber(targetValue),
        caption: `Diferencia: ${formatNumber(diff)}`,
      },
    ],
  }
}

function resolveCancellations(data, filter) {
  const dataset = Array.isArray(data?.bajasMensuales) ? data.bajasMensuales : []
  if (!dataset.length) {
    return {
      context: 'Sin datos',
      metrics: [
        { label: 'Bajas del mes', value: '—' },
        { label: 'Variación', value: '—' },
        { label: 'Mes anterior', value: '—' },
      ],
    }
  }
  const months = Array.from(new Set(dataset.map((item) => item.month).filter(Boolean))).sort()
  const targetKey = filter?.month || months[months.length - 1]
  let current = dataset.find((item) => item.month === targetKey)
  if (!current) current = dataset[dataset.length - 1]
  const idx = months.indexOf(current?.month)
  const prevKey = idx > 0 ? months[idx - 1] : null
  const prev = prevKey ? dataset.find((item) => item.month === prevKey) : null
  const currentValue = Number(current?.bajas ?? 0)
  const prevValue = Number(prev?.bajas ?? 0)
  const delta = prev ? calcPercentChange(prevValue, currentValue) : null
  return {
    context: formatMonthLabel(current?.month),
    metrics: [
      { label: 'Bajas del mes', value: formatNumber(currentValue) },
      {
        label: 'Variación',
        value: formatPercent(delta),
        caption: prev ? `vs ${formatMonthLabel(prev.month)}` : 'Sin comparación',
      },
      {
        label: prev ? formatMonthLabel(prev.month) : 'Mes anterior',
        value: prev ? formatNumber(prevValue) : '—',
      },
    ],
  }
}

const moduleResolvers = {
  financialTotals: resolveFinancialTotals,
  incomeVariation: resolveIncomeVariation,
  membershipsOverview: resolveMemberships,
  staffPresence: resolveStaffPresence,
  planHighlights: resolvePlanHighlights,
  inscriptionGrowth: resolveInscriptionGrowth,
  cancellations: resolveCancellations,
}

async function loadDashboard() {
  loading.value.dashboard = true
  try {
    const data = await fetchDashboardSnapshot()
    dashboardData.value = data
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.__DASHBOARD_API_CONTRACT__ = dashboardApiContract
    }
  } finally {
    loading.value.dashboard = false
  }
}

onMounted(async () => {
  await nextTick()
  if (!auth.isAuthenticated) return
  await ws.ensureEmpresaSet()
  await loadDashboard()
  await queueGridRefresh()
})

onBeforeUnmount(() => {
  destroyGrid()
  cancelFilterHide()
})

const modalCliente = ref(false)
const modalBuscar = ref(false)
const buscarInput = ref('')
const resultados = ref([])
let tDebounce = null

function openBuscarModal() {
  modalBuscar.value = true
  buscarInput.value = ''
  resultados.value = []
}

function closeBuscarModal() {
  modalBuscar.value = false
}

watch(
  buscarInput,
  (value) => {
    clearTimeout(tDebounce)
    tDebounce = setTimeout(() => {
      doSearch(value)
    }, 300)
  },
  { flush: 'post' },
)

async function doSearch(q) {
  if (!q || !q.trim()) {
    resultados.value = []
    return
  }
  loading.value.buscar = true
  try {
    const { data } = await api.clientes.list({ search: q.trim(), page_size: 10, ordering: '-id' })
    resultados.value = (data?.results || data || []).map((r) => ({
      id: r.id,
      nombre: r.nombre ?? '',
      apellidos: r.apellidos ?? '',
      email: r.email || '—',
    }))
  } finally {
    loading.value.buscar = false
  }
}

const panelClienteOpen = ref(false)
const resumen = ref(null)

function closePanelCliente() {
  panelClienteOpen.value = false
  resumen.value = null
}

async function selectCliente(c) {
  modalBuscar.value = false
  await openResumen(c.id)
}

async function openResumen(id) {
  panelClienteOpen.value = true
  loading.value.resumen = true
  try {
    const { data } = await http.get(`clientes/${id}/resumen/`)
    resumen.value = data || null
  } catch {
    resumen.value = null
  } finally {
    loading.value.resumen = false
  }
}

function verEditar() {
  const id = resumen.value?.id
  if (!id) return
  try {
    router.push({ name: 'ClientesLista', query: { sel: id } })
  } catch {}
}

function onClienteCreado() {
  modalCliente.value = false
}

function cobrar(c) {
  console.log('Cobrar a:', c)
}
</script>

<style scoped>
.dashboard-head {
  @apply flex flex-wrap items-start justify-between gap-4;
}

.dashboard-title {
  @apply text-2xl font-semibold;
}

.dashboard-subtitle {
  @apply text-sm;
}

.dashboard-actions {
  @apply flex items-center gap-3;
}

.action-btn {
  @apply rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-150;
}

.action-btn--primary {
  @apply flex items-center justify-center h-10 w-10 rounded-full border;
}

.action-btn--primary.is-active {
  box-shadow: 0 10px 26px rgba(26, 94, 255, 0.28);
}

.gridstack-wrapper {
  position: relative;
}

.gridstack-wrapper.editing .grid-stack-item-content {
  cursor: grab;
}

.grid-stack {
  min-height: 320px;
}

.grid-stack-item {
  padding: 0 !important;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 1.25rem;
  border: 1px solid transparent;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.kpi-card:hover {
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.08);
}

.kpi-card__head {
  @apply flex items-start justify-between gap-4 px-5 py-4 border-b;
}

.kpi-card.editing .kpi-card__head {
  cursor: grab;
}

.kpi-card.editing .kpi-card__head:active {
  cursor: grabbing;
}

.kpi-card__title-wrap {
  @apply flex items-start gap-3;
}

.kpi-card__title {
  @apply text-lg font-semibold;
}

.kpi-card__subtitle {
  @apply text-sm;
}

.kpi-card__actions {
  @apply flex items-center gap-2;
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
  @apply flex flex-col gap-3;
}

.kpi-card__filters.floating {
  position: absolute;
  top: 64px;
  right: 24px;
  background: v-bind('theme.cardBg');
  border: 1px solid v-bind('borderColor');
  border-radius: 1rem;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
  padding: 1rem;
  min-width: 220px;
  z-index: 20;
}

.field-inline {
  @apply flex flex-col gap-1 min-w-[150px];
}

.field-label {
  @apply text-[11px] uppercase tracking-wide font-semibold;
}

.field-select {
  @apply w-full rounded-lg border px-3 py-2 text-sm focus:outline-none;
}

.field-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, v-bind(primary) 20%, transparent);
}

.kpi-card__body {
  @apply px-5 py-5 flex flex-col gap-4;
}

.kpi-card__context {
  @apply text-sm font-medium;
}

.metric-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.metric-block {
  @apply flex flex-col gap-1;
  min-height: 72px;
}

.metric-label {
  @apply text-[11px] uppercase tracking-wide font-semibold;
}

.metric-value {
  @apply text-2xl font-semibold;
}

.metric-caption {
  @apply text-xs;
}

.kpi-loading {
  @apply text-sm italic;
}

.drag-handle {
  @apply flex items-center justify-center rounded-full text-base;
  width: 32px;
  height: 32px;
  border: 1px dashed color-mix(in srgb, v-bind(primary) 40%, transparent);
  color: v-bind('subtext');
  cursor: grab;
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}

.icon-btn {
  @apply h-9 w-9 rounded-xl grid place-items-center text-sm font-semibold;
  border: 1px solid v-bind('borderColor');
  background: transparent;
  transition: filter 0.15s ease;
}

.icon-btn:hover {
  filter: brightness(0.95);
}

.hidden-summary {
  @apply flex flex-wrap items-center justify-end gap-3 text-sm pt-2;
}

.hidden-summary__title {
  font-weight: 600;
}

.hidden-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 9999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.8125rem;
  border: 1px solid;
  transition: filter 0.15s ease;
}

.hidden-chip:hover {
  filter: brightness(0.95);
}

.link-theme {
  color: v-bind(primary);
}

.link-theme:hover {
  text-decoration: underline;
}

.fab {
  position: fixed;
  right: 1.5rem;
  bottom: 6.5rem;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.fab--secondary {
  right: 1.5rem;
  bottom: 1.5rem;
  height: 3.5rem;
  width: 3.5rem;
  border-radius: 9999px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .kpi-card__filters.floating {
    left: 16px;
    right: 16px;
    width: auto;
  }

  .field-inline {
    @apply w-full;
  }
}
</style>
