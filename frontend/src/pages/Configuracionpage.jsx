import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Save,
    Settings,
    Palette,
    Type,
    Layout,
    Wrench,
    Headphones,
    Newspaper,
    ChevronRight,
    RotateCcw,
    Upload,
    Trash2,
    Image as ImageIcon,
} from 'lucide-react';

import {
    obtenerConfiguracion,
    actualizarConfiguracion,
    subirArchivoConfiguracion,
    eliminarArchivoConfiguracion,
} from '../api/configuracionApi';

import {
    closeNotify,
    getApiErrorMessage,
    notifyError,
    notifyLoading,
    notifySuccess,
} from '../utils/notify';

import ConPermiso from '../components/ConPermiso';

import '../styles/modules/configuracion.css';

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ||
    'http://127.0.0.1:8000';

// =============================================================================
// Definición de grupos y campos
// =============================================================================

const GRUPOS = [
    {
        key: 'apariencia',
        label: 'Apariencia',
        icono: Palette,
        descripcion:
            'Paleta de colores, tipografía, logo e imágenes generales del portal público.',
        secciones: [
            {
                titulo: 'Paleta de colores',
                campos: [
                    {
                        clave: 'color_primario',
                        label: 'Color primario',
                        tipo: 'color',
                        hint: 'Header y botones principales.',
                    },
                    {
                        clave: 'color_secundario',
                        label: 'Color secundario',
                        tipo: 'color',
                        hint: 'Acentos y badges de éxito.',
                    },
                    {
                        clave: 'color_acento',
                        label: 'Color de acento',
                        tipo: 'color',
                        hint: 'Fondos claros y elementos destacados.',
                    },
                    {
                        clave: 'color_fondo',
                        label: 'Color de fondo',
                        tipo: 'color',
                        hint: 'Fondo general del portal.',
                    },
                    {
                        clave: 'color_texto',
                        label: 'Color de texto',
                        tipo: 'color',
                        hint: 'Texto principal del portal.',
                    },
                ],
                layout: 'color-grid',
            },
            {
                titulo: 'Tipografía',
                campos: [
                    {
                        clave: 'fuente_cuerpo',
                        label: 'Fuente de cuerpo',
                        tipo: 'select',
                        opciones: [
                            'Inter',
                            'Lato',
                            'Open Sans',
                            'Source Sans 3',
                            'IBM Plex Sans',
                            'Roboto',
                        ],
                    },
                    {
                        clave: 'fuente_titulos',
                        label: 'Fuente de títulos',
                        tipo: 'select',
                        opciones: [
                            'Sora',
                            'Outfit',
                            'Plus Jakarta Sans',
                            'Raleway',
                            'Nunito',
                            'DM Sans',
                        ],
                    },
                    {
                        clave: 'tamano_base',
                        label: 'Tamaño base (px)',
                        tipo: 'select',
                        opciones: ['13', '14', '15', '16'],
                    },
                    {
                        clave: 'radio_bordes',
                        label: 'Radio de bordes (px)',
                        tipo: 'select',
                        opciones: ['0', '4', '8', '12', '16', '20'],
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Logo e identidad',
                campos: [
                    {
                        clave: 'logo_nombre_corto',
                        label: 'Nombre corto (header)',
                        tipo: 'texto',
                    },
                    {
                        clave: 'logo_subtitulo',
                        label: 'Subtítulo del logo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'img_logo',
                        label: 'Logo principal',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/jpeg,image/webp,image/svg+xml',
                        hint:
                            'SVG, PNG, JPG o WEBP. Tamaño máximo: 5 MB.',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Imágenes generales del portal',
                hint:
                    'Estas imágenes reemplazan los recursos predeterminados definidos en el CSS.',
                campos: [
                    {
                        clave: 'img_hero_bg',
                        label: 'Imagen de fondo del hero',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/jpeg,image/webp',
                        hint:
                            'Se recomienda una imagen horizontal de buena resolución.',
                    },
                    {
                        clave: 'img_default_card',
                        label: 'Imagen predeterminada de tarjetas',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/jpeg,image/webp,image/svg+xml',
                        hint:
                            'Se mostrará cuando un contenido no tenga imagen propia.',
                    },
                    {
                        clave: 'img_hero_pattern',
                        label: 'Patrón decorativo del hero',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/webp,image/svg+xml',
                        hint:
                            'Preferentemente SVG o PNG transparente.',
                    },
                    {
                        clave: 'img_default_avatar',
                        label: 'Avatar predeterminado',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/jpeg,image/webp,image/svg+xml',
                        hint:
                            'Se usará cuando una autoridad no tenga fotografía.',
                    },
                    {
                        clave: 'img_textura_fondo',
                        label: 'Textura de fondo',
                        tipo: 'archivo',
                        accept:
                            'image/png,image/jpeg,image/webp,image/svg+xml',
                        hint:
                            'Textura decorativa general del portal.',
                    },
                ],
                layout: 'dos-col',
            },
        ],
    },
    {
        key: 'textos',
        label: 'Textos globales',
        icono: Type,
        descripcion:
            'Hero, footer, barra superior y enlaces rápidos.',
        secciones: [
            {
                titulo: 'Hero — sección principal',
                campos: [
                    {
                        clave: 'hero_titulo',
                        label: 'Título principal',
                        tipo: 'texto',
                    },
                    {
                        clave: 'hero_titulo_acento',
                        label: 'Título acento',
                        tipo: 'texto',
                        hint:
                            'Segunda línea resaltada con el color primario.',
                    },
                    {
                        clave: 'hero_etiqueta',
                        label: 'Etiqueta (chip)',
                        tipo: 'texto',
                    },
                    {
                        clave: 'hero_descripcion',
                        label: 'Descripción',
                        tipo: 'textarea',
                    },
                    {
                        clave: 'hero_btn1_texto',
                        label: 'Botón 1 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'hero_btn1_href',
                        label: 'Botón 1 — enlace',
                        tipo: 'texto',
                    },
                    {
                        clave: 'hero_btn2_texto',
                        label: 'Botón 2 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'hero_btn2_href',
                        label: 'Botón 2 — enlace',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Footer',
                campos: [
                    {
                        clave: 'footer_nombre',
                        label: 'Nombre completo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_descripcion',
                        label: 'Descripción',
                        tipo: 'textarea',
                    },
                ],
                layout: 'uno-col',
            },
            {
                titulo: 'Barra superior',
                campos: [
                    {
                        clave: 'topbar_telefono',
                        label: 'Teléfono visible',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_correo',
                        label: 'Correo visible',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link1_texto',
                        label: 'Enlace 1 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link1_href',
                        label: 'Enlace 1 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link2_texto',
                        label: 'Enlace 2 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link2_href',
                        label: 'Enlace 2 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link3_texto',
                        label: 'Enlace 3 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_link3_href',
                        label: 'Enlace 3 — URL',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Botón de login',
                campos: [
                    {
                        clave: 'topbar_login_texto',
                        label: 'Texto del botón',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_login_href',
                        label: 'URL del botón',
                        tipo: 'texto',
                    },
                    {
                        clave: 'topbar_login_visible',
                        label: 'Mostrar botón login',
                        tipo: 'booleano',
                        hint:
                            'Oculta el botón Iniciar sesión del topbar.',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Footer — enlaces rápidos',
                hint:
                    'Los cuatro enlaces de la columna izquierda del footer.',
                campos: [
                    {
                        clave: 'footer_link1_texto',
                        label: 'Enlace 1 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link1_href',
                        label: 'Enlace 1 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link2_texto',
                        label: 'Enlace 2 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link2_href',
                        label: 'Enlace 2 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link3_texto',
                        label: 'Enlace 3 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link3_href',
                        label: 'Enlace 3 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link4_texto',
                        label: 'Enlace 4 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_link4_href',
                        label: 'Enlace 4 — URL',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Footer — enlaces de apoyo',
                hint:
                    'Los cuatro enlaces de la columna derecha del footer.',
                campos: [
                    {
                        clave: 'footer_apoyo1_texto',
                        label: 'Apoyo 1 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo1_href',
                        label: 'Apoyo 1 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo2_texto',
                        label: 'Apoyo 2 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo2_href',
                        label: 'Apoyo 2 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo3_texto',
                        label: 'Apoyo 3 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo3_href',
                        label: 'Apoyo 3 — URL',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo4_texto',
                        label: 'Apoyo 4 — texto',
                        tipo: 'texto',
                    },
                    {
                        clave: 'footer_apoyo4_href',
                        label: 'Apoyo 4 — URL',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
        ],
    },
    {
        key: 'modulos',
        label: 'Módulos',
        icono: Layout,
        descripcion: 'Paginación por sección del portal.',
        secciones: [
            {
                titulo: 'Ítems por página',
                hint:
                    'Los módulos activos o inactivos se administran desde el panel de Módulos.',
                campos: [
                    {
                        clave: 'paginacion_servicios',
                        label: 'Servicios',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_noticias',
                        label: 'Noticias',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_sistemas',
                        label: 'Sistemas',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_proyectos',
                        label: 'Proyectos',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_documentos',
                        label: 'Documentos',
                        tipo: 'select',
                        opciones: ['5', '10', '15', '20'],
                    },
                    {
                        clave: 'paginacion_eventos',
                        label: 'Eventos',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_tutoriales',
                        label: 'Tutoriales',
                        tipo: 'select',
                        opciones: ['6', '9', '12', '15'],
                    },
                    {
                        clave: 'paginacion_faqs',
                        label: 'FAQs',
                        tipo: 'select',
                        opciones: ['10', '15', '20', '30'],
                    },
                ],
                layout: 'cuatro-col',
            },
        ],
    },
    {
        key: 'servicios',
        label: 'Servicios',
        icono: Settings,
        descripcion:
            'Comportamiento, campos opcionales y textos del módulo de servicios.',
        secciones: [
            {
                titulo: 'Comportamiento',
                campos: [
                    {
                        clave: 'servicios_tarjeta_destacada',
                        label: 'Tarjeta destacada',
                        tipo: 'booleano',
                        hint:
                            'Primer servicio mostrado en formato grande.',
                    },
                    {
                        clave: 'servicios_mostrar_filtros',
                        label: 'Mostrar filtros',
                        tipo: 'booleano',
                        hint:
                            'Chips de filtro por categoría.',
                    },
                ],
                layout: 'toggles',
            },
            {
                titulo: 'Textos de la sección',
                campos: [
                    {
                        clave: 'servicios_titulo',
                        label: 'Título principal',
                        tipo: 'texto',
                    },
                    {
                        clave: 'servicios_descripcion',
                        label: 'Descripción',
                        tipo: 'textarea',
                    },
                ],
                layout: 'dos-col',
            },
        ],
    },
    {
        key: 'noticias',
        label: 'Noticias',
        icono: Newspaper,
        descripcion:
            'Comportamiento y textos del módulo de noticias y comunicados.',
        secciones: [
            {
                titulo: 'Comportamiento',
                campos: [
                    {
                        clave: 'noticias_busqueda',
                        label: 'Habilitar búsqueda',
                        tipo: 'booleano',
                    },
                    {
                        clave: 'noticias_destacadas_primero',
                        label: 'Destacadas primero',
                        tipo: 'booleano',
                    },
                    {
                        clave: 'noticias_mostrar_fecha',
                        label: 'Mostrar fecha de publicación',
                        tipo: 'booleano',
                    },
                ],
                layout: 'toggles',
            },
            {
                titulo: 'Textos',
                campos: [
                    {
                        clave: 'noticias_titulo',
                        label: 'Título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'noticias_subtitulo',
                        label: 'Subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'noticias_placeholder',
                        label: 'Placeholder búsqueda',
                        tipo: 'texto',
                    },
                ],
                layout: 'uno-col',
            },
        ],
    },
    {
        key: 'soporte',
        label: 'Mesa de ayuda',
        icono: Headphones,
        descripcion:
            'Campos del formulario, correos y textos de la mesa de ayuda.',
        secciones: [
            {
                titulo: 'Comportamiento del formulario',
                campos: [
                    {
                        clave: 'soporte_telefono_obligatorio',
                        label: 'Teléfono obligatorio',
                        tipo: 'booleano',
                    },
                    {
                        clave: 'soporte_dependencia_obligatoria',
                        label: 'Dependencia obligatoria',
                        tipo: 'booleano',
                    },
                    {
                        clave: 'soporte_permite_adjunto',
                        label: 'Permitir adjuntar archivo',
                        tipo: 'booleano',
                    },
                    {
                        clave: 'soporte_confirmar_por_correo',
                        label: 'Confirmación por correo',
                        tipo: 'booleano',
                    },
                ],
                layout: 'toggles',
            },
            {
                titulo: 'Correos',
                campos: [
                    {
                        clave: 'soporte_correo_destino',
                        label: 'Correo destino de tickets',
                        tipo: 'texto',
                        hint:
                            'Recibe todas las solicitudes.',
                    },
                    {
                        clave: 'soporte_correo_noreply',
                        label: 'Correo remitente (noreply)',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
            {
                titulo: 'Textos',
                campos: [
                    {
                        clave: 'soporte_titulo',
                        label: 'Título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'soporte_subtitulo',
                        label: 'Subtítulo',
                        tipo: 'textarea',
                    },
                    {
                        clave: 'soporte_mensaje_exito',
                        label: 'Mensaje de éxito',
                        tipo: 'textarea',
                    },
                ],
                layout: 'uno-col',
            },
        ],
    },
    {
        key: 'secciones',
        label: 'Secciones',
        icono: Layout,
        descripcion:
            'Títulos y subtítulos de cada sección del portal público.',
        secciones: [
            {
                titulo: 'Títulos de secciones',
                hint:
                    'Deja el subtítulo vacío para usar el valor predeterminado.',
                campos: [
                    {
                        clave: 'seccion_institucional_titulo',
                        label: 'Institucional — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_institucional_subtitulo',
                        label: 'Institucional — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_autoridades_titulo',
                        label: 'Autoridades — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_autoridades_subtitulo',
                        label: 'Autoridades — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_servicios_titulo',
                        label: 'Servicios — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_servicios_subtitulo',
                        label: 'Servicios — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_sistemas_titulo',
                        label: 'Sistemas — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_sistemas_subtitulo',
                        label: 'Sistemas — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_proyectos_titulo',
                        label: 'Proyectos — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_proyectos_subtitulo',
                        label: 'Proyectos — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_documentos_titulo',
                        label: 'Documentos — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_documentos_subtitulo',
                        label: 'Documentos — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_eventos_titulo',
                        label: 'Eventos — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_eventos_subtitulo',
                        label: 'Eventos — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_tutoriales_titulo',
                        label: 'Tutoriales — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_tutoriales_subtitulo',
                        label: 'Tutoriales — subtítulo',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_faqs_titulo',
                        label: 'FAQs — título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seccion_faqs_subtitulo',
                        label: 'FAQs — subtítulo',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
        ],
    },
    {
        key: 'textos_ui',
        label: 'Textos UI',
        icono: Type,
        descripcion:
            'Mensajes de estados vacíos, errores, carga y botones.',
        secciones: [
            {
                titulo: 'Estados vacíos',
                campos: [
                    {
                        clave: 'empty_servicios',
                        label: 'Sin servicios',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_sistemas',
                        label: 'Sin sistemas',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_noticias',
                        label: 'Sin noticias',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_documentos',
                        label: 'Sin documentos',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_eventos',
                        label: 'Sin eventos',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_tutoriales',
                        label: 'Sin tutoriales',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_faqs',
                        label: 'Sin FAQs',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_proyectos',
                        label: 'Sin proyectos',
                        tipo: 'texto',
                    },
                    {
                        clave: 'empty_autoridades',
                        label: 'Sin autoridades',
                        tipo: 'texto',
                    },
                ],
                layout: 'uno-col',
            },
            {
                titulo: 'Mensajes del sistema',
                campos: [
                    {
                        clave: 'error_seccion',
                        label: 'Error al cargar sección',
                        tipo: 'texto',
                    },
                    {
                        clave: 'btn_reintentar',
                        label: 'Botón reintentar',
                        tipo: 'texto',
                    },
                    {
                        clave: 'btn_quitar_filtro',
                        label: 'Botón quitar filtro',
                        tipo: 'texto',
                    },
                    {
                        clave: 'loading_texto',
                        label: 'Texto de carga',
                        tipo: 'texto',
                    },
                ],
                layout: 'dos-col',
            },
        ],
    },
    {
        key: 'avanzado',
        label: 'Avanzado',
        icono: Wrench,
        descripcion:
            'Rendimiento, modo mantenimiento y SEO.',
        secciones: [
            {
                titulo: 'Rendimiento',
                campos: [
                    {
                        clave: 'modo_mantenimiento',
                        label: 'Modo mantenimiento',
                        tipo: 'booleano',
                        hint:
                            'El portal muestra una pantalla de mantenimiento.',
                        danger: true,
                    },
                ],
                layout: 'toggles',
            },
            {
                titulo: 'Pantalla de mantenimiento',
                campos: [
                    {
                        clave: 'mantenimiento_titulo',
                        label: 'Título',
                        tipo: 'texto',
                    },
                    {
                        clave: 'mantenimiento_descripcion',
                        label: 'Descripción',
                        tipo: 'textarea',
                    },
                    {
                        clave: 'mantenimiento_subtexto',
                        label: 'Subtexto',
                        tipo: 'texto',
                    },
                ],
                layout: 'uno-col',
            },
            {
                titulo: 'SEO y metadatos',
                campos: [
                    {
                        clave: 'seo_titulo',
                        label: 'Meta title',
                        tipo: 'texto',
                    },
                    {
                        clave: 'seo_descripcion',
                        label: 'Meta description',
                        tipo: 'textarea',
                    },
                    {
                        clave: 'seo_keywords',
                        label: 'Keywords',
                        tipo: 'texto',
                    },
                ],
                layout: 'uno-col',
            },
        ],
    },
];

const CLAVES_ARCHIVO = new Set(
    GRUPOS.flatMap((grupo) =>
        grupo.secciones.flatMap((seccion) =>
            seccion.campos
                .filter((campo) => campo.tipo === 'archivo')
                .map((campo) => campo.clave)
        )
    )
);

// =============================================================================
// Utilidades
// =============================================================================

function resolverUrlArchivo(valor) {
    if (!valor || typeof valor !== 'string') {
        return null;
    }

    const ruta = valor.trim();

    if (!ruta) {
        return null;
    }

    if (
        ruta.startsWith('blob:') ||
        ruta.startsWith('data:')
    ) {
        return ruta;
    }

    if (
        ruta.startsWith('http://') ||
        ruta.startsWith('https://')
    ) {
        try {
            const url = new URL(ruta);
            const backend = new URL(BACKEND_URL);

            const esLocalSinPuerto =
                (url.hostname === 'localhost' ||
                    url.hostname === '127.0.0.1') &&
                !url.port;

            if (esLocalSinPuerto) {
                return `${backend.origin}${url.pathname}${url.search}${url.hash}`;
            }

            return ruta;
        } catch {
            return ruta;
        }
    }

    let rutaLimpia = ruta.replace(/\\/g, '/');

    rutaLimpia = rutaLimpia.replace(/^public\/storage\//i, '');
    rutaLimpia = rutaLimpia.replace(/^public\//i, '');
    rutaLimpia = rutaLimpia.replace(/^storage\//i, '');
    rutaLimpia = rutaLimpia.replace(/^\/storage\//i, '');
    rutaLimpia = rutaLimpia.replace(/^\/+/, '');

    return `${BACKEND_URL.replace(/\/$/, '')}/storage/${rutaLimpia}`;
}

function normalizarArchivo(valor) {
    if (!valor) {
        return {
            idarchivo: null,
            url: null,
            ruta: null,
            nombre: null,
        };
    }

    if (typeof valor === 'string') {
        return {
            idarchivo: null,
            url: resolverUrlArchivo(valor),
            ruta: valor,
            nombre: valor.split('/').pop() || null,
        };
    }

    if (typeof valor === 'object') {
        const archivo =
            valor.archivo && typeof valor.archivo === 'object'
                ? valor.archivo
                : valor;

        const ruta =
            archivo.url ??
            archivo.ruta ??
            archivo.path ??
            archivo.nombre_guardado ??
            valor.url ??
            valor.ruta ??
            valor.path ??
            null;

        return {
            idarchivo:
                archivo.idarchivo ??
                valor.idarchivo ??
                null,

            url: resolverUrlArchivo(ruta),
            ruta,

            nombre:
                archivo.nombre_original ??
                archivo.nombre ??
                archivo.nombre_guardado ??
                valor.nombre_original ??
                valor.nombre ??
                valor.nombre_guardado ??
                (typeof ruta === 'string'
                    ? ruta.split('/').pop()
                    : null),
        };
    }

    return {
        idarchivo: null,
        url: null,
        ruta: null,
        nombre: null,
    };
}

function valoresIguales(valorA, valorB) {
    return JSON.stringify(valorA) === JSON.stringify(valorB);
}

function extraerArchivoRespuesta(
    response,
    clave,
    nombreOriginal
) {
    const payload =
        response?.data ??
        response ??
        {};

    const resultadoClave =
        payload?.[clave] &&
        typeof payload[clave] === 'object'
            ? payload[clave]
            : null;

    const data =
        resultadoClave ??
        payload?.data?.[clave] ??
        payload?.data ??
        payload;

    const archivo =
        data?.archivo &&
        typeof data.archivo === 'object'
            ? data.archivo
            : data;

    const ruta =
        archivo?.url ??
        archivo?.ruta ??
        archivo?.path ??
        archivo?.nombre_guardado ??
        data?.url ??
        data?.ruta ??
        data?.path ??
        null;

    return {
        idarchivo:
            archivo?.idarchivo ??
            data?.idarchivo ??
            null,

        url: resolverUrlArchivo(ruta),
        ruta,

        nombre:
            archivo?.nombre_original ??
            archivo?.nombre ??
            archivo?.nombre_guardado ??
            data?.nombre_original ??
            data?.nombre ??
            data?.nombre_guardado ??
            nombreOriginal ??
            null,
    };
}

// =============================================================================
// Componente principal
// =============================================================================

export default function Configuracion() {
    const [grupoActivo, setGrupoActivo] =
        useState('apariencia');

    const [valores, setValores] = useState({});
    const [valoresOriginales, setValoresOriginales] =
        useState({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [archivoProcesando, setArchivoProcesando] =
        useState(null);

    const cargarDatos = useCallback(async () => {
        setLoading(true);

        try {
            const response =
                await obtenerConfiguracion();

            const data = response?.data || {};
            const plano = {};

            Object.values(data).forEach((grupo) => {
                if (!grupo || typeof grupo !== 'object') {
                    return;
                }

                Object.entries(grupo).forEach(
                    ([clave, valor]) => {
                        if (CLAVES_ARCHIVO.has(clave)) {
                            plano[clave] =
                                normalizarArchivo(valor);
                        } else if (
                            valor &&
                            typeof valor === 'object' &&
                            'valor' in valor
                        ) {
                            plano[clave] =
                                valor.valor ?? '';
                        } else {
                            plano[clave] = valor ?? '';
                        }
                    }
                );
            });

            CLAVES_ARCHIVO.forEach((clave) => {
                if (!(clave in plano)) {
                    plano[clave] =
                        normalizarArchivo(null);
                }
            });

            setValores(plano);
            setValoresOriginales(
                structuredClone(plano)
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo cargar la configuración.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const dirty = useMemo(() => {
        return Object.keys(valores).some(
            (clave) =>
                !valoresIguales(
                    valores[clave],
                    valoresOriginales[clave]
                )
        );
    }, [valores, valoresOriginales]);

    const handleChange = useCallback(
        (clave, valor) => {
            setValores((prev) => ({
                ...prev,
                [clave]: valor,
            }));
        },
        []
    );

    const handleDescartar = () => {
        setValores(
            structuredClone(valoresOriginales)
        );
    };

    const handleGuardar = async () => {
        if (!dirty) return;

        const configuracionTexto =
            Object.fromEntries(
                Object.entries(valores).filter(
                    ([clave]) =>
                        !CLAVES_ARCHIVO.has(clave)
                )
            );

        setSaving(true);

        const toastId = notifyLoading(
            'Guardando configuración...'
        );

        try {
            await actualizarConfiguracion(
                configuracionTexto
            );

            setValoresOriginales(
                structuredClone(valores)
            );

            notifySuccess(
                'Configuración guardada correctamente.'
            );
        } catch (err) {
            notifyError(
                getApiErrorMessage(
                    err,
                    'No se pudo guardar la configuración.'
                )
            );
        } finally {
            closeNotify(toastId);
            setSaving(false);
        }
    };

    const handleSubirArchivo = useCallback(
        async (clave, archivo) => {
            if (!archivo) return;

            const tiposPermitidos = [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/svg+xml',
            ];

            if (
                archivo.type &&
                !tiposPermitidos.includes(archivo.type)
            ) {
                notifyError(
                    'Solo se permiten imágenes JPG, PNG, WEBP o SVG.'
                );
                return;
            }

            const maximoBytes =
                5 * 1024 * 1024;

            if (archivo.size > maximoBytes) {
                notifyError(
                    'La imagen no debe superar los 5 MB.'
                );
                return;
            }

            setArchivoProcesando(clave);

            const toastId = notifyLoading(
                'Subiendo imagen...'
            );

            try {
                const response =
                    await subirArchivoConfiguracion(
                        clave,
                        archivo
                    );

                const archivoGuardado =
                    extraerArchivoRespuesta(
                        response,
                        clave,
                        archivo.name
                    );

                setValores((prev) => ({
                    ...prev,
                    [clave]: archivoGuardado,
                }));

                setValoresOriginales((prev) => ({
                    ...prev,
                    [clave]: archivoGuardado,
                }));

                notifySuccess(
                    'Imagen guardada correctamente.'
                );
            } catch (err) {
                notifyError(
                    getApiErrorMessage(
                        err,
                        'No se pudo subir la imagen.'
                    )
                );
            } finally {
                closeNotify(toastId);
                setArchivoProcesando(null);
            }
        },
        []
    );

    const handleEliminarArchivo = useCallback(
        async (clave) => {
            const confirmado = window.confirm(
                '¿Deseas eliminar esta imagen? El portal volverá a utilizar el recurso predeterminado.'
            );

            if (!confirmado) return;

            setArchivoProcesando(clave);

            const toastId = notifyLoading(
                'Eliminando imagen...'
            );

            try {
                await eliminarArchivoConfiguracion(
                    clave
                );

                const vacio =
                    normalizarArchivo(null);

                setValores((prev) => ({
                    ...prev,
                    [clave]: vacio,
                }));

                setValoresOriginales((prev) => ({
                    ...prev,
                    [clave]: vacio,
                }));

                notifySuccess(
                    'Imagen eliminada correctamente.'
                );
            } catch (err) {
                notifyError(
                    getApiErrorMessage(
                        err,
                        'No se pudo eliminar la imagen.'
                    )
                );
            } finally {
                closeNotify(toastId);
                setArchivoProcesando(null);
            }
        },
        []
    );

    const grupoConfig = useMemo(
        () =>
            GRUPOS.find(
                (grupo) =>
                    grupo.key === grupoActivo
            ),
        [grupoActivo]
    );

    if (loading) {
        return (
            <section className="configuracion-page">
                <div className="configuracion-loading">
                    <p>
                        Cargando configuración...
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="configuracion-page">
            <div className="configuracion-header">
                <div>
                    <span className="configuracion-eyebrow">
                        Portal Web DSTI
                    </span>

                    <h1>Configuración global</h1>

                    <p>
                        Personaliza la apariencia,
                        textos, comportamiento e
                        imágenes del portal público
                        desde un solo lugar.
                    </p>
                </div>

                <ConPermiso permiso="catalogos.editar">
                <div className="configuracion-header-actions">
                    {dirty && (
                        <button
                            type="button"
                            className="configuracion-cancel-button"
                            onClick={handleDescartar}
                            disabled={
                                saving ||
                                Boolean(
                                    archivoProcesando
                                )
                            }
                        >
                            <RotateCcw size={16} />
                            Descartar
                        </button>
                    )}

                    <button
                        type="button"
                        className={`configuracion-save-button ${
                            !dirty ? 'disabled' : ''
                        }`}
                        onClick={handleGuardar}
                        disabled={
                            !dirty ||
                            saving ||
                            Boolean(
                                archivoProcesando
                            )
                        }
                    >
                        <Save size={16} />

                        {saving
                            ? 'Guardando...'
                            : 'Guardar cambios'}
                    </button>
                </div>
                </ConPermiso>
            </div>

            <div className="configuracion-layout">
                <aside className="configuracion-sidebar">
                    {GRUPOS.map((grupo) => {
                        const Icono = grupo.icono;

                        const activo =
                            grupoActivo === grupo.key;

                        return (
                            <button
                                key={grupo.key}
                                type="button"
                                className={`configuracion-nav-item ${
                                    activo
                                        ? 'is-active'
                                        : ''
                                }`}
                                onClick={() =>
                                    setGrupoActivo(
                                        grupo.key
                                    )
                                }
                            >
                                <Icono size={16} />

                                <span>
                                    {grupo.label}
                                </span>

                                <ChevronRight
                                    size={14}
                                    className="configuracion-nav-arrow"
                                />
                            </button>
                        );
                    })}
                </aside>

                <div className="configuracion-content">
                    <div className="configuracion-group-header">
                        <h2>
                            {grupoConfig?.label}
                        </h2>

                        <p>
                            {
                                grupoConfig?.descripcion
                            }
                        </p>
                    </div>

                    {grupoConfig?.secciones.map(
                        (seccion, indice) => (
                            <SeccionFormulario
                                key={`${grupoConfig.key}-${indice}`}
                                seccion={seccion}
                                valores={valores}
                                onChange={
                                    handleChange
                                }
                                onSubirArchivo={
                                    handleSubirArchivo
                                }
                                onEliminarArchivo={
                                    handleEliminarArchivo
                                }
                                archivoProcesando={
                                    archivoProcesando
                                }
                                saving={saving}
                            />
                        )
                    )}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Sección de formulario
// =============================================================================

function SeccionFormulario({
                               seccion,
                               valores,
                               onChange,
                               onSubirArchivo,
                               onEliminarArchivo,
                               archivoProcesando,
                               saving,
                           }) {
    return (
        <div className="configuracion-seccion">
            <div className="configuracion-seccion-title">
                {seccion.titulo}
            </div>

            {seccion.hint && (
                <p className="configuracion-seccion-hint">
                    {seccion.hint}
                </p>
            )}

            <div
                className={`configuracion-layout configuracion-layout-${seccion.layout}`}
            >
                {seccion.campos.map((campo) => (
                    <CampoConfig
                        key={campo.clave}
                        campo={campo}
                        valor={
                            valores[campo.clave] ??
                            ''
                        }
                        onChange={onChange}
                        onSubirArchivo={
                            onSubirArchivo
                        }
                        onEliminarArchivo={
                            onEliminarArchivo
                        }
                        procesando={
                            archivoProcesando ===
                            campo.clave
                        }
                        saving={saving}
                    />
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// CampoConfig
// =============================================================================

function CampoConfig({
                         campo,
                         valor,
                         onChange,
                         onSubirArchivo,
                         onEliminarArchivo,
                         procesando,
                         saving,
                     }) {
    const {
        clave,
        label,
        tipo,
        hint,
        opciones = [],
        danger = false,
        accept = 'image/*',
    } = campo;

    if (tipo === 'archivo') {
        const archivoActual =
            normalizarArchivo(valor);

        const tieneImagen =
            Boolean(archivoActual.url);

        const handleSeleccionarArchivo = (
            event
        ) => {
            const archivo =
                event.target.files?.[0];

            if (archivo) {
                onSubirArchivo(
                    clave,
                    archivo
                );
            }

            event.target.value = '';
        };

        return (
            <div className="configuracion-field configuracion-field-file">
                <label htmlFor={`archivo-${clave}`}>
                    {label}
                </label>

                <div className="configuracion-file-card">
                    <div className="configuracion-file-preview">
                        {tieneImagen ? (
                            <img
                                src={
                                    archivoActual.url
                                }
                                alt={label}
                                loading="lazy"
                                decoding="async"
                                onError={(event) => {
                                    console.error(
                                        'No se pudo cargar la imagen:',
                                        archivoActual.url
                                    );

                                    event.currentTarget.style.display =
                                        'none';

                                    const preview =
                                        event.currentTarget.parentElement;

                                    if (preview) {
                                        preview.classList.add(
                                            'configuracion-file-preview-error'
                                        );
                                    }
                                }}
                            />
                        ) : (
                            <div className="configuracion-file-empty">
                                <ImageIcon
                                    size={32}
                                    aria-hidden="true"
                                />

                                <span>
                                    Sin imagen
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="configuracion-file-info">
                        <strong>
                            {archivoActual.nombre ||
                                (tieneImagen
                                    ? 'Imagen actual'
                                    : 'No se ha seleccionado una imagen')}
                        </strong>

                        <small>
                            {tieneImagen
                                ? 'Puedes reemplazar o eliminar esta imagen.'
                                : 'Al no existir una imagen se utilizará el recurso predeterminado del CSS.'}
                        </small>
                    </div>

                    <div className="configuracion-file-actions">
                        <label
                            htmlFor={`archivo-${clave}`}
                            className={`configuracion-file-upload ${
                                procesando
                                    ? 'is-disabled'
                                    : ''
                            }`}
                        >
                            <Upload size={16} />

                            {procesando
                                ? 'Procesando...'
                                : tieneImagen
                                    ? 'Reemplazar'
                                    : 'Seleccionar'}
                        </label>

                        <input
                            type="file"
                            id={`archivo-${clave}`}
                            accept={accept}
                            onChange={
                                handleSeleccionarArchivo
                            }
                            disabled={
                                saving ||
                                procesando
                            }
                            hidden
                        />

                        {tieneImagen && (
                            <button
                                type="button"
                                className="configuracion-file-delete"
                                onClick={() =>
                                    onEliminarArchivo(
                                        clave
                                    )
                                }
                                disabled={
                                    saving ||
                                    procesando
                                }
                            >
                                <Trash2
                                    size={16}
                                />
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                {hint && <small>{hint}</small>}
            </div>
        );
    }

    if (tipo === 'booleano') {
        const activo =
            valor === '1' ||
            valor === 1 ||
            valor === true ||
            valor === 'true';

        return (
            <div
                className={`configuracion-toggle-row ${
                    danger
                        ? 'is-danger'
                        : ''
                }`}
            >
                <div className="configuracion-toggle-info">
                    <strong>{label}</strong>

                    {hint && (
                        <span>{hint}</span>
                    )}
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={activo}
                    aria-label={label}
                    className={`configuracion-toggle ${
                        activo
                            ? 'is-on'
                            : 'is-off'
                    }`}
                    onClick={() =>
                        onChange(
                            clave,
                            activo ? '0' : '1'
                        )
                    }
                    disabled={saving}
                />
            </div>
        );
    }

    if (tipo === 'color') {
        const colorValido =
            /^#[0-9A-Fa-f]{6}$/.test(
                String(valor || '')
            )
                ? valor
                : '#000000';

        return (
            <div className="configuracion-field configuracion-field-color">
                <label htmlFor={clave}>
                    {label}
                </label>

                <div className="configuracion-color-wrap">
                    <input
                        type="color"
                        id={`color-picker-${clave}`}
                        value={colorValido}
                        onChange={(event) =>
                            onChange(
                                clave,
                                event.target.value
                            )
                        }
                        className="configuracion-color-input"
                        disabled={saving}
                    />

                    <input
                        type="text"
                        id={clave}
                        value={valor || ''}
                        onChange={(event) =>
                            onChange(
                                clave,
                                event.target.value
                            )
                        }
                        className="configuracion-color-hex"
                        placeholder="#000000"
                        maxLength={7}
                        disabled={saving}
                    />
                </div>

                {hint && <small>{hint}</small>}
            </div>
        );
    }

    if (tipo === 'select') {
        return (
            <div className="configuracion-field">
                <label htmlFor={clave}>
                    {label}
                </label>

                <select
                    id={clave}
                    value={valor || ''}
                    onChange={(event) =>
                        onChange(
                            clave,
                            event.target.value
                        )
                    }
                    disabled={saving}
                >
                    {opciones.map((opcion) => (
                        <option
                            key={opcion}
                            value={opcion}
                        >
                            {opcion}
                        </option>
                    ))}
                </select>

                {hint && <small>{hint}</small>}
            </div>
        );
    }

    if (tipo === 'textarea') {
        return (
            <div className="configuracion-field configuracion-field-full">
                <label htmlFor={clave}>
                    {label}
                </label>

                <textarea
                    id={clave}
                    value={valor || ''}
                    onChange={(event) =>
                        onChange(
                            clave,
                            event.target.value
                        )
                    }
                    rows={3}
                    disabled={saving}
                />

                {hint && <small>{hint}</small>}
            </div>
        );
    }

    if (tipo === 'password') {
        return (
            <div className="configuracion-field">
                <label htmlFor={clave}>
                    {label}
                </label>

                <input
                    type="password"
                    id={clave}
                    value={valor || ''}
                    onChange={(event) =>
                        onChange(
                            clave,
                            event.target.value
                        )
                    }
                    autoComplete="new-password"
                    disabled={saving}
                />

                {hint && <small>{hint}</small>}
            </div>
        );
    }

    return (
        <div className="configuracion-field">
            <label htmlFor={clave}>
                {label}
            </label>

            <input
                type={
                    tipo === 'email'
                        ? 'email'
                        : tipo === 'url'
                            ? 'url'
                            : 'text'
                }
                id={clave}
                value={valor || ''}
                onChange={(event) =>
                    onChange(
                        clave,
                        event.target.value
                    )
                }
                disabled={saving}
            />

            {hint && <small>{hint}</small>}
        </div>
    );
}