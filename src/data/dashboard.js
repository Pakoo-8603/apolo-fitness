// src/data/dashboard.js
// Definiciones y datos mockeados que alimentan el dashboard de KPIs.

function monthFormatter(options) {
  return new Intl.DateTimeFormat('es-MX', options)
}

const monthLongFormatter = monthFormatter({ month: 'long', year: 'numeric' })
const monthShortFormatter = monthFormatter({ month: 'short', year: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

export function formatMonthLabel(key) {
  if (!key) return '—'
  try {
    return monthLongFormatter.format(new Date(`${key}-01T00:00:00`))
  } catch {
    return key
  }
}

export function formatMonthShort(key) {
  if (!key) return '—'
  try {
    return monthShortFormatter.format(new Date(`${key}-01T00:00:00`))
  } catch {
    return key
  }
}

export function formatDateLabel(value) {
  if (!value) return '—'
  try {
    return dateFormatter.format(new Date(value))
  } catch {
    return value
  }
}

function uniqueSorted(values = []) {
  return Array.from(new Set(values.filter(Boolean))).sort()
}

function toMonthOptions(values = []) {
  return uniqueSorted(values).map((month) => ({
    value: month,
    label: formatMonthLabel(month),
  }))
}

function toDateOptions(values = []) {
  return uniqueSorted(values).map((date) => ({
    value: date,
    label: formatDateLabel(date),
  }))
}

export const dashboardApiContract = {
  ingresosVsGastos: {
    description:
      'Totales mensuales de ingresos (ventas) frente a egresos (gastos) para un rango dado.',
    models: ['ventas.Venta', 'finanzas.Egreso'],
    requestExample: {
      empresa_id: 3,
      month_from: '2024-01',
      month_to: '2024-04',
    },
    responseExample: {
      results: [
        { month: '2024-01', ingresos: 128450.32, gastos: 80440.8 },
        { month: '2024-02', ingresos: 136890.51, gastos: 85690.11 },
      ],
      totals: { ingresos: 265340.83, gastos: 166130.91 },
    },
  },

  variacionIngresos: {
    description:
      'Serie mensual sólo de ingresos para comparar libremente dos meses y calcular variaciones.',
    models: ['ventas.Venta'],
    requestExample: {
      empresa_id: 3,
      month_from: '2024-01',
      month_to: '2024-12',
    },
    responseExample: {
      months: [
        { month: '2024-01', total: 128450.32 },
        { month: '2024-02', total: 136890.51 },
        { month: '2024-03', total: 141225.77 },
      ],
    },
  },

  estadoMembresias: {
    description:
      'Conteos históricos de membresías activas, canceladas y suspendidas (para filtrar por corte).',
    models: ['planes.AltaPlan', 'clientes.Cliente'],
    requestExample: { empresa_id: 3 },
    responseExample: {
      cortes: [
        { corte: '2024-03-31', activos: 298, cancelados: 38, suspendidos: 12 },
        { corte: '2024-04-30', activos: 312, cancelados: 41, suspendidos: 17 },
      ],
    },
  },

  pagosAlDia: {
    description: 'Cuántas membresías activas tienen pagos al día vs el total de activas.',
    models: ['planes.AltaPlan', 'ventas.Venta', 'ventas.DetalleVenta'],
    requestExample: { empresa_id: 3 },
    responseExample: {
      cortes: [
        { corte: '2024-03-31', activos_totales: 298, activos_al_corriente: 247 },
        { corte: '2024-04-30', activos_totales: 312, activos_al_corriente: 265 },
      ],
    },
  },

  personalEnGimnasio: {
    description:
      'Personal (usuarios empleados) dentro del gimnasio al momento, basado en accesos.',
    models: ['accounts.Usuario', 'empleados.UsuarioEmpresa', 'accesos.Acceso'],
    requestExample: { empresa_id: 3, sucursal_id: 1, fecha: '2024-04-22' },
    responseExample: {
      sucursales: [
        { id: 1, nombre: 'Matriz Centro' },
        { id: 2, nombre: 'Sucursal Norte' },
      ],
      snapshots: [
        {
          date: '2024-04-22',
          sucursal_id: 1,
          timestamp: '2024-04-22T17:30:00Z',
          personal_total: 22,
          personal_en_gimnasio: 15,
          personal_fuera: 7,
        },
      ],
    },
  },

  personalPorHora: {
    description:
      'Distribución por hora del personal presente en el gimnasio en un día y sucursal dados.',
    models: ['accesos.Acceso', 'accounts.Usuario'],
    requestExample: { empresa_id: 3, sucursal_id: 1, fecha: '2024-04-22' },
    responseExample: {
      series: [
        {
          date: '2024-04-22',
          sucursal_id: 1,
          buckets: [
            { hour: '06:00', personal: 3 },
            { hour: '07:00', personal: 5 },
            { hour: '08:00', personal: 6 },
          ],
        },
      ],
    },
  },

  planesRanking: {
    description: 'Planes con más y menos personas activas por mes (ranking completo para listarlo).',
    models: ['planes.Plan', 'planes.AltaPlan'],
    requestExample: { empresa_id: 3, month: '2024-04' },
    responseExample: {
      series: [
        {
          month: '2024-04',
          top: { plan_id: 4, plan_nombre: 'Plan Élite', personas: 210 },
          bottom: { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 14 },
          detalle: [
            { plan_id: 4, plan_nombre: 'Plan Élite', personas: 210 },
            { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 14 },
          ],
        },
      ],
    },
  },

  inscripcionesMensuales: {
    description: 'Número de altas (inscripciones) por mes para medir crecimiento.',
    models: ['planes.AltaPlan'],
    requestExample: { empresa_id: 3, month_from: '2023-12', month_to: '2024-04' },
    responseExample: {
      months: [
        { month: '2024-03', altas: 42 },
        { month: '2024-04', altas: 56 },
      ],
    },
  },

  bajasMensuales: {
    description: 'Cantidad de bajas/cancelaciones de membresías por mes.',
    models: ['planes.AltaPlan'],
    requestExample: { empresa_id: 3, month_from: '2023-12', month_to: '2024-04' },
    responseExample: {
      months: [
        { month: '2024-03', bajas: 9 },
        { month: '2024-04', bajas: 6 },
      ],
    },
  },
}

export const dashboardMock = {
  metadata: {
    months: ['2023-12', '2024-01', '2024-02', '2024-03', '2024-04'],
    currentMonth: '2024-04',
    defaultSucursalId: 1,
  },
  ingresosVsGastos: [
    { month: '2023-12', ingresos: 98210, gastos: 62410 },
    { month: '2024-01', ingresos: 118450, gastos: 73480 },
    { month: '2024-02', ingresos: 129870, gastos: 80120 },
    { month: '2024-03', ingresos: 136540, gastos: 84560 },
    { month: '2024-04', ingresos: 144980, gastos: 88910 },
  ],
  variacionIngresos: [
    { month: '2023-12', total: 98210 },
    { month: '2024-01', total: 118450 },
    { month: '2024-02', total: 129870 },
    { month: '2024-03', total: 136540 },
    { month: '2024-04', total: 144980 },
  ],
  estadoMembresias: {
    cortes: [
      { corte: '2024-03-31', activos: 298, cancelados: 38, suspendidos: 12 },
      { corte: '2024-04-30', activos: 312, cancelados: 41, suspendidos: 17 },
    ],
  },
  pagosAlDia: {
    cortes: [
      { corte: '2024-03-31', activos_totales: 298, activos_al_corriente: 247 },
      { corte: '2024-04-30', activos_totales: 312, activos_al_corriente: 265 },
    ],
  },
  personalEnGimnasio: {
    sucursales: [
      { id: 1, nombre: 'Matriz Centro' },
      { id: 2, nombre: 'Sucursal Norte' },
    ],
    snapshots: [
      {
        date: '2024-04-22',
        sucursal_id: 1,
        timestamp: '2024-04-22T17:30:00Z',
        personal_total: 22,
        personal_en_gimnasio: 15,
        personal_fuera: 7,
      },
      {
        date: '2024-04-22',
        sucursal_id: 2,
        timestamp: '2024-04-22T17:30:00Z',
        personal_total: 12,
        personal_en_gimnasio: 8,
        personal_fuera: 4,
      },
      {
        date: '2024-04-23',
        sucursal_id: 1,
        timestamp: '2024-04-23T17:30:00Z',
        personal_total: 21,
        personal_en_gimnasio: 14,
        personal_fuera: 7,
      },
    ],
  },
  personalPorHora: {
    series: [
      {
        date: '2024-04-22',
        sucursal_id: 1,
        buckets: [
          { hour: '06:00', personal: 3 },
          { hour: '07:00', personal: 5 },
          { hour: '08:00', personal: 6 },
          { hour: '09:00', personal: 8 },
          { hour: '10:00', personal: 9 },
          { hour: '11:00', personal: 7 },
          { hour: '12:00', personal: 6 },
          { hour: '13:00', personal: 5 },
          { hour: '14:00', personal: 6 },
          { hour: '15:00', personal: 8 },
          { hour: '16:00', personal: 10 },
          { hour: '17:00', personal: 12 },
          { hour: '18:00', personal: 11 },
          { hour: '19:00', personal: 9 },
          { hour: '20:00', personal: 6 },
        ],
      },
      {
        date: '2024-04-22',
        sucursal_id: 2,
        buckets: [
          { hour: '06:00', personal: 2 },
          { hour: '07:00', personal: 3 },
          { hour: '08:00', personal: 4 },
          { hour: '09:00', personal: 5 },
          { hour: '10:00', personal: 5 },
          { hour: '11:00', personal: 4 },
          { hour: '12:00', personal: 4 },
          { hour: '13:00', personal: 3 },
          { hour: '14:00', personal: 4 },
          { hour: '15:00', personal: 5 },
          { hour: '16:00', personal: 6 },
          { hour: '17:00', personal: 7 },
          { hour: '18:00', personal: 6 },
          { hour: '19:00', personal: 5 },
          { hour: '20:00', personal: 3 },
        ],
      },
      {
        date: '2024-04-23',
        sucursal_id: 1,
        buckets: [
          { hour: '06:00', personal: 4 },
          { hour: '07:00', personal: 6 },
          { hour: '08:00', personal: 7 },
          { hour: '09:00', personal: 8 },
          { hour: '10:00', personal: 9 },
          { hour: '11:00', personal: 8 },
          { hour: '12:00', personal: 7 },
          { hour: '13:00', personal: 6 },
          { hour: '14:00', personal: 7 },
          { hour: '15:00', personal: 9 },
          { hour: '16:00', personal: 11 },
          { hour: '17:00', personal: 13 },
          { hour: '18:00', personal: 12 },
          { hour: '19:00', personal: 10 },
          { hour: '20:00', personal: 7 },
        ],
      },
    ],
  },
  planesRanking: {
    series: [
      {
        month: '2024-03',
        top: { plan_id: 4, plan_nombre: 'Plan Élite', personas: 198 },
        bottom: { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 11 },
        detalle: [
          { plan_id: 4, plan_nombre: 'Plan Élite', personas: 198 },
          { plan_id: 5, plan_nombre: 'Plan Corporativo', personas: 151 },
          { plan_id: 2, plan_nombre: 'Plan Mensual', personas: 139 },
          { plan_id: 8, plan_nombre: 'Plan Estudiantil', personas: 58 },
          { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 11 },
        ],
      },
      {
        month: '2024-04',
        top: { plan_id: 4, plan_nombre: 'Plan Élite', personas: 210 },
        bottom: { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 14 },
        detalle: [
          { plan_id: 4, plan_nombre: 'Plan Élite', personas: 210 },
          { plan_id: 5, plan_nombre: 'Plan Corporativo', personas: 162 },
          { plan_id: 2, plan_nombre: 'Plan Mensual', personas: 145 },
          { plan_id: 8, plan_nombre: 'Plan Estudiantil', personas: 62 },
          { plan_id: 9, plan_nombre: 'Plan Fin de Semana', personas: 14 },
        ],
      },
    ],
  },
  inscripcionesMensuales: [
    { month: '2023-12', altas: 28 },
    { month: '2024-01', altas: 36 },
    { month: '2024-02', altas: 44 },
    { month: '2024-03', altas: 52 },
    { month: '2024-04', altas: 61 },
  ],
  bajasMensuales: [
    { month: '2023-12', bajas: 5 },
    { month: '2024-01', bajas: 7 },
    { month: '2024-02', bajas: 6 },
    { month: '2024-03', bajas: 9 },
    { month: '2024-04', bajas: 6 },
  ],
}

export function createFilterOptions(data = dashboardMock) {
  const source = data || dashboardMock
  const metadataMonths = source?.metadata?.months ?? []
  const ingresosMonths = (source?.ingresosVsGastos ?? []).map((item) => item.month)
  const variacionMonths = (source?.variacionIngresos ?? []).map((item) => item.month)
  const inscripcionMonths = (source?.inscripcionesMensuales ?? []).map((item) => item.month)
  const bajaMonths = (source?.bajasMensuales ?? []).map((item) => item.month)

  const cortesEstado = source?.estadoMembresias?.cortes ?? []
  const cortesPagos = source?.pagosAlDia?.cortes ?? []

  const membershipCuts = uniqueSorted([
    ...cortesEstado.map((item) => item.corte),
    ...cortesPagos.map((item) => item.corte),
  ]).map((date) => ({ value: date, label: formatDateLabel(date) }))

  const sucursales = source?.personalEnGimnasio?.sucursales ?? []
  const personalSucursales = [
    { value: 'all', label: 'Todas las sucursales' },
    ...sucursales
      .filter((s) => s?.id != null)
      .map((s) => ({ value: String(s.id), label: s.nombre || `Sucursal ${s.id}` })),
  ]

  const personalDates = toDateOptions(
    (source?.personalEnGimnasio?.snapshots ?? []).map((snap) => snap.date),
  )

  const planMonths = toMonthOptions((source?.planesRanking?.series ?? []).map((item) => item.month))

  return {
    financialMonths: toMonthOptions([...metadataMonths, ...ingresosMonths]),
    variationMonths: toMonthOptions([...metadataMonths, ...variacionMonths]),
    membershipCuts,
    personalSucursales,
    personalDates,
    planMonths,
    inscriptionMonths: toMonthOptions([...metadataMonths, ...inscripcionMonths]),
    cancellationMonths: toMonthOptions([...metadataMonths, ...bajaMonths]),
  }
}

const baseFilterOptions = createFilterOptions(dashboardMock)

export const kpiDefinitions = [
  {
    id: 'financialTotals',
    title: 'Ingresos vs gastos',
    subtitle: 'Totales del periodo seleccionado',
    layout: { colSpan: 12, rowSpan: 12, order: 1 },
    filters: [
      { key: 'from', label: 'Desde', optionsKey: 'financialMonths' },
      { key: 'to', label: 'Hasta', optionsKey: 'financialMonths' },
    ],
  },
  {
    id: 'incomeVariation',
    title: 'Variación de ingresos',
    subtitle: 'Comparación entre dos meses',
    layout: { colSpan: 12, rowSpan: 12, order: 2 },
    filters: [
      { key: 'base', label: 'Mes base', optionsKey: 'variationMonths' },
      { key: 'target', label: 'Mes comparación', optionsKey: 'variationMonths' },
    ],
  },
  {
    id: 'membershipsOverview',
    title: 'Estado de membresías',
    subtitle: 'Activos, cancelados y pagos al día',
    layout: { colSpan: 12, rowSpan: 12, order: 3 },
    filters: [{ key: 'corte', label: 'Fecha de corte', optionsKey: 'membershipCuts' }],
  },
  {
    id: 'staffPresence',
    title: 'Personal en el gimnasio',
    subtitle: 'Disponibilidad por sucursal y día',
    layout: { colSpan: 12, rowSpan: 12, order: 4 },
    filters: [
      { key: 'sucursalId', label: 'Sucursal', optionsKey: 'personalSucursales' },
      { key: 'fecha', label: 'Fecha', optionsKey: 'personalDates' },
    ],
  },
  {
    id: 'planHighlights',
    title: 'Planes destacados',
    subtitle: 'Mayor y menor cantidad de personas',
    layout: { colSpan: 12, rowSpan: 12, order: 5 },
    filters: [{ key: 'month', label: 'Mes', optionsKey: 'planMonths' }],
  },
  {
    id: 'inscriptionGrowth',
    title: 'Crecimiento de inscripciones',
    subtitle: 'Compara el desempeño mensual',
    layout: { colSpan: 12, rowSpan: 12, order: 6 },
    filters: [
      { key: 'from', label: 'Mes base', optionsKey: 'inscriptionMonths' },
      { key: 'to', label: 'Mes comparación', optionsKey: 'inscriptionMonths' },
    ],
  },
  {
    id: 'cancellations',
    title: 'Bajas por mes',
    subtitle: 'Seguimiento de cancelaciones',
    layout: { colSpan: 12, rowSpan: 12, order: 7 },
    filters: [{ key: 'month', label: 'Mes', optionsKey: 'cancellationMonths' }],
  },
]

export const defaultLayout = kpiDefinitions.map((def) => ({
  id: def.id,
  colSpan: def.layout.colSpan,
  rowSpan: def.layout.rowSpan,
  order: def.layout.order,
  visible: true,
}))

function firstOptionValue(list, fallback = '') {
  if (!Array.isArray(list) || !list.length) return fallback
  return list[0]?.value ?? fallback
}

function lastOptionValue(list, fallback = '') {
  if (!Array.isArray(list) || !list.length) return fallback
  return list[list.length - 1]?.value ?? fallback
}

function penultimateOptionValue(list, fallback = '') {
  if (!Array.isArray(list) || list.length < 2) return fallback || firstOptionValue(list, fallback)
  return list[list.length - 2]?.value ?? fallback
}

export const defaultFilters = {
  financialTotals: {
    from: firstOptionValue(baseFilterOptions.financialMonths, ''),
    to: lastOptionValue(baseFilterOptions.financialMonths, ''),
  },
  incomeVariation: {
    base: firstOptionValue(baseFilterOptions.variationMonths, ''),
    target: lastOptionValue(baseFilterOptions.variationMonths, ''),
  },
  membershipsOverview: {
    corte: lastOptionValue(baseFilterOptions.membershipCuts, ''),
  },
  staffPresence: {
    sucursalId: firstOptionValue(baseFilterOptions.personalSucursales, 'all'),
    fecha: lastOptionValue(baseFilterOptions.personalDates, ''),
  },
  planHighlights: {
    month: lastOptionValue(baseFilterOptions.planMonths, ''),
  },
  inscriptionGrowth: {
    from: penultimateOptionValue(baseFilterOptions.inscriptionMonths, firstOptionValue(baseFilterOptions.inscriptionMonths, '')),
    to: lastOptionValue(baseFilterOptions.inscriptionMonths, ''),
  },
  cancellations: {
    month: lastOptionValue(baseFilterOptions.cancellationMonths, ''),
  },
}

export const initialFilterOptions = baseFilterOptions
