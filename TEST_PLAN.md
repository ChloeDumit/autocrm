# AutoCRM - Plan de Pruebas Completo

## Resumen

Este documento detalla el plan de pruebas para todas las funcionalidades del sistema AutoCRM, un CRM multi-tenant para concesionarias de vehículos.

---

## 1. AUTENTICACIÓN Y GESTIÓN DE USUARIOS

### 1.1 Login
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 1.1.1 | Login exitoso | 1. Ir a /login<br>2. Ingresar email y contraseña válidos<br>3. Click en "Iniciar Sesión" | Redirige a /dashboard, muestra nombre del usuario |
| 1.1.2 | Login con credenciales inválidas | 1. Ingresar email/contraseña incorrectos<br>2. Click en "Iniciar Sesión" | Muestra mensaje de error "Credenciales inválidas" |
| 1.1.3 | Login con campos vacíos | 1. Dejar campos vacíos<br>2. Click en "Iniciar Sesión" | Muestra errores de validación |
| 1.1.4 | Login en tenant suspendido | 1. Intentar login en subdomain de tenant suspendido | Muestra mensaje de tenant suspendido |

### 1.2 Recuperación de Contraseña
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 1.2.1 | Solicitar reset de contraseña | 1. Click en "Olvidé mi contraseña"<br>2. Ingresar email registrado<br>3. Click en "Enviar" | Muestra mensaje de éxito, envía email |
| 1.2.2 | Reset con email no registrado | 1. Ingresar email no existente | Muestra mensaje genérico (protección anti-enumeración) |
| 1.2.3 | Usar link de reset válido | 1. Click en link del email<br>2. Ingresar nueva contraseña<br>3. Confirmar | Contraseña actualizada, redirige a login |
| 1.2.4 | Usar link de reset expirado | 1. Usar link después de 1 hora | Muestra mensaje de token expirado |

### 1.3 Cambio de Contraseña
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 1.3.1 | Cambiar contraseña exitosamente | 1. Ir a perfil<br>2. Ingresar contraseña actual<br>3. Ingresar nueva contraseña (min 6 chars) | Contraseña actualizada, muestra éxito |
| 1.3.2 | Contraseña actual incorrecta | 1. Ingresar contraseña actual incorrecta | Muestra error de contraseña incorrecta |

### 1.4 Gestión de Usuarios (Admin)
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 1.4.1 | Ver lista de usuarios | 1. Ir a /admin/users | Muestra todos los usuarios del tenant |
| 1.4.2 | Crear nuevo usuario | 1. Click "Nuevo Usuario"<br>2. Completar formulario<br>3. Guardar | Usuario creado, aparece en lista |
| 1.4.3 | Crear usuario con email duplicado | 1. Usar email existente | Muestra error de email duplicado |
| 1.4.4 | Editar usuario | 1. Click en editar<br>2. Modificar datos<br>3. Guardar | Datos actualizados |
| 1.4.5 | Eliminar usuario | 1. Click en eliminar<br>2. Confirmar | Usuario eliminado de la lista |
| 1.4.6 | Asignar roles | 1. Editar usuario<br>2. Cambiar rol (ADMIN/VENDEDOR/ASISTENTE) | Rol actualizado |
| 1.4.7 | Exceder límite de usuarios | 1. Crear usuarios hasta el límite del plan<br>2. Intentar crear otro | Muestra error de límite alcanzado |

---

## 2. GESTIÓN DE VEHÍCULOS

