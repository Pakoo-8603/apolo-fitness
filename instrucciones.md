# Plan de trabajo DASHBOARD KPI

## 1. Contexto y stack actual
- El proyecto es una SPA en **Vue 3 + Vite** con composición API y Tailwind; el enrutador vive en `src/router` y el estado global en **Pinia** (ver `src/stores`).
- Ya existen stores para empresa/usuario (`workspace`, `auth`), helpers de API en `src/api`, componentes reutilizables (`src/components`) y vistas organizadas por dominio (`src/views`).
- El ecosistema incluye librerías listas para dashboards (`vue-echarts`, `vue-draggable-plus`, `naive-ui`), por lo que reutilizaremos estas dependencias.

## 2. Objetivo del entregable
Crear tres vistas nuevas totalmente funcionales basadas en JSON en memoria que simulen el backend de KPIs:
1. **Dashboard de KPIs** (solo lectura y controles globales).
2. **Editor de KPIs/Métricas** (creación y edición de `KpiMetric`, `KpiDefinition`, filtros, dimensiones y componentes de fórmula).
3. **Editor de Dashboards** (drag & drop, ordenamiento y configuración de widgets).

Todo debe operar con datos maquetados que se actualizan en runtime como si hiciéramos peticiones reales.

## 3. Modelado de datos en memoria (JSON)
Tomar como referencia `models.py` y `todos_modelos.py`. Definir estructuras normalizadas siguiendo las claves primarias/foráneas:
- `KpiSource`: `{ id, empresa_id, code, name, description, content_type, default_date_field_name, base_filters, metadata, is_template }`.
- `KpiSourceField`: `{ id, source_id, name, label, field_type, allowed_aggregations, metadata, order, is_default }`.
- `KpiMetric`: `{ id, empresa_id, code, name, description, source_id, aggregation, value_field_id, date_field_id, time_window, custom_start, custom_end, compare_against_previous, extra_config, order, is_template }`.
- `KpiMetricFilter`: `{ id, metric_id, field_id, operator, value, connector, order }`.
- `KpiMetricDimension`: `{ id, metric_id, field_id, granularity, limit, order }`.
- `KpiDefinition`: `{ id, empresa_id, code, name, description, calculation_type, metric_id, expression, format_type, baseline_metric_id, extra_config, is_template }`.
- `KpiDefinitionMetric`: `{ id, definition_id, metric_id, alias, order }`.
- `KpiDashboard`: `{ id, empresa_id, owner_id, name, slug, description, is_default, layout }`.
- `KpiWidget`: `{ id, dashboard_id, definition_id, title, subtitle, order, size, position, time_window_override, custom_start_override, custom_end_override, options }`.
- `KpiWidgetFilter`: `{ id, widget_id, field_id, operator, value, connector, target_alias, order }`.

Crear un archivo `src/mocks/kpiData.js` (o similar) con datasets de ejemplo coherentes (IDs correlativos, relaciones válidas, campos de fecha ISO). Incluir plantillas (`is_template=true`) y registros por empresa para probar multi-tenant.

## 4. Capa de "API" simulada y persistencia local
1. Implementar un servicio mock (`src/api/kpiMock.js`) que exponga métodos async (`list`, `create`, `update`, `delete`, `clone`) para cada entidad. Internamente operará sobre los arrays del mock y devolverá `Promise.resolve({ data })` tras `setTimeout` corto para simular latencia.
2. Mantener la integridad referencial: al eliminar un `KpiMetric`, eliminar sus filtros/dimensiones/definiciones asociadas; validar que `source_id` y `field_id` correspondan.
3. Añadir persistencia opcional en `localStorage` (serializar `kpiData` después de cada mutación y rehidratar en la carga) para no perder cambios al refrescar.
4. Exponer helpers para restaurar datos semilla (botón "Restablecer dataset demo").

## 5. Store de Pinia para KPIs
- Crear `src/stores/kpis.js` con state reactivo tomado del mock, getters derivados (ej. métricas por empresa, definiciones por dashboard) y acciones que envuelvan a la API mock.
- Incluir `loading/error states` y versiones (`lastUpdated`) para invalidar caches.
- Integrar con `useWorkspaceStore` para filtrar automáticamente por `empresaId` y soportar plantillas (`empresa_id === null`).
- Proveer acciones de alto nivel: `fetchDashboard(dashboardId)`, `saveWidget(widgetPayload)`, `saveMetric(metricPayload)`, `applyWidgetFilters(widgetId, filters)`.

## 6. Nuevas rutas y estructura de vistas
1. Añadir grupo de rutas `'/kpis'` en `src/router` con lazy loading:
   - `/kpis/dashboard` → vista de visualización.
   - `/kpis/metricas/:id?` → editor de KPI (modo crear/editar según parámetro).
   - `/kpis/dashboards/:id/editar` → editor de layout.
2. Registrar las vistas en `src/views/kpis/` y un layout compartido (barra lateral con tabs: "Dashboard", "Editor de KPI", "Editor de Dashboard", "Plantillas").
3. Respetar los patrones existentes: usar `<PageHeader>` / `<Breadcrumbs>` si existen (ver otras vistas) y clases utilitarias tailwind.

