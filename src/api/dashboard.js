// src/api/dashboard.js
// Funciones auxiliares para consultar (o mockear) los datos del dashboard.

import { dashboardMock, dashboardApiContract, buildDashboardSnapshot } from '@/data/dashboard'

export { dashboardMock, dashboardApiContract, buildDashboardSnapshot } from '@/data/dashboard'

export async function fetchDashboardSnapshot(params = {}) {
  // En producción esto debería llamar al backend usando http.get(...).
  // Como no existe el endpoint aún, devolvemos un mock con latencia simulada.
  await new Promise((resolve) => setTimeout(resolve, 250))
  return buildDashboardSnapshot(params)
}
