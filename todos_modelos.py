# accounts/models.py

from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """
    Modelo de usuario/empleado basado en tu tabla 'Usuarios'.
    Aprovechamos los campos nativos de Django:
      - username        -> (tabla: usuario)
      - password        -> (tabla: contraseña)  [encriptada]
      - last_login      -> (tabla: ultimo_acceso)
      - email           -> (tabla: correo)
      - first_name      -> (tabla: nombre)
      - last_name       -> (tabla: apellido)
      - is_active       -> (tabla: is_active)

    Extra del dominio (sí existen en tu tabla y NO los trae AbstractUser):
      - empresa (FK)
      - cargo, dias_trabajo
      - horario_entrada, horario_salida
      - fecha_contratacion
      - codigo_postal, telefono, fecha_nacimiento, numero_seguro
      - domicilio, notas
    """

    # FK a empresas (tu tabla: empresa_id)
    empresa = models.ForeignKey(
        "empresas.Empresa",
        on_delete=models.PROTECT,
        related_name="usuarios",
        verbose_name="Empresa",
        null=True,
        blank=True,
    )

    # Campos del dominio
    cargo = models.CharField("Cargo", max_length=150, blank=True)
    dias_trabajo = models.CharField(
        "Días de trabajo",
        max_length=150,
        blank=True,
        help_text="Texto libre, ej. 'Lun-Vie' o 'Lun,Mié,Vie'."
    )
    horario_entrada = models.TimeField("Horario de entrada", null=True, blank=True)
    horario_salida = models.TimeField("Horario de salida", null=True, blank=True)
    fecha_contratacion = models.DateField("Fecha de contratación", null=True, blank=True)

    codigo_postal = models.CharField("Código postal", max_length=10, blank=True)
    telefono = models.CharField("Teléfono", max_length=20, blank=True)
    fecha_nacimiento = models.DateField("Fecha de nacimiento", null=True, blank=True)
    numero_seguro = models.CharField("No. seguro", max_length=50, blank=True)
    domicilio = models.TextField("Domicilio", blank=True)
    notas = models.TextField("Notas", blank=True)

    # Opcional: asegurar emails únicos por sistema (si lo deseas)
    # email ya existe en AbstractUser
    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    # Atajos para mantener nombres de tu documento:
    @property
    def nombre(self):
        return self.first_name

    @nombre.setter
    def nombre(self, value):
        self.first_name = value or ""

    @property
    def apellido(self):
        return self.last_name

    @apellido.setter
    def apellido(self, value):
        self.last_name = value or ""

    def __str__(self):
        full = (self.first_name or "").strip() + " " + (self.last_name or "").strip()
        return full.strip() or self.username




# accesos/models.py

from django.db import models

# Create your models here.


# clientes/models.py

from django.db import models
from core.models import TimeStampedModel
from django.conf import settings
from empresas.models import Empresa, Sucursal

class Cliente(TimeStampedModel):
    apellidos = models.CharField("Apellidos", max_length=255)
    nombre = models.CharField("Nombre", max_length=255)
    fecha_nacimiento = models.DateField("Fecha de nacimiento", null=True, blank=True)
    contacto_emergencia = models.CharField("Contacto de emergencia", max_length=255, blank=True)
    email = models.EmailField("Correo", max_length=254, blank=True)
    factura = models.BooleanField("¿Requiere factura?", default=False)
    observaciones = models.TextField("Observaciones", blank=True)
    recordar_vencimiento = models.BooleanField("Recordar vencimiento", default=False)
    recibo_pago = models.BooleanField("Enviar recibo de pago", default=False)
    recibir_promociones = models.BooleanField("Recibir promociones", default=True)
    genero = models.CharField("Género", max_length=20, blank=True)
    fecha_limite_pago = models.DateField("Fecha límite de pago", null=True, blank=True, db_index=True)
    esquema = models.CharField("Esquema", max_length=20, null=True)
    # Tu doc trae: Usuarios_id (revisar). Lo dejo como opcional por si quieres asignar un responsable/comercial.
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="clientes_asignados",
        verbose_name="Usuario asignado"
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"

    def __str__(self):
        return f"{self.nombre} {self.apellidos}".strip()
      
      
class DatoContacto(TimeStampedModel):
    class TipoContacto(models.TextChoices):
        CORREO = "correo", "Correo"
        TELEFONO = "telefono", "Teléfono"
        CELULAR = "celular", "Celular"
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        OTRO = "otro", "Otro"

    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="datos_contacto",
        verbose_name="Cliente"
    )
    tipo = models.CharField("Tipo", max_length=30, choices=TipoContacto.choices)
    valor = models.CharField("Valor", max_length=255)

    class Meta:
        verbose_name = "Dato de contacto"
        verbose_name_plural = "Datos de contacto"

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.valor}"


