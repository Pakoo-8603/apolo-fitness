"""Modelos para construir tableros de KPI dinámicos sobre datos reales."""

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from core.models import TimeStampedModel
from empresas.models import Empresa


class KpiSource(TimeStampedModel):
    """Origen de datos (tabla/modelo) del que se pueden calcular métricas."""

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="kpi_sources",
        null=True,
        blank=True,
        help_text="Empresa propietaria. Vacío = plantilla disponible para todas.",
    )
    code = models.SlugField(max_length=80, help_text="Identificador corto del origen.")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.PROTECT,
        related_name="kpi_sources",
        help_text="Modelo real que alimenta este origen de datos.",
    )
    default_date_field_name = models.CharField(
        max_length=150,
        blank=True,
        help_text="Nombre del campo fecha predeterminado para filtros de tiempo.",
    )
    base_filters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Filtros que siempre se aplican al consultar este origen.",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Información adicional (ej. sugerencias de joins o anotaciones).",
    )
    is_template = models.BooleanField(
        default=False,
        help_text="Indica si es una definición general que se puede clonar.",
    )

    class Meta:
        verbose_name = "origen de datos"
        verbose_name_plural = "orígenes de datos"
        constraints = [
            models.UniqueConstraint(
                fields=("empresa", "code"),
                name="unique_kpi_source_per_company",
            )
        ]
        ordering = ("name",)

    def __str__(self) -> str:
        target = self.empresa.nombre if self.empresa else "plantilla"
        return f"{self.name} ({target})"


class KpiSourceField(TimeStampedModel):
    """Campos disponibles dentro de un origen de datos."""

    class FieldType(models.TextChoices):
        NUMERIC = "numeric", "Numérico"
        DATE = "date", "Fecha"
        DIMENSION = "dimension", "Dimensión"
        BOOLEAN = "boolean", "Booleano"

    source = models.ForeignKey(
        KpiSource,
        on_delete=models.CASCADE,
        related_name="fields",
    )
    name = models.CharField(
        max_length=150,
        help_text="Ruta del campo en términos de ORM (ej. 'total', 'cliente__genero').",
    )
    label = models.CharField(max_length=150)
    field_type = models.CharField(max_length=20, choices=FieldType.choices)
    allowed_aggregations = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de agregaciones permitidas (solo para campos numéricos).",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Metadatos opcionales (formato, unidad, etc.).",
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_default = models.BooleanField(
        default=False,
        help_text="Marca campos sugeridos en los builders.",
    )

    class Meta:
        verbose_name = "campo de origen"
        verbose_name_plural = "campos de origen"
        constraints = [
            models.UniqueConstraint(
                fields=("source", "name"),
                name="unique_field_per_source",
            )
        ]
        ordering = ("source", "order", "name")

    def __str__(self) -> str:
        return f"{self.source.name}: {self.name}"

    def clean(self) -> None:
        super().clean()
        if self.field_type == self.FieldType.NUMERIC:
            if not isinstance(self.allowed_aggregations, list):
                raise ValidationError(
                    {"allowed_aggregations": "Debe ser una lista de agregaciones permitidas."}
                )
        elif self.allowed_aggregations:
            raise ValidationError(
                {
                    "allowed_aggregations": (
                        "Solo los campos numéricos pueden especificar agregaciones permitidas."
                    )
                }
            )


