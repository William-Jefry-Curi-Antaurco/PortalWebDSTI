<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\Documento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Services\ArchivoLimpiezaService;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Support\Facades\Cache;


class DocumentoController extends Controller
{
    //public function index(Request $request)
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    )
    {
        $query = Documento::with([
            'archivo',
            'categoria',
            'usuarioSubidor',
            'estado',
            'tipoDocumento',
            'documentoPadre',
        ])
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('titulo', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('version', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        if ($request->filled('idtipodocumento')) {
            $query->where('idtipodocumento', $request->idtipodocumento);
        }

        if ($request->filled('es_version_actual')) {
            $query->where('es_version_actual', $request->boolean('es_version_actual'));
        }

        $documentos = $query->paginate(10);

        $documentos->getCollection()->transform(function ($documento) use ($etiquetaService) {
            $documento->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::DOCUMENTOS,
                $documento->iddocumento
            );

            return $documento;
        });


        return response()->json([
            'success' => true,
            'message' => 'Listado de documentos obtenido correctamente.',
            'data' => $documentos,
        ]);
    }

    //public function store(Request $request)

    public function store(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    )
    {
        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                'unique:documentos,titulo',
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'version' => [
                'nullable',
                'string',
                'max:20',
            ],
            'es_version_actual' => [
                'nullable',
                'boolean',
            ],
            'fecha_documento' => [
                'nullable',
                'date',
            ],
            'iddocumento_padre' => [
                'nullable',
                'integer',
                'exists:documentos,iddocumento',
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
            'idtipodocumento' => [
                'required',
                'integer',
                'exists:tipos_documento,idtipodocumento',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'archivo' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'titulo.required' => 'El título del documento es obligatorio.',
            'titulo.unique' => 'Ya existe un documento con ese título.',
            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipodocumento.required' => 'El tipo de documento es obligatorio.',
            'idtipodocumento.exists' => 'El tipo de documento seleccionado no existe.',
            'archivo.required' => 'El archivo es obligatorio.',
            'archivo.file' => 'Debe subir un archivo válido.',
            'archivo.mimes' => 'El archivo debe ser PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'iddocumento_padre.exists' => 'El documento padre seleccionado no existe.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $archivoSubido = $request->file('archivo');

        $rutaGuardada = null;

        try {
            $documento = DB::transaction(function () use ($request, $archivoSubido, $etiquetaService, &$rutaGuardada) {
                $nombreOriginal = $archivoSubido->getClientOriginalName();
                $extension = $archivoSubido->getClientOriginalExtension();
                $mimeType = $archivoSubido->getMimeType();
                $pesoBytes = $archivoSubido->getSize();

                $nombreGuardado = Str::uuid() . '.' . $extension;
                $rutaGuardada = $archivoSubido->storeAs('documentos', $nombreGuardado, 'public');

                $archivo = Archivo::create([
                    'nombre_original' => $nombreOriginal,
                    'nombre_guardado' => $nombreGuardado,
                    'ruta' => $rutaGuardada,
                    'extension' => $extension,
                    'mime_type' => $mimeType,
                    'peso_bytes' => $pesoBytes,
                    'descargas' => 0,
                ]);

                $slug = $this->generarSlugUnico($request->titulo);

                $documento = Documento::create([
                    'titulo' => $request->titulo,
                    'slug' => $slug,
                    'descripcion' => $request->descripcion,
                    'version' => $request->version ?? '1.0',
                    'es_version_actual' => $request->has('es_version_actual')
                        ? $request->boolean('es_version_actual')
                        : true,
                    'fecha_documento' => $request->fecha_documento,
                    'iddocumento_padre' => $request->iddocumento_padre,
                    'idarchivo' => $archivo->idarchivo,
                    'idcategoria' => $request->idcategoria,
                    'idusuario_subidor' => $request->user()->idusuario,
                    'idestado' => $request->idestado,
                    'idtipodocumento' => $request->idtipodocumento,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::DOCUMENTOS,
                    $documento->iddocumento,
                    $request->input('etiquetas', [])
                );

                return $documento;
            });
        } catch (\Throwable $e) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $documento->load([
            'archivo',
            'categoria',
            'usuarioSubidor',
            'estado',
            'tipoDocumento',
            'documentoPadre',
        ]);

        $documento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::DOCUMENTOS,
            $documento->iddocumento
        );
        return response()->json([
            'success' => true,
            'message' => 'Documento registrado correctamente.',
            'data' => $documento,
        ], 201);
    }

   // public function show($id)
    public function show(
        $id,
        EtiquetaContenidoService $etiquetaService
    )
    {
        $documento = Documento::with([
            'archivo',
            'categoria',
            'usuarioSubidor',
            'estado',
            'tipoDocumento',
            'documentoPadre',
            'versiones',
        ])->find($id);

        if (!$documento) {
            return response()->json([
                'success' => false,
                'message' => 'Documento no encontrado.',
            ], 404);
        }

        $documento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::DOCUMENTOS,
            $documento->iddocumento
        );

        return response()->json([
            'success' => true,
            'message' => 'Documento obtenido correctamente.',
            'data' => $documento,
        ]);
    }

    //public function update(Request $request, $id)
    public function update(
        Request $request,
                $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    )
    {
        $documento = Documento::with('archivo')->find($id);

        if (!$documento) {
            return response()->json([
                'success' => false,
                'message' => 'Documento no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                Rule::unique('documentos', 'titulo')->ignore($documento->iddocumento, 'iddocumento'),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'version' => [
                'nullable',
                'string',
                'max:20',
            ],
            'es_version_actual' => [
                'nullable',
                'boolean',
            ],
            'fecha_documento' => [
                'nullable',
                'date',
            ],
            'iddocumento_padre' => [
                'nullable',
                'integer',
                'exists:documentos,iddocumento',
                Rule::notIn([$documento->iddocumento]),
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
            'idtipodocumento' => [
                'required',
                'integer',
                'exists:tipos_documento,idtipodocumento',
            ],
            'etiquetas' => [
                'nullable',
                'array',
            ],
            'etiquetas.*' => [
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'titulo.required' => 'El título del documento es obligatorio.',
            'titulo.unique' => 'Ya existe un documento con ese título.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipodocumento.exists' => 'El tipo de documento seleccionado no existe.',
            'archivo.mimes' => 'El archivo debe ser PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'iddocumento_padre.not_in' => 'Un documento no puede ser padre de sí mismo.',
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
            DB::transaction(function () use ($request, $documento, $etiquetaService, &$archivoAnterior, &$rutaGuardada) {
                if ($request->hasFile('archivo')) {
                    $archivoAnterior = $documento->archivo;

                    $archivoSubido = $request->file('archivo');

                    $nombreOriginal = $archivoSubido->getClientOriginalName();
                    $extension = $archivoSubido->getClientOriginalExtension();
                    $mimeType = $archivoSubido->getMimeType();
                    $pesoBytes = $archivoSubido->getSize();

                    $nombreGuardado = 'documento_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;

                    $rutaGuardada = $archivoSubido->storeAs('documentos', $nombreGuardado, 'public');

                    $nuevoArchivo = Archivo::create([
                        'nombre_original' => $nombreOriginal,
                        'nombre_guardado' => $nombreGuardado,
                        'ruta' => $rutaGuardada,
                        'extension' => $extension,
                        'mime_type' => $mimeType,
                        'peso_bytes' => $pesoBytes,
                        'descargas' => 0,
                    ]);

                    $documento->idarchivo = $nuevoArchivo->idarchivo;
                }

                $slug = $documento->titulo !== $request->titulo
                    ? $this->generarSlugUnico($request->titulo, $documento->iddocumento)
                    : $documento->slug;

                $documento->update([
                    'titulo' => $request->titulo,
                    'slug' => $slug,
                    'descripcion' => $request->descripcion,
                    'version' => $request->version ?? '1.0',
                    'es_version_actual' => $request->has('es_version_actual')
                        ? $request->boolean('es_version_actual')
                        : true,
                    'fecha_documento' => $request->fecha_documento,
                    'iddocumento_padre' => $request->iddocumento_padre,
                    'idarchivo' => $documento->idarchivo,
                    'idcategoria' => $request->idcategoria,
                    'idestado' => $request->idestado,
                    'idtipodocumento' => $request->idtipodocumento,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::DOCUMENTOS,
                    $documento->iddocumento,
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

        $documento->load([
            'archivo',
            'categoria',
            'usuarioSubidor',
            'estado',
            'tipoDocumento',
            'documentoPadre',
        ]);

        $documento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::DOCUMENTOS,
            $documento->iddocumento
        );

        return response()->json([
            'success' => true,
            'message' => 'Documento actualizado correctamente.',
            'data' => $documento,
        ]);
    }

    //public function destroy($id)
    public function destroy(
        $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    )
    {
        $documento = Documento::with('archivo')->withCount('versiones')->find($id);

        if (!$documento) {
            return response()->json([
                'success' => false,
                'message' => 'Documento no encontrado.',
            ], 404);
        }

        if ($documento->versiones_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el documento porque tiene versiones asociadas.',
            ], 409);
        }

        $archivo = $documento->archivo;

        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::DOCUMENTOS,
            $documento->iddocumento
        );

        $documento->delete();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivo);

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Documento eliminado correctamente.',
        ]);
    }

    private function limpiarCachePublico(): void
    {
        Cache::increment('public:cache_version');
        Cache::forget('public:inicio');
    }
    private function generarSlugUnico(string $titulo, ?int $idDocumentoIgnorar = null): string
    {
        $slugBase = Str::slug($titulo);
        $slug = $slugBase;
        $contador = 1;

        while (
        Documento::where('slug', $slug)
            ->when($idDocumentoIgnorar, function ($query) use ($idDocumentoIgnorar) {
                $query->where('iddocumento', '!=', $idDocumentoIgnorar);
            })
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }
}