# =========================
# DATOS FISCALES
# =========================
class DatosFiscales(TimeStampedModel):
    class PersonaTipo(models.TextChoices):
        FISICA = "fisica", "Persona Física"
        MORAL = "moral", "Persona Moral"

    cliente = models.OneToOneField(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="datos_fiscales",
        verbose_name="Cliente"
    )
    rfc = models.CharField("RFC", max_length=20, blank=True)
    razon_social = models.CharField("Razón social", max_length=255, blank=True)
    persona = models.CharField("Tipo de persona", max_length=10, choices=PersonaTipo.choices, blank=True)
    codigo_postal = models.CharField("Código postal", max_length=10, blank=True)
    regimen_fiscal = models.CharField("Régimen fiscal", max_length=120, blank=True)

    class Meta:
        verbose_name = "Datos fiscales"
        verbose_name_plural = "Datos fiscales"

    def __str__(self):
        return f"{self.rfc or 'Sin RFC'} - {self.razon_social or self.cliente}"


# =========================
# CONVENIOS
# =========================
class Convenio(TimeStampedModel):
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="convenios",
        verbose_name="Cliente",
        null=True, blank=True
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="convenios_clientes",
        verbose_name="Empresa"
    )
    empresa_convenio = models.CharField("Empresa del convenio", max_length=255, blank=True)
    telefono_oficina = models.CharField("Teléfono de oficina", max_length=30, blank=True)
    medio_entero = models.CharField("¿Cómo se enteró?", max_length=120, blank=True)
    tipo_cliente = models.CharField("Tipo de cliente", max_length=120, blank=True)

    class Meta:
        verbose_name = "Convenio"
        verbose_name_plural = "Convenios"

    def __str__(self):
        return f"{self.cliente} - {self.empresa_convenio or 'Convenio'}"


# =========================
# CARACTERÍSTICAS / DATOS ADICIONALES
# =========================
class Caracteristica(TimeStampedModel):
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="caracteristicas",
        verbose_name="Empresa"
    )
    nombre = models.TextField("Nombre")
    tipo_dato = models.TextField("Tipo de dato")  # libre: texto, número, fecha, booleano, etc.

    class Meta:
        verbose_name = "Característica"
        verbose_name_plural = "Características"

    def __str__(self):
        return f"{self.nombre} ({self.empresa})"


class DatoAdicional(TimeStampedModel):
    caracteristica = models.ForeignKey(
        Caracteristica,
        on_delete=models.CASCADE,
        related_name="valores",
        verbose_name="Característica"
    )
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="datos_adicionales",
        verbose_name="Cliente"
    )
    campo = models.CharField("Campo", max_length=255, blank=True)  # tu doc lo pide
    valor = models.CharField("Valor", max_length=255, blank=True)

    class Meta:
        verbose_name = "Dato adicional"
        verbose_name_plural = "Datos adicionales"

    def __str__(self):
        return f"{self.caracteristica.nombre}: {self.valor}"


# =========================
# CLIENTE - SUCURSAL
# =========================
class ClienteSucursal(TimeStampedModel):
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.CASCADE,
        related_name="sucursales_asignadas",
        verbose_name="Cliente"
    )
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name="clientes_asignados",
        verbose_name="Sucursal"
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="clientes_sucursales",
        verbose_name="Empresa"
    )
    fecha_inicio = models.DateField("Fecha de inicio", null=True, blank=True)
    fecha_fin = models.DateField("Fecha de fin", null=True, blank=True)
    # is_active ya viene de TimeStampedModel

    class Meta:
        verbose_name = "Cliente por sucursal"
        verbose_name_plural = "Clientes por sucursal"
        unique_together = ("cliente", "sucursal", "empresa")

    def __str__(self):
        return f"{self.cliente} @ {self.sucursal}"


# core/models.py


from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    """
    Modelo abstracto con campos de auditoría comunes.
    Lo heredan todas las tablas que necesiten created/updated/is_active.
    """

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="creado")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="actualizado")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
        verbose_name="creado por"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_updated",
        verbose_name="actualizado por"
    )

    is_active = models.BooleanField(default=True, verbose_name="activo")

    class Meta:
        abstract = True


# empleados/models.py

from django.conf import settings
from django.db import models
from core.models import TimeStampedModel
from empresas.models import Empresa, Sucursal

class UsuarioEmpresa(TimeStampedModel):
    """
    Asigna un usuario (empleado) a una empresa y opcionalmente a una sucursal,
    con rol y permisos (flexibles en JSON).
    Basado en tu tabla 'usuarios_empresa'.
    """
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="asignaciones_empresa",
        verbose_name="Usuario"
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="usuarios_asignados",
        verbose_name="Empresa"
    )
    sucursal = models.ForeignKey(
        Sucursal,
        on_delete=models.CASCADE,
        related_name="usuarios_asignados",
        null=True, blank=True,
        verbose_name="Sucursal"
    )
    rol = models.CharField("Rol", max_length=50)
    # En tu documento es text. Usar JSONField es más útil;
    # si prefieres TextField, cámbialo por models.TextField(blank=True).
    permisos = models.JSONField("Permisos", blank=True, null=True)

    class Meta:
        verbose_name = "Usuario de empresa"
        verbose_name_plural = "Usuarios de empresa"
        unique_together = ("usuario", "empresa", "sucursal")

    def __str__(self):
        return f"{self.usuario} - {self.empresa} ({self.sucursal or 'Sin sucursal'})"


