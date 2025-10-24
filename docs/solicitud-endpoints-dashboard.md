# Solicitud de endpoints para abastecer el dashboard de KPIs

Este documento detalla la creación de endpoints en el backend que permitan alimentar el dashboard actual de métricas del gimnasio. La información se basa en el contrato de datos definido en `src/data/dashboard.js`, por lo que cada endpoint contempla los modelos, filtros y estructuras de respuesta que la interfaz espera consumir.

## Resumen ejecutivo

| KPI | Endpoint sugerido | Método | Parámetros clave | Modelos involucrados |
| --- | --- | --- | --- | --- |
| Ingresos vs Gastos | `GET /api/kpis/ingresos-vs-gastos` | GET | `empresa_id`, `[sucursal_id]`, `month_from`, `month_to` | `ventas.Venta`, `finanzas.Egreso` |
| Variación de Ingresos | `GET /api/kpis/variacion-ingresos` | GET | `empresa_id`, `[sucursal_id]`, `month_from`, `month_to` | `ventas.Venta` |
| Estado de membresías | `GET /api/kpis/membresias/estado` | GET | `empresa_id`, `[sucursal_id]` | `planes.AltaPlan`, `clientes.Cliente` |
| Pagos al día | `GET /api/kpis/membresias/pagos-al-dia` | GET | `empresa_id`, `[sucursal_id]` | `planes.AltaPlan`, `ventas.Venta`, `ventas.DetalleVenta` |
| Personal en gimnasio | `GET /api/kpis/personal/presencia-actual` | GET | `empresa_id`, `sucursal_id`, `fecha` | `accounts.Usuario`, `empleados.UsuarioEmpresa`, `accesos.Acceso` |
| Personal por hora | `GET /api/kpis/personal/presencia-horaria` | GET | `empresa_id`, `sucursal_id`, `fecha` | `accesos.Acceso`, `accounts.Usuario` |
| Ranking de planes | `GET /api/kpis/planes/ranking` | GET | `empresa_id`, `[sucursal_id]`, `month` | `planes.Plan`, `planes.AltaPlan` |
| Inscripciones mensuales | `GET /api/kpis/membresias/altas` | GET | `empresa_id`, `[sucursal_id]`, `month_from`, `month_to` | `planes.AltaPlan` |
| Bajas mensuales | `GET /api/kpis/membresias/bajas` | GET | `empresa_id`, `[sucursal_id]`, `month_from`, `month_to` | `planes.AltaPlan` |


## Detalle de endpoints propuestos

### 1. Ingresos vs Gastos
- **Objetivo:** Entregar los totales mensuales de ingresos (ventas) vs egresos (gastos) dentro de un rango de meses seleccionado.【F:src/data/dashboard.js†L66-L83】
- **Endpoint:** `GET /api/kpis/ingresos-vs-gastos`
- **Parámetros:** `empresa_id`, `month_from`, `month_to`, `[sucursal_id]`.
- **Respuesta esperada:**
  ```json
  {
    "results": [
      { "month": "2024-01", "ingresos": 128450.32, "gastos": 80440.8 }
    ],
    "totals": { "ingresos": 265340.83, "gastos": 166130.91 }
  }
  ```
- **Notas técnicas:** consolidar ventas y egresos en el mismo rango temporal y, si llega `sucursal_id`, filtrar únicamente los registros de esa sucursal; en ausencia de dicho parámetro devolver totales de toda la empresa.

### 2. Variación de Ingresos
- **Objetivo:** Servir la serie mensual de ingresos y permitir que el frontend calcule variaciones entre meses elegidos por el usuario.【F:src/data/dashboard.js†L86-L103】
- **Endpoint:** `GET /api/kpis/variacion-ingresos`
- **Parámetros:** `empresa_id`, `month_from`, `month_to`, `[sucursal_id]`.
- **Respuesta esperada:** arreglo de meses con el total facturado por cada uno.
- **Notas técnicas:** devolver meses sin datos con valor `0` para mantener continuidad en el gráfico y respetar el filtro `sucursal_id` cuando llegue (serie consolidada si se omite).

### 3. Estado de membresías
- **Objetivo:** Obtener conteos históricos de membresías activas, canceladas y suspendidas para distintos cortes de fecha.【F:src/data/dashboard.js†L105-L116】
- **Endpoint:** `GET /api/kpis/membresias/estado`
- **Parámetros:** `empresa_id`, `[sucursal_id]`.
- **Respuesta esperada:** lista de cortes con los totales por estado.
- **Notas técnicas:** permitir filtros opcionales por rango de fechas y aplicar `sucursal_id` cuando llegue; si no se envía, devolver el consolidado de la empresa.

