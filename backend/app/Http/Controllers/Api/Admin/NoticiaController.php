<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Noticia;
use App\Models\NoticiaImagen;
use App\Services\ArchivoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Support\Facades\Cache;





class NoticiaController extends Controller
{
    //public function index(): JsonResponse
    public function index(EtiquetaContenidoService $etiquetaService): JsonResponse
    {
        $noticias = Noticia::with([
            'categoria',
            'autor',
            'estado',
            'tipoPublicacion',
            'imagenes.archivo',
        ])
            ->orderByDesc('created_at')
            ->get();

        $noticias = $this->adjuntarEtiquetasANoticias(
            $noticias,
            $etiquetaService
        );

        return response()->json([
            'success' => true,
            'message' => 'Listado de noticias obtenido correctamente.',
            'data' => $noticias,
        ]);
    }

    //public function show(int $id): JsonResponse
    public function show(int $id, EtiquetaContenidoService $etiquetaService): JsonResponse
    {
        $noticia = Noticia::with([
            'categoria',
            'autor',
            'estado',
            'tipoPublicacion',
            'imagenes.archivo',
        ])->find($id);

        if (!$noticia) {
            return response()->json([
                'success' => false,
                'message' => 'La noticia no existe.',
            ], 404);
        }


        $noticia = $this->adjuntarEtiquetasANoticia(
            $noticia,
            $etiquetaService
        );


        return response()->json([
            'success' => true,
            'message' => 'Noticia obtenida correctamente.',
            'data' => $noticia,
        ]);
    }