# empresas/models.py

from django.db import models
from core.models import TimeStampedModel


class Empresa(TimeStampedModel):
    nombre = models.CharField("Nombre", max_length=255)
    razon_social = models.CharField("Razón social", max_length=255, blank=True)
    rfc = models.CharField("RFC", max_length=20, blank=True)
    direccion = models.TextField("Dirección", blank=True)
    telefono = models.CharField("Teléfono", max_length=30, blank=True)
    correo = models.EmailField("Correo", max_length=254, blank=True)
    sitio_web = models.CharField("Sitio web", max_length=255, blank=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"

    def __str__(self):
        return self.nombre


class Sucursal(TimeStampedModel):
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="sucursales",
        verbose_name="Empresa",
    )
    nombre = models.CharField("Nombre", max_length=255)
    direccion = models.TextField("Dirección", blank=True)
    # Nota en tu doc: "telefono varchar // relacionar con usuarios"
    # Por ahora respetamos 'varchar'; más adelante podemos enlazar responsable a Usuario.
    telefono = models.CharField("Teléfono", max_length=30, blank=True)
    correo = models.EmailField("Correo", max_length=254, blank=True)
    responsable = models.CharField("Responsable", max_length=255, blank=True)
    horario_apertura = models.TimeField("Horario de apertura", null=True, blank=True)
    horario_cierre = models.TimeField("Horario de cierre", null=True, blank=True)

    class Meta:
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"
        unique_together = ("empresa", "nombre")

    def __str__(self):
        return f"{self.empresa.nombre} - {self.nombre}"


class Configuracion(models.Model):
    """
    Catálogo de claves de configuración disponibles para el sistema.
    (Global; no está ligada a una empresa en tu esquema.)
    """
    nombre = models.CharField("Nombre", max_length=150, unique=True)
    tipo_dato = models.CharField("Tipo de dato", max_length=30)  # ej: text, int, decimal, bool, date, datetime, json
    descripcion = models.TextField("Descripción", blank=True)

    class Meta:
        verbose_name = "Configuración"
        verbose_name_plural = "Configuraciones"

    def __str__(self):
        return f"{self.nombre} ({self.tipo_dato})"


class ValorConfiguracion(TimeStampedModel):
    """
    Valor por empresa para una configuración específica.
    """
    configuracion = models.ForeignKey(
        Configuracion,
        on_delete=models.CASCADE,
        related_name="valores",
        verbose_name="Configuración"
    )
    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="valores_configuracion",
        verbose_name="Empresa"
    )
    valor = models.TextField("Valor")  # Se valida/parsea según tipo_dato en el serializer

    class Meta:
        verbose_name = "Valor de configuración"
        verbose_name_plural = "Valores de configuración"
        unique_together = ("configuracion", "empresa")  # una clave por empresa

    def __str__(self):
        return f"{self.empresa} -> {self.configuracion.nombre} = {self.valor}"
# finanzas/models.py

from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class Proveedor(TimeStampedModel):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='proveedores')
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=50, blank=True, default='')
    correo = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('empresa', 'nombre')
        indexes = [models.Index(fields=['empresa', 'nombre'])]

    def __str__(self):
        return self.nombre


class CategoriaEgreso(TimeStampedModel):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='categorias_egresos')
    nombre = models.CharField(max_length=255)

    class Meta:
        unique_together = ('empresa', 'nombre')
        indexes = [models.Index(fields=['empresa', 'nombre'])]

    def __str__(self):
        return self.nombre


class Egreso(TimeStampedModel):
    class FormaPago(models.TextChoices):
        EFECTIVO = 'efectivo', 'Efectivo'
        TARJETA  = 'tarjeta', 'Tarjeta'
        TRANSFER = 'transferencia', 'Transferencia'
        CHEQUE   = 'cheque', 'Cheque'
        OTRO     = 'otro', 'Otro'

    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='egresos')
    concepto = models.CharField(max_length=255)
    proveedor = models.ForeignKey('finanzas.Proveedor', on_delete=models.SET_NULL, null=True, related_name='egresos')
    total = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateTimeField()
    forma_pago = models.CharField(max_length=20, choices=FormaPago.choices)
    descripcion = models.TextField(blank=True, default='')
    sucursal = models.CharField(max_length=255, blank=True, default='')  # si tienes modelo Sucursal, cámbialo a FK
    categoria = models.ForeignKey('finanzas.CategoriaEgreso', on_delete=models.SET_NULL, null=True, related_name='egresos')

    class Meta:
        indexes = [
            models.Index(fields=['empresa', 'fecha']),
            models.Index(fields=['empresa', 'categoria']),
            models.Index(fields=['empresa', 'proveedor']),
        ]


# inventario/models.py

from django.db import models
from django.conf import settings
from core.models import TimeStampedModel  # clase base con auditoría
from django.core.exceptions import ValidationError

