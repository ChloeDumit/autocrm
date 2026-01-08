import { FileText, Receipt, Truck, FilePlus, LucideIcon } from 'lucide-react'

export interface StarterTemplate {
  id: string
  nombre: string
  descripcion: string
  icon: LucideIcon
  contenido: string
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'contrato-venta',
    nombre: 'Contrato de Venta',
    descripcion: 'Contrato formal para la venta de un vehículo',
    icon: FileText,
    contenido: `CONTRATO DE COMPRAVENTA DE VEHÍCULO

Fecha: {{fecha_actual}}

Entre las partes que suscriben el presente contrato:

VENDEDOR:
Representante: {{vendedor_nombre}}

COMPRADOR:
Nombre: {{cliente_nombre}}
Email: {{cliente_email}}
Teléfono: {{cliente_telefono}}
Dirección: {{cliente_direccion}}

VEHÍCULO OBJETO DE LA COMPRAVENTA:
Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje: {{vehiculo_kilometraje}}

CONDICIONES ECONÓMICAS:
Precio de lista: {{vehiculo_precio}}
Precio final acordado: {{precio_final}}

TÉRMINOS Y CONDICIONES:
1. El vendedor garantiza que el vehículo se encuentra libre de gravámenes.
2. El comprador acepta las condiciones del vehículo tal como se encuentra.
3. La entrega se realizará una vez confirmado el pago total.

Este contrato entra en vigor a partir de la fecha {{fecha_venta}}.

Ambas partes firman en conformidad:


_____________________          _____________________
Firma del Vendedor             Firma del Comprador
{{vendedor_nombre}}            {{cliente_nombre}}`
  },
  {
    id: 'recibo',
    nombre: 'Recibo de Pago',
    descripcion: 'Comprobante de pago para el cliente',
    icon: Receipt,
    contenido: `RECIBO DE PAGO

Fecha: {{fecha_actual}}
No. de Recibo: _____________

Recibido de: {{cliente_nombre}}
Dirección: {{cliente_direccion}}
Teléfono: {{cliente_telefono}}

Por concepto de:
Compra de vehículo {{vehiculo_marca}} {{vehiculo_modelo}} ({{vehiculo_ano}})

Monto recibido: {{precio_final}}

Forma de pago: ____________________

Fecha de transacción: {{fecha_venta}}

Atendido por: {{vendedor_nombre}}


_____________________
Firma Autorizada`
  },
  {
    id: 'nota-entrega',
    nombre: 'Nota de Entrega',
    descripcion: 'Documento de entrega del vehículo',
    icon: Truck,
    contenido: `NOTA DE ENTREGA DE VEHÍCULO

Fecha de entrega: {{fecha_actual}}

DATOS DEL CLIENTE:
Nombre: {{cliente_nombre}}
Teléfono: {{cliente_telefono}}
Email: {{cliente_email}}
Dirección: {{cliente_direccion}}

VEHÍCULO ENTREGADO:
Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje al momento de entrega: {{vehiculo_kilometraje}}
Precio: {{precio_final}}

CHECKLIST DE ENTREGA:
[ ] Documentación completa (título, cédula verde)
[ ] Llaves entregadas (cantidad: ___)
[ ] Manual del propietario
[ ] Kit de herramientas
[ ] Llanta de repuesto
[ ] Gato y llave de ruedas
[ ] Triángulos de seguridad

CONDICIONES DEL VEHÍCULO:
[ ] Exterior en buen estado
[ ] Interior en buen estado
[ ] Funcionamiento mecánico verificado
[ ] Niveles de fluidos verificados

OBSERVACIONES:
_____________________________________________
_____________________________________________

Entregado por: {{vendedor_nombre}}
Fecha de venta original: {{fecha_venta}}

Declaro haber recibido el vehículo descrito en las condiciones acordadas.


_____________________          _____________________
{{cliente_nombre}}              {{vendedor_nombre}}
     Comprador                      Vendedor`
  },
  {
    id: 'vacio',
    nombre: 'Plantilla Vacía',
    descripcion: 'Comienza desde cero',
    icon: FilePlus,
    contenido: ''
  }
]

// Helper to get a starter template by id
export function getStarterTemplateById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find(t => t.id === id)
}