### 2.1 Lista de Vehículos
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.1.1 | Ver lista de vehículos | 1. Ir a /vehicles | Muestra grid de vehículos con cards |
| 2.1.2 | Buscar vehículos | 1. Escribir en campo de búsqueda<br>2. Esperar 300ms | Filtra por marca/modelo |
| 2.1.3 | Filtrar por estado | 1. Seleccionar estado (Disponible, Reservado, etc.) | Muestra solo vehículos de ese estado |
| 2.1.4 | Filtrar por marca | 1. Seleccionar marca del dropdown | Muestra solo vehículos de esa marca |
| 2.1.5 | Filtrar por año | 1. Seleccionar año | Muestra vehículos de ese año |
| 2.1.6 | Ordenar vehículos | 1. Seleccionar criterio (precio, año, km, marca)<br>2. Toggle dirección | Lista ordenada correctamente |
| 2.1.7 | Filtros combinados | 1. Aplicar múltiples filtros | Resultados cumplen todos los criterios |
| 2.1.8 | Limpiar filtros | 1. Aplicar filtros<br>2. Click en limpiar | Muestra todos los vehículos |

### 2.2 Crear Vehículo
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.2.1 | Crear vehículo básico | 1. Ir a /vehicles/new<br>2. Completar Paso 1 (marca, modelo, año, precio, km)<br>3. Continuar pasos<br>4. Guardar | Vehículo creado, redirige a detalle |
| 2.2.2 | Validación campos requeridos | 1. Dejar campos vacíos<br>2. Intentar continuar | Muestra errores de validación |
| 2.2.3 | Subir imagen principal | 1. En Paso 2<br>2. Seleccionar imagen | Vista previa de imagen |
| 2.2.4 | Subir múltiples imágenes | 1. Subir imagen principal<br>2. Agregar imágenes a galería | Todas las imágenes se muestran |
| 2.2.5 | Agregar documentos | 1. En Paso 3<br>2. Subir documento<br>3. Seleccionar tipo<br>4. Agregar fecha vencimiento | Documento agregado a la lista |
| 2.2.6 | Agregar propiedades custom | 1. En Paso 4<br>2. Completar campos dinámicos | Propiedades guardadas |
| 2.2.7 | Seleccionar moneda | 1. Cambiar moneda (USD, UYU, EUR, BRL) | Precio se guarda con moneda correcta |

### 2.3 Detalle de Vehículo
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.3.1 | Ver detalle completo | 1. Click en vehículo de la lista | Muestra toda la información del vehículo |
| 2.3.2 | Carrusel de imágenes | 1. Click en flechas de navegación | Cambia entre imágenes |
| 2.3.3 | Ver documentos | 1. Click en sección documentos | Lista todos los documentos |
| 2.3.4 | Abrir documento | 1. Click en documento | Abre en nueva pestaña |
| 2.3.5 | Ver propiedades custom | 1. Scroll a características | Muestra todas las propiedades |
| 2.3.6 | Crear venta desde vehículo | 1. Click "Crear Venta" | Redirige a /sales/new con vehículo preseleccionado |

### 2.4 Editar Vehículo
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.4.1 | Editar información básica | 1. Click en Editar<br>2. Modificar datos<br>3. Guardar | Datos actualizados |
| 2.4.2 | Cambiar estado | 1. Cambiar estado (Disponible → Reservado) | Estado actualizado, badge cambia |
| 2.4.3 | Reemplazar imagen | 1. Subir nueva imagen | Nueva imagen se muestra |
| 2.4.4 | Eliminar documento | 1. Click eliminar en documento | Documento removido |

### 2.5 Eliminar Vehículo
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.5.1 | Eliminar vehículo | 1. Click eliminar<br>2. Confirmar | Vehículo eliminado, redirige a lista |
| 2.5.2 | Cancelar eliminación | 1. Click eliminar<br>2. Cancelar | Vehículo permanece |

### 2.6 Compartir en Redes Sociales
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 2.6.1 | Abrir dialog de compartir | 1. Click "Compartir" | Muestra opciones de redes sociales |
| 2.6.2 | Generar contenido | 1. Seleccionar red social | Genera texto apropiado para la red |

---

## 3. GESTIÓN DE CLIENTES

