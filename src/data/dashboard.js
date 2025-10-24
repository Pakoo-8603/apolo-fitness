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
  "metadata": {
    "months": [
      "2024-01",
      "2024-02",
      "2024-03",
      "2024-04",
      "2024-05",
      "2024-06",
      "2024-07",
      "2024-08",
      "2024-09",
      "2024-10",
      "2024-11",
      "2024-12",
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12"
    ],
    "currentMonth": "2025-12",
    "defaultSucursalId": 1
  },
  "ingresosVsGastos": [
    {
      "month": "2024-01",
      "ingresos": 118450.0,
      "gastos": 69511.03
    },
    {
      "month": "2024-02",
      "ingresos": 121533.52,
      "gastos": 76596.24
    },
    {
      "month": "2024-03",
      "ingresos": 124044.48,
      "gastos": 83580.21
    },
    {
      "month": "2024-04",
      "ingresos": 126167.46,
      "gastos": 84580.65
    },
    {
      "month": "2024-05",
      "ingresos": 128187.53,
      "gastos": 81704.22
    },
    {
      "month": "2024-06",
      "ingresos": 131299.99,
      "gastos": 81456.84
    },
    {
      "month": "2024-07",
      "ingresos": 134451.48,
      "gastos": 78180.6
    },
    {
      "month": "2024-08",
      "ingresos": 138229.79,
      "gastos": 85180.67
    },
    {
      "month": "2024-09",
      "ingresos": 139698.18,
      "gastos": 89255.81
    },
    {
      "month": "2024-10",
      "ingresos": 142079.06,
      "gastos": 95809.73
    },
    {
      "month": "2024-11",
      "ingresos": 143153.32,
      "gastos": 92260.72
    },
    {
      "month": "2024-12",
      "ingresos": 146001.37,
      "gastos": 93273.3
    },
    {
      "month": "2025-01",
      "ingresos": 149242.1,
      "gastos": 91653.47
    },
    {
      "month": "2025-02",
      "ingresos": 152971.51,
      "gastos": 98398.91
    },
    {
      "month": "2025-03",
      "ingresos": 155380.83,
      "gastos": 99598.6
    },
    {
      "month": "2025-04",
      "ingresos": 158907.03,
      "gastos": 100280.26
    },
    {
      "month": "2025-05",
      "ingresos": 162484.22,
      "gastos": 104662.96
    },
    {
      "month": "2025-06",
      "ingresos": 166168.9,
      "gastos": 100035.46
    },
    {
      "month": "2025-07",
      "ingresos": 168897.33,
      "gastos": 102457.18
    },
    {
      "month": "2025-08",
      "ingresos": 171647.38,
      "gastos": 111605.37
    },
    {
      "month": "2025-09",
      "ingresos": 176477.84,
      "gastos": 118239.21
    },
    {
      "month": "2025-10",
      "ingresos": 178631.76,
      "gastos": 121206.06
    },
    {
      "month": "2025-11",
      "ingresos": 179936.54,
      "gastos": 111780.55
    },
    {
      "month": "2025-12",
      "ingresos": 181636.15,
      "gastos": 110089.09
    }
  ],
  "variacionIngresos": [
    {
      "month": "2024-01",
      "total": 118450.0
    },
    {
      "month": "2024-02",
      "total": 121533.52
    },
    {
      "month": "2024-03",
      "total": 124044.48
    },
    {
      "month": "2024-04",
      "total": 126167.46
    },
    {
      "month": "2024-05",
      "total": 128187.53
    },
    {
      "month": "2024-06",
      "total": 131299.99
    },
    {
      "month": "2024-07",
      "total": 134451.48
    },
    {
      "month": "2024-08",
      "total": 138229.79
    },
    {
      "month": "2024-09",
      "total": 139698.18
    },
    {
      "month": "2024-10",
      "total": 142079.06
    },
    {
      "month": "2024-11",
      "total": 143153.32
    },
    {
      "month": "2024-12",
      "total": 146001.37
    },
    {
      "month": "2025-01",
      "total": 149242.1
    },
    {
      "month": "2025-02",
      "total": 152971.51
    },
    {
      "month": "2025-03",
      "total": 155380.83
    },
    {
      "month": "2025-04",
      "total": 158907.03
    },
    {
      "month": "2025-05",
      "total": 162484.22
    },
    {
      "month": "2025-06",
      "total": 166168.9
    },
    {
      "month": "2025-07",
      "total": 168897.33
    },
    {
      "month": "2025-08",
      "total": 171647.38
    },
    {
      "month": "2025-09",
      "total": 176477.84
    },
    {
      "month": "2025-10",
      "total": 178631.76
    },
    {
      "month": "2025-11",
      "total": 179936.54
    },
    {
      "month": "2025-12",
      "total": 181636.15
    }
  ],
  "estadoMembresias": {
    "cortes": [
      {
        "corte": "2024-01-31",
        "activos": 292,
        "cancelados": 57,
        "suspendidos": 24
      },
      {
        "corte": "2024-02-29",
        "activos": 295,
        "cancelados": 45,
        "suspendidos": 25
      },
      {
        "corte": "2024-03-31",
        "activos": 299,
        "cancelados": 28,
        "suspendidos": 21
      },
      {
        "corte": "2024-04-30",
        "activos": 303,
        "cancelados": 45,
        "suspendidos": 21
      },
      {
        "corte": "2024-05-31",
        "activos": 306,
        "cancelados": 39,
        "suspendidos": 26
      },
      {
        "corte": "2024-06-30",
        "activos": 309,
        "cancelados": 57,
        "suspendidos": 26
      },
      {
        "corte": "2024-07-31",
        "activos": 310,
        "cancelados": 50,
        "suspendidos": 28
      },
      {
        "corte": "2024-08-31",
        "activos": 311,
        "cancelados": 46,
        "suspendidos": 19
      },
      {
        "corte": "2024-09-30",
        "activos": 316,
        "cancelados": 37,
        "suspendidos": 12
      },
      {
        "corte": "2024-10-31",
        "activos": 321,
        "cancelados": 51,
        "suspendidos": 18
      },
      {
        "corte": "2024-11-30",
        "activos": 324,
        "cancelados": 48,
        "suspendidos": 17
      },
      {
        "corte": "2024-12-31",
        "activos": 327,
        "cancelados": 42,
        "suspendidos": 24
      },
      {
        "corte": "2025-01-31",
        "activos": 329,
        "cancelados": 31,
        "suspendidos": 25
      },
      {
        "corte": "2025-02-28",
        "activos": 332,
        "cancelados": 33,
        "suspendidos": 22
      },
      {
        "corte": "2025-03-31",
        "activos": 336,
        "cancelados": 40,
        "suspendidos": 20
      },
      {
        "corte": "2025-04-30",
        "activos": 337,
        "cancelados": 38,
        "suspendidos": 17
      },
      {
        "corte": "2025-05-31",
        "activos": 339,
        "cancelados": 32,
        "suspendidos": 23
      },
      {
        "corte": "2025-06-30",
        "activos": 344,
        "cancelados": 39,
        "suspendidos": 20
      },
      {
        "corte": "2025-07-31",
        "activos": 345,
        "cancelados": 51,
        "suspendidos": 16
      },
      {
        "corte": "2025-08-31",
        "activos": 349,
        "cancelados": 40,
        "suspendidos": 23
      },
      {
        "corte": "2025-09-30",
        "activos": 353,
        "cancelados": 36,
        "suspendidos": 26
      },
      {
        "corte": "2025-10-31",
        "activos": 356,
        "cancelados": 45,
        "suspendidos": 27
      },
      {
        "corte": "2025-11-30",
        "activos": 360,
        "cancelados": 39,
        "suspendidos": 17
      },
      {
        "corte": "2025-12-31",
        "activos": 362,
        "cancelados": 50,
        "suspendidos": 21
      }
    ]
  },
  "pagosAlDia": {
    "cortes": [
      {
        "corte": "2024-01-31",
        "activos_totales": 292,
        "activos_al_corriente": 248
      },
      {
        "corte": "2024-02-29",
        "activos_totales": 295,
        "activos_al_corriente": 241
      },
      {
        "corte": "2024-03-31",
        "activos_totales": 299,
        "activos_al_corriente": 244
      },
      {
        "corte": "2024-04-30",
        "activos_totales": 303,
        "activos_al_corriente": 246
      },
      {
        "corte": "2024-05-31",
        "activos_totales": 306,
        "activos_al_corriente": 248
      },
      {
        "corte": "2024-06-30",
        "activos_totales": 309,
        "activos_al_corriente": 263
      },
      {
        "corte": "2024-07-31",
        "activos_totales": 310,
        "activos_al_corriente": 264
      },
      {
        "corte": "2024-08-31",
        "activos_totales": 311,
        "activos_al_corriente": 264
      },
      {
        "corte": "2024-09-30",
        "activos_totales": 316,
        "activos_al_corriente": 279
      },
      {
        "corte": "2024-10-31",
        "activos_totales": 321,
        "activos_al_corriente": 270
      },
      {
        "corte": "2024-11-30",
        "activos_totales": 324,
        "activos_al_corriente": 280
      },
      {
        "corte": "2024-12-31",
        "activos_totales": 327,
        "activos_al_corriente": 288
      },
      {
        "corte": "2025-01-31",
        "activos_totales": 329,
        "activos_al_corriente": 277
      },
      {
        "corte": "2025-02-28",
        "activos_totales": 332,
        "activos_al_corriente": 280
      },
      {
        "corte": "2025-03-31",
        "activos_totales": 336,
        "activos_al_corriente": 291
      },
      {
        "corte": "2025-04-30",
        "activos_totales": 337,
        "activos_al_corriente": 274
      },
      {
        "corte": "2025-05-31",
        "activos_totales": 339,
        "activos_al_corriente": 301
      },
      {
        "corte": "2025-06-30",
        "activos_totales": 344,
        "activos_al_corriente": 308
      },
      {
        "corte": "2025-07-31",
        "activos_totales": 345,
        "activos_al_corriente": 287
      },
      {
        "corte": "2025-08-31",
        "activos_totales": 349,
        "activos_al_corriente": 287
      },
      {
        "corte": "2025-09-30",
        "activos_totales": 353,
        "activos_al_corriente": 298
      },
      {
        "corte": "2025-10-31",
        "activos_totales": 356,
        "activos_al_corriente": 308
      },
      {
        "corte": "2025-11-30",
        "activos_totales": 360,
        "activos_al_corriente": 316
      },
      {
        "corte": "2025-12-31",
        "activos_totales": 362,
        "activos_al_corriente": 291
      }
    ]
  },
  "personalEnGimnasio": {
    "sucursales": [
      {
        "id": 1,
        "nombre": "Matriz Centro"
      },
      {
        "id": 2,
        "nombre": "Sucursal Norte"
      }
    ],
    "snapshots": [
      {
        "date": "2024-01-22",
        "sucursal_id": 1,
        "timestamp": "2024-01-22T17:30:00Z",
        "personal_total": 28,
        "personal_en_gimnasio": 22,
        "personal_fuera": 6
      },
      {
        "date": "2024-01-22",
        "sucursal_id": 2,
        "timestamp": "2024-01-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 14,
        "personal_fuera": 6
      },
      {
        "date": "2024-02-22",
        "sucursal_id": 1,
        "timestamp": "2024-02-22T17:30:00Z",
        "personal_total": 22,
        "personal_en_gimnasio": 14,
        "personal_fuera": 8
      },
      {
        "date": "2024-02-22",
        "sucursal_id": 2,
        "timestamp": "2024-02-22T17:30:00Z",
        "personal_total": 21,
        "personal_en_gimnasio": 15,
        "personal_fuera": 6
      },
      {
        "date": "2024-03-22",
        "sucursal_id": 1,
        "timestamp": "2024-03-22T17:30:00Z",
        "personal_total": 29,
        "personal_en_gimnasio": 19,
        "personal_fuera": 10
      },
      {
        "date": "2024-03-22",
        "sucursal_id": 2,
        "timestamp": "2024-03-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 15,
        "personal_fuera": 8
      },
      {
        "date": "2024-04-22",
        "sucursal_id": 1,
        "timestamp": "2024-04-22T17:30:00Z",
        "personal_total": 28,
        "personal_en_gimnasio": 18,
        "personal_fuera": 10
      },
      {
        "date": "2024-04-22",
        "sucursal_id": 2,
        "timestamp": "2024-04-22T17:30:00Z",
        "personal_total": 22,
        "personal_en_gimnasio": 14,
        "personal_fuera": 8
      },
      {
        "date": "2024-05-22",
        "sucursal_id": 1,
        "timestamp": "2024-05-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 11,
        "personal_fuera": 9
      },
      {
        "date": "2024-05-22",
        "sucursal_id": 2,
        "timestamp": "2024-05-22T17:30:00Z",
        "personal_total": 16,
        "personal_en_gimnasio": 9,
        "personal_fuera": 7
      },
      {
        "date": "2024-06-22",
        "sucursal_id": 1,
        "timestamp": "2024-06-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 15,
        "personal_fuera": 5
      },
      {
        "date": "2024-06-22",
        "sucursal_id": 2,
        "timestamp": "2024-06-22T17:30:00Z",
        "personal_total": 18,
        "personal_en_gimnasio": 10,
        "personal_fuera": 8
      },
      {
        "date": "2024-07-22",
        "sucursal_id": 1,
        "timestamp": "2024-07-22T17:30:00Z",
        "personal_total": 22,
        "personal_en_gimnasio": 17,
        "personal_fuera": 5
      },
      {
        "date": "2024-07-22",
        "sucursal_id": 2,
        "timestamp": "2024-07-22T17:30:00Z",
        "personal_total": 13,
        "personal_en_gimnasio": 10,
        "personal_fuera": 3
      },
      {
        "date": "2024-08-22",
        "sucursal_id": 1,
        "timestamp": "2024-08-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 15,
        "personal_fuera": 5
      },
      {
        "date": "2024-08-22",
        "sucursal_id": 2,
        "timestamp": "2024-08-22T17:30:00Z",
        "personal_total": 15,
        "personal_en_gimnasio": 11,
        "personal_fuera": 4
      },
      {
        "date": "2024-09-22",
        "sucursal_id": 1,
        "timestamp": "2024-09-22T17:30:00Z",
        "personal_total": 29,
        "personal_en_gimnasio": 18,
        "personal_fuera": 11
      },
      {
        "date": "2024-09-22",
        "sucursal_id": 2,
        "timestamp": "2024-09-22T17:30:00Z",
        "personal_total": 24,
        "personal_en_gimnasio": 16,
        "personal_fuera": 8
      },
      {
        "date": "2024-10-22",
        "sucursal_id": 1,
        "timestamp": "2024-10-22T17:30:00Z",
        "personal_total": 28,
        "personal_en_gimnasio": 22,
        "personal_fuera": 6
      },
      {
        "date": "2024-10-22",
        "sucursal_id": 2,
        "timestamp": "2024-10-22T17:30:00Z",
        "personal_total": 15,
        "personal_en_gimnasio": 12,
        "personal_fuera": 3
      },
      {
        "date": "2024-11-22",
        "sucursal_id": 1,
        "timestamp": "2024-11-22T17:30:00Z",
        "personal_total": 24,
        "personal_en_gimnasio": 18,
        "personal_fuera": 6
      },
      {
        "date": "2024-11-22",
        "sucursal_id": 2,
        "timestamp": "2024-11-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 15,
        "personal_fuera": 5
      },
      {
        "date": "2024-12-22",
        "sucursal_id": 1,
        "timestamp": "2024-12-22T17:30:00Z",
        "personal_total": 26,
        "personal_en_gimnasio": 20,
        "personal_fuera": 6
      },
      {
        "date": "2024-12-22",
        "sucursal_id": 2,
        "timestamp": "2024-12-22T17:30:00Z",
        "personal_total": 16,
        "personal_en_gimnasio": 10,
        "personal_fuera": 6
      },
      {
        "date": "2025-01-22",
        "sucursal_id": 1,
        "timestamp": "2025-01-22T17:30:00Z",
        "personal_total": 22,
        "personal_en_gimnasio": 17,
        "personal_fuera": 5
      },
      {
        "date": "2025-01-22",
        "sucursal_id": 2,
        "timestamp": "2025-01-22T17:30:00Z",
        "personal_total": 24,
        "personal_en_gimnasio": 13,
        "personal_fuera": 11
      },
      {
        "date": "2025-02-22",
        "sucursal_id": 1,
        "timestamp": "2025-02-22T17:30:00Z",
        "personal_total": 24,
        "personal_en_gimnasio": 14,
        "personal_fuera": 10
      },
      {
        "date": "2025-02-22",
        "sucursal_id": 2,
        "timestamp": "2025-02-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 11,
        "personal_fuera": 9
      },
      {
        "date": "2025-03-22",
        "sucursal_id": 1,
        "timestamp": "2025-03-22T17:30:00Z",
        "personal_total": 21,
        "personal_en_gimnasio": 14,
        "personal_fuera": 7
      },
      {
        "date": "2025-03-22",
        "sucursal_id": 2,
        "timestamp": "2025-03-22T17:30:00Z",
        "personal_total": 17,
        "personal_en_gimnasio": 10,
        "personal_fuera": 7
      },
      {
        "date": "2025-04-22",
        "sucursal_id": 1,
        "timestamp": "2025-04-22T17:30:00Z",
        "personal_total": 21,
        "personal_en_gimnasio": 12,
        "personal_fuera": 9
      },
      {
        "date": "2025-04-22",
        "sucursal_id": 2,
        "timestamp": "2025-04-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 18,
        "personal_fuera": 5
      },
      {
        "date": "2025-05-22",
        "sucursal_id": 1,
        "timestamp": "2025-05-22T17:30:00Z",
        "personal_total": 26,
        "personal_en_gimnasio": 18,
        "personal_fuera": 8
      },
      {
        "date": "2025-05-22",
        "sucursal_id": 2,
        "timestamp": "2025-05-22T17:30:00Z",
        "personal_total": 17,
        "personal_en_gimnasio": 11,
        "personal_fuera": 6
      },
      {
        "date": "2025-06-22",
        "sucursal_id": 1,
        "timestamp": "2025-06-22T17:30:00Z",
        "personal_total": 19,
        "personal_en_gimnasio": 14,
        "personal_fuera": 5
      },
      {
        "date": "2025-06-22",
        "sucursal_id": 2,
        "timestamp": "2025-06-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 14,
        "personal_fuera": 9
      },
      {
        "date": "2025-07-22",
        "sucursal_id": 1,
        "timestamp": "2025-07-22T17:30:00Z",
        "personal_total": 25,
        "personal_en_gimnasio": 15,
        "personal_fuera": 10
      },
      {
        "date": "2025-07-22",
        "sucursal_id": 2,
        "timestamp": "2025-07-22T17:30:00Z",
        "personal_total": 21,
        "personal_en_gimnasio": 13,
        "personal_fuera": 8
      },
      {
        "date": "2025-08-22",
        "sucursal_id": 1,
        "timestamp": "2025-08-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 12,
        "personal_fuera": 8
      },
      {
        "date": "2025-08-22",
        "sucursal_id": 2,
        "timestamp": "2025-08-22T17:30:00Z",
        "personal_total": 19,
        "personal_en_gimnasio": 13,
        "personal_fuera": 6
      },
      {
        "date": "2025-09-22",
        "sucursal_id": 1,
        "timestamp": "2025-09-22T17:30:00Z",
        "personal_total": 30,
        "personal_en_gimnasio": 21,
        "personal_fuera": 9
      },
      {
        "date": "2025-09-22",
        "sucursal_id": 2,
        "timestamp": "2025-09-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 15,
        "personal_fuera": 8
      },
      {
        "date": "2025-10-22",
        "sucursal_id": 1,
        "timestamp": "2025-10-22T17:30:00Z",
        "personal_total": 20,
        "personal_en_gimnasio": 15,
        "personal_fuera": 5
      },
      {
        "date": "2025-10-22",
        "sucursal_id": 2,
        "timestamp": "2025-10-22T17:30:00Z",
        "personal_total": 18,
        "personal_en_gimnasio": 13,
        "personal_fuera": 5
      },
      {
        "date": "2025-11-22",
        "sucursal_id": 1,
        "timestamp": "2025-11-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 13,
        "personal_fuera": 10
      },
      {
        "date": "2025-11-22",
        "sucursal_id": 2,
        "timestamp": "2025-11-22T17:30:00Z",
        "personal_total": 23,
        "personal_en_gimnasio": 16,
        "personal_fuera": 7
      },
      {
        "date": "2025-12-22",
        "sucursal_id": 1,
        "timestamp": "2025-12-22T17:30:00Z",
        "personal_total": 24,
        "personal_en_gimnasio": 14,
        "personal_fuera": 10
      },
      {
        "date": "2025-12-22",
        "sucursal_id": 2,
        "timestamp": "2025-12-22T17:30:00Z",
        "personal_total": 21,
        "personal_en_gimnasio": 17,
        "personal_fuera": 4
      }
    ]
  },
  "personalPorHora": {
    "series": [
      {
        "date": "2024-04-22",
        "sucursal_id": 1,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 2
          },
          {
            "hour": "07:00",
            "personal": 3
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 8
          },
          {
            "hour": "10:00",
            "personal": 9
          },
          {
            "hour": "11:00",
            "personal": 9
          },
          {
            "hour": "12:00",
            "personal": 6
          },
          {
            "hour": "13:00",
            "personal": 7
          },
          {
            "hour": "14:00",
            "personal": 6
          },
          {
            "hour": "15:00",
            "personal": 8
          },
          {
            "hour": "16:00",
            "personal": 11
          },
          {
            "hour": "17:00",
            "personal": 12
          },
          {
            "hour": "18:00",
            "personal": 12
          },
          {
            "hour": "19:00",
            "personal": 7
          },
          {
            "hour": "20:00",
            "personal": 8
          }
        ]
      },
      {
        "date": "2024-04-22",
        "sucursal_id": 2,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 2
          },
          {
            "hour": "07:00",
            "personal": 6
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 8
          },
          {
            "hour": "10:00",
            "personal": 8
          },
          {
            "hour": "11:00",
            "personal": 6
          },
          {
            "hour": "12:00",
            "personal": 5
          },
          {
            "hour": "13:00",
            "personal": 7
          },
          {
            "hour": "14:00",
            "personal": 5
          },
          {
            "hour": "15:00",
            "personal": 7
          },
          {
            "hour": "16:00",
            "personal": 12
          },
          {
            "hour": "17:00",
            "personal": 13
          },
          {
            "hour": "18:00",
            "personal": 11
          },
          {
            "hour": "19:00",
            "personal": 8
          },
          {
            "hour": "20:00",
            "personal": 8
          }
        ]
      },
      {
        "date": "2024-10-22",
        "sucursal_id": 1,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 4
          },
          {
            "hour": "07:00",
            "personal": 4
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 9
          },
          {
            "hour": "10:00",
            "personal": 9
          },
          {
            "hour": "11:00",
            "personal": 8
          },
          {
            "hour": "12:00",
            "personal": 8
          },
          {
            "hour": "13:00",
            "personal": 3
          },
          {
            "hour": "14:00",
            "personal": 5
          },
          {
            "hour": "15:00",
            "personal": 10
          },
          {
            "hour": "16:00",
            "personal": 11
          },
          {
            "hour": "17:00",
            "personal": 12
          },
          {
            "hour": "18:00",
            "personal": 10
          },
          {
            "hour": "19:00",
            "personal": 9
          },
          {
            "hour": "20:00",
            "personal": 6
          }
        ]
      },
      {
        "date": "2024-10-22",
        "sucursal_id": 2,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 1
          },
          {
            "hour": "07:00",
            "personal": 4
          },
          {
            "hour": "08:00",
            "personal": 6
          },
          {
            "hour": "09:00",
            "personal": 7
          },
          {
            "hour": "10:00",
            "personal": 10
          },
          {
            "hour": "11:00",
            "personal": 8
          },
          {
            "hour": "12:00",
            "personal": 7
          },
          {
            "hour": "13:00",
            "personal": 6
          },
          {
            "hour": "14:00",
            "personal": 8
          },
          {
            "hour": "15:00",
            "personal": 8
          },
          {
            "hour": "16:00",
            "personal": 9
          },
          {
            "hour": "17:00",
            "personal": 14
          },
          {
            "hour": "18:00",
            "personal": 11
          },
          {
            "hour": "19:00",
            "personal": 10
          },
          {
            "hour": "20:00",
            "personal": 6
          }
        ]
      },
      {
        "date": "2025-04-22",
        "sucursal_id": 1,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 3
          },
          {
            "hour": "07:00",
            "personal": 4
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 8
          },
          {
            "hour": "10:00",
            "personal": 9
          },
          {
            "hour": "11:00",
            "personal": 8
          },
          {
            "hour": "12:00",
            "personal": 8
          },
          {
            "hour": "13:00",
            "personal": 4
          },
          {
            "hour": "14:00",
            "personal": 8
          },
          {
            "hour": "15:00",
            "personal": 6
          },
          {
            "hour": "16:00",
            "personal": 8
          },
          {
            "hour": "17:00",
            "personal": 11
          },
          {
            "hour": "18:00",
            "personal": 11
          },
          {
            "hour": "19:00",
            "personal": 10
          },
          {
            "hour": "20:00",
            "personal": 5
          }
        ]
      },
      {
        "date": "2025-04-22",
        "sucursal_id": 2,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 3
          },
          {
            "hour": "07:00",
            "personal": 7
          },
          {
            "hour": "08:00",
            "personal": 5
          },
          {
            "hour": "09:00",
            "personal": 7
          },
          {
            "hour": "10:00",
            "personal": 8
          },
          {
            "hour": "11:00",
            "personal": 5
          },
          {
            "hour": "12:00",
            "personal": 7
          },
          {
            "hour": "13:00",
            "personal": 3
          },
          {
            "hour": "14:00",
            "personal": 5
          },
          {
            "hour": "15:00",
            "personal": 6
          },
          {
            "hour": "16:00",
            "personal": 10
          },
          {
            "hour": "17:00",
            "personal": 13
          },
          {
            "hour": "18:00",
            "personal": 12
          },
          {
            "hour": "19:00",
            "personal": 11
          },
          {
            "hour": "20:00",
            "personal": 5
          }
        ]
      },
      {
        "date": "2025-10-22",
        "sucursal_id": 1,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 4
          },
          {
            "hour": "07:00",
            "personal": 6
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 9
          },
          {
            "hour": "10:00",
            "personal": 8
          },
          {
            "hour": "11:00",
            "personal": 5
          },
          {
            "hour": "12:00",
            "personal": 7
          },
          {
            "hour": "13:00",
            "personal": 5
          },
          {
            "hour": "14:00",
            "personal": 5
          },
          {
            "hour": "15:00",
            "personal": 6
          },
          {
            "hour": "16:00",
            "personal": 8
          },
          {
            "hour": "17:00",
            "personal": 13
          },
          {
            "hour": "18:00",
            "personal": 10
          },
          {
            "hour": "19:00",
            "personal": 8
          },
          {
            "hour": "20:00",
            "personal": 5
          }
        ]
      },
      {
        "date": "2025-10-22",
        "sucursal_id": 2,
        "buckets": [
          {
            "hour": "06:00",
            "personal": 3
          },
          {
            "hour": "07:00",
            "personal": 5
          },
          {
            "hour": "08:00",
            "personal": 7
          },
          {
            "hour": "09:00",
            "personal": 10
          },
          {
            "hour": "10:00",
            "personal": 11
          },
          {
            "hour": "11:00",
            "personal": 6
          },
          {
            "hour": "12:00",
            "personal": 4
          },
          {
            "hour": "13:00",
            "personal": 4
          },
          {
            "hour": "14:00",
            "personal": 6
          },
          {
            "hour": "15:00",
            "personal": 8
          },
          {
            "hour": "16:00",
            "personal": 8
          },
          {
            "hour": "17:00",
            "personal": 10
          },
          {
            "hour": "18:00",
            "personal": 10
          },
          {
            "hour": "19:00",
            "personal": 9
          },
          {
            "hour": "20:00",
            "personal": 5
          }
        ]
      }
    ]
  },
  "planesRanking": {
    "series": [
      {
        "month": "2024-01",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 204
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 9
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 204
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 148
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 139
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 51
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 9
          }
        ]
      },
      {
        "month": "2024-02",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 194
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 9
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 194
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 146
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 146
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 65
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 9
          }
        ]
      },
      {
        "month": "2024-03",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 205
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 16
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 205
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 155
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 135
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 56
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 16
          }
        ]
      },
      {
        "month": "2024-04",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 199
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 18
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 199
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 155
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 152
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 54
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 18
          }
        ]
      },
      {
        "month": "2024-05",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 185
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 14
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 185
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 173
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 142
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 69
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 14
          }
        ]
      },
      {
        "month": "2024-06",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 217
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 19
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 217
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 156
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 160
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 58
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 19
          }
        ]
      },
      {
        "month": "2024-07",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 198
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 19
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 198
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 163
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 144
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 53
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 19
          }
        ]
      },
      {
        "month": "2024-08",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 182
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 11
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 182
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 181
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 165
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 63
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 11
          }
        ]
      },
      {
        "month": "2024-09",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 212
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 20
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 212
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 182
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 135
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 50
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 20
          }
        ]
      },
      {
        "month": "2024-10",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 180
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 10
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 180
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 178
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 146
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 56
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 10
          }
        ]
      },
      {
        "month": "2024-11",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 220
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 9
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 220
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 155
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 140
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 66
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 9
          }
        ]
      },
      {
        "month": "2024-12",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 200
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 10
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 200
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 159
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 156
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 64
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 10
          }
        ]
      },
      {
        "month": "2025-01",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 216
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 19
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 216
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 145
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 158
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 59
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 19
          }
        ]
      },
      {
        "month": "2025-02",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 196
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 16
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 196
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 168
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 145
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 62
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 16
          }
        ]
      },
      {
        "month": "2025-03",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 183
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 15
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 183
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 180
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 148
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 58
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 15
          }
        ]
      },
      {
        "month": "2025-04",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 192
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 14
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 192
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 168
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 149
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 61
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 14
          }
        ]
      },
      {
        "month": "2025-05",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 221
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 15
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 221
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 177
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 162
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 68
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 15
          }
        ]
      },
      {
        "month": "2025-06",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 220
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 18
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 220
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 155
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 140
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 62
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 18
          }
        ]
      },
      {
        "month": "2025-07",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 195
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 12
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 195
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 176
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 153
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 56
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 12
          }
        ]
      },
      {
        "month": "2025-08",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 216
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 19
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 216
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 159
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 163
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 64
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 19
          }
        ]
      },
      {
        "month": "2025-09",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 224
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 14
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 224
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 147
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 164
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 71
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 14
          }
        ]
      },
      {
        "month": "2025-10",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 196
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 16
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 196
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 181
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 134
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 56
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 16
          }
        ]
      },
      {
        "month": "2025-11",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 181
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 19
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 181
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 146
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 133
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 56
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 19
          }
        ]
      },
      {
        "month": "2025-12",
        "top": {
          "plan_id": 4,
          "plan_nombre": "Plan Élite",
          "personas": 209
        },
        "bottom": {
          "plan_id": 9,
          "plan_nombre": "Plan Fin de Semana",
          "personas": 12
        },
        "detalle": [
          {
            "plan_id": 4,
            "plan_nombre": "Plan Élite",
            "personas": 209
          },
          {
            "plan_id": 5,
            "plan_nombre": "Plan Corporativo",
            "personas": 152
          },
          {
            "plan_id": 2,
            "plan_nombre": "Plan Mensual",
            "personas": 156
          },
          {
            "plan_id": 8,
            "plan_nombre": "Plan Estudiantil",
            "personas": 65
          },
          {
            "plan_id": 9,
            "plan_nombre": "Plan Fin de Semana",
            "personas": 12
          }
        ]
      }
    ]
  },
  "inscripcionesMensuales": [
    {
      "month": "2024-01",
      "altas": 43
    },
    {
      "month": "2024-02",
      "altas": 44
    },
    {
      "month": "2024-03",
      "altas": 43
    },
    {
      "month": "2024-04",
      "altas": 39
    },
    {
      "month": "2024-05",
      "altas": 41
    },
    {
      "month": "2024-06",
      "altas": 41
    },
    {
      "month": "2024-07",
      "altas": 34
    },
    {
      "month": "2024-08",
      "altas": 31
    },
    {
      "month": "2024-09",
      "altas": 33
    },
    {
      "month": "2024-10",
      "altas": 35
    },
    {
      "month": "2024-11",
      "altas": 36
    },
    {
      "month": "2024-12",
      "altas": 37
    },
    {
      "month": "2025-01",
      "altas": 51
    },
    {
      "month": "2025-02",
      "altas": 57
    },
    {
      "month": "2025-03",
      "altas": 55
    },
    {
      "month": "2025-04",
      "altas": 55
    },
    {
      "month": "2025-05",
      "altas": 52
    },
    {
      "month": "2025-06",
      "altas": 52
    },
    {
      "month": "2025-07",
      "altas": 46
    },
    {
      "month": "2025-08",
      "altas": 43
    },
    {
      "month": "2025-09",
      "altas": 41
    },
    {
      "month": "2025-10",
      "altas": 40
    },
    {
      "month": "2025-11",
      "altas": 45
    },
    {
      "month": "2025-12",
      "altas": 46
    }
  ],
  "bajasMensuales": [
    {
      "month": "2024-01",
      "bajas": 4
    },
    {
      "month": "2024-02",
      "bajas": 7
    },
    {
      "month": "2024-03",
      "bajas": 8
    },
    {
      "month": "2024-04",
      "bajas": 6
    },
    {
      "month": "2024-05",
      "bajas": 6
    },
    {
      "month": "2024-06",
      "bajas": 5
    },
    {
      "month": "2024-07",
      "bajas": 4
    },
    {
      "month": "2024-08",
      "bajas": 6
    },
    {
      "month": "2024-09",
      "bajas": 5
    },
    {
      "month": "2024-10",
      "bajas": 4
    },
    {
      "month": "2024-11",
      "bajas": 4
    },
    {
      "month": "2024-12",
      "bajas": 7
    },
    {
      "month": "2025-01",
      "bajas": 7
    },
    {
      "month": "2025-02",
      "bajas": 7
    },
    {
      "month": "2025-03",
      "bajas": 9
    },
    {
      "month": "2025-04",
      "bajas": 8
    },
    {
      "month": "2025-05",
      "bajas": 8
    },
    {
      "month": "2025-06",
      "bajas": 6
    },
    {
      "month": "2025-07",
      "bajas": 5
    },
    {
      "month": "2025-08",
      "bajas": 7
    },
    {
      "month": "2025-09",
      "bajas": 6
    },
    {
      "month": "2025-10",
      "bajas": 5
    },
    {
      "month": "2025-11",
      "bajas": 8
    },
    {
      "month": "2025-12",
      "bajas": 6
    }
  ]
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
