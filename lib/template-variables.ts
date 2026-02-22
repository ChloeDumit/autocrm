import { User, Car, Receipt, CreditCard, Calendar, LucideIcon } from 'lucide-react'

export interface TemplateVariable {
  key: string
  label: string
  exampleValue: string
}

export interface VariableCategory {
  id: string
  label: string
  icon: LucideIcon
  description: string
  variables: TemplateVariable[]
}

export const TEMPLATE_VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    id: 'cliente',
    label: 'Cliente',
    icon: User,
    description: 'Datos del comprador',
    variables: [
      { key: 'cliente_nombre', label: 'Nombre completo', exampleValue: 'Juan Pérez González' },
      { key: 'cliente_email', label: 'Email', exampleValue: 'juan.perez@email.com' },
      { key: 'cliente_telefono', label: 'Teléfono', exampleValue: '+598 99 123 456' },
      { key: 'cliente_direccion', label: 'Dirección', exampleValue: 'Av. 18 de Julio 1234, Montevideo' },
    ]
  },
  {
    id: 'vehiculo',
    label: 'Vehículo',
    icon: Car,
    description: 'Datos del vehículo',
    variables: [
      { key: 'vehiculo_marca', label: 'Marca', exampleValue: 'Toyota' },
      { key: 'vehiculo_modelo', label: 'Modelo', exampleValue: 'Corolla' },
      { key: 'vehiculo_ano', label: 'Año', exampleValue: '2023' },
      { key: 'vehiculo_precio', label: 'Precio de lista', exampleValue: '25000' },
      { key: 'vehiculo_kilometraje', label: 'Kilometraje', exampleValue: '15000' },
    ]
  },
  {
    id: 'venta',
    label: 'Venta',
    icon: Receipt,
    description: 'Datos de la transacción',
    variables: [
      { key: 'precio_final', label: 'Precio final', exampleValue: '24500' },
      { key: 'venta_precio', label: 'Precio de venta (alias)', exampleValue: '24500' },
      { key: 'vendedor_nombre', label: 'Vendedor', exampleValue: 'María García' },
    ]
  },
  {
    id: 'pago',
    label: 'Pagos',
    icon: CreditCard,
    description: 'Formas de pago',
    variables: [
      { key: 'pago_metodos', label: 'Métodos utilizados', exampleValue: 'Transferencia, Financiación' },
      { key: 'pago_total', label: 'Total pagado', exampleValue: '24500' },
    ]
  },
  {
    id: 'fechas',
    label: 'Fechas',
    icon: Calendar,
    description: 'Fechas del documento',
    variables: [
      { key: 'fecha_venta', label: 'Fecha de venta', exampleValue: '15 de enero de 2024' },
      { key: 'fecha_actual', label: 'Fecha actual', exampleValue: '8 de enero de 2026' },
    ]
  }
]

export function getAllVariables(): TemplateVariable[] {
  return TEMPLATE_VARIABLE_CATEGORIES.flatMap(cat => cat.variables)
}

export function replaceVariablesWithExamples(content: string): string {
  let result = content
  for (const variable of getAllVariables()) {
    result = result.replace(
      new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g'),
      variable.exampleValue
    )
  }
  return result
}

export function findVariableByKey(key: string): TemplateVariable | undefined {
  return getAllVariables().find(v => v.key === key)
}