class Almacen(TimeStampedModel):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='almacenes')
    sucursal = models.ForeignKey('empresas.Sucursal', on_delete=models.CASCADE, related_name='almacenes', null=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        unique_together = ('empresa', 'sucursal', 'nombre')
        indexes = [
            models.Index(fields=['empresa', 'sucursal', 'nombre']),
            models.Index(fields=['sucursal', 'nombre']),
        ]
    def clean(self):
        if self.sucursal and self.empresa_id != self.sucursal.empresa_id:
            raise ValidationError("La sucursal no pertenece a la empresa seleccionada.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


    def __str__(self):
        return f'{self.nombre} (emp:{self.empresa_id})'


class CategoriaProducto(TimeStampedModel):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='categorias_producto')
    nombre = models.CharField(max_length=255)

    class Meta:
        unique_together = ('empresa', 'nombre')
        indexes = [models.Index(fields=['empresa', 'nombre'])]

    def __str__(self):
        return self.nombre


class Producto(TimeStampedModel):
    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='productos')
    categoria = models.ForeignKey('inventario.CategoriaProducto', on_delete=models.PROTECT, related_name='productos')
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, default='')
    codigo_barras = models.CharField(max_length=64, blank=True, default='')
    precio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    aplicar_iva = models.BooleanField("Aplicar IVA (16%)", default=True)
    aplicar_ieps = models.BooleanField("Aplicar IEPS (8%)", default=False)
    iva_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    afectastock  = models.BooleanField("Afecta el stock", default=False)

    class Meta:
        unique_together = (('empresa', 'nombre'),)
        constraints = [
            # Único por empresa cuando no esté vacío
            models.UniqueConstraint(
                fields=['empresa', 'codigo_barras'],
                name='uniq_producto_codigo_barras_por_empresa',
                condition=~models.Q(codigo_barras='')
            )
        ]
        indexes = [
            models.Index(fields=['empresa', 'nombre']),
            models.Index(fields=['empresa', 'codigo_barras']),
        ]

    def __str__(self):
        return self.nombre


class MovimientoProducto(TimeStampedModel):
    class TipoMovimiento(models.TextChoices):
        ENTRADA = 'entrada', 'Entrada'    # alta
        SALIDA  = 'salida', 'Salida'      # baja
        AJUSTE  = 'ajuste', 'Ajuste'      # modificación

    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='movimientos_productos')
    producto = models.ForeignKey('inventario.Producto', on_delete=models.CASCADE, related_name='movimientos')
    almacen = models.ForeignKey('inventario.Almacen', on_delete=models.PROTECT, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TipoMovimiento.choices)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['empresa', 'producto']),
            models.Index(fields=['fecha']),
        ]
# planes/models.py

from django.db import models
from django.conf import settings
from decimal import Decimal
from django.core.validators import MinValueValidator
from core.models import TimeStampedModel
from empresas.models import Empresa, Sucursal

class Plan(TimeStampedModel):
    """
    Tabla: planes
    """
    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE,
        related_name="planes", verbose_name="Empresa"
    )
    nombre = models.CharField("Nombre", max_length=255)
    descripcion = models.TextField("Descripción", blank=True)
    acceso_multisucursal = models.BooleanField("Acceso multisucursal", default=False)
    tipo_plan = models.CharField("Tipo de plan", max_length=50, blank=True)  # libre: mensual, semanal, sesiones, etc.
    preventa = models.BooleanField("Preventa", default=False)
    desde = models.DateField("Vigente desde", null=True, blank=True)
    hasta = models.DateField("Vigente hasta", null=True, blank=True)
    visitas_gratis = models.PositiveIntegerField("Visitas gratis", default=0)
    fecha_limite_pago = models.DateField("Fecha límite de pago", null=True, blank=True, db_index=True)
    # Tu tabla incluye Usuario_id aparte de auditoría; lo dejamos como “responsable” opcional:
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="planes_responsables",
        verbose_name="Usuario responsable"
    )
    costo_inscripcion = models.DecimalField(
        "Costo de inscripción",
        max_digits=10,
        decimal_places=2,
        null=True,           # <- puede venir vacío
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Monto en MXN"
    )

    class Meta:
        verbose_name = "Plan"
        verbose_name_plural = "Planes"
        unique_together = ("empresa", "nombre")  # evita duplicados de nombre en la misma empresa

    def __str__(self):
        return f"{self.nombre} ({self.empresa})"