### 3.1 Lista de Clientes
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 3.1.1 | Ver lista de clientes | 1. Ir a /clients | Muestra tabla con todos los clientes |
| 3.1.2 | Buscar clientes | 1. Escribir en búsqueda | Filtra por nombre, email, teléfono |
| 3.1.3 | Filtrar por interés | 1. Seleccionar categoría de interés | Muestra clientes con ese interés |
| 3.1.4 | Ordenar clientes | 1. Click en cabecera de columna | Ordena por ese campo |

### 3.2 Crear Cliente
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 3.2.1 | Crear cliente básico | 1. Click "Nuevo Cliente"<br>2. Ingresar nombre y teléfono<br>3. Guardar | Cliente creado |
| 3.2.2 | Crear cliente completo | 1. Completar todos los campos (nombre, tel, email, dirección, interés, notas) | Cliente creado con toda la info |
| 3.2.3 | Validación teléfono | 1. Dejar teléfono vacío | Muestra error requerido |
| 3.2.4 | Email duplicado | 1. Usar email existente | Puede mostrar advertencia o crear |

### 3.3 Editar/Eliminar Cliente
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 3.3.1 | Editar cliente | 1. Click editar<br>2. Modificar datos<br>3. Guardar | Datos actualizados |
| 3.3.2 | Eliminar cliente | 1. Click eliminar<br>2. Confirmar | Cliente eliminado |

---

## 4. GESTIÓN DE VENTAS

### 4.1 Lista de Ventas / Pipeline
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.1.1 | Ver pipeline de ventas | 1. Ir a /sales | Muestra tabla y cards de resumen por etapa |
| 4.1.2 | Filtrar por etapa | 1. Click en card de etapa o dropdown | Filtra ventas de esa etapa |
| 4.1.3 | Ver contadores | 1. Observar cards de etapa | Muestra conteo correcto por etapa |
| 4.1.4 | Click en fila | 1. Click en cualquier fila | Redirige a detalle de venta |

### 4.2 Crear Venta
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.2.1 | Crear venta básica | 1. Ir a /sales/new<br>2. Buscar y seleccionar vehículo<br>3. Buscar y seleccionar cliente<br>4. Seleccionar etapa<br>5. Guardar | Venta creada |
| 4.2.2 | Crear venta desde vehículo | 1. En vehículo, click "Crear Venta" | Vehículo preseleccionado |
| 4.2.3 | Venta con precio final | 1. Ingresar precio final diferente al del vehículo | Muestra descuento |
| 4.2.4 | Venta como VENDIDO | 1. Seleccionar etapa VENDIDO<br>2. Agregar formas de pago | Muestra sección de pagos |
| 4.2.5 | Ver documentos requeridos | 1. Seleccionar VENDIDO<br>2. Agregar forma de pago con documentos | Muestra sección de documentos requeridos |
| 4.2.6 | Ver plantilla de documento | 1. Click "Ver plantilla" en documento requerido | Abre documento en nueva pestaña |

### 4.3 Detalle de Venta
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.3.1 | Ver detalle completo | 1. Click en venta de la lista | Muestra info de venta, vehículo, cliente |
| 4.3.2 | Ver banner de documentos | 1. Abrir venta con docs pendientes | Muestra banner amber con checklist |
| 4.3.3 | Banner verde (docs completos) | 1. Subir todos los docs requeridos<br>2. Refrescar | Banner cambia a verde |
| 4.3.4 | Ver formas de pago | 1. Scroll a sección pagos | Muestra métodos con montos |
| 4.3.5 | Ver documentos cargados | 1. Click en sección documentos | Lista documentos de la venta |

### 4.4 Editar Venta
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.4.1 | Cambiar etapa | 1. Click Editar<br>2. Cambiar etapa<br>3. Guardar | Etapa actualizada, badge cambia |
| 4.4.2 | Modificar precio final | 1. Editar precio<br>2. Guardar | Precio actualizado |
| 4.4.3 | Agregar notas | 1. Agregar/modificar notas<br>2. Guardar | Notas guardadas |

