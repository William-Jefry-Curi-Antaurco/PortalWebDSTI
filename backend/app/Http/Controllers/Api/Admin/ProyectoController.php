<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\Proyecto;
use App\Services\ArchivoLimpiezaService;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProyectoController extends Controller
{
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse {
        $query = Proyecto::with([
            'categoria',
            'estado',
            'archivo',
        ])
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('titulo', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('responsable', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        $proyectos = $query->paginate(10);

        $proyectos->getCollection()->transform(function ($proyecto) use ($etiquetaService) {
            $proyecto->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::PROYECTOS,
                $proyecto->idproyecto
            );

            return $proyecto;
        });

        return response()->json([
            'success' => true,
            'message' => 'Listado de proyectos obtenido correctamente.',
            'data' => $proyectos,
        ]);
    }

    public function store(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse {
        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                'unique:proyectos,titulo',
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'porcentaje_avance' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_fin' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],
            'responsable' => [
                'nullable',
                'string',
                'max:150',
            ],
            'url_resultado' => [
                'nullable',
                'url',
                'max:255',
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
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
        ], [
            'titulo.required' => 'El título del proyecto es obligatorio.',
            'titulo.unique' => 'Ya existe un proyecto con ese título.',
            'titulo.max' => 'El título no debe superar los 200 caracteres.',
            'porcentaje_avance.min' => 'El porcentaje de avance no puede ser menor que 0.',
            'porcentaje_avance.max' => 'El porcentaje de avance no puede ser mayor que 100.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'url_resultado.url' => 'La URL del resultado no tiene un formato válido.',
            'url_resultado.max' => 'La URL del resultado no debe superar los 255 caracteres.',
            'responsable.max' => 'El responsable no debe superar los 150 caracteres.',
            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'etiquetas.array' => 'Las etiquetas deben enviarse como una lista.',
            'etiquetas.*.exists' => 'Una de las etiquetas seleccionadas no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rutaGuardada = null;

        try {
            $proyecto = DB::transaction(function () use ($request, $etiquetaService, &$rutaGuardada) {
                $idArchivo = null;

                if ($request->hasFile('archivo')) {
                    $archivoSubido = $request->file('archivo');

                    $nombreOriginal = $archivoSubido->getClientOriginalName();
                    $extension = $archivoSubido->getClientOriginalExtension();
                    $mimeType = $archivoSubido->getMimeType();
                    $pesoBytes = $archivoSubido->getSize();

                    $nombreGuardado = 'proyecto_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
                    $rutaGuardada = $archivoSubido->storeAs('proyectos', $nombreGuardado, 'public');

                    $archivo = Archivo::create([
                        'nombre_original' => $nombreOriginal,
                        'nombre_guardado' => $nombreGuardado,
                        'ruta' => $rutaGuardada,
                        'extension' => $extension,
                        'mime_type' => $mimeType,
                        'peso_bytes' => $pesoBytes,
                        'descargas' => 0,
                    ]);

                    $idArchivo = $archivo->idarchivo;
                }

                $proyecto = Proyecto::create([
                    'titulo' => $request->titulo,
                    'slug' => $this->generarSlugUnico($request->titulo),
                    'descripcion' => $request->descripcion,
                    'porcentaje_avance' => $request->porcentaje_avance ?? 0,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'responsable' => $request->responsable,
                    'url_resultado' => $request->url_resultado,
                    'idcategoria' => $request->idcategoria,
                    'idestado' => $request->idestado,
                    'idarchivo' => $idArchivo,
                    'orden' => $request->orden ?? 0,
                    'activo' => $request->has('activo')
                        ? $request->boolean('activo')
                        : true,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::PROYECTOS,
                    $proyecto->idproyecto,
                    $request->input('etiquetas', [])
                );

                return $proyecto;
            });
        } catch (\Throwable $e) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $proyecto->load([
            'categoria',
            'estado',
            'archivo',
        ]);

        $proyecto->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::PROYECTOS,
            $proyecto->idproyecto
        );

        return response()->json([
            'success' => true,
            'message' => 'Proyecto registrado correctamente.',
            'data' => $proyecto,
        ], 201);
    }

    public function show(
        int $id,
        EtiquetaContenidoService $etiquetaService
    ): JsonResponse {
        $proyecto = Proyecto::with([
            'categoria',
            'estado',
            'archivo',
        ])->find($id);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        $proyecto->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::PROYECTOS,
            $proyecto->idproyecto
        );

        return response()->json([
            'success' => true,
            'message' => 'Proyecto obtenido correctamente.',
            'data' => $proyecto,
        ]);
    }

    public function update(
        Request $request,
        int $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ): JsonResponse {
        $proyecto = Proyecto::with('archivo')->find($id);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                Rule::unique('proyectos', 'titulo')->ignore(
                    $proyecto->idproyecto,
                    'idproyecto'
                ),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'porcentaje_avance' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_fin' => [
                'nullable',
                'date',
                'after_or_equal:fecha_inicio',
            ],
            'responsable' => [
                'nullable',
                'string',
                'max:150',
            ],
            'url_resultado' => [
                'nullable',
                'url',
                'max:255',
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
            'orden' => [
                'nullable',
                'integer',
                'min:0',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
        ], [
            'titulo.required' => 'El título del proyecto es obligatorio.',
            'titulo.unique' => 'Ya existe un proyecto con ese título.',
            'porcentaje_avance.min' => 'El porcentaje de avance no puede ser menor que 0.',
            'porcentaje_avance.max' => 'El porcentaje de avance no puede ser mayor que 100.',
            'url_resultado.url' => 'La URL del resultado no tiene un formato válido.',
            'url_resultado.max' => 'La URL del resultado no debe superar los 255 caracteres.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'etiquetas.array' => 'Las etiquetas deben enviarse como una lista.',
            'etiquetas.*.exists' => 'Una de las etiquetas seleccionadas no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $archivoAnterior = null;
        $rutaGuardada = null;

        try {
            DB::transaction(function () use ($request, $proyecto, $etiquetaService, &$archivoAnterior, &$rutaGuardada) {
                if ($request->hasFile('archivo')) {
                    $archivoAnterior = $proyecto->archivo;

                    $archivoSubido = $request->file('archivo');

                    $nombreOriginal = $archivoSubido->getClientOriginalName();
                    $extension = $archivoSubido->getClientOriginalExtension();
                    $mimeType = $archivoSubido->getMimeType();
                    $pesoBytes = $archivoSubido->getSize();

                    $nombreGuardado = 'proyecto_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
                    $rutaGuardada = $archivoSubido->storeAs('proyectos', $nombreGuardado, 'public');

                    $nuevoArchivo = Archivo::create([
                        'nombre_original' => $nombreOriginal,
                        'nombre_guardado' => $nombreGuardado,
                        'ruta' => $rutaGuardada,
                        'extension' => $extension,
                        'mime_type' => $mimeType,
                        'peso_bytes' => $pesoBytes,
                        'descargas' => 0,
                    ]);

                    $proyecto->idarchivo = $nuevoArchivo->idarchivo;
                }

                $slug = $proyecto->titulo !== $request->titulo
                    ? $this->generarSlugUnico($request->titulo, $proyecto->idproyecto)
                    : $proyecto->slug;

                $proyecto->update([
                    'titulo' => $request->titulo,
                    'slug' => $slug,
                    'descripcion' => $request->descripcion,
                    'porcentaje_avance' => $request->porcentaje_avance ?? 0,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'responsable' => $request->responsable,
                    'url_resultado' => $request->url_resultado,
                    'idcategoria' => $request->idcategoria,
                    'idestado' => $request->idestado,
                    'idarchivo' => $proyecto->idarchivo,
                    'orden' => $request->orden ?? 0,
                    'activo' => $request->has('activo')
                        ? $request->boolean('activo')
                        : true,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::PROYECTOS,
                    $proyecto->idproyecto,
                    $request->input('etiquetas', [])
                );
            });
        } catch (\Throwable $e) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoAnterior);

        $proyecto->load([
            'categoria',
            'estado',
            'archivo',
        ]);

        $proyecto->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::PROYECTOS,
            $proyecto->idproyecto
        );

        return response()->json([
            'success' => true,
            'message' => 'Proyecto actualizado correctamente.',
            'data' => $proyecto,
        ]);
    }

    public function destroy(
        int $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ): JsonResponse {
        $proyecto = Proyecto::with('archivo')->find($id);

        if (!$proyecto) {
            return response()->json([
                'success' => false,
                'message' => 'Proyecto no encontrado.',
            ], 404);
        }

        $archivo = $proyecto->archivo;

        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::PROYECTOS,
            $proyecto->idproyecto
        );

        $proyecto->delete();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivo);

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Proyecto eliminado correctamente.',
        ]);
    }

    private function generarSlugUnico(string $titulo, ?int $idProyectoIgnorar = null): string
    {
        $slugBase = Str::slug($titulo);
        $slug = $slugBase;
        $contador = 1;

        while (
        Proyecto::where('slug', $slug)
            ->when($idProyectoIgnorar, function ($query) use ($idProyectoIgnorar) {
                $query->where('idproyecto', '!=', $idProyectoIgnorar);
            })
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }

    private function limpiarCachePublico(): void
    {
        Cache::increment('public:cache_version');
        Cache::forget('public:inicio');
    }
}