class PrecioPlan(TimeStampedModel):
    """
    Tabla: precios_planes
    """
    class Esquema(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        GRUPAL = "grupal", "Grupal"
        EMPRESA = "empresa", "Empresa"

    class Tipo(models.TextChoices):
        MENSUAL = "mensual", "Mensual"
        SEMANAL = "semanal", "Semanal"
        SESIONES = "sesiones", "Por sesiones"

    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE,
        related_name="precios", verbose_name="Plan"
    )
    esquema = models.CharField("Esquema", max_length=20, choices=Esquema.choices)
    tipo = models.CharField("Tipo", max_length=20, choices=Tipo.choices)
    precio = models.DecimalField("Precio", max_digits=10, decimal_places=2)
    numero_visitas = models.PositiveIntegerField(
        "Número de visitas", default=0,
        help_text="Si es 0, no se contabilizan visitas."
    )

    # Usuario_id en tu tabla:
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="precios_planes_responsables",
        verbose_name="Usuario responsable"
    )

    class Meta:
        verbose_name = "Precio de plan"
        verbose_name_plural = "Precios de plan"
        unique_together = ("plan", "esquema", "tipo")  # evita duplicados del mismo esquema/tipo por plan

    def __str__(self):
        return f"{self.plan} - {self.esquema} / {self.tipo}: {self.precio}"


class RestriccionPlan(TimeStampedModel):
    """
    Tabla: restricciones_planes
    """
    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE,
        related_name="restricciones", verbose_name="Plan"
    )
    dia = models.CharField("Día", max_length=20)  # libre: Lunes/Martes/... o código numérico, según tu preferencia
    hora_inicio = models.TimeField("Hora inicio", null=True, blank=True)
    hora_fin = models.TimeField("Hora fin", null=True, blank=True)

    # Usuario_id en tu tabla:
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="restricciones_planes_responsables",
        verbose_name="Usuario responsable"
    )

    class Meta:
        verbose_name = "Restricción de plan"
        verbose_name_plural = "Restricciones de plan"

    def __str__(self):
        return f"{self.plan} - {self.dia} ({self.hora_inicio} - {self.hora_fin})"

class Servicio(TimeStampedModel):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="servicios", verbose_name="Empresa")
    nombre = models.CharField("Nombre del servicio", max_length=255)
    descripcion = models.TextField("Descripción", blank=True)
    icono = models.CharField(max_length=64, blank=True, default="", help_text="Nombre del ícono (ej. 'Dumbbell')")

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        indexes = [models.Index(fields=["empresa", "nombre"])]

    def __str__(self):
        return self.nombre


class Beneficio(TimeStampedModel):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="beneficios", verbose_name="Empresa")
    nombre = models.CharField("Nombre del beneficio", max_length=255)
    descripcion = models.TextField("Descripción", blank=True)
    tipo_descuento = models.CharField("Tipo de descuento", max_length=50, blank=True)  # p.ej. porcentaje/monto
    valor = models.DecimalField("Valor", max_digits=10, decimal_places=2, default=0)
    unidad = models.IntegerField("Unidad", default=0, help_text="Uso libre; 0 si no aplica")

    class Meta:
        verbose_name = "Beneficio"
        verbose_name_plural = "Beneficios"
        indexes = [models.Index(fields=["empresa", "nombre"])]

    def __str__(self):
        return self.nombre


# === Relación Plan – Servicio ===
class PlanServicio(TimeStampedModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="servicios_incluidos", verbose_name="Plan")
    servicio = models.ForeignKey(Servicio, on_delete=models.PROTECT, related_name="en_planes", verbose_name="Servicio")
    precio = models.DecimalField("Precio", max_digits=10, decimal_places=2, default=0)
    icono = models.CharField("Icono", max_length=120, blank=True)
    fecha_baja = models.DateTimeField("Fecha de baja", null=True, blank=True)

    class Meta:
        verbose_name = "Servicio del plan"
        verbose_name_plural = "Servicios del plan"
        unique_together = ("plan", "servicio")
        indexes = [models.Index(fields=["plan", "servicio"])]

    def __str__(self):
        return f"{self.plan} - {self.servicio}"


# === Relación Plan – Beneficio ===
class PlanBeneficio(TimeStampedModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="beneficios_incluidos", verbose_name="Plan")
    beneficio = models.ForeignKey(Beneficio, on_delete=models.PROTECT, related_name="en_planes", verbose_name="Beneficio")
    vigencia_inicio = models.DateTimeField("Vigencia inicio", null=True, blank=True)
    vigencia_fin = models.DateTimeField("Vigencia fin", null=True, blank=True)

    class Meta:
        verbose_name = "Beneficio del plan"
        verbose_name_plural = "Beneficios del plan"
        unique_together = ("plan", "beneficio")
        indexes = [models.Index(fields=["plan", "beneficio"])]

    def __str__(self):
        return f"{self.plan} - {self.beneficio}"


# === Disciplinas ===
class Disciplina(TimeStampedModel):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="disciplinas", verbose_name="Empresa")
    nombre = models.CharField("Nombre", max_length=255)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="disciplinas_impartidas", verbose_name="Instructor"
    )
    limite_personas = models.IntegerField("Límite de personas", default=0, help_text="0 = sin límite")
    recomendaciones = models.TextField("Recomendaciones", blank=True)

    class Meta:
        verbose_name = "Disciplina"
        verbose_name_plural = "Disciplinas"
        indexes = [models.Index(fields=["empresa", "nombre"])]

    def __str__(self):
        return self.nombre


