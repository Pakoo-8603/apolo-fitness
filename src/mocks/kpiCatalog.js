export const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Suma' },
  { value: 'avg', label: 'Promedio' },
  { value: 'count', label: 'Conteo' },
  { value: 'max', label: 'Máximo' },
  { value: 'min', label: 'Mínimo' },
  { value: 'distinct_count', label: 'Conteo distinto' },
]

export const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'Igual' },
  { value: 'ne', label: 'Diferente' },
  { value: 'gt', label: 'Mayor que' },
  { value: 'gte', label: 'Mayor o igual' },
  { value: 'lt', label: 'Menor que' },
  { value: 'lte', label: 'Menor o igual' },
  { value: 'in', label: 'En la lista' },
  { value: 'not_in', label: 'Fuera de la lista' },
  { value: 'between', label: 'Entre valores' },
  { value: 'contains', label: 'Contiene' },
  { value: 'icontains', label: 'Contiene (insensible)' },
  { value: 'startswith', label: 'Empieza con' },
  { value: 'endswith', label: 'Termina con' },
  { value: 'is_null', label: 'Es nulo' },
  { value: 'is_not_null', label: 'No es nulo' },
]

export const CONNECTOR_OPTIONS = [
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
]

export const TIME_WINDOW_OPTIONS = [
  { value: 'all_time', label: 'Todo el historial' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Semana en curso' },
  { value: 'last_7_days', label: 'Últimos 7 días' },
  { value: 'this_month', label: 'Mes en curso' },
  { value: 'last_30_days', label: 'Últimos 30 días' },
  { value: 'this_year', label: 'Año en curso' },
  { value: 'custom', label: 'Rango personalizado' },
]

export const GRANULARITY_OPTIONS = [
  { value: 'exact', label: 'Sin agrupación' },
  { value: 'hour', label: 'Por hora' },
  { value: 'day', label: 'Por día' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mes' },
  { value: 'quarter', label: 'Por trimestre' },
  { value: 'year', label: 'Por año' },
]

export const FORMAT_OPTIONS = [
  { value: 'value', label: 'Valor' },
  { value: 'currency', label: 'Moneda' },
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'duration', label: 'Duración' },
]

export const CALCULATION_TYPES = [
  { value: 'metric', label: 'Métrica directa' },
  { value: 'formula', label: 'Fórmula' },
]
