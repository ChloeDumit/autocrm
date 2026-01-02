'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import api from '@/lib/api'

interface PropertyField {
  id: string
  nombre: string
  tipo: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN'
  esPredefinida: boolean
  orden: number
}

interface PropertyValue {
  fieldId: string
  valor: string
}

interface VehiclePropertiesFormProps {
  vehicleId?: string | null
  onPropertiesChange: (properties: PropertyValue[]) => void
}

export function VehiclePropertiesForm({ vehicleId, onPropertiesChange }: VehiclePropertiesFormProps) {
  const [fields, setFields] = useState<PropertyField[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFields()
    if (vehicleId) {
      fetchVehicleProperties()
    }
  }, [vehicleId])

  const fetchFields = async () => {
    try {
      const res = await api.get('/vehicle-properties/fields')
      setFields(res.data)
    } catch (error) {
      console.error('Error fetching fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleProperties = async () => {
    if (!vehicleId) return
    try {
      const res = await api.get(`/vehicle-properties/vehicle/${vehicleId}`)
      const propertiesMap: Record<string, string> = {}
      res.data.forEach((prop: any) => {
        propertiesMap[prop.fieldId] = prop.valor
      })
      setValues(propertiesMap)
      // Notificar al padre
      const properties: PropertyValue[] = Object.entries(propertiesMap).map(([fieldId, valor]) => ({
        fieldId,
        valor: valor as string,
      }))
      onPropertiesChange(properties)
    } catch (error) {
      console.error('Error fetching vehicle properties:', error)
    }
  }

  const handleValueChange = (fieldId: string, valor: string) => {
    const newValues = { ...values, [fieldId]: valor }
    setValues(newValues)
    
    // Notificar al padre
    const properties: PropertyValue[] = Object.entries(newValues)
      .filter(([_, v]) => v && v.trim() !== '')
      .map(([fId, v]) => ({
        fieldId: fId,
        valor: v,
      }))
    onPropertiesChange(properties)
  }

  const renderInput = (field: PropertyField) => {
    const value = values[field.id] || ''

    switch (field.tipo) {
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={`Ingrese ${field.nombre.toLowerCase()}`}
          />
        )
      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
          />
        )
      case 'BOOLEAN':
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Seleccione...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(field.id, e.target.value)}
            placeholder={`Ingrese ${field.nombre.toLowerCase()}`}
          />
        )
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando propiedades...</div>
  }

  if (fields.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay propiedades configuradas</div>
  }

  return (
    <div className="space-y-4">
      <Label>Propiedades del Vehículo</Label>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`prop-${field.id}`}>
              {field.nombre}
              {field.esPredefinida && (
                <span className="ml-2 text-xs text-muted-foreground">(Predefinida)</span>
              )}
            </Label>
            {renderInput(field)}
          </div>
        ))}
      </div>
    </div>
  )
}