class KpiMetric(TimeStampedModel):
    """Métrica calculable a partir de un origen de datos concreto."""

    class Aggregation(models.TextChoices):
        SUM = "sum", "Suma"
        AVG = "avg", "Promedio"
        COUNT = "count", "Conteo"
        MAX = "max", "Máximo"
        MIN = "min", "Mínimo"
        DISTINCT_COUNT = "distinct_count", "Conteo distinto"

    class TimeWindow(models.TextChoices):
        ALL_TIME = "all_time", "Todo el historial"
        TODAY = "today", "Hoy"
        YESTERDAY = "yesterday", "Ayer"
        THIS_WEEK = "this_week", "Semana en curso"
        LAST_7_DAYS = "last_7_days", "Últimos 7 días"
        THIS_MONTH = "this_month", "Mes en curso"
        LAST_30_DAYS = "last_30_days", "Últimos 30 días"
        THIS_YEAR = "this_year", "Año en curso"
        CUSTOM = "custom", "Rango personalizado"

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="kpi_metrics",
    )
    code = models.SlugField(max_length=80)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    source = models.ForeignKey(
        KpiSource,
        on_delete=models.PROTECT,
        related_name="metrics",
    )
    aggregation = models.CharField(max_length=32, choices=Aggregation.choices)
    value_field = models.ForeignKey(
        KpiSourceField,
        on_delete=models.PROTECT,
        related_name="value_metrics",
        null=True,
        blank=True,
        help_text="Campo numérico sobre el que se aplica la agregación.",
    )
    date_field = models.ForeignKey(
        KpiSourceField,
        on_delete=models.PROTECT,
        related_name="date_metrics",
        null=True,
        blank=True,
        help_text="Campo de fecha usado para filtrar por rango de tiempo.",
    )
    time_window = models.CharField(
        max_length=32,
        choices=TimeWindow.choices,
        default=TimeWindow.THIS_MONTH,
    )
    custom_start = models.DateField(null=True, blank=True)
    custom_end = models.DateField(null=True, blank=True)
    compare_against_previous = models.BooleanField(
        default=False,
        help_text="Si se debe calcular la variación vs. el periodo anterior.",
    )
    extra_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Opciones adicionales (decimales, prefijos, etc.).",
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_template = models.BooleanField(
        default=False,
        help_text="Permite usar la métrica como base para nuevas empresas.",
    )

    class Meta:
        verbose_name = "métrica"
        verbose_name_plural = "métricas"
        constraints = [
            models.UniqueConstraint(
                fields=("empresa", "code"),
                name="unique_metric_per_company",
            )
        ]
        ordering = ("order", "name")

    def __str__(self) -> str:
        return f"{self.name} ({self.empresa.nombre})"

    def clean(self) -> None:
        super().clean()
        if self.source.empresa and self.source.empresa != self.empresa:
            raise ValidationError(
                {"source": "El origen de datos debe pertenecer a la misma empresa."}
            )
        if self.value_field and self.value_field.source_id != self.source_id:
            raise ValidationError(
                {"value_field": "El campo debe pertenecer al mismo origen seleccionado."}
            )
        if self.date_field and self.date_field.source_id != self.source_id:
            raise ValidationError(
                {"date_field": "El campo debe pertenecer al mismo origen seleccionado."}
            )
        if self.aggregation == self.Aggregation.COUNT:
            if self.value_field:
                raise ValidationError(
                    {"value_field": "El conteo no requiere un campo numérico específico."}
                )
        elif self.aggregation == self.Aggregation.DISTINCT_COUNT:
            if not self.value_field:
                raise ValidationError(
                    {"value_field": "El conteo distinto necesita el campo sobre el que agrupar."}
                )
        else:
            if not self.value_field:
                raise ValidationError(
                    {"value_field": "Debes seleccionar el campo numérico a agregar."}
                )
            if self.value_field.field_type != KpiSourceField.FieldType.NUMERIC:
                raise ValidationError(
                    {"value_field": "Solo los campos numéricos admiten esas agregaciones."}
                )
        if self.time_window == self.TimeWindow.CUSTOM:
            if not self.custom_start or not self.custom_end:
                raise ValidationError(
                    {
                        "custom_start": "Debes indicar fecha inicial y final para el rango personalizado.",
                        "custom_end": "Debes indicar fecha inicial y final para el rango personalizado.",
                    }
                )
            if self.custom_start > self.custom_end:
                raise ValidationError(
                    {"custom_end": "La fecha final debe ser mayor o igual a la inicial."}
                )
        else:
            if self.custom_start or self.custom_end:
                raise ValidationError(
                    {
                        "custom_start": "Las fechas personalizadas solo aplican cuando el rango es personalizado.",
                        "custom_end": "Las fechas personalizadas solo aplican cuando el rango es personalizado.",
                    }
                )
        if self.time_window != self.TimeWindow.ALL_TIME and not self.date_field:
            raise ValidationError(
                {"date_field": "Selecciona el campo de fecha para filtrar por el rango indicado."}
            )
        if self.date_field and self.date_field.field_type != KpiSourceField.FieldType.DATE:
            raise ValidationError(
                {"date_field": "El campo seleccionado debe ser de tipo fecha."}
            )


