<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Noticia;
use App\Models\Servicio;
use App\Models\EnlaceSistema;
use App\Models\Documento;
use App\Models\Evento;
use App\Models\Tutorial;
use App\Models\Faq;
use App\Models\InfoInstitucional;
use App\Models\Autoridad;
use App\Models\Proyecto;
use App\Models\Categoria;
use App\Models\Modulo;
use App\Models\TipoSoporte;
use App\Models\Prioridad;
use App\Models\TipoDocumento;
use App\Models\TipoEvento;
use App\Models\ModalidadEvento;
use App\Models\TipoTutorial;
use App\Models\SolicitudSoporte;
use App\Models\PortalConfiguracion;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PortalPublicController extends Controller
{
    private const TTL_LARGO = 30;
    private const TTL_MEDIO = 10;
    private const TTL_CORTO = 5;

    // ── Helpers generales ─────────────────────────────────────────────────────

    private function ok($data = null, string $message = 'Operación correcta.')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ]);
    }

    private function ttl(int $minutes): \DateTimeInterface
    {
        return now()->addMinutes($minutes);
    }

    private function cacheVersion(): int
    {
        return (int) Cache::get('public:cache_version', 1);
    }

    private function cacheKey(string $name, array $params = []): string
    {
        ksort($params);

        return 'public:v' . $this->cacheVersion() . ':' . $name . ':' . md5(json_encode($params));
    }

    private function perPage(Request $request, int $default = 9, int $max = 100): int
    {
        $valor = $request->input('per_page');

        if ($valor === null || $valor === '' || !is_numeric($valor)) {
            return $default;
        }

        $perPage = (int) $valor;

        if ($perPage <= 0) {
            return $default;
        }

        return min($perPage, $max);
    }

    /**
     * Obtiene una configuración numérica positiva desde portal_configuraciones.
     */
    private function configuracionNumerica(
        string $grupo,
        string $clave,
        int $default,
        int $max = 100
    ): int {
        $configuracion = PortalConfiguracion::grupo($grupo);
        $valor = $configuracion[$clave] ?? $default;

        if ($valor === null || $valor === '' || !is_numeric($valor)) {
            return $default;
        }

        $numero = (int) $valor;

        if ($numero <= 0) {
            return $default;
        }

        return min($numero, $max);
    }

    private function moduloActivo(string $slug): bool
    {
        return Cache::remember(
            $this->cacheKey('modulo-activo', ['slug' => $slug]),
            $this->ttl(self::TTL_LARGO),
            fn () => Modulo::where('slug', $slug)
                ->where('activo', 1)
                ->exists()
        );
    }

    private function aplicarCategoriaYModuloActivo($query, ?string $slugModulo = null)
    {
        return $query->whereHas('categoria', function ($categoria) use ($slugModulo) {
            $categoria->where('activo', 1)
                ->whereHas('modulo', function ($modulo) use ($slugModulo) {
                    $modulo->where('activo', 1);

                    if ($slugModulo) {
                        $modulo->where('slug', $slugModulo);
                    }
                });
        });
    }

    private function aplicarFiltrosPublicos(Request $request, $query, ?string $slugModulo = null)
    {
        $this->aplicarCategoriaYModuloActivo($query, $slugModulo);

        $query->when($request->filled('categoria'), function ($q) use ($request) {
            $q->where('idcategoria', $request->categoria);
        });

        $query->when($request->filled('modulo'), function ($q) use ($request) {
            $q->whereHas('categoria.modulo', function ($modulo) use ($request) {
                $modulo->where('idmodulo', $request->modulo)
                    ->where('activo', 1);
            });
        });

        return $query;
    }

    private function paginatorToArray($paginator): array
    {
        return [
            'data' => collect($paginator->items())
                ->map(fn ($item) => is_object($item) && method_exists($item, 'toArray')
                    ? $item->toArray()
                    : $item
                )
                ->all(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    // ── Helpers de etiquetas ──────────────────────────────────────────────────

    private function etiquetasPorLote(string $entidad, array $ids): array
    {
        $idsNormalizados = collect($ids)
            ->filter(fn ($id) => is_numeric($id))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($idsNormalizados->isEmpty()) {
            return [];
        }

        return DB::table('etiquetas_contenido as ec')
            ->join('etiquetas as e', 'e.idetiqueta', '=', 'ec.idetiqueta')
            ->where('ec.entidad', $entidad)
            ->whereIn('ec.identidad', $idsNormalizados)
            ->where('e.activo', 1)
            ->select(
                'ec.identidad',
                'e.idetiqueta',
                'e.nombre',
                'e.slug',
                'e.color'
            )
            ->orderBy('e.nombre')
            ->get()
            ->groupBy('identidad')
            ->map(fn ($items) => $items->values()->toArray())
            ->toArray();
    }

    private function adjuntarEtiquetas($coleccion, string $entidad, string $campoId)
    {
        $ids = $coleccion
            ->pluck($campoId)
            ->filter()
            ->values()
            ->all();

        $mapaEtiquetas = $this->etiquetasPorLote($entidad, $ids);

        return $coleccion->map(function ($item) use ($mapaEtiquetas, $campoId) {
            $id = $item->{$campoId};

            $item->etiquetas = $mapaEtiquetas[$id] ?? [];

            return $item;
        });
    }

    private function adjuntarEtiquetasAPaginador($paginator, string $entidad, string $campoId): array
    {
        $coleccion = collect($paginator->items());

        $coleccion = $this->adjuntarEtiquetas($coleccion, $entidad, $campoId);

        return [
            'data' => $coleccion
                ->map(fn ($item) => is_object($item) && method_exists($item, 'toArray')
                    ? $item->toArray()
                    : $item
                )
                ->values()
                ->all(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    private function adjuntarEtiquetasAItem($item, string $entidad, string $campoId)
    {
        if (!$item) {
            return $item;
        }

        $id = $item->{$campoId};

        $mapaEtiquetas = $this->etiquetasPorLote($entidad, [$id]);

        $item->etiquetas = $mapaEtiquetas[$id] ?? [];

        return $item;
    }

    /**
     * Filtra por texto libre en $campos y, adicionalmente, por coincidencia
     * en el nombre de alguna etiqueta interna asociada (no se exponen las
     * etiquetas como filtro visual, solo mejoran la relevancia de la
     * búsqueda de texto).
     */
    private function aplicarBusquedaTexto(
        $query,
        string $search,
        array $campos,
        string $entidadEtiqueta,
        string $columnaIdCalificada
    ) {
        return $query->where(function ($subQuery) use ($search, $campos, $entidadEtiqueta, $columnaIdCalificada) {
            foreach ($campos as $indice => $campo) {
                $metodo = $indice === 0 ? 'where' : 'orWhere';
                $subQuery->{$metodo}($campo, 'like', "%{$search}%");
            }

            $subQuery->orWhereExists(function ($etiquetaQuery) use ($search, $entidadEtiqueta, $columnaIdCalificada) {
                $etiquetaQuery->select(DB::raw(1))
                    ->from('etiquetas_contenido as ec')
                    ->join('etiquetas as e', 'e.idetiqueta', '=', 'ec.idetiqueta')
                    ->whereColumn('ec.identidad', $columnaIdCalificada)
                    ->where('ec.entidad', $entidadEtiqueta)
                    ->where('e.activo', 1)
                    ->where('e.nombre', 'like', "%{$search}%");
            });
        });
    }

    // ── Endpoints públicos ────────────────────────────────────────────────────

    public function catalogos()
    {
        $data = Cache::remember($this->cacheKey('catalogos'), $this->ttl(self::TTL_LARGO), function () {
            return [
                'modulos' => Modulo::where('activo', 1)
                    ->select(
                        'idmodulo',
                        'nombre',
                        'slug',
                        'descripcion',
                        'activo'
                    )
                    ->orderBy('idmodulo')
                    ->get()
                    ->map(function ($modulo) {
                        return [
                            'idmodulo' => $modulo->idmodulo,
                            'nombre' => $modulo->nombre,
                            'slug' => $modulo->slug,
                            'descripcion' => $modulo->descripcion,
                            'activo' => $modulo->activo,
                            'orden' => $modulo->idmodulo,
                        ];
                    })
                    ->values()
                    ->toArray(),

                'categorias' => Categoria::with('modulo:idmodulo,nombre,slug,activo')
                    ->where('activo', 1)
                    ->whereHas('modulo', function ($modulo) {
                        $modulo->where('activo', 1);
                    })
                    ->select(
                        'idcategoria',
                        'nombre',
                        'slug',
                        'descripcion',
                        'orden',
                        'activo',
                        'idmodulo'
                    )
                    ->orderBy('idmodulo')
                    ->orderBy('orden')
                    ->get()
                    ->toArray(),

                'tipos_soporte' => TipoSoporte::where('activo', 1)
                    ->select('idtiposoporte', 'nombre', 'activo')
                    ->get()
                    ->toArray(),

                'prioridades' => Prioridad::orderBy('nivel')
                    ->select('idprioridad', 'nombre', 'nivel')
                    ->get()
                    ->toArray(),

                'tipos_documento' => TipoDocumento::where('activo', 1)
                    ->select('idtipodocumento', 'nombre', 'activo')
                    ->get()
                    ->toArray(),

                'tipos_evento' => TipoEvento::where('activo', 1)
                    ->select('idtipoevento', 'nombre', 'activo')
                    ->get()
                    ->toArray(),

                'modalidades_evento' => ModalidadEvento::where('activo', 1)
                    ->select('idmodalidad', 'nombre', 'activo')
                    ->get()
                    ->toArray(),

                'tipos_tutorial' => TipoTutorial::where('activo', 1)
                    ->select('idtipotutorial', 'nombre', 'activo')
                    ->get()
                    ->toArray(),
            ];
        });

        return $this->ok($data, 'Catálogos públicos obtenidos correctamente.');
    }

    public function inicio()
    {
        $limiteNoticias = $this->configuracionNumerica(
            'modulos',
            'paginacion_noticias',
            9
        );

        $limiteServicios = $this->configuracionNumerica(
            'modulos',
            'paginacion_servicios',
            9
        );

        $limiteEventos = $this->configuracionNumerica(
            'modulos',
            'paginacion_eventos',
            9
        );

        $limiteFaqs = $this->configuracionNumerica(
            'modulos',
            'paginacion_faqs',
            20
        );

        $cacheKey = $this->cacheKey('inicio', [
            'paginacion_noticias' => $limiteNoticias,
            'paginacion_servicios' => $limiteServicios,
            'paginacion_eventos' => $limiteEventos,
            'paginacion_faqs' => $limiteFaqs,
        ]);

        $data = Cache::remember(
            $cacheKey,
            $this->ttl(self::TTL_MEDIO),
            function () use (
                $limiteNoticias,
                $limiteServicios,
                $limiteEventos,
                $limiteFaqs
            ) {
                $noticias = Noticia::with([
                    'categoria:idcategoria,nombre,slug',
                    'tipoPublicacion:idtipopublicacion,nombre',
                    'imagenes.archivo:idarchivo,ruta,mime_type,extension',
                ])
                    ->where(
                        fn ($query) => $this->aplicarCategoriaYModuloActivo(
                            $query,
                            'noticias-comunicados'
                        )
                    )
                    ->select(
                        'idnoticia',
                        'titulo',
                        'slug',
                        'resumen',
                        'fecha_publicacion',
                        'es_destacada',
                        'idcategoria',
                        'idtipopublicacion'
                    )
                    ->orderByDesc('es_destacada')
                    ->orderByDesc('fecha_publicacion')
                    ->take($limiteNoticias)
                    ->get();

                $noticias = $this->adjuntarEtiquetas(
                    $noticias,
                    'noticias',
                    'idnoticia'
                )
                    ->map(function ($noticia) {
                        $imagen = $noticia->imagenes
                            ->sortByDesc('es_portada')
                            ->sortBy('orden')
                            ->first();

                        $archivo = $imagen?->archivo;

                        $noticia->imagen_url = $archivo?->ruta
                            ? asset('storage/' . ltrim($archivo->ruta, '/'))
                            : null;

                        unset($noticia->imagenes);

                        return $noticia;
                    })
                    ->values()
                    ->toArray();

                $servicios = Servicio::with(
                    'categoria:idcategoria,nombre,slug'
                )
                    ->where('activo', 1)
                    ->where(
                        fn ($query) => $this->aplicarCategoriaYModuloActivo(
                            $query,
                            'servicios-tecnologicos'
                        )
                    )
                    ->select(
                        'idservicio',
                        'nombre',
                        'slug',
                        'descripcion_corta',
                        'url_servicio',
                        'requiere_autenticacion',
                        'orden',
                        'idcategoria',
                        'correo_contacto',
                        'texto_accion'
                    )
                    ->orderBy('orden')
                    ->take($limiteServicios)
                    ->get();

                $servicios = $this->adjuntarEtiquetas(
                    $servicios,
                    'servicios',
                    'idservicio'
                )
                    ->values()
                    ->toArray();

                $eventos = Evento::with([
                    'categoria:idcategoria,nombre,slug',
                    'estado:idestado,nombre',
                    'tipoEvento:idtipoevento,nombre',
                    'modalidad:idmodalidad,nombre',
                    'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
                ])
                    ->where(
                        fn ($query) => $this->aplicarCategoriaYModuloActivo(
                            $query,
                            'eventos-capacitaciones'
                        )
                    )
                    ->select(
                        'idevento',
                        'titulo',
                        'slug',
                        'descripcion',
                        'fecha_inicio',
                        'fecha_fin',
                        'ubicacion',
                        'enlace_virtual',
                        'cupo_maximo',
                        'cupos_ocupados',
                        'idcategoria',
                        'idestado',
                        'idtipoevento',
                        'idmodalidad',
                        'idarchivo',
                        'created_at'
                    )
                    ->orderByDesc('fecha_inicio')
                    ->take($limiteEventos)
                    ->get();

                $eventos = $this->adjuntarEtiquetas(
                    $eventos,
                    'eventos',
                    'idevento'
                )
                    ->values()
                    ->toArray();

                $faqs = Faq::with(
                    'categoria:idcategoria,nombre,slug'
                )
                    ->where(
                        fn ($query) => $this->aplicarCategoriaYModuloActivo(
                            $query,
                            'tutoriales-recursos'
                        )
                    )
                    ->select(
                        'idfaq',
                        'pregunta',
                        'respuesta',
                        'orden',
                        'idcategoria'
                    )
                    ->orderBy('orden')
                    ->take($limiteFaqs)
                    ->get()
                    ->toArray();

                return compact(
                    'noticias',
                    'servicios',
                    'eventos',
                    'faqs'
                );
            }
        );

        return $this->ok(
            $data,
            'Datos de inicio obtenidos correctamente.'
        );
    }

    public function institucional()
    {
        $data = Cache::remember($this->cacheKey('institucional'), $this->ttl(self::TTL_LARGO), function () {
            if (!$this->moduloActivo('institucional')) {
                return [];
            }

            return InfoInstitucional::where('activo', 1)
                ->select(
                    'idinfo',
                    'clave',
                    'titulo',
                    'contenido',
                    'orden'
                )
                ->orderBy('orden')
                ->get()
                ->toArray();
        });

        return $this->ok($data, 'Información institucional obtenida correctamente.');
    }

    public function autoridades()
    {
        $data = Cache::remember($this->cacheKey('autoridades'), $this->ttl(self::TTL_LARGO), function () {
            if (!$this->moduloActivo('institucional')) {
                return [];
            }

            return Autoridad::where('activo', 1)
                ->select(
                    'idautoridad',
                    'nombre_completo',
                    'cargo',
                    'funciones_principales',
                    'correo_institucional',
                    'foto_url',
                    'orden',
                    'fecha_inicio_gestion',
                    'fecha_fin_gestion'
                )
                ->orderBy('orden')
                ->get()
                ->toArray();
        });

        return $this->ok($data, 'Autoridades obtenidas correctamente.');
    }

    public function proyectos(Request $request)
    {
        $params = $request->only(['categoria', 'modulo', 'search', 'per_page', 'page']);
        $cacheKey = $this->cacheKey('proyectos', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Proyecto::with([
                'categoria:idcategoria,nombre,slug,activo,idmodulo',
                'estado:idestado,nombre',
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->where('activo', 1)
                ->select(
                    'idproyecto',
                    'titulo',
                    'slug',
                    'descripcion',
                    'porcentaje_avance',
                    'fecha_inicio',
                    'fecha_fin',
                    'responsable',
                    'url_resultado',
                    'orden',
                    'activo',
                    'idcategoria',
                    'idestado',
                    'idarchivo',
                    'created_at'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'proyectos-tecnologicos');

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['titulo', 'descripcion'],
                    EtiquetaEntidad::PROYECTOS,
                    'proyectos.idproyecto'
                );
            });

            $paginator = $query
                ->orderBy('orden')
                ->orderByDesc('created_at')
                ->paginate($this->perPage($request, 9, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'proyectos',
                'idproyecto'
            );
        });

        return $this->ok($data, 'Proyectos obtenidos correctamente.');
    }

    public function servicios(Request $request)
    {
        $params = $request->only(['categoria', 'modulo', 'search', 'per_page', 'page']);
        $cacheKey = $this->cacheKey('servicios', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Servicio::with('categoria:idcategoria,nombre,slug')
                ->where('activo', 1)
                ->select(
                    'idservicio',
                    'nombre',
                    'slug',
                    'descripcion_corta',
                    'descripcion_larga',
                    'icono',
                    'url_servicio',
                    'requiere_autenticacion',
                    'orden',
                    'idcategoria',
                    'correo_contacto',
                    'texto_accion',
                    'orientacion',
                    'casos_uso',
                    'consejo',
                    'seccion_relacionada',
                    'label_seccion',
                    'activo'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'servicios-tecnologicos');

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['nombre', 'descripcion_corta', 'descripcion_larga'],
                    EtiquetaEntidad::SERVICIOS,
                    'servicios.idservicio'
                );
            });

            $paginator = $query
                ->orderBy('orden')
                ->paginate($this->perPage($request, 9, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'servicios',
                'idservicio'
            );
        });

        return $this->ok($data, 'Servicios obtenidos correctamente.');
    }

    public function sistemas(Request $request)
    {
        $query = EnlaceSistema::with([
            'categoria:idcategoria,nombre,slug',
            'estadoOperativo:idestadooperativo,nombre',
            'archivoManual:idarchivo,nombre_original,ruta,extension,mime_type',
            'archivoDocumentacion:idarchivo,nombre_original,ruta,extension,mime_type',
        ])
            ->where('activo', 1)
            ->select(
                'idenlace',
                'nombre_sistema',
                'slug',
                'descripcion',
                'url',
                'icono',
                'orden',
                'idcategoria',
                'idestadooperativo',
                'idarchivo_manual',
                'idarchivo_documentacion'
            );

        $this->aplicarFiltrosPublicos(
            $request,
            $query,
            'sistemas-institucionales'
        );

        $sistemas = $query
            ->orderBy('orden')
            ->orderBy('idenlace')
            ->get();

        $sistemas = $this->adjuntarEtiquetas(
            $sistemas,
            'enlaces_sistemas',
            'idenlace'
        )
            ->values()
            ->map(
                fn ($item) =>
                is_object($item) && method_exists($item, 'toArray')
                    ? $item->toArray()
                    : $item
            )
            ->all();

        return $this->ok(
            $sistemas,
            'Sistemas institucionales obtenidos correctamente.'
        );
    }

    public function noticias(Request $request)
    {
        $params = $request->only([
            'categoria',
            'modulo',
            'tipo',
            'search',
            'per_page',
            'page',
        ]);

        $cacheKey = $this->cacheKey('noticias', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Noticia::with([
                'categoria:idcategoria,nombre,slug',
                'tipoPublicacion:idtipopublicacion,nombre',
                'imagenes.archivo:idarchivo,ruta,mime_type,extension',
            ])
                ->select(
                    'idnoticia',
                    'titulo',
                    'slug',
                    'resumen',
                    'contenido',
                    'fecha_publicacion',
                    'es_destacada',
                    'visitas',
                    'idcategoria',
                    'idtipopublicacion'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'noticias-comunicados');

            $query->when($request->filled('tipo'), function ($q) use ($request) {
                $q->where('idtipopublicacion', $request->tipo);
            });

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['titulo', 'resumen', 'contenido'],
                    EtiquetaEntidad::NOTICIAS,
                    'noticias.idnoticia'
                );
            });

            $paginator = $query
                ->orderByDesc('es_destacada')
                ->orderByDesc('fecha_publicacion')
                ->paginate($this->perPage($request, 9, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'noticias',
                'idnoticia'
            );
        });

        return $this->ok($data, 'Noticias obtenidas correctamente.');
    }

    public function noticiaDetalle(string $slug)
    {
        $cacheKey = $this->cacheKey('noticia-detalle', ['slug' => $slug]);

        $data = Cache::remember($cacheKey, $this->ttl(self::TTL_CORTO), function () use ($slug) {
            $noticia = Noticia::with([
                'categoria:idcategoria,nombre,slug,activo,idmodulo',
                'categoria.modulo:idmodulo,nombre,slug,activo',
                'tipoPublicacion:idtipopublicacion,nombre',
                'imagenes.archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->where('slug', $slug)
                ->whereHas('categoria', function ($categoria) {
                    $categoria->where('activo', 1)
                        ->whereHas('modulo', function ($modulo) {
                            $modulo->where('activo', 1)
                                ->where('slug', 'noticias-comunicados');
                        });
                })
                ->firstOrFail();

            $noticia = $this->adjuntarEtiquetasAItem(
                $noticia,
                'noticias',
                'idnoticia'
            );

            $noticia->imagenes = $noticia->imagenes
                ->sortByDesc('es_portada')
                ->sortBy('orden')
                ->values()
                ->map(function ($imagen) {
                    if ($imagen->archivo && $imagen->archivo->ruta) {
                        $ruta = ltrim($imagen->archivo->ruta, '/');
                        $ruta = preg_replace('/^public\//', '', $ruta);
                        $ruta = preg_replace('/^storage\//', '', $ruta);

                        $imagen->archivo->url = asset('storage/' . $ruta);
                    }

                    return $imagen;
                });

            $relacionadas = Noticia::with([
                'categoria:idcategoria,nombre,slug',
                'tipoPublicacion:idtipopublicacion,nombre',
                'imagenes.archivo:idarchivo,ruta,mime_type,extension',
            ])
                ->where('idnoticia', '!=', $noticia->idnoticia)
                ->whereHas('categoria', function ($categoria) {
                    $categoria->where('activo', 1)
                        ->whereHas('modulo', function ($modulo) {
                            $modulo->where('activo', 1)
                                ->where('slug', 'noticias-comunicados');
                        });
                })
                ->where(function ($query) use ($noticia) {
                    $query->where('idcategoria', $noticia->idcategoria)
                        ->orWhere('idtipopublicacion', $noticia->idtipopublicacion);
                })
                ->orderByRaw('CASE WHEN idcategoria = ? THEN 0 ELSE 1 END', [$noticia->idcategoria])
                ->orderByDesc('fecha_publicacion')
                ->take(3)
                ->get();

            $relacionadas = $this->adjuntarEtiquetas(
                $relacionadas,
                'noticias',
                'idnoticia'
            )->map(function ($relacionada) {
                $relacionada->imagenes = $relacionada->imagenes
                    ->sortByDesc('es_portada')
                    ->sortBy('orden')
                    ->values()
                    ->map(function ($imagen) {
                        if ($imagen->archivo && $imagen->archivo->ruta) {
                            $ruta = ltrim($imagen->archivo->ruta, '/');
                            $ruta = preg_replace('/^public\//', '', $ruta);
                            $ruta = preg_replace('/^storage\//', '', $ruta);

                            $imagen->archivo->url = asset('storage/' . $ruta);
                        }

                        return $imagen;
                    });

                return $relacionada;
            });

            return [
                'noticia' => $noticia,
                'relacionadas' => $relacionadas,
            ];
        });

        Noticia::where('slug', $slug)->increment('visitas');

        return $this->ok($data, 'Detalle de noticia obtenido correctamente.');
    }

    public function documentos(Request $request)
    {
        $params = $request->only([
            'categoria',
            'modulo',
            'tipo',
            'search',
            'per_page',
            'page',
        ]);

        $cacheKey = $this->cacheKey('documentos', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Documento::with([
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
                'categoria:idcategoria,nombre,slug,activo,idmodulo',
                'estado:idestado,nombre',
                'tipoDocumento:idtipodocumento,nombre',
            ])
                ->where('es_version_actual', 1)
                ->select(
                    'iddocumento',
                    'titulo',
                    'slug',
                    'descripcion',
                    'version',
                    'fecha_documento',
                    'fecha_publicacion',
                    'url_externa',
                    'idcategoria',
                    'idestado',
                    'idtipodocumento',
                    'idarchivo',
                    'created_at'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'documentos-manuales');

            $query->when($request->filled('tipo'), function ($q) use ($request) {
                $q->where('idtipodocumento', $request->tipo);
            });

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['titulo', 'descripcion'],
                    EtiquetaEntidad::DOCUMENTOS,
                    'documentos.iddocumento'
                );
            });

            $paginator = $query
                ->orderByDesc('fecha_documento')
                ->paginate($this->perPage($request, 10, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'documentos',
                'iddocumento'
            );
        });

        return $this->ok($data, 'Documentos obtenidos correctamente.');
    }

    public function documentoDetalle(string $slug)
    {
        $cacheKey = $this->cacheKey('documento-detalle', ['slug' => $slug]);

        $data = Cache::remember($cacheKey, $this->ttl(self::TTL_MEDIO), function () use ($slug) {
            $documento = Documento::with([
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
                'categoria:idcategoria,nombre,slug',
                'estado:idestado,nombre',
                'tipoDocumento:idtipodocumento,nombre',
            ])
                ->where('slug', $slug)
                ->where('es_version_actual', 1)
                ->whereHas('categoria', function ($categoria) {
                    $categoria->where('activo', 1)
                        ->whereHas('modulo', function ($modulo) {
                            $modulo->where('activo', 1)
                                ->where('slug', 'documentos-manuales');
                        });
                })
                ->firstOrFail();

            return $this->adjuntarEtiquetasAItem(
                $documento,
                'documentos',
                'iddocumento'
            );
        });

        return $this->ok($data, 'Detalle de documento obtenido correctamente.');
    }

    public function eventos(Request $request)
    {
        $params = $request->only([
            'categoria',
            'modulo',
            'tipo',
            'modalidad',
            'search',
            'per_page',
            'page',
        ]);

        $cacheKey = $this->cacheKey('eventos', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Evento::with([
                'categoria:idcategoria,nombre,slug',
                'estado:idestado,nombre',
                'tipoEvento:idtipoevento,nombre',
                'modalidad:idmodalidad,nombre',
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
                'archivos.archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->select(
                    'idevento',
                    'titulo',
                    'slug',
                    'descripcion',
                    'fecha_inicio',
                    'fecha_fin',
                    'ubicacion',
                    'enlace_virtual',
                    'cupo_maximo',
                    'cupos_ocupados',
                    'idcategoria',
                    'idestado',
                    'idtipoevento',
                    'idmodalidad',
                    'idarchivo',
                    'created_at'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'eventos-capacitaciones');

            $query->when($request->filled('tipo'), function ($q) use ($request) {
                $q->where('idtipoevento', $request->tipo);
            });

            $query->when($request->filled('modalidad'), function ($q) use ($request) {
                $q->where('idmodalidad', $request->modalidad);
            });

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['titulo', 'descripcion'],
                    EtiquetaEntidad::EVENTOS,
                    'eventos.idevento'
                );
            });

            $paginator = $query
                ->orderByDesc('fecha_inicio')
                ->paginate($this->perPage($request, 9, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'eventos',
                'idevento'
            );
        });

        return $this->ok($data, 'Eventos obtenidos correctamente.');
    }

    public function eventoDetalle(string $slug)
    {
        $cacheKey = $this->cacheKey('evento-detalle', ['slug' => $slug]);

        $data = Cache::remember($cacheKey, $this->ttl(self::TTL_MEDIO), function () use ($slug) {
            $evento = Evento::with([
                'categoria:idcategoria,nombre,slug',
                'estado:idestado,nombre',
                'tipoEvento:idtipoevento,nombre',
                'modalidad:idmodalidad,nombre',
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
                'archivos.archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->select(
                    'idevento',
                    'titulo',
                    'slug',
                    'descripcion',
                    'fecha_inicio',
                    'fecha_fin',
                    'ubicacion',
                    'enlace_virtual',
                    'cupo_maximo',
                    'cupos_ocupados',
                    'idcategoria',
                    'idestado',
                    'idtipoevento',
                    'idmodalidad',
                    'idarchivo',
                    'created_at'
                )
                ->where('slug', $slug)
                ->whereHas('categoria', function ($categoria) {
                    $categoria->where('activo', 1)
                        ->whereHas('modulo', function ($modulo) {
                            $modulo->where('activo', 1)
                                ->where('slug', 'eventos-capacitaciones');
                        });
                })
                ->firstOrFail();

            return $this->adjuntarEtiquetasAItem(
                $evento,
                'eventos',
                'idevento'
            );
        });

        return $this->ok($data, 'Detalle de evento obtenido correctamente.');
    }

    public function tutoriales(Request $request)
    {
        $params = $request->only([
            'categoria',
            'modulo',
            'tipo',
            'search',
            'per_page',
            'page',
        ]);

        $cacheKey = $this->cacheKey('tutoriales', $params);
        $ttl = $request->filled('search') ? self::TTL_CORTO : self::TTL_MEDIO;

        $data = Cache::remember($cacheKey, $this->ttl($ttl), function () use ($request) {
            $query = Tutorial::with([
                'categoria:idcategoria,nombre,slug,activo,idmodulo',
                'estado:idestado,nombre',
                'tipoTutorial:idtipotutorial,nombre',
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->select(
                    'idtutorial',
                    'titulo',
                    'slug',
                    'descripcion',
                    'contenido_html',
                    'enlace_video',
                    'duracion_minutos',
                    'visitas',
                    'orden',
                    'fecha_publicacion',
                    'idcategoria',
                    'idestado',
                    'idtipotutorial',
                    'idarchivo',
                    'created_at'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'tutoriales-recursos');

            $query->when($request->filled('tipo'), function ($q) use ($request) {
                $q->where('idtipotutorial', $request->tipo);
            });

            $query->when($request->filled('search'), function ($q) use ($request) {
                $this->aplicarBusquedaTexto(
                    $q,
                    trim($request->search),
                    ['titulo', 'descripcion'],
                    EtiquetaEntidad::TUTORIALES,
                    'tutoriales.idtutorial'
                );
            });

            $paginator = $query
                ->orderBy('orden')
                ->orderByDesc('created_at')
                ->paginate($this->perPage($request, 9, 20));

            return $this->adjuntarEtiquetasAPaginador(
                $paginator,
                'tutoriales',
                'idtutorial'
            );
        });

        return $this->ok($data, 'Tutoriales obtenidos correctamente.');
    }

    public function tutorialDetalle(string $slug)
    {
        $cacheKey = $this->cacheKey('tutorial-detalle', ['slug' => $slug]);

        $data = Cache::remember($cacheKey, $this->ttl(self::TTL_CORTO), function () use ($slug) {
            $tutorial = Tutorial::with([
                'categoria:idcategoria,nombre,slug',
                'estado:idestado,nombre',
                'tipoTutorial:idtipotutorial,nombre',
                'archivo:idarchivo,ruta,mime_type,extension,peso_bytes,nombre_original',
            ])
                ->select(
                    'idtutorial',
                    'titulo',
                    'slug',
                    'descripcion',
                    'contenido_html',
                    'enlace_video',
                    'duracion_minutos',
                    'visitas',
                    'orden',
                    'idcategoria',
                    'idestado',
                    'idtipotutorial',
                    'idarchivo'
                )
                ->where('slug', $slug)
                ->whereHas('categoria', function ($categoria) {
                    $categoria->where('activo', 1)
                        ->whereHas('modulo', function ($modulo) {
                            $modulo->where('activo', 1)
                                ->where('slug', 'tutoriales-recursos');
                        });
                })
                ->firstOrFail();

            return $this->adjuntarEtiquetasAItem(
                $tutorial,
                'tutoriales',
                'idtutorial'
            );
        });

        Tutorial::where('slug', $slug)->increment('visitas');

        return $this->ok($data, 'Detalle de tutorial obtenido correctamente.');
    }

    public function faqs(Request $request)
    {
        $params = $request->only([
            'categoria',
            'modulo',
            'per_page',
            'page',
        ]);

        $cacheKey = $this->cacheKey('faqs', $params);

        $data = Cache::remember($cacheKey, $this->ttl(self::TTL_MEDIO), function () use ($request) {
            $query = Faq::with('categoria:idcategoria,nombre,slug')
                ->select(
                    'idfaq',
                    'pregunta',
                    'respuesta',
                    'orden',
                    'idcategoria'
                );

            $this->aplicarFiltrosPublicos($request, $query, 'tutoriales-recursos');

            return $this->paginatorToArray(
                $query
                    ->orderBy('orden')
                    ->paginate($this->perPage($request, 20, 30))
            );
        });

        return $this->ok($data, 'Preguntas frecuentes obtenidas correctamente.');
    }

    public function registrarSoporte(Request $request)
    {
        if (!$this->moduloActivo('mesa-ayuda')) {
            return response()->json([
                'success' => false,
                'message' => 'El módulo de mesa de ayuda no se encuentra disponible.',
                'data' => null,
            ], 403);
        }

        $validated = $request->validate([
            'nombres' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'dependencia' => ['nullable', 'string', 'max:150'],
            'asunto' => ['required', 'string', 'max:200'],
            'descripcion' => ['required', 'string'],
            'idtiposoporte' => ['required', 'integer', 'exists:tipos_soporte,idtiposoporte'],
            'idprioridad' => ['nullable', 'integer', 'exists:prioridades,idprioridad'],
            'consentimiento_privacidad' => ['required', Rule::in([1, true, '1'])],
        ]);

        $solicitud = SolicitudSoporte::create([
            'nombres' => $validated['nombres'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? null,
            'dependencia' => $validated['dependencia'] ?? null,
            'asunto' => $validated['asunto'],
            'descripcion' => $validated['descripcion'],
            'ip_origen' => $request->ip(),
            'consentimiento_privacidad' => 1,
            'codigo_ticket' => 'DSTI-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
            'idtiposoporte' => $validated['idtiposoporte'],
            'idprioridad' => $validated['idprioridad'] ?? (int) (Prioridad::orderBy('nivel')->value('idprioridad') ?? 1),
            'idestado' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Solicitud registrada correctamente.',
            'data' => [
                'codigo_ticket' => $solicitud->codigo_ticket,
                'solicitud' => $solicitud,
            ],
        ], 201);
    }
}