### 4.5 Formas de Pago
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.5.1 | Agregar forma de pago | 1. En detalle, click "Formas de Pago"<br>2. Click "Agregar"<br>3. Seleccionar método, monto, notas<br>4. Guardar | Forma de pago agregada |
| 4.5.2 | Ver docs requeridos en dialog | 1. Agregar método con documentos | Muestra sección amber con docs |
| 4.5.3 | Descargar plantilla | 1. Click "Descargar" en documento | Descarga el archivo |
| 4.5.4 | Editar forma de pago | 1. Click Editar<br>2. Modificar<br>3. Guardar | Datos actualizados |
| 4.5.5 | Eliminar forma de pago | 1. Click eliminar<br>2. Confirmar | Método removido |
| 4.5.6 | Ver total de pagos | 1. Agregar múltiples métodos | Total se calcula correctamente |

### 4.6 Documentos de Venta
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.6.1 | Generar documento | 1. Click "Generar Doc"<br>2. Seleccionar plantilla<br>3. Generar | Documento generado |
| 4.6.2 | Subir documento | 1. En sección documentos<br>2. Click "Agregar"<br>3. Subir archivo | Documento agregado |
| 4.6.3 | Ver documento | 1. Click en documento | Abre en nueva pestaña |
| 4.6.4 | Eliminar documento | 1. Click eliminar<br>2. Confirmar | Documento removido |
| 4.6.5 | Verificar checklist | 1. Subir documento con mismo nombre que requerido | Checklist muestra como "Cargado" |

### 4.7 Eliminar Venta
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 4.7.1 | Eliminar venta | 1. Click eliminar<br>2. Confirmar | Venta eliminada |

---

## 5. PRUEBAS DE MANEJO (TEST DRIVES)

### 5.1 Lista de Test Drives
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 5.1.1 | Ver lista | 1. Ir a /test-drives | Muestra cards de pruebas |
| 5.1.2 | Filtrar por fecha | 1. Seleccionar fecha | Muestra solo de esa fecha |
| 5.1.3 | Filtrar por estado | 1. Seleccionar estado | Filtra por PENDIENTE/CONFIRMADO/etc |

### 5.2 Crear Test Drive
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 5.2.1 | Crear prueba de manejo | 1. Click "Nueva Prueba"<br>2. Seleccionar vehículo, cliente<br>3. Seleccionar fecha y hora<br>4. Guardar | Prueba creada |
| 5.2.2 | Validar campos | 1. Dejar campos vacíos | Muestra errores |

### 5.3 Gestionar Test Drive
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 5.3.1 | Cambiar estado | 1. Editar<br>2. Cambiar estado<br>3. Guardar | Estado actualizado |
| 5.3.2 | Reprogramar | 1. Editar<br>2. Cambiar fecha/hora<br>3. Guardar | Fecha actualizada |
| 5.3.3 | Eliminar | 1. Eliminar<br>2. Confirmar | Prueba eliminada |

---

## 6. DASHBOARD

### 6.1 Métricas y Estadísticas
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 6.1.1 | Ver métricas principales | 1. Ir a /dashboard | Muestra cards con métricas |
| 6.1.2 | Verificar conteo vehículos | 1. Comparar con lista de vehículos | Números coinciden |
| 6.1.3 | Verificar pipeline | 1. Comparar con lista de ventas | Conteos por etapa coinciden |
| 6.1.4 | Ver actividad reciente | 1. Scroll a actividad | Muestra últimas acciones |

### 6.2 Acciones Rápidas
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 6.2.1 | Agregar vehículo | 1. Click en acción rápida | Redirige a /vehicles/new |
| 6.2.2 | Nuevo cliente | 1. Click en acción rápida | Redirige a /clients |
| 6.2.3 | Agendar prueba | 1. Click en acción rápida | Redirige a /test-drives |

---

## 7. CONFIGURACIÓN ADMIN