class KpiMetricFilter(TimeStampedModel):
    """Filtros adicionales que se aplican al calcular una métrica."""

    class Operator(models.TextChoices):
        EQUAL = "eq", "Igual"
        NOT_EQUAL = "ne", "Diferente"
        GREATER_THAN = "gt", "Mayor que"
        GREATER_EQUAL = "gte", "Mayor o igual"
        LESS_THAN = "lt", "Menor que"
        LESS_EQUAL = "lte", "Menor o igual"
        IN = "in", "En la lista"
        NOT_IN = "not_in", "Fuera de la lista"
        BETWEEN = "between", "Entre valores"
        CONTAINS = "contains", "Contiene"
        ICONTAINS = "icontains", "Contiene (insensible)"
        STARTS_WITH = "startswith", "Empieza con"
        ENDS_WITH = "endswith", "Termina con"
        IS_NULL = "is_null", "Es nulo"
        IS_NOT_NULL = "is_not_null", "No es nulo"

    class Connector(models.TextChoices):
        AND = "and", "AND"
        OR = "or", "OR"

    metric = models.ForeignKey(
        KpiMetric,
        on_delete=models.CASCADE,
        related_name="filters",
    )
    field = models.ForeignKey(
        KpiSourceField,
        on_delete=models.PROTECT,
        related_name="metric_filters",
    )
    operator = models.CharField(max_length=20, choices=Operator.choices)
    value = models.JSONField(null=True, blank=True)
    connector = models.CharField(
        max_length=5,
        choices=Connector.choices,
        default=Connector.AND,
        help_text="Cómo se enlaza este filtro con el anterior.",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "filtro de métrica"
        verbose_name_plural = "filtros de métrica"
        ordering = ("metric", "order")

    def __str__(self) -> str:
        return f"{self.metric.name} · {self.field.name} {self.operator}"

    def clean(self) -> None:
        super().clean()
        if self.field.source_id != self.metric.source_id:
            raise ValidationError(
                {"field": "El campo filtrado debe pertenecer al mismo origen de la métrica."}
            )
        operators_without_value = {
            self.Operator.IS_NULL,
            self.Operator.IS_NOT_NULL,
        }
        if self.operator in operators_without_value:
            if self.value not in (None, {}):
                raise ValidationError(
                    {"value": "Este operador no requiere valor."}
                )
        else:
            if self.value in (None, {}):
                raise ValidationError(
                    {"value": "Debes especificar el valor para el filtro."}
                )
            if self.operator == self.Operator.BETWEEN:
                if not isinstance(self.value, (list, tuple)) or len(self.value) != 2:
                    raise ValidationError(
                        {"value": "El filtro 'between' necesita una lista con [desde, hasta]."}
                    )


class KpiMetricDimension(TimeStampedModel):
    """Configura cortes y agrupaciones para métricas (ej. por día o sucursal)."""

    class Granularity(models.TextChoices):
        EXACT = "exact", "Sin agrupación"
        HOUR = "hour", "Por hora"
        DAY = "day", "Por día"
        WEEK = "week", "Por semana"
        MONTH = "month", "Por mes"
        QUARTER = "quarter", "Por trimestre"
        YEAR = "year", "Por año"

    metric = models.ForeignKey(
        KpiMetric,
        on_delete=models.CASCADE,
        related_name="dimensions",
    )
    field = models.ForeignKey(
        KpiSourceField,
        on_delete=models.PROTECT,
        related_name="metric_dimensions",
    )
    granularity = models.CharField(
        max_length=20,
        choices=Granularity.choices,
        default=Granularity.EXACT,
    )
    limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Límite de resultados (ej. top 5).",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "dimensión de métrica"
        verbose_name_plural = "dimensiones de métrica"
        ordering = ("metric", "order")
        constraints = [
            models.UniqueConstraint(
                fields=("metric", "field", "granularity"),
                name="unique_metric_dimension",
            )
        ]

    def __str__(self) -> str:
        return f"{self.metric.name} · {self.field.label}"

    def clean(self) -> None:
        super().clean()
        if self.field.source_id != self.metric.source_id:
            raise ValidationError(
                {"field": "El campo debe pertenecer al mismo origen de la métrica."}
            )
        if self.granularity == self.Granularity.EXACT:
            if self.field.field_type not in (
                KpiSourceField.FieldType.DIMENSION,
                KpiSourceField.FieldType.BOOLEAN,
                KpiSourceField.FieldType.DATE,
            ):
                raise ValidationError(
                    {"field": "Este campo no puede usarse como dimensión directa."}
                )
        else:
            if self.field.field_type != KpiSourceField.FieldType.DATE:
                raise ValidationError(
                    {"field": "La granularidad temporal solo aplica sobre campos de fecha."}
                )


class KpiDefinition(TimeStampedModel):
    """Definición final de un KPI disponible en los dashboards."""

    class CalculationType(models.TextChoices):
        METRIC = "metric", "Métrica directa"
        FORMULA = "formula", "Fórmula"

    class FormatType(models.TextChoices):
        VALUE = "value", "Valor"
        CURRENCY = "currency", "Moneda"
        PERCENTAGE = "percentage", "Porcentaje"
        DURATION = "duration", "Duración"

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="kpi_definitions",
    )
    code = models.SlugField(max_length=80)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    calculation_type = models.CharField(
        max_length=20,
        choices=CalculationType.choices,
        default=CalculationType.METRIC,
    )
    metric = models.ForeignKey(
        KpiMetric,
        on_delete=models.PROTECT,
        related_name="definitions",
        null=True,
        blank=True,
    )
    expression = models.TextField(
        blank=True,
        help_text="Expresión a evaluar en fórmulas usando los alias configurados.",
    )
    format_type = models.CharField(
        max_length=20,
        choices=FormatType.choices,
        default=FormatType.VALUE,
    )
    baseline_metric = models.ForeignKey(
        KpiMetric,
        on_delete=models.PROTECT,
        related_name="baseline_for",
        null=True,
        blank=True,
        help_text="Métrica de referencia para comparativos (opcional).",
    )
    extra_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Opciones visuales (colores, metas, unidades adicionales, etc.).",
    )
    is_template = models.BooleanField(default=False)

    class Meta:
        verbose_name = "definición de KPI"
        verbose_name_plural = "definiciones de KPI"
        constraints = [
            models.UniqueConstraint(
                fields=("empresa", "code"),
                name="unique_definition_per_company",
            )
        ]
        ordering = ("name",)

    def __str__(self) -> str:
        return f"{self.name} ({self.empresa.nombre})"

    def clean(self) -> None:
        super().clean()
        if self.calculation_type == self.CalculationType.METRIC:
            if not self.metric:
                raise ValidationError({"metric": "Debes seleccionar la métrica principal."})
        else:
            if not self.expression:
                raise ValidationError(
                    {"expression": "Las fórmulas necesitan la expresión a evaluar."}
                )
        if self.metric and self.metric.empresa != self.empresa:
            raise ValidationError(
                {"metric": "La métrica debe pertenecer a la misma empresa."}
            )
        if self.baseline_metric and self.baseline_metric.empresa != self.empresa:
            raise ValidationError(
                {"baseline_metric": "La métrica de referencia debe ser de la misma empresa."}
            )
        if (
            self.calculation_type == self.CalculationType.METRIC
            and self.expression
        ):
            raise ValidationError(
                {"expression": "No se debe definir fórmula cuando el KPI es directo."}
            )
        if (
            self.calculation_type == self.CalculationType.FORMULA
            and self.metric
        ):
            raise ValidationError(
                {"metric": "Las fórmulas no usan una métrica directa."}
            )