## 7. Vista Dashboard (visualización)
- Construir un componente `KpiDashboardView.vue` que:
  - Cargue el dashboard activo vía store (usar `workspace.empresaId` + slug configurable).
  - Renderice widgets en un grid responsivo (`vue-draggable-plus` modo sólo lectura o CSS grid) respetando `widget.order`, `size` (anchos/altos) y `position`.
  - Incluya controles globales: selector de empresa (readonly), sucursal, rango de fechas; estas opciones actualizan un estado local que re-evalúa cada widget.
  - Para cada widget, calcular el dataset llamando a un helper `resolveWidgetData(widget)` que combine definición, métricas relacionadas, overrides y filtros.
  - Usar `vue-echarts` para gráficos (línea, barras, donut) y tarjetas para KPIs numéricos; tablas con `TableBasic`.
  - Mostrar estados vacíos cuando no existan métricas o cuando la definición esté incompleta.

## 8. Vista Editor de KPIs
- Crear `KpiMetricEditor.vue` con formulario multipaso dividido en secciones:
  1. **Selección de origen y campos**: combos dependientes (`KpiSource` → `KpiSourceField`), validaciones según `field_type`.
  2. **Configuración de agregación y ventana de tiempo**: UI para `Aggregation`, `TimeWindow`, fechas personalizadas.
  3. **Filtros y dimensiones**: tablas editables para agregar/quitar `KpiMetricFilter` y `KpiMetricDimension`.
  4. **Definición de KPI**: elegir tipo (`metric`/`formula`), asociar métricas componentes (`KpiDefinitionMetric`), baseline, formato.
- Incluir vista previa en vivo que utilice el mismo helper de cálculo que el dashboard.
- Utilizar `naive-ui` (inputs avanzados) o componentes existentes para selects, chips, JSON editors.
- Guardar cambios mediante acciones del store (`saveMetricDefinition`) que actualicen todos los JSON relacionados.
- Permitir clonar desde plantilla: botón que precarga valores y marca `is_template` según corresponda.

## 9. Vista Editor de Dashboard
- Implementar `KpiDashboardEditor.vue` usando `vue-draggable-plus` en modo libre:
  - Mostrar widgets disponibles (definiciones de KPI) en un panel lateral y permitir arrastrarlos al lienzo.
  - Editar propiedades de cada widget (título, subtítulo, opciones, overrides de tiempo, filtros locales) en un panel derecho.
  - Persistir tamaño/posición traduciendo la salida de la librería al formato `{ size: { w, h }, position: { x, y } }` dentro del JSON del widget.
  - Soportar versiones: `Guardar borrador`, `Publicar` (marca `is_default`), `Revertir cambios` (restaura snapshot del store).
  - Validar referencias: sólo permitir widgets cuyo KPI (`definition_id`) pertenezca a la misma empresa.

## 10. Componentes y utilidades compartidas
- Crear carpeta `src/components/kpis/` con piezas reutilizables:
  - `MetricPreviewCard`, `WidgetRenderer`, `MetricFiltersEditor`, `MetricDimensionsEditor`, `WidgetFiltersEditor`.
  - Helpers en `src/composables/useKpiEngine.js` para transformar métricas en resultados (aplicar agregaciones a datos mock).
- Añadir constantes (`AggregationOptions`, `OperatorOptions`, `GranularityOptions`) centralizadas.
- Crear utilidades para formateo (`formatCurrency`, `formatPercentage`, `formatDuration`).

## 11. Sincronización y flujos clave
- Definir flujo estándar:
  1. Las vistas disparan acciones del store (que invocan al mock API).
  2. El store actualiza los arrays y emite eventos (usar `watch` + `nextTick` para recalcular layouts).
  3. El dashboard se suscribe a `store.lastUpdated` para recomputar datos.
- Implementar un **history log** simple en el store (stack de acciones) para soportar undo/redo básico dentro del editor.
- Integrar con `ui` store para mostrar `toast` de éxito/error reutilizando componentes existentes.

## 12. Pruebas y QA
- Añadir pruebas unitarias con Vitest + @vue/test-utils (instalar dependencias si no están):
  - Store de KPIs: creación/edición/eliminación mantienen integridad.
  - Componentes clave (MetricFiltersEditor, WidgetRenderer) renderizan correctamente con datos mock.
- Crear pruebas de interacción ligeras con `happy-dom` (drag/drop simulado) o documentar pasos manuales.
- Incluir checklist de QA: crear métrica, convertir en KPI, agregar al dashboard, modificar filtros, clonar desde plantilla.

## 13. Documentación
- Documentar en `docs/kpis.md` (nuevo) los contratos JSON, helpers disponibles y flujos de edición.
- Añadir sección en README con instrucciones para levantar las vistas de KPIs y resetear el dataset mock.
- Mantener comentarios JSDoc en el store/mock para facilitar la futura integración con el backend real.
