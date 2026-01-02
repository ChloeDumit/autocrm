# Guía de Integraciones - Instagram y MercadoLibre

## Funcionalidades Implementadas

### ✅ Subida de Imágenes
- Sube hasta 10 imágenes por vehículo
- Las imágenes se guardan en `server/uploads/`
- Soporte para URLs externas también
- Vista previa de imágenes en las tarjetas de vehículos

### ✅ Generación de Contenido para Redes Sociales

#### Instagram
- Genera texto (caption) listo para copiar y pegar
- Incluye hashtags relevantes
- Formato optimizado para Instagram

#### MercadoLibre
- Genera título y descripción
- Incluye todos los datos necesarios (precio, categoría, etc.)
- Listo para usar con la API de MercadoLibre

## Cómo Usar

### Subir Imágenes

1. Ve a **Vehículos** → **Nuevo Vehículo** o edita uno existente
2. En la sección "Imágenes del Vehículo", haz clic en el área de subida
3. Selecciona una o múltiples imágenes (máx. 10)
4. Las imágenes se subirán automáticamente
5. Puedes eliminar imágenes haciendo hover y clic en la X

### Generar Publicaciones

1. En cualquier tarjeta de vehículo, haz clic en el botón de **Share** (compartir)
2. Se abrirá un diálogo con dos pestañas:
   - **Instagram**: Texto listo para copiar
   - **MercadoLibre**: Título, descripción y datos estructurados
3. Copia el contenido y úsalo en tus publicaciones

## Integración Completa con APIs

### Instagram (Opcional - Requiere Configuración)

Para publicar automáticamente en Instagram, necesitas:

1. **Crear una App en Meta Developers**
   - Ve a https://developers.facebook.com/
   - Crea una nueva app
   - Configura Instagram Basic Display o Instagram Graph API

2. **Obtener Credenciales**
   - App ID
   - App Secret
   - Access Token

3. **Agregar al `.env` del servidor:**
```env
INSTAGRAM_APP_ID=tu_app_id
INSTAGRAM_APP_SECRET=tu_app_secret
INSTAGRAM_ACCESS_TOKEN=tu_access_token
```

4. **Implementar endpoint de publicación** (ejemplo en `server/src/routes/socialMedia.ts`)

### MercadoLibre (Opcional - Requiere Configuración)

Para publicar automáticamente en MercadoLibre:

1. **Crear una App en MercadoLibre Developers**
   - Ve a https://developers.mercadolibre.com/
   - Crea una nueva aplicación
   - Obtén tu Client ID y Client Secret

2. **Obtener Credenciales**
   - Client ID
   - Client Secret
   - Access Token (vía OAuth)

3. **Agregar al `.env` del servidor:**
```env
MERCADOLIBRE_CLIENT_ID=tu_client_id
MERCADOLIBRE_CLIENT_SECRET=tu_client_secret
MERCADOLIBRE_ACCESS_TOKEN=tu_access_token
MERCADOLIBRE_COUNTRY_ID=MLA  # Argentina, ajustar según país
```

4. **Usar la API de MercadoLibre**
   - Endpoint: `POST https://api.mercadolibre.com/items`
   - Usa los datos generados por `/api/social-media/mercadolibre/generate`

## Ejemplo de Código para Publicar en MercadoLibre

```typescript
// En server/src/routes/socialMedia.ts
router.post('/mercadolibre/publish', authenticate, async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.body;
    
    // Generar datos
    const data = await generateMercadoLibreData(vehicleId);
    
    // Publicar en MercadoLibre
    const response = await fetch('https://api.mercadolibre.com/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOLIBRE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        category_id: data.category_id,
        price: data.price,
        currency_id: data.currency_id,
        available_quantity: data.available_quantity,
        buying_mode: 'buy_it_now',
        condition: 'used',
        listing_type_id: 'bronze',
        description: data.description,
        pictures: data.pictures,
        attributes: data.attributes,
      }),
    });
    
    const result = await response.json();
    res.json({ success: true, itemId: result.id, url: result.permalink });
  } catch (error) {
    res.status(500).json({ error: 'Error al publicar en MercadoLibre' });
  }
});
```

## Notas Importantes

1. **Almacenamiento de Imágenes**: 
   - Actualmente se guardan localmente en `server/uploads/`
   - Para producción, considera usar:
     - Cloudinary
     - AWS S3
     - Google Cloud Storage
     - Azure Blob Storage

2. **Límites de Instagram**:
   - Instagram Graph API tiene límites de rate
   - Necesitas una cuenta de negocio vinculada a Facebook

3. **Límites de MercadoLibre**:
   - Dependen de tu plan (gratuito, premium, etc.)
   - Verifica los límites en tu cuenta de desarrollador

4. **Seguridad**:
   - Nunca expongas tus tokens en el frontend
   - Usa variables de entorno para todas las credenciales
   - Implementa refresh tokens para renovar access tokens

## Próximos Pasos

1. Ejecutar migración de Prisma para agregar campo `imagenes`:
```bash
cd server
npm run prisma:migrate
```

2. Instalar dependencias:
```bash
# Backend
cd server
npm install

# Frontend
npm install
```

3. Crear directorio de uploads:
```bash
mkdir -p server/uploads
```

4. Probar la funcionalidad:
   - Sube imágenes a un vehículo
   - Genera contenido para redes sociales
   - Copia y pega en tus publicaciones