class KpiDefinitionMetric(TimeStampedModel):
    """Métricas que participan en una definición tipo fórmula."""

    definition = models.ForeignKey(
        KpiDefinition,
        on_delete=models.CASCADE,
        related_name="components",
    )
    metric = models.ForeignKey(
        KpiMetric,
        on_delete=models.PROTECT,
        related_name="definition_components",
    )
    alias = models.SlugField(
        max_length=50,
        help_text="Nombre utilizado en la expresión de la fórmula.",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "métrica de fórmula"
        verbose_name_plural = "métricas de fórmula"
        constraints = [
            models.UniqueConstraint(
                fields=("definition", "alias"),
                name="unique_metric_alias_per_definition",
            )
        ]
        ordering = ("definition", "order")

    def __str__(self) -> str:
        return f"{self.definition.name} · {self.alias}"

    def clean(self) -> None:
        super().clean()
        if self.definition.calculation_type != KpiDefinition.CalculationType.FORMULA:
            raise ValidationError(
                {"definition": "Solo puedes agregar componentes a definiciones de tipo fórmula."}
            )
        if self.metric.empresa != self.definition.empresa:
            raise ValidationError(
                {"metric": "La métrica debe pertenecer a la misma empresa."}
            )


class KpiDashboard(TimeStampedModel):
    """Agrupa widgets de KPI visibles para una empresa."""

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="kpi_dashboards",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="kpi_dashboards",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=80)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(
        default=False,
        help_text="Marca el dashboard que se abre por defecto para la empresa.",
    )
    layout = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuración general del lienzo (grid, columnas, etc.).",
    )

    class Meta:
        verbose_name = "dashboard"
        verbose_name_plural = "dashboards"
        constraints = [
            models.UniqueConstraint(
                fields=("empresa", "slug"),
                name="unique_dashboard_per_company",
            )
        ]
        ordering = ("name",)

    def __str__(self) -> str:
        return f"{self.name} ({self.empresa.nombre})"


