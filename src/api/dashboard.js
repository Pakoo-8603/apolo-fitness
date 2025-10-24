// src/api/dashboard.js
// Contrato y mocks para el nuevo dashboard financiero / operativo.
// Cada entrada detalla los modelos involucrados en el backend y la estructura
// JSON esperada para que el front pueda pintar los KPI solicitados.

export const dashboardApiContract = {
  ingresosVsGastos: {
    description:
      "Totales mensuales de ingresos (ventas) frente a egresos (gastos) para un rango dado.",
    models: ["ventas.Venta", "finanzas.Egreso"],
    requestExample: {
      empresa_id: 3,
      fecha_desde: "2024-01-01",
      fecha_hasta: "2024-04-30",
    },
    responseExample: {
      results: [
        { month: "2024-01", ingresos: 128450.32, gastos: 80440.8 },
        { month: "2024-02", ingresos: 136890.51, gastos: 85690.11 },
      ],
      totals: { ingresos: 265340.83, gastos: 166130.91 },
    },
  },

  variacionIngresos: {
    description:
      "Serie mensual sólo de ingresos para comparar libremente dos meses y calcular variaciones.",
    models: ["ventas.Venta"],
    requestExample: { empresa_id: 3, fecha_desde: "2024-01-01", fecha_hasta: "2024-12-31" },
    responseExample: {
      months: [
        { month: "2024-01", total: 128450.32 },
        { month: "2024-02", total: 136890.51 },
        { month: "2024-03", total: 141225.77 },
      ],
    },
  },

  estadoMembresias: {
    description:
      "Conteos globales de membresías activas, canceladas y suspendidas a la fecha.",
    models: ["planes.AltaPlan", "clientes.Cliente"],
    requestExample: { empresa_id: 3, fecha_corte: "2024-04-30" },
    responseExample: {
      corte: "2024-04-30",
      counts: { activos: 312, cancelados: 41, suspendidos: 17 },
    },
  },

  pagosAlDia: {
    description:
      "Cuántas membresías activas tienen pagos al día vs el total de activas.",
    models: ["planes.AltaPlan", "ventas.Venta", "ventas.DetalleVenta"],
    requestExample: { empresa_id: 3, fecha_corte: "2024-04-30" },
    responseExample: {
      corte: "2024-04-30",
      activos_totales: 312,
      activos_al_corriente: 265,
    },
  },

  personalEnGimnasio: {
    description:
      "Personal (usuarios empleados) dentro del gimnasio al momento, basado en accesos.",
    models: ["accounts.Usuario", "empleados.UsuarioEmpresa", "accesos.Acceso"],
    requestExample: { empresa_id: 3, sucursal_id: 1 },
    responseExample: {
      timestamp: "2024-04-22T17:30:00Z",
      personal_total: 22,
      personal_en_gimnasio: 15,
      personal_fuera: 7,
    },
  },

  personalPorHora: {
    description:
      "Distribución por hora del personal presente en el gimnasio en un día dado.",
    models: ["accesos.Acceso", "accounts.Usuario"],
    requestExample: { empresa_id: 3, fecha: "2024-04-22" },
    responseExample: {
      date: "2024-04-22",
      buckets: [
        { hour: "06:00", personal: 3 },
        { hour: "07:00", personal: 5 },
        { hour: "08:00", personal: 6 },
      ],
    },
  },

  planesRanking: {
    description:
      "Plan con más personas inscritas y plan con menos personas (activos).",
    models: ["planes.Plan", "planes.AltaPlan"],
    requestExample: { empresa_id: 3, fecha_corte: "2024-04-30" },
    responseExample: {
      corte: "2024-04-30",
      top: { plan_id: 4, plan_nombre: "Plan Élite", personas: 210 },
      bottom: { plan_id: 9, plan_nombre: "Plan Fin de Semana", personas: 14 },
      detalle: [
        { plan_id: 4, plan_nombre: "Plan Élite", personas: 210 },
        { plan_id: 9, plan_nombre: "Plan Fin de Semana", personas: 14 },
      ],
    },
  },

  inscripcionesMensuales: {
    description:
      "Número de altas (inscripciones) por mes para medir crecimiento.",
    models: ["planes.AltaPlan"],
    requestExample: { empresa_id: 3, fecha_desde: "2023-12-01", fecha_hasta: "2024-04-30" },
    responseExample: {
      months: [
        { month: "2024-03", altas: 42 },
        { month: "2024-04", altas: 56 },
      ],
    },
  },

  bajasMensuales: {
    description:
      "Cantidad de bajas/cancelaciones de membresías por mes.",
    models: ["planes.AltaPlan"],
    requestExample: { empresa_id: 3, fecha_desde: "2023-12-01", fecha_hasta: "2024-04-30" },
    responseExample: {
      months: [
        { month: "2024-03", bajas: 9 },
        { month: "2024-04", bajas: 6 },
      ],
    },
  },
};

