# Ejemplo de Plantilla de Documento

Copia y pega este contenido en el campo "Contenido" al crear una nueva plantilla:

## Contrato de Venta de Vehículo

```
═══════════════════════════════════════════════════════════════════
                    CONTRATO DE VENTA DE VEHÍCULO
═══════════════════════════════════════════════════════════════════

FECHA: {{fecha_actual}}

═══════════════════════════════════════════════════════════════════
                        DATOS DEL COMPRADOR
═══════════════════════════════════════════════════════════════════

Nombre: {{cliente_nombre}}
Email: {{cliente_email}}
Teléfono: {{cliente_telefono}}
Dirección: {{cliente_direccion}}

═══════════════════════════════════════════════════════════════════
                      DATOS DEL VEHÍCULO
═══════════════════════════════════════════════════════════════════

Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje: {{vehiculo_kilometraje}} km
Precio de Lista: ${{vehiculo_precio}}

═══════════════════════════════════════════════════════════════════
                        CONDICIONES DE VENTA
═══════════════════════════════════════════════════════════════════

PRECIO FINAL DE VENTA: ${{precio_final}}

Vendedor: {{vendedor_nombre}}
Fecha de Venta: {{fecha_venta}}

═══════════════════════════════════════════════════════════════════
                        TÉRMINOS Y CONDICIONES
═══════════════════════════════════════════════════════════════════

1. El vehículo se entrega en el estado en que se encuentra, sin garantía 
   expresa o implícita, salvo las garantías legales aplicables.

2. El comprador declara haber inspeccionado el vehículo y acepta su 
   estado actual.

3. El pago se realizará según lo acordado entre las partes.

4. La transferencia del vehículo se realizará dentro de los plazos 
   establecidos por la ley.

5. Todos los gastos de transferencia correrán por cuenta del comprador.

═══════════════════════════════════════════════════════════════════

Firma del Comprador: _________________________

Firma del Vendedor: {{vendedor_nombre}}
                    _________________________

═══════════════════════════════════════════════════════════════════

Este documento fue generado el {{fecha_actual}} mediante el sistema AutoCRM.
```

## Recibo de Venta (Versión Simple)

```
═══════════════════════════════════════════════════════════════════
                            RECIBO DE VENTA
═══════════════════════════════════════════════════════════════════

Fecha: {{fecha_actual}}

Cliente: {{cliente_nombre}}
Teléfono: {{cliente_telefono}}
Email: {{cliente_email}}

Vehículo: {{vehiculo_marca}} {{vehiculo_modelo}} {{vehiculo_ano}}
Kilometraje: {{vehiculo_kilometraje}} km

Precio de Venta: ${{precio_final}}

Vendedor: {{vendedor_nombre}}

═══════════════════════════════════════════════════════════════════

Gracias por su compra.
```

## Certificado de Venta

```
CERTIFICADO DE VENTA

Por medio del presente, certifico que el día {{fecha_venta}} se realizó 
la venta del siguiente vehículo:

COMPRADOR:
Nombre: {{cliente_nombre}}
Email: {{cliente_email}}
Teléfono: {{cliente_telefono}}
Dirección: {{cliente_direccion}}

VEHÍCULO:
Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje: {{vehiculo_kilometraje}} km

PRECIO DE VENTA: ${{precio_final}}

VENDEDOR: {{vendedor_nombre}}

Fecha de emisión: {{fecha_actual}}

Este certificado es válido como comprobante de venta.
```

## Nota de Entrega

```
═══════════════════════════════════════════════════════════════════
                          NOTA DE ENTREGA
═══════════════════════════════════════════════════════════════════

Fecha de Entrega: {{fecha_actual}}

Se hace entrega del siguiente vehículo:

DATOS DEL CLIENTE:
Nombre: {{cliente_nombre}}
Email: {{cliente_email}}
Teléfono: {{cliente_telefono}}
Dirección: {{cliente_direccion}}

VEHÍCULO ENTREGADO:
Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje al momento de entrega: {{vehiculo_kilometraje}} km

PRECIO PAGADO: ${{precio_final}}

El cliente declara haber recibido el vehículo en las condiciones 
descritas y se encuentra conforme con la entrega.

Vendedor: {{vendedor_nombre}}
Fecha de Venta Original: {{fecha_venta}}

═══════════════════════════════════════════════════════════════════

Firma del Cliente: _________________________

Firma del Vendedor: _________________________
```

## Lista de Placeholders Disponibles

Puedes usar estos placeholders en tus plantillas:

- `{{cliente_nombre}}` - Nombre completo del cliente
- `{{cliente_email}}` - Email del cliente
- `{{cliente_telefono}}` - Teléfono del cliente
- `{{cliente_direccion}}` - Dirección del cliente
- `{{vehiculo_marca}}` - Marca del vehículo (ej: Toyota)
- `{{vehiculo_modelo}}` - Modelo del vehículo (ej: Corolla)
- `{{vehiculo_ano}}` - Año del vehículo (ej: 2023)
- `{{vehiculo_precio}}` - Precio original del vehículo
- `{{vehiculo_kilometraje}}` - Kilometraje del vehículo
- `{{precio_final}}` - Precio final de la venta (negociado)
- `{{vendedor_nombre}}` - Nombre del vendedor
- `{{fecha_venta}}` - Fecha en que se creó la venta
- `{{fecha_actual}}` - Fecha actual (cuando se genera el documento)

## Consejos

1. Puedes usar los placeholders múltiples veces en el mismo documento
2. Los placeholders se reemplazarán automáticamente cuando generes el documento desde una venta
3. Puedes crear múltiples plantillas para diferentes tipos de documentos
4. Las plantillas inactivas no aparecerán en la lista al generar documentos