class KpiWidget(TimeStampedModel):
    """Elemento visual dentro de un dashboard (tarjeta, gráfica, tabla, etc.)."""

    dashboard = models.ForeignKey(
        KpiDashboard,
        on_delete=models.CASCADE,
        related_name="widgets",
    )
    definition = models.ForeignKey(
        KpiDefinition,
        on_delete=models.PROTECT,
        related_name="widgets",
    )
    title = models.CharField(max_length=150, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    size = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dimensiones del widget (ej. {'w': 4, 'h': 2}).",
    )
    position = models.JSONField(
        default=dict,
        blank=True,
        help_text="Coordenadas dentro del grid (fila, columna).",
    )
    time_window_override = models.CharField(
        max_length=32,
        choices=KpiMetric.TimeWindow.choices,
        blank=True,
        help_text="Permite usar un rango distinto al de la métrica base.",
    )
    custom_start_override = models.DateField(null=True, blank=True)
    custom_end_override = models.DateField(null=True, blank=True)
    options = models.JSONField(
        default=dict,
        blank=True,
        help_text="Opciones específicas del widget (tipo de gráfico, colores, etc.).",
    )

    class Meta:
        verbose_name = "widget"
        verbose_name_plural = "widgets"
        ordering = ("dashboard", "order")

    def __str__(self) -> str:
        return f"{self.dashboard.name} · {self.definition.name}"

    def clean(self) -> None:
        super().clean()
        if self.definition.empresa != self.dashboard.empresa:
            raise ValidationError(
                {"definition": "El KPI debe pertenecer a la misma empresa que el dashboard."}
            )
        if self.time_window_override != KpiMetric.TimeWindow.CUSTOM:
            if self.custom_start_override or self.custom_end_override:
                raise ValidationError(
                    {
                        "custom_start_override": "Solo se pueden definir fechas personalizadas cuando el override es personalizado.",
                        "custom_end_override": "Solo se pueden definir fechas personalizadas cuando el override es personalizado.",
                    }
                )
        else:
            if not self.custom_start_override or not self.custom_end_override:
                raise ValidationError(
                    {
                        "custom_start_override": "Debes indicar el rango personalizado del widget.",
                        "custom_end_override": "Debes indicar el rango personalizado del widget.",
                    }
                )
            if self.custom_start_override > self.custom_end_override:
                raise ValidationError(
                    {"custom_end_override": "La fecha final debe ser mayor o igual a la inicial."}
                )