### 7.1 Formas de Pago
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 7.1.1 | Crear forma de pago | 1. Ir a /admin/payment-methods<br>2. Click "Nueva"<br>3. Completar nombre, descripción<br>4. Guardar | Método creado |
| 7.1.2 | Agregar documento a método | 1. Editar método<br>2. Subir documento<br>3. Guardar | Documento asociado |
| 7.1.3 | Activar/Desactivar | 1. Toggle estado activo | Estado cambia |
| 7.1.4 | Eliminar método | 1. Eliminar<br>2. Confirmar | Método eliminado |

### 7.2 Plantillas de Documentos
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 7.2.1 | Crear plantilla | 1. Ir a /templates<br>2. Crear nueva<br>3. Escribir contenido con variables | Plantilla creada |
| 7.2.2 | Usar variables | 1. Insertar {{cliente_nombre}}, {{vehiculo_marca}}, etc. | Variables se reemplazan al generar |
| 7.2.3 | Previsualizar | 1. Click previsualizar | Muestra documento generado |

### 7.3 Propiedades de Vehículos
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 7.3.1 | Crear propiedad | 1. Ir a /admin/vehicle-properties<br>2. Crear campo (texto, número, fecha, boolean, select) | Campo creado |
| 7.3.2 | Definir opciones (select) | 1. Crear campo tipo SELECT<br>2. Agregar opciones | Opciones disponibles en vehículos |
| 7.3.3 | Ordenar campos | 1. Drag & drop o cambiar orden | Orden se refleja en formulario |
| 7.3.4 | Desactivar campo | 1. Toggle activo | Campo no aparece en nuevo vehículo |

### 7.4 Configuración de App
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 7.4.1 | Cambiar nombre empresa | 1. Ir a /admin/settings<br>2. Cambiar nombre<br>3. Guardar | Nombre se muestra en header |
| 7.4.2 | Cambiar colores | 1. Modificar color primario/secundario | UI refleja nuevos colores |
| 7.4.3 | Subir logo | 1. Subir imagen de logo | Logo aparece en header |

---

## 8. SUPER ADMIN

### 8.1 Dashboard Super Admin
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 8.1.1 | Ver métricas globales | 1. Login como super admin<br>2. Ir a /super-admin | Muestra totales de toda la plataforma |

### 8.2 Gestión de Tenants
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 8.2.1 | Ver lista de tenants | 1. Ir a /super-admin/tenants | Muestra todos los tenants |
| 8.2.2 | Filtrar por estado | 1. Filtrar ACTIVE/PENDING/SUSPENDED | Muestra solo esos tenants |
| 8.2.3 | Filtrar por plan | 1. Filtrar por plan | Muestra solo ese plan |
| 8.2.4 | Ver detalle tenant | 1. Click en tenant | Muestra info completa |
| 8.2.5 | Editar tenant | 1. Modificar plan, límites<br>2. Guardar | Cambios aplicados |
| 8.2.6 | Suspender tenant | 1. Click suspender<br>2. Confirmar | Tenant suspendido, usuarios no pueden acceder |
| 8.2.7 | Reactivar tenant | 1. Click reactivar | Tenant activo nuevamente |

### 8.3 Registros Pendientes
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 8.3.1 | Ver registros | 1. Ir a /super-admin/registrations | Lista registros pendientes |
| 8.3.2 | Aprobar registro | 1. Click aprobar<br>2. Configurar plan | Tenant creado, email enviado |
| 8.3.3 | Rechazar registro | 1. Click rechazar<br>2. Ingresar razón | Registro rechazado, email enviado |

---

## 9. REGISTRO DE EMPRESA (PÚBLICO)

### 9.1 Registro
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 9.1.1 | Registrar empresa | 1. Ir a /register-company<br>2. Completar datos<br>3. Enviar | Muestra mensaje de confirmación |
| 9.1.2 | Subdomain inválido | 1. Usar caracteres especiales | Error de validación |
| 9.1.3 | Subdomain reservado | 1. Usar "admin", "www", etc. | Error de subdomain reservado |
| 9.1.4 | Subdomain duplicado | 1. Usar subdomain existente | Error de subdomain en uso |

