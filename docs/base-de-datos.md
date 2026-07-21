# Base de datos — Portal Web DSTI

Documentación generada consultando directamente el esquema real (`portalwebbd`, MySQL 8.0),
no a partir de suposiciones. La fuente de verdad ejecutable es
[`backend/database/schema/mysql-schema.sql`](../backend/database/schema/mysql-schema.sql)
(generado con `php artisan schema:dump`); este documento es la versión legible para humanos.

**44 tablas** · **56 llaves foráneas** · **102 triggers de auditoría**

## Cómo reconstruir el esquema

```bash
cd backend
php artisan migrate
```

Laravel carga automáticamente `database/schema/mysql-schema.sql` antes de correr cualquier
migración nueva. Si cambias el esquema directamente en la BD (una columna nueva, un índice,
etc.) sin pasar por una migración, corre `php artisan schema:dump` de nuevo para mantener
este archivo — y por lo tanto esta documentación — al día.

---

## 1. Contenido público

Las tablas que alimentan las secciones del portal público (`InicioPublico.jsx`). Casi todas
comparten el mismo patrón: `idestado` (borrador/publicado/archivado), `idcategoria`, un
`idusuario_*` de autoría, `slug` único para URLs, y `fecha_publicacion` para controlar cuándo
aparecen.

| Tabla | Propósito | Relaciones clave |
|---|---|---|
| `noticias` | Noticias y comunicados. `es_destacada` la resalta en el home, `visitas` es un contador, `fecha_expiracion` permite ocultarla sola. | `idcategoria→categorias`, `idestado→estados`, `idtipopublicacion→tipos_publicacion`, `idusuario_autor→usuarios` |
| `noticias_imagen` | Galería de imágenes por noticia (una puede marcarse `es_portada`). | `idnoticia→noticias`, `idarchivo→archivos` |
| `servicios` | Catálogo de servicios tecnológicos (correo, wifi, etc.). Tiene campos ricos para el modal público: `orientacion`, `casos_uso`, `consejo`, `seccion_relacionada`. `icono` es un nombre de ícono lucide-react, no una imagen. | `idcategoria→categorias` |
| `enlaces_sistemas` | "Sistemas institucionales" (SGA, biblioteca virtual, etc.). `idarchivo_manual`/`idarchivo_documentacion` (agregados en jul-2026) permiten adjuntar hasta dos PDFs por sistema. `icono` también es un nombre lucide. | `idcategoria→categorias`, `idestadooperativo→estados_operativos`, `idarchivo_manual`/`idarchivo_documentacion→archivos` |
| `documentos` | Manuales, directivas, normativas descargables. `iddocumento_padre` permite versionar (un documento "reemplaza" a otro), `es_version_actual` marca cuál mostrar. | `idarchivo→archivos`, `idcategoria→categorias`, `idestado→estados`, `idtipodocumento→tipos_documento`, `idusuario_subidor→usuarios`, `iddocumento_padre→documentos` (auto-referencia) |
| `eventos` | Capacitaciones, talleres, webinars. `cupo_maximo`/`cupos_ocupados` controlan disponibilidad, `enlace_virtual` para modalidad remota. | `idarchivo→archivos` (imagen principal), `idcategoria→categorias`, `idestado→estados`, `idtipoevento→tipos_evento`, `idmodalidad→modalidades_evento`, `idusuario_organizador→usuarios` |
| `eventos_archivos` | Adjuntos/galería de un evento (además de la imagen principal en `eventos.idarchivo`). | `idevento→eventos`, `idarchivo→archivos` |
| `eventos_inscripciones` | Registro de asistentes a un evento. Puede ser un usuario del sistema (`idusuario`) o alguien externo (solo nombre/email). | `idevento→eventos`, `idestado→estados`, `idusuario→usuarios` (nullable) |
| `tutoriales` | Guías/recursos de aprendizaje. Puede ser contenido HTML propio (`contenido_html`), un video externo (`enlace_video`) o un archivo (`idarchivo`) — al menos uno es obligatorio. ⚠️ `contenido_html` se sanitiza con DOMPurify antes de renderizarse (ver `frontend/src/pages/Tutoriales.jsx`). | `idarchivo→archivos`, `idcategoria→categorias`, `idestado→estados`, `idtipotutorial→tipos_tutorial`, `idusuario_autor→usuarios` |
| `faqs` | Preguntas frecuentes. `veces_util` es un contador de "¿te sirvió esta respuesta?". **No tiene sistema de etiquetas** (no existe `EtiquetaEntidad::FAQS`). | `idcategoria→categorias`, `idestado→estados`, `idusuario_autor→usuarios` |
| `proyectos` | Proyectos tecnológicos institucionales, con línea de tiempo. `porcentaje_avance` alimenta la barra de progreso del portal público. | `idarchivo→archivos`, `idcategoria→categorias`, `idestado→estados` |
| `autoridades` | Directorio de autoridades (rector, decanos, etc.) con foto y período de gestión (`fecha_inicio_gestion`/`fecha_fin_gestion`). | (sin FK propias; `foto_url`/`cv_url` son URLs de texto libre, no referencias a `archivos`) |
| `info_institucional` | Contenido de "misión, visión, valores" como pares clave/contenido (`clave`, `contenido` en `longtext`), no una tabla estructurada. | `idusuario_editor→usuarios` |