class DisciplinaPlan(TimeStampedModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="disciplinas", verbose_name="Plan")
    disciplina = models.ForeignKey(Disciplina, on_delete=models.PROTECT, related_name="en_planes", verbose_name="Disciplina")
    tipo_acceso = models.CharField("Tipo de acceso", max_length=50, blank=True)  # 'ilimitado', 'bolsa', etc.
    numero_accesos = models.IntegerField("Número de accesos", default=0)

    class Meta:
        verbose_name = "Disciplina por plan"
        verbose_name_plural = "Disciplinas por plan"
        unique_together = ("plan", "disciplina")
        indexes = [models.Index(fields=["plan", "disciplina"])]

    def __str__(self):
        return f"{self.plan} - {self.disciplina}"


class HorarioDisciplina(TimeStampedModel):
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, related_name="horarios", verbose_name="Disciplina")
    hora_inicio = models.TimeField("Hora inicio")
    hora_fin = models.TimeField("Hora fin")

    class Meta:
        verbose_name = "Horario de disciplina"
        verbose_name_plural = "Horarios de disciplina"
        indexes = [models.Index(fields=["disciplina", "hora_inicio", "hora_fin"])]

    def __str__(self):
        return f"{self.disciplina} [{self.hora_inicio}-{self.hora_fin}]"


# === Accesos ===
class Acceso(TimeStampedModel):
    cliente = models.ForeignKey("clientes.Cliente", on_delete=models.PROTECT, related_name="accesos", verbose_name="Cliente")
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="accesos", verbose_name="Empresa")
    sucursal = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name="accesos", verbose_name="Sucursal")
    tipo_acceso = models.CharField("Tipo de acceso", max_length=20)  # 'entrada' / 'salida'
    puerta = models.CharField("Puerta", max_length=120, blank=True)
    temperatura = models.FloatField("Temperatura", null=True, blank=True)
    fecha = models.DateTimeField("Fecha/Hora de acceso")

    class Meta:
        verbose_name = "Acceso"
        verbose_name_plural = "Accesos"
        indexes = [models.Index(fields=["empresa", "sucursal", "cliente", "fecha"])]

    def __str__(self):
        return f"{self.cliente} {self.tipo_acceso} {self.fecha}"
      
class ServicioBeneficio(TimeStampedModel):
    """
    Relación independiente entre un Servicio y un Beneficio.
    Permite n beneficios por servicio, con vigencia opcional.
    """
    servicio = models.ForeignKey(
        "planes.Servicio",  # ajusta al app_label real
        on_delete=models.CASCADE,
        related_name="beneficios_rel"
    )
    beneficio = models.ForeignKey(
        "planes.Beneficio",  # ajusta al app_label real
        on_delete=models.CASCADE,
        related_name="servicios_rel"
    )
    vigencia_inicio = models.DateField(null=True, blank=True)
    vigencia_fin = models.DateField(null=True, blank=True)
    notas = models.TextField(blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="servicio_beneficio_responsables"
    )

    class Meta:
        verbose_name = "Beneficio de servicio"
        verbose_name_plural = "Beneficios de servicio"
        unique_together = ("servicio", "beneficio")  # evita duplicados

    def clean(self):
        # Validación: servicio.empresa == beneficio.empresa
        if self.servicio_id and self.beneficio_id:
            s_emp = getattr(self.servicio, "empresa_id", None)
            b_emp = getattr(self.beneficio, "empresa_id", None)
            if s_emp and b_emp and s_emp != b_emp:
                from django.core.exceptions import ValidationError
                raise ValidationError("El beneficio y el servicio deben pertenecer a la misma empresa.")

    def __str__(self):
        return f"{self.servicio} ↔ {self.beneficio}"
      
      
# === La revisión inmutable del plan ===
class PlanRevision(TimeStampedModel):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="revisiones")
    version = models.PositiveIntegerField(help_text="Versión incremental del plan")
    # Copias inmutables de campos del Plan:
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    acceso_multisucursal = models.BooleanField(default=False)
    tipo_plan = models.CharField(max_length=50, blank=True)
    preventa = models.BooleanField(default=False)
    visitas_gratis = models.PositiveIntegerField(default=0)

    # Vigencia (opcional pero útil si manejas periodos de publicación)
    vigente_desde = models.DateField(null=True, blank=True)
    vigente_hasta = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ("plan", "version")
        indexes = [models.Index(fields=["plan", "version"])]

    def __str__(self):
        return f"{self.plan} v{self.version}"


# === Precios congelados por revisión ===
class PrecioPlanRevision(TimeStampedModel):
    revision = models.ForeignKey(PlanRevision, on_delete=models.CASCADE, related_name="precios")
    esquema = models.CharField(max_length=20, choices=PrecioPlan.Esquema.choices)
    tipo = models.CharField(max_length=20, choices=PrecioPlan.Tipo.choices)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    numero_visitas = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("revision", "esquema", "tipo")
        indexes = [models.Index(fields=["revision", "esquema", "tipo"])]


