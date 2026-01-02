'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ImageCarouselProps {
  images: string[]
  alt?: string
  className?: string
}

export function ImageCarousel({ images, alt = 'Imagen', className }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={cn('aspect-video bg-muted rounded-lg flex items-center justify-center', className)}>
        <p className="text-muted-foreground">No hay imágenes disponibles</p>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
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

  const currentImage = images[currentIndex]
  const imageUrl = getImageUrl(currentImage)
  const isBase64 = currentImage?.startsWith('data:image')

  return (
    <div className={cn('relative w-full', className)}>
      {/* Imagen principal */}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
        {isBase64 ? (
          <img
            src={imageUrl}
            alt={`${alt} - Imagen ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-car.png'
            }}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={`${alt} - Imagen ${currentIndex + 1}`}
            fill
            className="object-cover"
            unoptimized={imageUrl.startsWith('http://localhost')}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-car.png'
            }}
          />
        )}

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicador de imagen actual */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = getImageUrl(image)
            const isThumbBase64 = image.startsWith('data:image')
            return (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={cn(
                  'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                {isThumbBase64 ? (
                  <img
                    src={thumbUrl}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-car.png'
                    }}
                  />
                ) : (
                  <Image
                    src={thumbUrl}
                    alt={`Miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={thumbUrl.startsWith('http://localhost')}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-car.png'
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