## 2. Catálogos / tablas maestras

Listas de valores reutilizadas por las tablas de contenido. Todas siguen el mismo patrón
(`nombre`, `slug`, `activo`) y se administran desde "Clasificación y configuración" en el panel.

| Tabla | Para qué sirve |
|---|---|
| `modulos` | Los ~11 módulos funcionales del portal (Noticias, Documentos, Seguridad, etc.) — también agrupan `categorias` y `permisos`. |
| `categorias` | Categorías de contenido, cada una ligada a un `modulo` específico. |
| `estados` | Estado de publicación (borrador/publicado/archivado, etc.), ligado a un `tipos_entidad` para saber a qué tipo de contenido aplica. |
| `estados_operativos` | Estado de disponibilidad de un sistema institucional (disponible/mantenimiento/caído). |
| `tipos_entidad` | Agrupa a qué "familia" de contenido pertenece un `estado`. |
| `tipos_documento`, `tipos_evento`, `tipos_publicacion`, `tipos_soporte`, `tipos_tutorial` | Sub-clasificación específica de cada módulo de contenido. |
| `modalidades_evento` | Presencial / virtual / híbrido. |
| `prioridades` | Prioridad de una solicitud de soporte (`nivel` 1-5, `dias_respuesta_max` es el SLA de respuesta). Desde jul-2026 es **opcional** al crear un ticket; si no se especifica, el backend asigna la de `nivel` más bajo. |

## 3. Archivos

| Tabla | Propósito |
|---|---|
| `archivos` | Tabla central de todo archivo subido al portal (PDF, imagen, video). Casi todas las tablas de contenido tienen un `idarchivo` apuntando aquí. Guarda `nombre_original` (lo que subió el usuario) vs `nombre_guardado` (nombre único en disco) y `ruta` (relativa a `storage/app/public`). |

## 4. Etiquetado

Sistema de tags polimórfico — no usa una tabla intermedia por entidad, sino una genérica.

| Tabla | Propósito |
|---|---|
| `etiquetas` | Catálogo de etiquetas (`nombre`, `color` para el badge visual). |
| `etiquetas_contenido` | Tabla puente genérica: `entidad` (string: `'noticias'`, `'documentos'`, `'eventos'`, `'tutoriales'`, `'proyectos'`, `'servicios'`, `'enlaces_sistemas'`, `'solicitudes_soporte'` — ver `App\Support\EtiquetaEntidad`) + `identidad` (el ID de la fila en esa tabla) + `idetiqueta`. Así una sola tabla etiqueta cualquier tipo de contenido sin necesitar `noticias_etiquetas`, `documentos_etiquetas`, etc. por separado. |

Las etiquetas se muestran visualmente en noticias y sistemas institucionales, y desde jul-2026
también se usan para **búsqueda interna** (sin mostrarse) en noticias y tutoriales — las únicas
dos secciones públicas con caja de búsqueda real hoy.

## 5. Seguridad y control de acceso (RBAC)

