/**
 * Convierte un error de la API a un mensaje de error legible
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Ha ocurrido un error'): string {
  if (!error) return defaultMessage

  // Si es un string, retornarlo directamente
  if (typeof error === 'string') return error

  // Si tiene response (error de axios)
  if (error.response) {
    const errorData = error.response.data?.error

    if (!errorData) {
      return `Error ${error.response.status}: ${error.response.statusText || defaultMessage}`
    }

    // Si es un array (errores de validación de Zod)
    if (Array.isArray(errorData)) {
      return errorData
        .map((e: any) => {
          if (typeof e === 'string') return e
          if (e?.message) return e.message
          if (e?.path && Array.isArray(e.path)) {
            return `${e.path.join('.')}: ${e.message || 'Error de validación'}`
          }
          return JSON.stringify(e)
        })
        .filter(Boolean)
        .join(', ')
    }

    // Si es un string
    if (typeof errorData === 'string') {
      return errorData
    }

    // Si es un objeto con message
    if (errorData?.message) {
      return errorData.message
    }

    // Si es un objeto, convertirlo a string
    return JSON.stringify(errorData)
  }

  // Si es un error de red (request hecho pero sin respuesta)
  if (error.request) {
    return 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
  }

  // Si tiene message
  if (error.message) {
    return error.message
  }

  // Último recurso
  return defaultMessage
}

