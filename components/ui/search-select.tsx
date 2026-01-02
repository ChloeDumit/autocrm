'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSelectProps {
  label: string
  placeholder: string
  value: string
  onValueChange: (value: string) => void
  items: Array<{ id: string; label: string }>
  onSearch: (search: string) => void
  loading?: boolean
  error?: string
  disabled?: boolean
  className?: string
}

export function SearchSelect({
  label,
  placeholder,
  value,
  onValueChange,
  items,
  onSearch,
  loading = false,
  error,
  disabled = false,
  className,
}: SearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ id: string; label: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Buscar el item seleccionado cuando cambia el value
  useEffect(() => {
    if (value) {
      const item = items.find((i) => i.id === value)
      if (item) {
        setSelectedItem(item)
        setSearchTerm(item.label)
      } else if (items.length === 0) {
        // Si no hay items pero hay un value, mantener el searchTerm vacío
        // El componente padre debería cargar el item
        setSelectedItem(null)
      }
    } else {
      setSelectedItem(null)
      setSearchTerm('')
    }
  }, [value, items])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (selectedItem) {
          setSearchTerm(selectedItem.label)
        } else {
          setSearchTerm('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedItem])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setIsOpen(true)
    onSearch(term)
  }

  const handleSelect = (item: { id: string; label: string }) => {
    setSelectedItem(item)
    setSearchTerm(item.label)
    onValueChange(item.id)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedItem(null)
    setSearchTerm('')
    onValueChange('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setIsOpen(true)
    if (searchTerm) {
      onSearch(searchTerm)
    }
  }

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      <Label>{label}</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={disabled}
            className={cn('pl-10 pr-10', error && 'border-red-500')}
          />
          {selectedItem && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              <div className="p-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                      selectedItem?.id === item.id && 'bg-accent'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