---

## 10. MULTI-TENANCY

### 10.1 Aislamiento de Datos
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 10.1.1 | Datos separados | 1. Login en tenant A<br>2. Crear vehículo<br>3. Login en tenant B<br>4. Ver vehículos | Vehículo no visible en tenant B |
| 10.1.2 | Usuarios separados | 1. Verificar usuarios de cada tenant | Solo usuarios propios visibles |

### 10.2 Subdominios
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 10.2.1 | Acceso por subdomain | 1. Ir a company1.autocrm.com | Muestra branding de company1 |
| 10.2.2 | Subdomain inexistente | 1. Ir a noexiste.autocrm.com | Error o redirect |

---

## 11. RESPONSIVIDAD Y UI

### 11.1 Mobile
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 11.1.1 | Menú mobile | 1. Ver en mobile<br>2. Click hamburger | Menú se despliega |
| 11.1.2 | Tablas responsive | 1. Ver tablas en mobile | Columnas se ocultan/scroll horizontal |
| 11.1.3 | Formularios | 1. Completar formularios en mobile | Inputs funcionan correctamente |

### 11.2 Dark Mode
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 11.2.1 | Toggle dark mode | 1. Click en toggle de tema | UI cambia a modo oscuro |
| 11.2.2 | Persistencia | 1. Cambiar tema<br>2. Refrescar | Tema se mantiene |

---

## 12. PERMISOS Y ROLES

### 12.1 Roles de Usuario
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 12.1.1 | ADMIN acceso total | 1. Login como ADMIN | Puede acceder a /admin/* |
| 12.1.2 | VENDEDOR acceso limitado | 1. Login como VENDEDOR | No puede acceder a /admin/users |
| 12.1.3 | ASISTENTE acceso básico | 1. Login como ASISTENTE | Acceso solo a vistas básicas |

---

## 13. ERRORES Y EDGE CASES

### 13.1 Manejo de Errores
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 13.1.1 | 404 - Recurso no encontrado | 1. Ir a /vehicles/id-inexistente | Muestra página 404 o redirect |
| 13.1.2 | 401 - No autorizado | 1. Acceder sin login | Redirige a login |
| 13.1.3 | 403 - Sin permisos | 1. Acceder a admin sin ser admin | Muestra error de permisos |
| 13.1.4 | Error de servidor | 1. Simular error 500 | Muestra mensaje amigable |

### 13.2 Validaciones
| # | Caso de Prueba | Pasos | Resultado Esperado |
|---|----------------|-------|-------------------|
| 13.2.1 | Precio negativo | 1. Ingresar precio -100 | Error de validación |
| 13.2.2 | Año futuro | 1. Ingresar año 2030 | Permite o muestra advertencia |
| 13.2.3 | Email inválido | 1. Ingresar "notanemail" | Error de formato |
| 13.2.4 | Archivo muy grande | 1. Subir archivo > 10MB | Error de tamaño |

---

## Checklist de Ejecución

- [ ] **Módulo 1**: Autenticación y Usuarios
- [ ] **Módulo 2**: Vehículos
- [ ] **Módulo 3**: Clientes
- [ ] **Módulo 4**: Ventas
- [ ] **Módulo 5**: Test Drives
- [ ] **Módulo 6**: Dashboard
- [ ] **Módulo 7**: Configuración Admin
- [ ] **Módulo 8**: Super Admin
- [ ] **Módulo 9**: Registro Público
- [ ] **Módulo 10**: Multi-tenancy
- [ ] **Módulo 11**: UI/Responsividad
- [ ] **Módulo 12**: Permisos
- [ ] **Módulo 13**: Errores

---

## Notas

- Ejecutar pruebas en diferentes navegadores (Chrome, Firefox, Safari)
- Probar en diferentes tamaños de pantalla
- Verificar tiempos de carga aceptables
- Documentar cualquier bug encontrado con screenshots
