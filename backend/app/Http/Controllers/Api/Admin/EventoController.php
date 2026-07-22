<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Archivo;
use App\Models\Evento;
use App\Models\EventoArchivo;
use App\Services\ArchivoLimpiezaService;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventoController extends Controller
{
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $query = Evento::with([
            'archivo',
            'archivos.archivo',
            'categoria',
            'organizador',
            'estado',
            'tipoEvento',
            'modalidad',
        ])
            ->withCount(['inscripciones', 'archivos'])
            ->orderByDesc('fecha_inicio');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('titulo', 'like', "%{$buscar}%")
                    ->orWhere('descripcion', 'like', "%{$buscar}%")
                    ->orWhere('ubicacion', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        if ($request->filled('idestado')) {
            $query->where('idestado', $request->idestado);
        }

        if ($request->filled('idtipoevento')) {
            $query->where('idtipoevento', $request->idtipoevento);
        }

        if ($request->filled('idmodalidad')) {
            $query->where('idmodalidad', $request->idmodalidad);
        }

        $eventos = $query->paginate(10);

        $eventos->getCollection()->transform(function ($evento) use ($etiquetaService) {
            $evento->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::EVENTOS,
                $evento->idevento
            );

            return $evento;
        });

        return response()->json([
            'success' => true,
            'message' => 'Listado de eventos obtenido correctamente.',
            'data' => $eventos,
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
                'unique:eventos,titulo',
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_fin' => [
                'required',
                'date',
                'after_or_equal:fecha_inicio',
            ],
            'ubicacion' => [
                'nullable',
                'string',
                'max:200',
            ],
            'enlace_virtual' => [
                'nullable',
                'url',
                'max:255',
            ],
            'cupo_maximo' => [
                'nullable',
                'integer',
                'min:0',
                'max:32767',
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
            'idtipoevento' => [
                'required',
                'integer',
                'exists:tipos_evento,idtipoevento',
            ],
            'idmodalidad' => [
                'required',
                'integer',
                'exists:modalidades_evento,idmodalidad',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
            'imagenes' => [
                'nullable',
                'array',
                'max:10',
            ],
            'imagenes.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp',
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
            'titulo.required' => 'El título del evento es obligatorio.',
            'titulo.unique' => 'Ya existe un evento con ese título.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.required' => 'La fecha de fin es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'enlace_virtual.url' => 'El enlace virtual no tiene un formato válido.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipoevento.exists' => 'El tipo de evento seleccionado no existe.',
            'idmodalidad.exists' => 'La modalidad seleccionada no existe.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'imagenes.max' => 'No puedes subir más de 10 imágenes.',
            'imagenes.*.mimes' => 'Cada imagen debe ser JPG, PNG o WEBP.',
            'imagenes.*.max' => 'Cada imagen no debe superar los 10 MB.',
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

        $rutasGuardadas = [];

        try {
            $evento = DB::transaction(function () use ($request, $etiquetaService, &$rutasGuardadas) {
                $idArchivo = null;

                if ($request->hasFile('archivo')) {
                    $ruta = null;
                    $idArchivo = $this->guardarArchivoEvento($request->file('archivo'), $ruta)->idarchivo;
                    $rutasGuardadas[] = $ruta;
                }

                $evento = Evento::create([
                    'titulo' => $request->titulo,
                    'slug' => $this->generarSlugUnico($request->titulo),
                    'descripcion' => $request->descripcion,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'ubicacion' => $request->ubicacion,
                    'enlace_virtual' => $request->enlace_virtual,
                    'cupo_maximo' => $request->cupo_maximo ?? 0,
                    'cupos_ocupados' => 0,
                    'idarchivo' => $idArchivo,
                    'idcategoria' => $request->idcategoria,
                    'idusuario_organizador' => $request->user()->idusuario,
                    'idestado' => $request->idestado,
                    'idtipoevento' => $request->idtipoevento,
                    'idmodalidad' => $request->idmodalidad,
                ]);

                if ($request->hasFile('imagenes')) {
                    $rutasGuardadas = array_merge(
                        $rutasGuardadas,
                        $this->guardarGaleriaImagenes($request->file('imagenes'), $evento->idevento)
                    );
                }

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::EVENTOS,
                    $evento->idevento,
                    $request->input('etiquetas', [])
                );

                return $evento;
            });
        } catch (\Throwable $e) {
            foreach ($rutasGuardadas as $ruta) {
                Storage::disk('public')->delete($ruta);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $evento->load([
            'archivo',
            'archivos.archivo',
            'categoria',
            'organizador',
            'estado',
            'tipoEvento',
            'modalidad',
        ]);

        $evento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::EVENTOS,
            $evento->idevento
        );

        return response()->json([
            'success' => true,
            'message' => 'Evento registrado correctamente.',
            'data' => $evento,
        ], 201);
    }

    public function show(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $evento = Evento::with([
            'archivo',
            'archivos.archivo',
            'categoria',
            'organizador',
            'estado',
            'tipoEvento',
            'modalidad',
            'inscripciones',
        ])
            ->withCount(['inscripciones', 'archivos'])
            ->find($id);

        if (!$evento) {
            return response()->json([
                'success' => false,
                'message' => 'Evento no encontrado.',
            ], 404);
        }

        $evento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::EVENTOS,
            $evento->idevento
        );

        return response()->json([
            'success' => true,
            'message' => 'Evento obtenido correctamente.',
            'data' => $evento,
        ]);
    }

    public function update(
        Request $request,
                $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ) {
        $evento = Evento::with('archivo')->find($id);

        if (!$evento) {
            return response()->json([
                'success' => false,
                'message' => 'Evento no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'required',
                'string',
                'max:200',
                Rule::unique('eventos', 'titulo')->ignore($evento->idevento, 'idevento'),
            ],
            'descripcion' => [
                'nullable',
                'string',
            ],
            'fecha_inicio' => [
                'required',
                'date',
            ],
            'fecha_fin' => [
                'required',
                'date',
                'after_or_equal:fecha_inicio',
            ],
            'ubicacion' => [
                'nullable',
                'string',
                'max:200',
            ],
            'enlace_virtual' => [
                'nullable',
                'url',
                'max:255',
            ],
            'cupo_maximo' => [
                'nullable',
                'integer',
                'min:0',
                'max:32767',
            ],
            'cupos_ocupados' => [
                'nullable',
                'integer',
                'min:0',
                'lte:cupo_maximo',
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
            'idtipoevento' => [
                'required',
                'integer',
                'exists:tipos_evento,idtipoevento',
            ],
            'idmodalidad' => [
                'required',
                'integer',
                'exists:modalidades_evento,idmodalidad',
            ],
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
            'imagenes' => [
                'nullable',
                'array',
                'max:10',
            ],
            'imagenes.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp',
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
            'titulo.required' => 'El título del evento es obligatorio.',
            'titulo.unique' => 'Ya existe un evento con ese título.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_fin.required' => 'La fecha de fin es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'cupos_ocupados.lte' => 'Los cupos ocupados no pueden ser mayores al cupo máximo.',
            'enlace_virtual.url' => 'El enlace virtual no tiene un formato válido.',
            'idcategoria.exists' => 'La categoría seleccionada no existe.',
            'idestado.exists' => 'El estado seleccionado no existe.',
            'idtipoevento.exists' => 'El tipo de evento seleccionado no existe.',
            'idmodalidad.exists' => 'La modalidad seleccionada no existe.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
            'imagenes.max' => 'No puedes subir más de 10 imágenes.',
            'imagenes.*.mimes' => 'Cada imagen debe ser JPG, PNG o WEBP.',
            'imagenes.*.max' => 'Cada imagen no debe superar los 10 MB.',
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
        $archivosGaleriaAnteriores = [];
        $rutasGuardadas = [];

        try {
            DB::transaction(function () use ($request, $evento, $etiquetaService, &$archivoAnterior, &$archivosGaleriaAnteriores, &$rutasGuardadas) {
                if ($request->hasFile('archivo')) {
                    $archivoAnterior = $evento->archivo;
                    $ruta = null;
                    $nuevoArchivo = $this->guardarArchivoEvento($request->file('archivo'), $ruta);
                    $rutasGuardadas[] = $ruta;
                    $evento->idarchivo = $nuevoArchivo->idarchivo;
                }

                $slug = $evento->titulo !== $request->titulo
                    ? $this->generarSlugUnico($request->titulo, $evento->idevento)
                    : $evento->slug;

                $evento->update([
                    'titulo' => $request->titulo,
                    'slug' => $slug,
                    'descripcion' => $request->descripcion,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin,
                    'ubicacion' => $request->ubicacion,
                    'enlace_virtual' => $request->enlace_virtual,
                    'cupo_maximo' => $request->cupo_maximo ?? 0,
                    'cupos_ocupados' => $request->cupos_ocupados ?? $evento->cupos_ocupados,
                    'idarchivo' => $evento->idarchivo,
                    'idcategoria' => $request->idcategoria,
                    'idestado' => $request->idestado,
                    'idtipoevento' => $request->idtipoevento,
                    'idmodalidad' => $request->idmodalidad,
                ]);

                $etiquetaService->sincronizar(
                    EtiquetaEntidad::EVENTOS,
                    $evento->idevento,
                    $request->input('etiquetas', [])
                );

                if ($request->hasFile('imagenes')) {
                    $archivosGaleriaAnteriores = $this->eliminarGaleriaImagenes($evento->idevento);
                    $rutasGuardadas = array_merge(
                        $rutasGuardadas,
                        $this->guardarGaleriaImagenes($request->file('imagenes'), $evento->idevento)
                    );
                }
            });
        } catch (\Throwable $e) {
            foreach ($rutasGuardadas as $ruta) {
                Storage::disk('public')->delete($ruta);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoAnterior);

        foreach ($archivosGaleriaAnteriores as $archivoGaleria) {
            $archivoLimpieza->eliminarSiNoEstaEnUso($archivoGaleria);
        }

        $evento->load([
            'archivo',
            'archivos.archivo',
            'categoria',
            'organizador',
            'estado',
            'tipoEvento',
            'modalidad',
        ]);

        $evento->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::EVENTOS,
            $evento->idevento
        );

        return response()->json([
            'success' => true,
            'message' => 'Evento actualizado correctamente.',
            'data' => $evento,
        ]);
    }

    public function subirArchivo(Request $request, $id)
    {
        $evento = Evento::find($id);

        if (!$evento) {
            return response()->json([
                'success' => false,
                'message' => 'Evento no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'nullable',
                'string',
                'max:150',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'tipo' => [
                'nullable',
                'string',
                'max:50',
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
            'archivo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'archivo.required' => 'El archivo es obligatorio.',
            'archivo.file' => 'Debe subir un archivo válido.',
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
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
            $eventoArchivo = DB::transaction(function () use ($request, $evento, &$rutaGuardada) {
                $archivo = $this->guardarArchivoEvento($request->file('archivo'), $rutaGuardada);

                return EventoArchivo::create([
                    'titulo' => $request->titulo,
                    'descripcion' => $request->descripcion,
                    'tipo' => $request->tipo,
                    'es_portada' => $request->has('es_portada') ? $request->boolean('es_portada') : false,
                    'orden' => $request->orden ?? 0,
                    'idarchivo' => $archivo->idarchivo,
                    'idevento' => $evento->idevento,
                ]);
            });
        } catch (\Throwable $e) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            throw $e;
        }

        $this->limpiarCachePublico();

        $eventoArchivo->load(['archivo', 'evento']);

        return response()->json([
            'success' => true,
            'message' => 'Archivo del evento registrado correctamente.',
            'data' => $eventoArchivo,
        ], 201);
    }

    public function actualizarArchivo(Request $request, $id, ArchivoLimpiezaService $archivoLimpieza)
    {
        $eventoArchivo = EventoArchivo::with('archivo')->find($id);

        if (!$eventoArchivo) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo del evento no encontrado.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => [
                'nullable',
                'string',
                'max:150',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'tipo' => [
                'nullable',
                'string',
                'max:50',
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
            'archivo' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx',
                'max:10240',
            ],
        ], [
            'archivo.mimes' => 'El archivo debe ser imagen, PDF, Word, Excel o PowerPoint.',
            'archivo.max' => 'El archivo no debe superar los 10 MB.',
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
            DB::transaction(function () use ($request, $eventoArchivo, &$archivoAnterior, &$rutaGuardada) {
                if ($request->hasFile('archivo')) {
                    $archivoAnterior = $eventoArchivo->archivo;
                    $nuevoArchivo = $this->guardarArchivoEvento($request->file('archivo'), $rutaGuardada);
                    $eventoArchivo->idarchivo = $nuevoArchivo->idarchivo;
                }

                $eventoArchivo->update([
                    'titulo' => $request->titulo,
                    'descripcion' => $request->descripcion,
                    'tipo' => $request->tipo,
                    'es_portada' => $request->has('es_portada') ? $request->boolean('es_portada') : false,
                    'orden' => $request->orden ?? 0,
                    'idarchivo' => $eventoArchivo->idarchivo,
                ]);
            });
        } catch (\Throwable $e) {
            if ($rutaGuardada) {
                Storage::disk('public')->delete($rutaGuardada);
            }

            throw $e;
        }

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivoAnterior);

        $this->limpiarCachePublico();

        $eventoArchivo->load(['archivo', 'evento']);

        return response()->json([
            'success' => true,
            'message' => 'Archivo del evento actualizado correctamente.',
            'data' => $eventoArchivo,
        ]);
    }

    public function eliminarArchivo($id, ArchivoLimpiezaService $archivoLimpieza)
    {
        $eventoArchivo = EventoArchivo::with('archivo')->find($id);

        if (!$eventoArchivo) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo del evento no encontrado.',
            ], 404);
        }

        $archivo = $eventoArchivo->archivo;

        $eventoArchivo->delete();

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivo);

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Archivo del evento eliminado correctamente.',
        ]);
    }

    public function destroy(
        $id,
        EtiquetaContenidoService $etiquetaService,
        ArchivoLimpiezaService $archivoLimpieza
    ) {
        $evento = Evento::with('archivo')
            ->withCount(['inscripciones', 'archivos'])
            ->find($id);

        if (!$evento) {
            return response()->json([
                'success' => false,
                'message' => 'Evento no encontrado.',
            ], 404);
        }

        if ($evento->inscripciones_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el evento porque tiene inscripciones asociadas.',
            ], 409);
        }

        $archivo = $evento->archivo;
        $archivosGaleria = [];

        DB::transaction(function () use ($evento, $etiquetaService, &$archivosGaleria) {
            $archivosGaleria = $this->eliminarGaleriaImagenes($evento->idevento);

            $etiquetaService->eliminarRelaciones(
                EtiquetaEntidad::EVENTOS,
                $evento->idevento
            );

            $evento->delete();
        });

        $archivoLimpieza->eliminarSiNoEstaEnUso($archivo);

        foreach ($archivosGaleria as $archivoGaleria) {
            $archivoLimpieza->eliminarSiNoEstaEnUso($archivoGaleria);
        }

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Evento eliminado correctamente.',
        ]);
    }

    private function guardarArchivoEvento($archivoSubido, ?string &$rutaGuardada = null): Archivo
    {
        $extension = $archivoSubido->getClientOriginalExtension();
        $nombreGuardado = 'evento_' . now()->format('YmdHis') . '_' . Str::random(10) . '.' . $extension;
        $rutaGuardada = $archivoSubido->storeAs('eventos', $nombreGuardado, 'public');

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

    /**
     * Guarda las imágenes de galería y devuelve las rutas físicas guardadas,
     * para que el llamador pueda borrarlas del disco si la transacción falla.
     */
    private function guardarGaleriaImagenes(array $imagenes, int $idEvento): array
    {
        $rutas = [];

        foreach (array_values($imagenes) as $indice => $img) {
            $ruta = null;
            $archivoImg = $this->guardarArchivoEvento($img, $ruta);
            $rutas[] = $ruta;

            EventoArchivo::create([
                'titulo' => 'Imagen del evento',
                'descripcion' => null,
                'tipo' => 'imagen',
                'es_portada' => $indice === 0,
                'orden' => $indice,
                'idarchivo' => $archivoImg->idarchivo,
                'idevento' => $idEvento,
            ]);
        }

        return $rutas;
    }

    /**
     * Borra las filas de galería (solo BD) y devuelve los Archivo desvinculados,
     * para que el llamador los limpie del disco fuera de la transacción, una
     * vez confirmado que el borrado se guardó.
     */
    private function eliminarGaleriaImagenes(int $idEvento): array
    {
        $registros = EventoArchivo::with('archivo')
            ->where('idevento', $idEvento)
            ->where('tipo', 'imagen')
            ->get();

        $archivos = [];

        foreach ($registros as $registro) {
            if ($registro->archivo) {
                $archivos[] = $registro->archivo;
            }

            $registro->delete();
        }

        return $archivos;
    }

    private function generarSlugUnico(string $titulo, ?int $idEventoIgnorar = null): string
    {
        $slugBase = Str::slug($titulo);
        $slug = $slugBase;
        $contador = 1;

        while (
        Evento::where('slug', $slug)
            ->when($idEventoIgnorar, function ($query) use ($idEventoIgnorar) {
                $query->where('idevento', '!=', $idEventoIgnorar);
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