class KpiWidgetFilter(TimeStampedModel):
    """Filtros que aplican únicamente sobre un widget en un dashboard."""

    widget = models.ForeignKey(
        KpiWidget,
        on_delete=models.CASCADE,
        related_name="filters",
    )
    field = models.ForeignKey(
        KpiSourceField,
        on_delete=models.PROTECT,
        related_name="widget_filters",
    )
    operator = models.CharField(max_length=20, choices=KpiMetricFilter.Operator.choices)
    value = models.JSONField(null=True, blank=True)
    connector = models.CharField(
        max_length=5,
        choices=KpiMetricFilter.Connector.choices,
        default=KpiMetricFilter.Connector.AND,
    )
    target_alias = models.SlugField(
        max_length=50,
        blank=True,
        help_text="Alias de la métrica cuando el KPI es una fórmula.",
    )
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "filtro de widget"
        verbose_name_plural = "filtros de widget"
        ordering = ("widget", "order")

    def __str__(self) -> str:
        return f"{self.widget} · {self.field.label}"

    def clean(self) -> None:
        super().clean()
        definition = self.widget.definition
        if definition.calculation_type == KpiDefinition.CalculationType.METRIC:
            target_metric = definition.metric
            if self.target_alias:
                raise ValidationError(
                    {"target_alias": "No uses alias cuando el KPI es directo."}
                )
        else:
            if not self.target_alias:
                raise ValidationError(
                    {"target_alias": "Debes especificar el alias de la métrica dentro de la fórmula."}
                )
            try:
                component = definition.components.get(alias=self.target_alias)
            except KpiDefinitionMetric.DoesNotExist as exc:
                raise ValidationError(
                    {"target_alias": "El alias indicado no existe en la definición."}
                ) from exc
            target_metric = component.metric
        if target_metric.source_id != self.field.source_id:
            raise ValidationError(
                {"field": "El campo debe existir dentro del mismo origen de la métrica."}
            )
        # Reutilizamos las validaciones de valores de los filtros de métrica.
        if self.operator in {
            KpiMetricFilter.Operator.IS_NULL,
            KpiMetricFilter.Operator.IS_NOT_NULL,
        }:
            if self.value not in (None, {}):
                raise ValidationError(
                    {"value": "Este operador no requiere valor."}
                )
        else:
            if self.value in (None, {}):
                raise ValidationError(
                    {"value": "Debes especificar el valor para el filtro."}
                )
            if self.operator == KpiMetricFilter.Operator.BETWEEN:
                if not isinstance(self.value, (list, tuple)) or len(self.value) != 2:
                    raise ValidationError(
                        {"value": "El filtro 'between' necesita una lista con [desde, hasta]."}
                    )