class RestriccionPlanRevision(TimeStampedModel):
    revision = models.ForeignKey(PlanRevision, on_delete=models.CASCADE, related_name="restricciones")
    dia = models.CharField(max_length=20)
    hora_inicio = models.TimeField(null=True, blank=True)
    hora_fin = models.TimeField(null=True, blank=True)


class PlanServicioRevision(TimeStampedModel):
    revision = models.ForeignKey(PlanRevision, on_delete=models.CASCADE, related_name="servicios_incluidos")
    servicio = models.ForeignKey(Servicio, on_delete=models.PROTECT)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    icono = models.CharField(max_length=120, blank=True)

    class Meta:
        unique_together = ("revision", "servicio")
        indexes = [models.Index(fields=["revision", "servicio"])]


class PlanBeneficioRevision(TimeStampedModel):
    revision = models.ForeignKey(PlanRevision, on_delete=models.CASCADE, related_name="beneficios_incluidos")
    beneficio = models.ForeignKey(Beneficio, on_delete=models.PROTECT)
    vigencia_inicio = models.DateTimeField(null=True, blank=True)
    vigencia_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("revision", "beneficio")
        indexes = [models.Index(fields=["revision", "beneficio"])]


class DisciplinaPlanRevision(TimeStampedModel):
    revision = models.ForeignKey(PlanRevision, on_delete=models.CASCADE, related_name="disciplinas")
    disciplina = models.ForeignKey(Disciplina, on_delete=models.PROTECT)
    tipo_acceso = models.CharField(max_length=50, blank=True)
    numero_accesos = models.IntegerField(default=0)

    class Meta:
        unique_together = ("revision", "disciplina")
        indexes = [models.Index(fields=["revision", "disciplina"])]
        

# === Alta de plan a cliente ===
class AltaPlan(TimeStampedModel):
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="altas_plan", verbose_name="Empresa")
    sucursal = models.ForeignKey(Sucursal, on_delete=models.PROTECT, related_name="altas_plan", verbose_name="Sucursal")
    cliente = models.ForeignKey("clientes.Cliente", on_delete=models.PROTECT, related_name="altas_plan", verbose_name="Cliente")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="altas", verbose_name="Plan")
    plan_revision = models.ForeignKey(PlanRevision, on_delete=models.PROTECT, related_name="altas", null=True, blank=True)
    fecha_alta = models.DateField("Fecha de alta")
    fecha_vencimiento = models.DateField("Fecha de vencimiento", null=True, blank=True)
    fecha_limite_pago = models.DateField("Fecha límite de pago", null=True, blank=True, db_index=True, help_text="Vencimiento para liquidar esta alta/pedido.")
    renovacion = models.BooleanField("Renovación automática", default=False)


    class Meta:
        verbose_name = "Alta de plan"
        verbose_name_plural = "Altas de plan"
        indexes = [models.Index(fields=["empresa", "sucursal", "cliente", "plan"])]

    def __str__(self):
        return f"{self.cliente} -> {self.plan} ({self.fecha_alta})"
# ventas/models.py

from django.db import models
from django.conf import settings
from core.models import TimeStampedModel
from empresas.models import Empresa

class CodigoDescuento(TimeStampedModel):
    """
    Tabla: codigos_descuento
    """
    class Tipo(models.TextChoices):
        PORCENTAJE = "porcentaje", "Porcentaje"
        MONTO = "monto", "Monto"

    empresa = models.ForeignKey(
        Empresa, on_delete=models.CASCADE,
        related_name="codigos_descuento", verbose_name="Empresa"
    )
    codigo = models.CharField("Código", max_length=50)
    descuento = models.DecimalField("Descuento", max_digits=10, decimal_places=2)
    tipo_descuento = models.CharField("Tipo de descuento", max_length=20, choices=Tipo.choices)
    cantidad = models.PositiveIntegerField("Cantidad disponible", default=0)
    restantes = models.PositiveIntegerField("Usos restantes", default=0)

    # Usuario_id de tu tabla como responsable opcional
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="codigos_descuento_responsables",
        verbose_name="Usuario responsable"
    )

    class Meta:
        verbose_name = "Código de descuento"
        verbose_name_plural = "Códigos de descuento"
        unique_together = ("empresa", "codigo")   # mismo código no se repite en la empresa
        indexes = [
            models.Index(fields=["empresa", "codigo"]),
        ]

    def save(self, *args, **kwargs):
        # normaliza el código en mayúsculas y sin espacios alrededor
        if self.codigo:
            self.codigo = self.codigo.strip().upper()
        # si se crea y 'restantes' no se puso, igualarlo a 'cantidad'
        if not self.pk and (self.restantes is None or self.restantes == 0):
            self.restantes = self.cantidad
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} ({self.empresa})"
      