| Tabla | Propósito |
|---|---|
| `usuarios` | Cuentas del panel administrativo (no hay cuentas de usuario público — el portal público es anónimo salvo el formulario de soporte). |
| `roles` | Actualmente 3: `admin` (acceso total), `editor` (gestiona contenido, no seguridad), `lector` (solo lectura). |
| `permisos` | 44 permisos con el patrón `modulo.accion` (ej. `noticias.crear`, `seguridad.eliminar`). Ligados a un `modulo`. |
| `roles_permisos` | Tabla puente rol↔permiso. Es la fuente de verdad que consulta `PermissionMiddleware` en cada request — ver `backend/app/Http/Middleware/PermissionMiddleware.php`. |

## 6. Mesa de ayuda

| Tabla | Propósito |
|---|---|
| `solicitudes_soporte` | Tickets de soporte, creables desde el panel o públicamente (formulario del portal). `codigo_ticket` es el identificador que se le da al usuario. `idprioridad` es opcional desde jul-2026. |
| `solicitudes_respuestas` | Hilo de respuestas de un ticket. `es_interno` marca notas internas (no visibles para quien reportó). |

## 7. Configuración del portal

| Tabla | Propósito |
|---|---|
| `portal_configuracion` | Configuración clave/valor (128 filas hoy) que alimenta "Configuración" en el panel: apariencia (colores, logo, imágenes), textos globales, paginación por sección, modo mantenimiento, SEO. `tipo` (`texto`/`color`/`booleano`/`json`/`url`/`email`/`numero`/`archivo`) le dice al frontend cómo renderizar cada campo del formulario de configuración. El endpoint público (`/api/public/configuracion`) filtra las claves sensibles (SMTP, correos internos) antes de exponerlas. |

## 8. Auditoría

| Tabla | Propósito |
|---|---|
| `logs_actividad` | Bitácora de auditoría (586 filas hoy). `detalles` es JSON con el estado antes/después del registro afectado. |

**Cómo se llena:** no la llena el código PHP directamente — la llenan **102 triggers de MySQL**
(`trg_<tabla>_insert`, `trg_<tabla>_update`, `trg_<tabla>_delete`, tres por cada tabla auditable).
El middleware `SetUsuarioAuditoria` (`backend/app/Http/Middleware/SetUsuarioAuditoria.php`) fija
tres variables de sesión de MySQL (`@usuario_auditoria`, `@ip_auditoria`, `@user_agent_auditoria`)
al inicio de cada request autenticado, y los triggers las leen al insertar en `logs_actividad`.
Esto significa que la auditoría funciona **incluso si alguien modifica la BD directamente** (por
fuera de la API), pero también que si se recrea el esquema sin los triggers (por ejemplo,
escribiendo migraciones a mano en vez de usar el `schema:dump`), la auditoría se rompe en
silencio. Es la razón principal por la que este proyecto usa `schema:dump` en vez de migraciones
tabla por tabla.

## 9. Tablas de Laravel (framework)

Estándar de Laravel, no específicas de este proyecto: `cache`, `cache_locks`, `sessions`,
`jobs`, `failed_jobs`, `job_batches`, `migrations`, `personal_access_tokens` (tokens Sanctum
del panel admin — el portal público no usa tokens).

---

## Notas para quien edite el esquema

- **No escribas el `ALTER TABLE` a mano en el cliente MySQL y ya**: aunque funcione al instante,
  se pierde en el próximo `migrate:fresh` de otra persona. Crea una migración de Laravel
  (`php artisan make:migration ...`) y después corre `php artisan schema:dump` para que el
  archivo base quede sincronizado.
- Todas las tablas de contenido público comparten el mismo trío `idcategoria` + `idestado` +
  autoría — si agregas una tabla nueva de contenido, seguir ese patrón la hace consistente con
  el resto (y con `PortalPublicController::aplicarFiltrosPublicos`, que asume esa forma).
- Si el nuevo contenido necesita etiquetas o auditoría, agrégalo a `EtiquetaEntidad` y asegúrate
  de que la migración cree los 3 triggers correspondientes (o pide que se generen igual que en
  las tablas existentes).