### 4. Pagos al día
- **Objetivo:** Identificar cuántas membresías activas tienen pagos al corriente frente al total de activas.【F:src/data/dashboard.js†L118-L128】
- **Endpoint:** `GET /api/kpis/membresias/pagos-al-dia`
- **Parámetros:** `empresa_id`, `[sucursal_id]`.
- **Respuesta esperada:** cortes con `activos_totales` y `activos_al_corriente`.
- **Notas técnicas:** calcular el estado de pago a partir de los movimientos de cobranza vinculados a cada alta de plan y honrar el filtro de sucursal cuando se proporcione.

### 5. Personal en gimnasio
- **Objetivo:** Mostrar el personal presente en tiempo real o en un día específico, junto con la lista de sucursales disponibles.【F:src/data/dashboard.js†L131-L152】
- **Endpoint:** `GET /api/kpis/personal/presencia-actual`
- **Parámetros:** `empresa_id`, `sucursal_id`, `fecha`.
- **Respuesta esperada:** conjunto de sucursales y snapshots con totales dentro/fuera.
- **Notas técnicas:** considerar la zona horaria oficial del gimnasio al registrar los accesos.

### 6. Personal por hora
- **Objetivo:** Desglosar la presencia del personal por bloques horarios para un día y sucursal determinados.【F:src/data/dashboard.js†L154-L172】
- **Endpoint:** `GET /api/kpis/personal/presencia-horaria`
- **Parámetros:** `empresa_id`, `sucursal_id`, `fecha`.
- **Respuesta esperada:** series con `buckets` horarios y el número de colaboradores por bloque.
- **Notas técnicas:** generar los buckets horarios de forma uniforme (ej. cada 60 minutos) para asegurar consistencia gráfica.

### 7. Ranking de planes
- **Objetivo:** Listar los planes con más y menos personas activas en el mes seleccionado, incluyendo el detalle completo para tablas y rankings.【F:src/data/dashboard.js†L174-L191】
- **Endpoint:** `GET /api/kpis/planes/ranking`
- **Parámetros:** `empresa_id`, `month`, `[sucursal_id]`.
- **Respuesta esperada:** serie mensual con objetos `top`, `bottom` y `detalle` completo.
- **Notas técnicas:** asegurar que el ranking se calcule con el estado activo al cierre del mes y que `sucursal_id` limite los conteos si se proporciona.

### 8. Inscripciones mensuales
- **Objetivo:** Proveer el conteo de altas de membresía por mes dentro del rango solicitado.【F:src/data/dashboard.js†L194-L205】
- **Endpoint:** `GET /api/kpis/membresias/altas`
- **Parámetros:** `empresa_id`, `month_from`, `month_to`, `[sucursal_id]`.
- **Respuesta esperada:** arreglo de objetos `{ month, altas }`.
- **Notas técnicas:** incluir meses sin altas con valor `0` para no interrumpir la serie temporal y respetar el filtro de sucursal cuando se incluya.

### 9. Bajas mensuales
- **Objetivo:** Entregar la cantidad de bajas/cancelaciones de membresías por mes para el rango indicado.【F:src/data/dashboard.js†L207-L218】
- **Endpoint:** `GET /api/kpis/membresias/bajas`
- **Parámetros:** `empresa_id`, `month_from`, `month_to`, `[sucursal_id]`.
- **Respuesta esperada:** arreglo de objetos `{ month, bajas }`.
- **Notas técnicas:** diferenciar entre cancelaciones voluntarias e involuntarias si la base de datos lo permite para futuros filtros y aceptar `sucursal_id` para recortar la serie.

## Consideraciones generales
- **Versionado:** publicar los endpoints bajo un prefijo `/api/kpis` versiónado (ej. `/api/v1/kpis`) para mantener compatibilidad futura.
- **Autenticación y autorización:** requerir credenciales válidas y verificar que el usuario tenga acceso a la empresa y sucursal solicitadas.
- **Performance:** aplicar índices en campos de fechas y llaves foráneas, y considerar cachear los agregados mensuales más consultados.
- **Internacionalización:** devolver fechas en formato ISO (`YYYY-MM` o `YYYY-MM-DD`) para que el frontend pueda formatearlas localmente sin pérdida de información.

