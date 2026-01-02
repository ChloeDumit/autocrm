'use client'

import * as React from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const selectedOption = options.find((opt) => opt.value === value)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange?.('')
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
    if (e.key === 'Enter' && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0].value)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <span className={cn(!selectedOption && 'text-muted-foreground')}>
          {selectedOption?.label || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-input bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent py-2.5 pl-2 text-sm outline-none placeholder:text-muted-foreground"
              onMouseDown={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                onMouseDown={(e) => e.stopPropagation()}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none',
                    'hover:bg-muted focus:bg-muted',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    option.value === value && 'bg-muted'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Multi-select variant
interface SearchableMultiSelectProps {
  options: SearchableSelectOption[]
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function SearchableMultiSelect({
  options,
  values = [],
  onValuesChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const selectedOptions = options.filter((opt) => values.includes(opt.value))

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue]
    onValuesChange?.(newValues)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange?.([])
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <span className={cn(selectedOptions.length === 0 && 'text-muted-foreground')}>
          {selectedOptions.length === 0
            ? placeholder
            : selectedOptions.length === 1
            ? selectedOptions[0].label
            : `${selectedOptions.length} seleccionados`}
        </span>
        <div className="flex items-center gap-1">
          {values.length > 0 && (
            <span
              role="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-input bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent py-2.5 pl-2 text-sm outline-none placeholder:text-muted-foreground"
              onMouseDown={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                onMouseDown={(e) => e.stopPropagation()}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none',
                    'hover:bg-muted focus:bg-muted',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    values.includes(option.value) && 'bg-muted'
                  )}
                >
                  <span>{option.label}</span>
                  {values.includes(option.value) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
