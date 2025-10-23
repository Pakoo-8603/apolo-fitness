<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">KPIs y dashboards</h1>
        <p class="text-sm text-slate-500">Configura métricas, fórmulas y tableros interactivos para tu empresa.</p>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="resetDataset">Restablecer dataset demo</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="undo" :disabled="!canUndo">Deshacer</button>
        <button type="button" class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" @click="redo" :disabled="!canRedo">Rehacer</button>
      </div>
    </header>
    <nav class="flex flex-wrap gap-2 text-sm">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="rounded-full px-4 py-2 transition"
        :class="route.name === tab.name ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:text-primary-600 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700'"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>
    <main class="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useKpiStore } from '@/stores/kpis'
import { useWorkspaceStore } from '@/stores/workspace'

const route = useRoute()
const workspace = useWorkspaceStore()
const kpiStore = useKpiStore()

const { activeDashboard, dashboardsForActiveEmpresa } = storeToRefs(kpiStore)

const tabs = computed(() => {
  const fallbackId = activeDashboard.value?.id || dashboardsForActiveEmpresa.value[0]?.id || 1
  return [
    { name: 'KpiDashboard', label: 'Dashboard', to: { name: 'KpiDashboard' } },
    { name: 'KpiMetricEditor', label: 'Editor de KPI', to: { name: 'KpiMetricEditor' } },
    { name: 'KpiDashboardEditor', label: 'Editor de dashboard', to: { name: 'KpiDashboardEditor', params: { id: fallbackId } } },
  ]
})

const canUndo = computed(() => kpiStore.history.past.length > 0)
const canRedo = computed(() => kpiStore.history.future.length > 0)

onMounted(async () => {
  await workspace.ensureEmpresaSet()
  await kpiStore.ensureHydrated()
})

async function resetDataset () {
  const confirmed = window.confirm('Esto restaurará el dataset demo y perderás cambios no guardados. ¿Deseas continuar?')
  if (!confirmed) return
  await kpiStore.restoreSeedDataset()
}

async function undo () {
  if (!canUndo.value) return
  await kpiStore.undo()
}

async function redo () {
  if (!canRedo.value) return
  await kpiStore.redo()
}
</script>
