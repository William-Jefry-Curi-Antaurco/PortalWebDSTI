<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\Tutorial;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TutorialController extends Controller
{
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $query = Tutorial::with([
            'archivo',
            'categoria',
            'autor',
            'estado',
            'tipoTutorial',
        ])
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('titulo', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('contenido_html', 'like', "%{$buscar}%")
                    ->orWhere('enlace_video', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        if ($request->filled('idtipotutorial')) {
            $query->where('idtipotutorial', $request->idtipotutorial);
        }

        $tutoriales = $query->paginate(10);

        $tutoriales->getCollection()->transform(function ($tutorial) use ($etiquetaService) {
            $tutorial->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::TUTORIALES,
                $tutorial->idtutorial
            );

            return $tutorial;
        });

        return response()->json([
            'success' => true,
            'message' => 'Listado de tutoriales obtenido correctamente.',
            'data' => $tutoriales,
        ]);
    }

    public function store(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                'unique:tutoriales,titulo',
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'contenido_html' => [
                'nullable',
                'string',
                'required_without_all:enlace_video,archivo',
            ],
            'enlace_video' => [
                'nullable',
                'url',
                'max:255',
                'required_without_all:contenido_html,archivo',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,ppt,pptx,mp4,webm,mov',
                'max:102400',
                'required_without_all:contenido_html,enlace_video',
            ],
            'duracion_minutos' => [
                'nullable',
                'integer',
                'min:0',
                'max:65535',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
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
            'idtipotutorial' => [
                'required',
                'integer',
                'exists:tipos_tutorial,idtipotutorial',
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
            'titulo.required' => 'El título del tutorial es obligatorio.',
            'titulo.unique' => 'Ya existe un tutorial con ese título.',

            'contenido_html.required_without_all' => 'Debe registrar contenido, un enlace de video o subir un archivo.',
            'enlace_video.required_without_all' => 'Debe registrar un enlace de video, contenido o subir un archivo.',
            'enlace_video.url' => 'El enlace de video no tiene un formato válido.',

            'archivo.required_without_all' => 'Debe subir un archivo, registrar contenido o colocar un enlace de video.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, PowerPoint o video.',
            'archivo.max' => 'El archivo no debe superar los 100 MB.',

            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipotutorial.required' => 'El tipo de tutorial es obligatorio.',
            'idtipotutorial.exists' => 'El tipo de tutorial seleccionado no existe.',

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

        $idArchivo = null;

        if ($request->hasFile('archivo')) {
            $archivoSubido = $request->file('archivo');

            $nombreOriginal = $archivoSubido->getClientOriginalName();
            $extension = $archivoSubido->getClientOriginalExtension();
            $mimeType = $archivoSubido->getMimeType();
            $pesoBytes = $archivoSubido->getSize();

            $nombreGuardado = 'tutorial_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
            $ruta = $archivoSubido->storeAs('tutoriales', $nombreGuardado, 'public');

            $archivo = Archivo::create([
                'nombre_original' => $nombreOriginal,
                'nombre_guardado' => $nombreGuardado,
                'ruta' => $ruta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'peso_bytes' => $pesoBytes,
                'descargas' => 0,
            ]);

            $idArchivo = $archivo->idarchivo;
        }

        $tutorial = Tutorial::create([
            'titulo' => $request->titulo,
            'slug' => $this->generarSlugUnico($request->titulo),
            'descripcion' => $request->descripcion,
            'contenido_html' => $request->contenido_html,
            'enlace_video' => $request->enlace_video,
            'duracion_minutos' => $request->duracion_minutos ?? 0,
            'visitas' => 0,
            'orden' => $request->orden ?? 0,
            'idarchivo' => $idArchivo,
            'idcategoria' => $request->idcategoria,
            'idusuario_autor' => $request->user()->idusuario,
            'idestado' => $request->idestado,
            'idtipotutorial' => $request->idtipotutorial,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();

        $tutorial->load([
            'archivo',
            'categoria',
            'autor',
            'estado',
            'tipoTutorial',
        ]);

        $tutorial->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial
        );

        return response()->json([
            'success' => true,
            'message' => 'Tutorial registrado correctamente.',
            'data' => $tutorial,
        ], 201);
    }

    public function show(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $tutorial = Tutorial::with([
            'archivo',
            'categoria',
            'autor',
            'estado',
            'tipoTutorial',
        ])->find($id);

        if (!$tutorial) {
            return response()->json([
                'success' => false,
                'message' => 'Tutorial no encontrado.',
            ], 404);
        }

        $tutorial->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial
        );

        return response()->json([
            'success' => true,
            'message' => 'Tutorial obtenido correctamente.',
            'data' => $tutorial,
        ]);
    }

    public function update(
        Request $request,
                $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $tutorial = Tutorial::with('archivo')->find($id);

        if (!$tutorial) {
            return response()->json([
                'success' => false,
                'message' => 'Tutorial no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                Rule::unique('tutoriales', 'titulo')->ignore($tutorial->idtutorial, 'idtutorial'),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'contenido_html' => [
                'nullable',
                'string',
            ],
            'enlace_video' => [
                'nullable',
                'url',
                'max:255',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,ppt,pptx,mp4,webm,mov',
                'max:102400',
            ],
            'duracion_minutos' => [
                'nullable',
                'integer',
                'min:0',
                'max:65535',
            ],
            'visitas' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'orden' => [
                'nullable',
                'integer',
                'min:0',
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
            'idtipotutorial' => [
                'required',
                'integer',
                'exists:tipos_tutorial,idtipotutorial',
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
            'titulo.required' => 'El título del tutorial es obligatorio.',
            'titulo.unique' => 'Ya existe un tutorial con ese título.',

            'enlace_video.url' => 'El enlace de video no tiene un formato válido.',

            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, PowerPoint o video.',
            'archivo.max' => 'El archivo no debe superar los 100 MB.',

            'idcategoria.required' => 'La categoría es obligatoria.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.required' => 'El estado es obligatorio.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipotutorial.required' => 'El tipo de tutorial es obligatorio.',
            'idtipotutorial.exists' => 'El tipo de tutorial seleccionado no existe.',

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

        $tieneContenido = $request->filled('contenido_html');
        $tieneVideo = $request->filled('enlace_video');
        $tieneArchivoNuevo = $request->hasFile('archivo');
        $tieneArchivoExistente = !empty($tutorial->idarchivo);

        if (!$tieneContenido && !$tieneVideo && !$tieneArchivoNuevo && !$tieneArchivoExistente) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => [
                    'contenido_html' => [
                        'Debe registrar contenido, un enlace de video o subir un archivo.',
                    ],
                ],
            ], 422);
        }

        $archivoAnterior = null;

        if ($request->hasFile('archivo')) {
            $archivoAnterior = $tutorial->archivo;

            $archivoSubido = $request->file('archivo');

            $nombreOriginal = $archivoSubido->getClientOriginalName();
            $extension = $archivoSubido->getClientOriginalExtension();
            $mimeType = $archivoSubido->getMimeType();
            $pesoBytes = $archivoSubido->getSize();

            $nombreGuardado = 'tutorial_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
            $ruta = $archivoSubido->storeAs('tutoriales', $nombreGuardado, 'public');

            $nuevoArchivo = Archivo::create([
                'nombre_original' => $nombreOriginal,
                'nombre_guardado' => $nombreGuardado,
                'ruta' => $ruta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'peso_bytes' => $pesoBytes,
                'descargas' => 0,
            ]);

            $tutorial->idarchivo = $nuevoArchivo->idarchivo;
        }

        $slug = $tutorial->titulo !== $request->titulo
            ? $this->generarSlugUnico($request->titulo, $tutorial->idtutorial)
            : $tutorial->slug;

        $tutorial->update([
            'titulo' => $request->titulo,
            'slug' => $slug,
            'descripcion' => $request->descripcion,
            'contenido_html' => $request->contenido_html,
            'enlace_video' => $request->enlace_video,
            'duracion_minutos' => $request->duracion_minutos ?? 0,
            'visitas' => $request->visitas ?? $tutorial->visitas,
            'orden' => $request->orden ?? 0,
            'idarchivo' => $tutorial->idarchivo,
            'idcategoria' => $request->idcategoria,
            'idestado' => $request->idestado,
            'idtipotutorial' => $request->idtipotutorial,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();

        if ($archivoAnterior && !$this->archivoTieneUsos($archivoAnterior->idarchivo)) {
            Storage::disk('public')->delete($archivoAnterior->ruta);
            $archivoAnterior->delete();
        }

        $tutorial->load([
            'archivo',
            'categoria',
            'autor',
            'estado',
            'tipoTutorial',
        ]);

        $tutorial->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial
        );

        return response()->json([
            'success' => true,
            'message' => 'Tutorial actualizado correctamente.',
            'data' => $tutorial,
        ]);
    }

    public function destroy(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $tutorial = Tutorial::with('archivo')->find($id);

        if (!$tutorial) {
            return response()->json([
                'success' => false,
                'message' => 'Tutorial no encontrado.',
            ], 404);
        }

        $archivo = $tutorial->archivo;

        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::TUTORIALES,
            $tutorial->idtutorial
        );

        $tutorial->delete();

        if ($archivo && !$this->archivoTieneUsos($archivo->idarchivo)) {
            Storage::disk('public')->delete($archivo->ruta);
            $archivo->delete();
        }

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Tutorial eliminado correctamente.',
        ]);
    }

    private function generarSlugUnico(string $titulo, ?int $idTutorialIgnorar = null): string
    {
        $slugBase = Str::slug($titulo);
        $slug = $slugBase;
        $contador = 1;

        while (
        Tutorial::where('slug', $slug)
            ->when($idTutorialIgnorar, function ($query) use ($idTutorialIgnorar) {
                $query->where('idtutorial', '!=', $idTutorialIgnorar);
            })
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }

    private function archivoTieneUsos(int $idarchivo): bool
    {
        return DB::table('tutoriales')->where('idarchivo', $idarchivo)->exists()
            || DB::table('documentos')->where('idarchivo', $idarchivo)->exists()
            || DB::table('eventos')->where('idarchivo', $idarchivo)->exists()
            || DB::table('eventos_archivos')->where('idarchivo', $idarchivo)->exists()
            || DB::table('noticias_imagen')->where('idarchivo', $idarchivo)->exists();
    }

    private function limpiarCachePublico(): void
    {
        Cache::increment('public:cache_version');
        Cache::forget('public:inicio');
    }
}