export const dashboardMock = {
  metadata: {
    months: ["2023-12", "2024-01", "2024-02", "2024-03", "2024-04"],
    currentMonth: "2024-04",
  },
  ingresosVsGastos: [
    { month: "2023-12", ingresos: 98210, gastos: 62410 },
    { month: "2024-01", ingresos: 118450, gastos: 73480 },
    { month: "2024-02", ingresos: 129870, gastos: 80120 },
    { month: "2024-03", ingresos: 136540, gastos: 84560 },
    { month: "2024-04", ingresos: 144980, gastos: 88910 },
  ],
  variacionIngresos: [
    { month: "2023-12", total: 98210 },
    { month: "2024-01", total: 118450 },
    { month: "2024-02", total: 129870 },
    { month: "2024-03", total: 136540 },
    { month: "2024-04", total: 144980 },
  ],
  estadoMembresias: { corte: "2024-04-30", activos: 312, cancelados: 41, suspendidos: 17 },
  pagosAlDia: { corte: "2024-04-30", activos_totales: 312, activos_al_corriente: 265 },
  personalEnGimnasio: {
    timestamp: "2024-04-22T17:30:00Z",
    personal_total: 22,
    personal_en_gimnasio: 15,
    personal_fuera: 7,
  },
  personalPorHora: {
    date: "2024-04-22",
    buckets: [
      { hour: "06:00", personal: 3 },
      { hour: "07:00", personal: 5 },
      { hour: "08:00", personal: 6 },
      { hour: "09:00", personal: 8 },
      { hour: "10:00", personal: 9 },
      { hour: "11:00", personal: 7 },
      { hour: "12:00", personal: 6 },
      { hour: "13:00", personal: 5 },
      { hour: "14:00", personal: 6 },
      { hour: "15:00", personal: 8 },
      { hour: "16:00", personal: 10 },
      { hour: "17:00", personal: 12 },
      { hour: "18:00", personal: 11 },
      { hour: "19:00", personal: 9 },
      { hour: "20:00", personal: 6 },
    ],
  },
  planesRanking: {
    corte: "2024-04-30",
    top: { plan_id: 4, plan_nombre: "Plan Élite", personas: 210 },
    bottom: { plan_id: 9, plan_nombre: "Plan Fin de Semana", personas: 14 },
    detalle: [
      { plan_id: 4, plan_nombre: "Plan Élite", personas: 210 },
      { plan_id: 5, plan_nombre: "Plan Corporativo", personas: 162 },
      { plan_id: 2, plan_nombre: "Plan Mensual", personas: 145 },
      { plan_id: 8, plan_nombre: "Plan Estudiantil", personas: 62 },
      { plan_id: 9, plan_nombre: "Plan Fin de Semana", personas: 14 },
    ],
  },
  inscripcionesMensuales: [
    { month: "2023-12", altas: 28 },
    { month: "2024-01", altas: 36 },
    { month: "2024-02", altas: 44 },
    { month: "2024-03", altas: 52 },
    { month: "2024-04", altas: 61 },
  ],
  bajasMensuales: [
    { month: "2023-12", bajas: 5 },
    { month: "2024-01", bajas: 7 },
    { month: "2024-02", bajas: 6 },
    { month: "2024-03", bajas: 9 },
    { month: "2024-04", bajas: 6 },
  ],
};

export async function fetchDashboardSnapshot() {
  // En producción esto debería llamar al backend usando http.get(...).
  // Como no existe el endpoint aún, devolvemos un mock con latencia simulada.
  await new Promise((resolve) => setTimeout(resolve, 250));
  return JSON.parse(JSON.stringify(dashboardMock));
}

