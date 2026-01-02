'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/error-handler'
import api from '@/lib/api'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Error',
        description: `Solo puedes subir hasta ${maxImages} imágenes`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    
    Array.from(files).forEach((file) => {
      formData.append('images', file)
    })

    try {
      const res = await api.post('/vehicle-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Usar base64 si está disponible, sino usar URLs
      const newImageData = res.data.files 
        ? res.data.files.map((f: any) => f.base64 || f.url)
        : res.data.urls || [];
      const newImages = [...images, ...newImageData]
      onImagesChange(newImages)
      
      toast({
        title: 'Éxito',
        description: `${res.data.count} imagen(es) subida(s) correctamente`,
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, 'Error al subir imágenes')
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const getImageUrl = (image: string) => {
    // Si es base64, retornarlo directamente
    if (image.startsWith('data:image')) {
      return image
    }
    // Si es una URL completa
    if (image.startsWith('http')) {
      return image
    }
    // Si es una ruta relativa, construir la URL completa
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${image}`
  }

  return (
    <div className="space-y-2">
      <Label>Imágenes del Vehículo</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={getImageUrl(image)}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-car.png'
                }}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Principal
              </div>
            )}
          </div>
        ))}
        
        {images.length < maxImages && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary transition-colors cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col gap-2 h-full w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-xs">Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Agregar</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {images.length} de {maxImages} imágenes. Máximo 5MB por imagen.
      </p>
    </div>
  )
}

