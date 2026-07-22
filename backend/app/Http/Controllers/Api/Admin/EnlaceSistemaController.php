<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\EnlaceSistema;
use App\Services\ArchivoLimpiezaService;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EnlaceSistemaController extends Controller
{
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $query = EnlaceSistema::with(['categoria', 'estadoOperativo', 'archivoManual', 'archivoDocumentacion'])
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre_sistema', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('url', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestadooperativo')) {
            $query->where('idestadooperativo', $request->idestadooperativo);
        }

        $enlaces = $query->paginate(10);

        $enlaces->getCollection()->transform(function ($enlace) use ($etiquetaService) {
            $enlace->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::SISTEMAS,
                $enlace->idenlace
            );

            return $enlace;
        });

        return response()->json([
            'success' => true,
            'message' => 'Listado de sistemas institucionales obtenido correctamente.',
            'data' => $enlaces,
        ]);
    }

    public function store(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $validator = Validator::make(
            $request->all(),
            $this->rules(),
            $this->messages()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $rutaManualGuardada = null;
        $rutaDocumentacionGuardada = null;

        try {
            $enlace = DB::transaction(function () use ($request, $etiquetaService, &$rutaManualGuardada, &$rutaDocumentacionGuardada) {
                $archivoManual = $request->hasFile('archivo_manual')
                    ? $this->guardarArchivo($request->file('archivo_manual'), $rutaManualGuardada)
                    : null;

                $archivoDocumentacion = $request->hasFile('archivo_documentacion')
                    ? $this->guardarArchivo($request->file('archivo_documentacion'), $rutaDocumentacionGuardada)
                    : null;

                $enlace = EnlaceSistema::create([
                    'nombre_sistema' => $request->nombre_sistema,
                    'slug' => $this->generarSlugUnico($request->nombre_sistema),
                    'descripcion' => $request->descripcion,
                    'url' => $request->url,
                    'icono' => $request->icono,
                    'idcategoria' => $request->idcategoria,
                    'idestadooperativo' => $request->idestadooperativo,
                    'idarchivo_manual' => $archivoManual?->idarchivo,
                    'idarchivo_documentacion' => $archivoDocumentacion?->idarchivo,
                    'orden' => $request->orden ?? 0,
                    'activo' => $request->has('activo')
                        ? $request->boolean('activo')
                        : true,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::SISTEMAS,
                    $enlace->idenlace,
                    $request->input('etiquetas', [])
                );

                return $enlace;
            });
        } catch (\Throwable $e) {
            if ($rutaManualGuardada) {
                Storage::disk('public')->delete($rutaManualGuardada);
            }

            if ($rutaDocumentacionGuardada) {
                Storage::disk('public')->delete($rutaDocumentacionGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $enlace->load(['categoria', 'estadoOperativo', 'archivoManual', 'archivoDocumentacion']);

        $enlace->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SISTEMAS,
            $enlace->idenlace
        );

        return response()->json([
            'success' => true,
            'message' => 'Sistema institucional registrado correctamente.',
            'data' => $enlace,
        ], 201);
    }

    public function show(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $enlace = EnlaceSistema::with(['categoria', 'estadoOperativo', 'archivoManual', 'archivoDocumentacion'])->find($id);

        if (!$enlace) {
            return response()->json([
                'success' => false,
                'message' => 'Sistema institucional no encontrado.',
            ], 404);
        }

        $enlace->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SISTEMAS,
            $enlace->idenlace
        );

        return response()->json([
            'success' => true,
            'message' => 'Sistema institucional obtenido correctamente.',
            'data' => $enlace,
        ]);
    }

    public function update(
        Request $request,
                $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ) {
        $enlace = EnlaceSistema::find($id);

        if (!$enlace) {
            return response()->json([
                'success' => false,
                'message' => 'Sistema institucional no encontrado.',
            ], 404);
        }

        $validator = Validator::make(
            $request->all(),
            $this->rules($enlace->idenlace),
            $this->messages()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $archivoManualAnteriorId = $enlace->idarchivo_manual;
        $archivoDocumentacionAnteriorId = $enlace->idarchivo_documentacion;
        $rutaManualGuardada = null;
        $rutaDocumentacionGuardada = null;

        try {
            DB::transaction(function () use ($request, $enlace, $etiquetaService, &$rutaManualGuardada, &$rutaDocumentacionGuardada) {
                $slug = $enlace->nombre_sistema !== $request->nombre_sistema
                    ? $this->generarSlugUnico($request->nombre_sistema, $enlace->idenlace)
                    : $enlace->slug;

                $idarchivoManual = $enlace->idarchivo_manual;
                $idarchivoDocumentacion = $enlace->idarchivo_documentacion;

                if ($request->hasFile('archivo_manual')) {
                    $idarchivoManual = $this->guardarArchivo($request->file('archivo_manual'), $rutaManualGuardada)->idarchivo;
                }

                if ($request->hasFile('archivo_documentacion')) {
                    $idarchivoDocumentacion = $this->guardarArchivo($request->file('archivo_documentacion'), $rutaDocumentacionGuardada)->idarchivo;
                }

                $enlace->update([
                    'nombre_sistema' => $request->nombre_sistema,
                    'slug' => $slug,
                    'descripcion' => $request->descripcion,
                    'url' => $request->url,
                    'icono' => $request->icono,
                    'idcategoria' => $request->idcategoria,
                    'idestadooperativo' => $request->idestadooperativo,
                    'idarchivo_manual' => $idarchivoManual,
                    'idarchivo_documentacion' => $idarchivoDocumentacion,
                    'orden' => $request->orden ?? 0,
                    'activo' => $request->has('activo')
                        ? $request->boolean('activo')
                        : true,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::SISTEMAS,
                    $enlace->idenlace,
                    $request->input('etiquetas', [])
                );
            });
        } catch (\Throwable $e) {
            if ($rutaManualGuardada) {
                Storage::disk('public')->delete($rutaManualGuardada);
            }

            if ($rutaDocumentacionGuardada) {
                Storage::disk('public')->delete($rutaDocumentacionGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        if ($request->hasFile('archivo_manual') && $archivoManualAnteriorId) {
            $archivoLimpieza->eliminarSiNoEstaEnUso(Archivo::find($archivoManualAnteriorId));
        }

        if ($request->hasFile('archivo_documentacion') && $archivoDocumentacionAnteriorId) {
            $archivoLimpieza->eliminarSiNoEstaEnUso(Archivo::find($archivoDocumentacionAnteriorId));
        }

        $enlace->load(['categoria', 'estadoOperativo', 'archivoManual', 'archivoDocumentacion']);

        $enlace->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SISTEMAS,
            $enlace->idenlace
        );

        return response()->json([
            'success' => true,
            'message' => 'Sistema institucional actualizado correctamente.',
            'data' => $enlace,
        ]);
    }

    public function destroy(
        $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ) {
        $enlace = EnlaceSistema::find($id);

        if (!$enlace) {
            return response()->json([
                'success' => false,
                'message' => 'Sistema institucional no encontrado.',
            ], 404);
        }

        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::SISTEMAS,
            $enlace->idenlace
        );

        $archivoManual = $enlace->idarchivo_manual ? Archivo::find($enlace->idarchivo_manual) : null;
        $archivoDocumentacion = $enlace->idarchivo_documentacion ? Archivo::find($enlace->idarchivo_documentacion) : null;

        $enlace->delete();

        $this->limpiarCachePublico();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoManual);
        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoDocumentacion);

        return response()->json([
            'success' => true,
            'message' => 'Sistema institucional eliminado correctamente.',
        ]);
    }

    private function rules(?int $idIgnorar = null): array
    {
        return [
            'nombre_sistema' => [
                'required',
                'string',
                'max:100',
                $idIgnorar
                    ? Rule::unique('enlaces_sistemas', 'nombre_sistema')
                    ->ignore($idIgnorar, 'idenlace')
                    : 'unique:enlaces_sistemas,nombre_sistema',
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'url' => [
                'required',
                'url',
                'max:255',
            ],
            'icono' => [
                'nullable',
                'string',
                'max:100',
            ],
            'idcategoria' => [
                'required',
                'integer',
                'exists:categorias,idcategoria',
            ],
            'idestadooperativo' => [
                'required',
                'integer',
                'exists:estados_operativos,idestadooperativo',
            ],
            'archivo_manual' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
            'archivo_documentacion' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
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
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
        ];
    }

    private function messages(): array
    {
        return [
            'nombre_sistema.required' => 'El nombre del sistema es obligatorio.',
            'nombre_sistema.unique' => 'Ya existe un sistema institucional con ese nombre.',
            'nombre_sistema.max' => 'El nombre del sistema no debe superar los 100 caracteres.',
            'url.required' => 'La URL del sistema es obligatoria.',
            'url.url' => 'La URL del sistema no tiene un formato válido.',
            'url.max' => 'La URL del sistema no debe superar los 255 caracteres.',
            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestadooperativo.required' => 'El estado operativo es obligatorio.',
            'idestadooperativo.exists' => 'El estado operativo seleccionado no existe.',
            'archivo_manual.mimes' => 'El manual debe ser PDF, Word, Excel o PowerPoint.',
            'archivo_manual.max' => 'El manual no debe superar los 10 MB.',
            'archivo_documentacion.mimes' => 'La documentación debe ser PDF, Word, Excel o PowerPoint.',
            'archivo_documentacion.max' => 'La documentación no debe superar los 10 MB.',
            'etiquetas.array' => 'Las etiquetas deben enviarse como una lista.',
            'etiquetas.*.exists' => 'Una de las etiquetas seleccionadas no existe.',
        ];
    }

    private function generarSlugUnico(string $nombre, ?int $idIgnorar = null): string
    {
        $slugBase = Str::slug($nombre);
        $slug = $slugBase;
        $contador = 1;

        while (
        EnlaceSistema::where('slug', $slug)
            ->when($idIgnorar, function ($query) use ($idIgnorar) {
                $query->where('idenlace', '!=', $idIgnorar);
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

    private function guardarArchivo(UploadedFile $archivoSubido, ?string &$rutaGuardada = null): Archivo
    {
        $extension = $archivoSubido->getClientOriginalExtension();
        $nombreGuardado = 'enlace_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
        $rutaGuardada = $archivoSubido->storeAs('enlaces-sistemas', $nombreGuardado, 'public');

        return Archivo::create([
            'nombre_original' => $archivoSubido->getClientOriginalName(),
            'nombre_guardado' => $nombreGuardado,
            'ruta' => $rutaGuardada,
            'extension' => $extension,
            'mime_type' => $archivoSubido->getMimeType(),
            'peso_bytes' => $archivoSubido->getSize(),
            'descargas' => 0,
        ]);
    }
}