    //public function store(Request $request): JsonResponse
    public function store(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => [
                'required',
                'string',
                'min:5',
                'max:200',
            ],
            'resumen' => [
                'required',
                'string',
                'min:10',
                'max:300',
            ],
            'contenido' => [
                'required',
                'string',
                'min:20',
            ],
            'es_destacada' => [
                'nullable',
                'boolean',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'idcategoria' => [
                'required',
                'integer',
                'exists:categorias,idcategoria',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
            'idtipopublicacion' => [
                'required',
                'integer',
                'exists:tipos_publicacion,idtipopublicacion',
            ],
            'fecha_publicacion' => [
                'required',
                'date',
            ],
            'fecha_expiracion' => [
                'nullable',
                'date',
                'after_or_equal:fecha_publicacion',
            ],
        ], [
            'titulo.required' => 'El título es obligatorio.',
            'titulo.min' => 'El título debe tener como mínimo 5 caracteres.',
            'titulo.max' => 'El título no debe superar los 200 caracteres.',

            'resumen.required' => 'El resumen es obligatorio.',
            'resumen.min' => 'El resumen debe tener como mínimo 10 caracteres.',
            'resumen.max' => 'El resumen no debe superar los 300 caracteres.',

            'contenido.required' => 'El contenido es obligatorio.',
            'contenido.min' => 'El contenido debe tener como mínimo 20 caracteres.',

            'es_destacada.boolean' => 'El campo destacado debe ser verdadero o falso.',

            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',

            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',

            'idtipopublicacion.required' => 'El tipo de publicación es obligatorio.',
            'idtipopublicacion.exists' => 'El tipo de publicación seleccionado no existe.',

            'fecha_publicacion.required' => 'La fecha de publicación es obligatoria.',
            'fecha_publicacion.date' => 'La fecha de publicación no tiene un formato válido.',

            'fecha_expiracion.date' => 'La fecha de expiración no tiene un formato válido.',
            'fecha_expiracion.after_or_equal' => 'La fecha de expiración debe ser igual o posterior a la fecha de publicación.',
        ]);

        $slugBase = Str::slug($validated['titulo']);
        $slug = $slugBase;
        $contador = 1;

        while (Noticia::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $noticia = Noticia::create([
            'titulo' => $validated['titulo'],
            'slug' => $slug,
            'resumen' => $validated['resumen'],
            'contenido' => $validated['contenido'],
            'es_destacada' => $validated['es_destacada'] ?? false,
            'visitas' => 0,
            'idcategoria' => $validated['idcategoria'],
            'idusuario_autor' => $request->user()->idusuario,
            'idestado' => $validated['idestado'],
            'idtipopublicacion' => $validated['idtipopublicacion'],
            'fecha_publicacion' => $validated['fecha_publicacion'],
            'fecha_expiracion' => $validated['fecha_expiracion'] ?? null,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::NOTICIAS,
            $noticia->idnoticia,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();

        $noticia->load([
            'categoria',
            'autor',
            'estado',
            'tipoPublicacion',
            'imagenes.archivo',
        ]);

        $noticia = $this->adjuntarEtiquetasANoticia(
            $noticia,
            $etiquetaService
        );

        return response()->json([
            'success' => true,
            'message' => 'Noticia registrada correctamente.',
            'data' => $noticia,
        ], 201);
    }

   // public function update(Request $request, int $id): JsonResponse
    public function update(
        Request $request,
        int $id,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse
    {
        $noticia = Noticia::find($id);

        if (!$noticia) {
            return response()->json([
                'success' => false,
                'message' => 'La noticia no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'titulo' => [
                'required',
                'string',
                'min:5',
                'max:200',
            ],
            'resumen' => [
                'required',
                'string',
                'min:10',
                'max:300',
            ],
            'contenido' => [
                'required',
                'string',
                'min:20',
            ],
            'es_destacada' => [
                'nullable',
                'boolean',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'idcategoria' => [
                'required',
                'integer',
                'exists:categorias,idcategoria',
            ],
            'idestado' => [
                'required',
                'integer',
                'exists:estados,idestado',
            ],
            'idtipopublicacion' => [
                'required',
                'integer',
                'exists:tipos_publicacion,idtipopublicacion',
            ],
            'fecha_publicacion' => [
                'required',
                'date',
            ],
            'fecha_expiracion' => [
                'nullable',
                'date',
                'after_or_equal:fecha_publicacion',
            ],
        ], [
            'titulo.required' => 'El título es obligatorio.',
            'titulo.min' => 'El título debe tener como mínimo 5 caracteres.',
            'titulo.max' => 'El título no debe superar los 200 caracteres.',

            'resumen.required' => 'El resumen es obligatorio.',
            'resumen.min' => 'El resumen debe tener como mínimo 10 caracteres.',
            'resumen.max' => 'El resumen no debe superar los 300 caracteres.',

            'contenido.required' => 'El contenido es obligatorio.',
            'contenido.min' => 'El contenido debe tener como mínimo 20 caracteres.',

            'es_destacada.boolean' => 'El campo destacado debe ser verdadero o falso.',

            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',

            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',

            'idtipopublicacion.required' => 'El tipo de publicación es obligatorio.',
            'idtipopublicacion.exists' => 'El tipo de publicación seleccionado no existe.',

            'fecha_publicacion.required' => 'La fecha de publicación es obligatoria.',
            'fecha_publicacion.date' => 'La fecha de publicación no tiene un formato válido.',

            'fecha_expiracion.date' => 'La fecha de expiración no tiene un formato válido.',
            'fecha_expiracion.after_or_equal' => 'La fecha de expiración debe ser igual o posterior a la fecha de publicación.',
        ]);

        if ($noticia->titulo !== $validated['titulo']) {
            $slugBase = Str::slug($validated['titulo']);
            $slug = $slugBase;
            $contador = 1;

            while (
            Noticia::where('slug', $slug)
                ->where('idnoticia', '!=', $noticia->idnoticia)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $validated['slug'] = $slug;
        }

        $noticia->update([
            'titulo' => $validated['titulo'],
            'slug' => $validated['slug'] ?? $noticia->slug,
            'resumen' => $validated['resumen'],
            'contenido' => $validated['contenido'],
            'es_destacada' => $validated['es_destacada'] ?? false,
            'idcategoria' => $validated['idcategoria'],
            'idestado' => $validated['idestado'],
            'idtipopublicacion' => $validated['idtipopublicacion'],
            'fecha_publicacion' => $validated['fecha_publicacion'],
            'fecha_expiracion' => $validated['fecha_expiracion'] ?? null,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::NOTICIAS,
            $noticia->idnoticia,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();


        $noticia->load([
            'categoria',
            'autor',
            'estado',
            'tipoPublicacion',
            'imagenes.archivo',
        ]);

        $noticia = $this->adjuntarEtiquetasANoticia(
            $noticia,
            $etiquetaService
        );

        return response()->json([
            'success' => true,
            'message' => 'Noticia actualizada correctamente.',
            'data' => $noticia,
        ]);
    }

    //public function destroy(int $id): JsonResponse
    public function destroy(
        int $id,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse
    {
        $noticia = Noticia::withCount('imagenes')->find($id);

        if (!$noticia) {
            return response()->json([
                'success' => false,
                'message' => 'La noticia no existe.',
            ], 404);
        }

        if ($noticia->imagenes_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la noticia porque tiene imágenes asociadas.',
                'data' => [
                    'imagenes' => $noticia->imagenes_count,
                ],
            ], 409);
        }
        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::NOTICIAS,
            $noticia->idnoticia
        );

        $noticia->delete();

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Noticia eliminada correctamente.',
        ]);
    }

    public function subirImagen(Request $request, int $id, ArchivoService $archivoService): JsonResponse
    {
        $noticia = Noticia::find($id);

        if (!$noticia) {
            return response()->json([
                'success' => false,
                'message' => 'La noticia no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'imagen' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'texto_alternativo' => [
                'nullable',
                'string',
                'max:255',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'es_portada' => [
                'nullable',
                'boolean',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
        ], [
            'imagen.required' => 'La imagen es obligatoria.',
            'imagen.image' => 'El archivo debe ser una imagen válida.',
            'imagen.mimes' => 'La imagen debe ser JPG, JPEG, PNG o WEBP.',
            'imagen.max' => 'La imagen no debe superar los 5 MB.',

            'texto_alternativo.max' => 'El texto alternativo no debe superar los 255 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 255 caracteres.',
            'es_portada.boolean' => 'El campo portada debe ser verdadero o falso.',
            'orden.integer' => 'El orden debe ser un número entero.',
            'orden.min' => 'El orden no puede ser negativo.',
            'orden.max' => 'El orden no debe superar 255.',
        ]);

        $archivo = $archivoService->guardarImagenNoticia($request->file('imagen'));

        if (($validated['es_portada'] ?? false) === true) {
            NoticiaImagen::where('idnoticia', $noticia->idnoticia)
                ->update(['es_portada' => false]);
        }

        $imagen = NoticiaImagen::create([
            'texto_alternativo' => $validated['texto_alternativo'] ?? null,
            'descripcion' => $validated['descripcion'] ?? null,
            'es_portada' => $validated['es_portada'] ?? false,
            'orden' => $validated['orden'] ?? 0,
            'idarchivo' => $archivo->idarchivo,
            'idnoticia' => $noticia->idnoticia,
        ]);

        $imagen->load('archivo');

        return response()->json([
            'success' => true,
            'message' => 'Imagen registrada correctamente.',
            'data' => $imagen,
        ], 201);
    }

    public function actualizarImagen(Request $request, int $id, ArchivoService $archivoService): JsonResponse
    {
        $imagen = NoticiaImagen::with('archivo')->find($id);

        if (!$imagen) {
            return response()->json([
                'success' => false,
                'message' => 'La imagen no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'imagen' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'texto_alternativo' => [
                'nullable',
                'string',
                'max:255',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'es_portada' => [
                'nullable',
                'boolean',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
        ], [
            'imagen.image' => 'El archivo debe ser una imagen válida.',
            'imagen.mimes' => 'La imagen debe ser JPG, JPEG, PNG o WEBP.',
            'imagen.max' => 'La imagen no debe superar los 5 MB.',

            'texto_alternativo.max' => 'El texto alternativo no debe superar los 255 caracteres.',
            'descripcion.max' => 'La descripción no debe superar los 255 caracteres.',
            'es_portada.boolean' => 'El campo portada debe ser verdadero o falso.',
            'orden.integer' => 'El orden debe ser un número entero.',
            'orden.min' => 'El orden no puede ser negativo.',
            'orden.max' => 'El orden no debe superar 255.',
        ]);

        if (($validated['es_portada'] ?? false) === true) {
            NoticiaImagen::where('idnoticia', $imagen->idnoticia)
                ->where('idnoticiaimagen', '!=', $imagen->idnoticiaimagen)
                ->update([
                    'es_portada' => false,
                ]);
        }

        $archivoAnterior = null;

        if ($request->hasFile('imagen')) {
            $archivoAnterior = $imagen->archivo;

            $archivoNuevo = $archivoService->guardarImagenNoticia(
                $request->file('imagen')
            );

            $imagen->idarchivo = $archivoNuevo->idarchivo;
        }

        $imagen->texto_alternativo = $validated['texto_alternativo'] ?? $imagen->texto_alternativo;
        $imagen->descripcion = $validated['descripcion'] ?? $imagen->descripcion;
        $imagen->es_portada = $validated['es_portada'] ?? $imagen->es_portada;
        $imagen->orden = $validated['orden'] ?? $imagen->orden;

        $imagen->save();

        if ($archivoAnterior) {
            $this->eliminarArchivoSiNoTieneUsos($archivoAnterior);
        }

        $imagen->load('archivo');

        return response()->json([
            'success' => true,
            'message' => 'Imagen actualizada correctamente.',
            'data' => $imagen,
        ]);
    }

    public function eliminarImagen(int $id): JsonResponse
    {
        $imagen = NoticiaImagen::with('archivo')->find($id);

        if (!$imagen) {
            return response()->json([
                'success' => false,
                'message' => 'La imagen no existe.',
            ], 404);
        }

        $archivo = $imagen->archivo;

        $imagen->delete();

        if ($archivo) {
            $this->eliminarArchivoSiNoTieneUsos($archivo);
        }

        return response()->json([
            'success' => true,
            'message' => 'Imagen eliminada correctamente.',
        ]);
    }

    private function eliminarArchivoSiNoTieneUsos($archivo): void
    {
        $usosArchivo = $archivo->noticiasImagen()->count()
            + $archivo->documentos()->count()
            + $archivo->eventos()->count()
            + $archivo->eventosArchivos()->count()
            + $archivo->tutoriales()->count()
            + $archivo->solicitudesSoporte()->count()
            + $archivo->proyectos()->count();

        if ($usosArchivo === 0) {
            Storage::disk('public')->delete($archivo->ruta);
            $archivo->delete();
        }
    }


    private function adjuntarEtiquetasANoticias($noticias, EtiquetaContenidoService $etiquetaService)
    {
        $ids = $noticias
            ->pluck('idnoticia')
            ->filter()
            ->values()
            ->all();

        $etiquetasPorNoticia = $etiquetaService->obtenerPorLote(
            EtiquetaEntidad::NOTICIAS,
            $ids
        );

        return $noticias->map(function ($noticia) use ($etiquetasPorNoticia) {
            $noticia->etiquetas = $etiquetasPorNoticia
                ->get($noticia->idnoticia, collect())
                ->values();

            return $noticia;
        });
    }

    private function adjuntarEtiquetasANoticia(Noticia $noticia, EtiquetaContenidoService $etiquetaService): Noticia
    {
        $noticia->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::NOTICIAS,
            $noticia->idnoticia
        );

        return $noticia;
    }

    private function limpiarCachePublico(): void
    {
        Cache::increment('public:cache_version');
        Cache::forget('public:inicio');
    }




}