class Venta(TimeStampedModel):
    # class MetodoPago(models.TextChoices):
    #     EFECTIVO = 'efectivo', 'Efectivo'
    #     TARJETA  = 'tarjeta', 'Tarjeta'
    #     TRANSFER = 'transferencia', 'Transferencia'
    #     MIXTO    = 'mixto', 'Mixto'

    empresa = models.ForeignKey('empresas.Empresa', on_delete=models.CASCADE, related_name='ventas')
    cliente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='compras')
    importe = models.DecimalField(max_digits=12, decimal_places=2)

    folio        = models.CharField(max_length=30, blank=True, null=True)                 # VTA-202510-...
    fecha        = models.DateTimeField()                                                 # fecha_hora
    sucursal     = models.ForeignKey('empresas.Sucursal', on_delete=models.PROTECT,
                                     related_name='ventas', null=True, blank=True)        # sucursal_id
    usuario      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='ventas_capturadas', null=True, blank=True)  # usuario_id (cajero/asesor)
    cliente      = models.ForeignKey('clientes.Cliente', on_delete=models.PROTECT, related_name='compras')                              # cliente_id
    tipo_venta   = models.CharField(max_length=60,null=True, blank=True )                              # PLAN / PRODUCTO / MIXTO
    # metodo_pago  = models.CharField(max_length=20, choices=MetodoPago.choices)

    # Totales (según encabezados: subtotal, descuento_monto, impuesto_monto, total)
    subtotal        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuento_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuesto_monto  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total           = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Otros campos de la tabla
    referencia_pago = models.CharField(max_length=100, blank=True, null=True)             # referencia_pa
    notas           = models.TextField(blank=True, null=True)
    procesado       = models.BooleanField(default=False)                                  # 0/1
    uso_cfdi        = models.CharField(max_length=10, blank=True, null=True)              # G01, etc.
    uuid_cfdi       = models.CharField(max_length=40, blank=True, null=True)
    serie           = models.CharField(max_length=20, blank=True, null=True)
    folio_fiscal    = models.CharField(max_length=50, blank=True, null=True)


    class Meta:
        indexes = [
            models.Index(fields=['empresa', 'fecha']),
            models.Index(fields=['folio']),
            models.Index(fields=['sucursal']),
        ]

    def __str__(self):
        return f'Venta #{self.id or "—"} {self.folio or ""} - {self.total:.2f}'


class MetodoPago(TimeStampedModel):
    """Pagos recibidos de una venta: SOLO venta_id, forma_pago_id, importe."""
    venta      = models.ForeignKey('ventas.Venta', on_delete=models.CASCADE, related_name='pagos')
    forma_pago = models.CharField(max_length=30, blank=True, null=True)
    importe    = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=['venta']),
        ]

    def __str__(self):
        return f'Pago {self.forma_pago} ${self.importe} de venta {self.venta_id}'


class DetalleVenta(TimeStampedModel):
    class ItemTipo(models.TextChoices):
        PLAN     = 'PLAN', 'PLAN'
        PRODUCTO = 'PRODUCTO', 'PRODUCTO'

    class Periodicidad(models.TextChoices):
        DIARIO   = 'DIARIO', 'DIARIO'
        SEMANAL  = 'SEMANAL', 'SEMANAL'
        QUINCENAL= 'QUINCENAL', 'QUINCENAL'
        MENSUAL  = 'MENSUAL', 'MENSUAL'
        ANUAL    = 'ANUAL', 'ANUAL'

    venta    = models.ForeignKey('ventas.Venta', on_delete=models.CASCADE, related_name='detalles')

    # Identificación del renglón (encabezado: item_tipo, item_id, descripcion)
    item_tipo   = models.CharField(max_length=12, choices=ItemTipo.choices, null=True, blank=True)
    item_id     = models.IntegerField(null=True, blank=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)                                        # texto que ves en la tabla

    # FKs opcionales (uno u otro según item_tipo)
    plan     = models.ForeignKey('planes.Plan', on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='detalles_venta')
    producto = models.ForeignKey('inventario.Producto', on_delete=models.SET_NULL,
                                 null=True, blank=True, related_name='detalles_venta')

    codigo_descuento = models.ForeignKey('ventas.CodigoDescuento', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='detalles_venta')

    cantidad        = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)     # precio_unitari

    # Totales por renglón (encabezados: descuento_m, impuesto_pct, impuesto_mo, subtotal, total)
    descuento_monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impuesto_pct    = models.DecimalField(max_digits=5,  decimal_places=2, default=0)     # ej. 16.00
    impuesto_monto  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total           = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Campos específicos cuando el item es un PLAN
    plan_inicio  = models.DateField(null=True, blank=True)
    plan_fin     = models.DateField(null=True, blank=True)
    periodicidad = models.CharField(max_length=12, choices=Periodicidad.choices,
                                    null=True, blank=True)

    # Campo específico cuando es PRODUCTO
    almacen      = models.ForeignKey('inventario.Almacen', on_delete=models.PROTECT,
                                     null=True, blank=True, related_name='detalles_venta')  # almacen_id

    class Meta:
        indexes = [
            models.Index(fields=['venta']),
            models.Index(fields=['item_tipo']),
        ]

    def __str__(self):
        return f'Detalle #{self.id} - {self.item_tipo} x{self.cantidad}'
# kpis/models.py

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
