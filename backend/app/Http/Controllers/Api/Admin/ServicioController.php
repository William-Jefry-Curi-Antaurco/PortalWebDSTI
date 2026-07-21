<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use App\Services\EtiquetaContenidoService;
use App\Support\EtiquetaEntidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ServicioController extends Controller
{
    public function index(
        Request $request,
        EtiquetaContenidoService $etiquetaService
    ) {
        $query = Servicio::with('categoria')
            ->orderBy('orden')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('descripcion_corta', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->filled('idcategoria')) {
            $query->where('idcategoria', $request->idcategoria);
        }

        $servicios = $query->paginate(10);

        $servicios->getCollection()->transform(function ($servicio) use ($etiquetaService) {
            $servicio->etiquetas = $etiquetaService->obtener(
                EtiquetaEntidad::SERVICIOS,
                $servicio->idservicio
            );

            return $servicio;
        });

        return response()->json([
            'success' => true,
            'message' => 'Listado de servicios tecnológicos obtenido correctamente.',
            'data'    => $servicios,
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
                'errors'  => $validator->errors(),
            ], 422);
        }

        $servicio = Servicio::create([
            'nombre'                  => $request->nombre,
            'slug'                    => $this->generarSlugUnico($request->nombre),
            'descripcion_corta'       => $request->descripcion_corta,
            'descripcion_larga'       => $request->descripcion_larga,
            'icono'                   => $request->icono,
            'url_servicio'            => $request->url_servicio,
            'requiere_autenticacion'  => $request->boolean('requiere_autenticacion'),
            'idcategoria'             => $request->idcategoria,
            'orden'                   => $request->orden ?? 0,
            'activo'                  => $request->has('activo')
                ? $request->boolean('activo')
                : true,

            // Campos extendidos
            'correo_contacto'         => $request->correo_contacto,
            'texto_accion'            => $request->texto_accion,
            'orientacion'             => $request->orientacion,
            'casos_uso'               => $request->casos_uso,
            'consejo'                 => $request->consejo,
            'seccion_relacionada'     => $request->seccion_relacionada,
            'label_seccion'           => $request->label_seccion,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();

        $servicio->load('categoria');

        $servicio->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio
        );

        return response()->json([
            'success' => true,
            'message' => 'Servicio tecnológico registrado correctamente.',
            'data'    => $servicio,
        ], 201);
    }

    public function show(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $servicio = Servicio::with('categoria')->find($id);

        if (!$servicio) {
            return response()->json([
                'success' => false,
                'message' => 'Servicio tecnológico no encontrado.',
            ], 404);
        }

        $servicio->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio
        );

        return response()->json([
            'success' => true,
            'message' => 'Servicio tecnológico obtenido correctamente.',
            'data'    => $servicio,
        ]);
    }

    public function update(
        Request $request,
                $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $servicio = Servicio::find($id);

        if (!$servicio) {
            return response()->json([
                'success' => false,
                'message' => 'Servicio tecnológico no encontrado.',
            ], 404);
        }

        $validator = Validator::make(
            $request->all(),
            $this->rules($servicio->idservicio),
            $this->messages()
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $slug = $servicio->nombre !== $request->nombre
            ? $this->generarSlugUnico($request->nombre, $servicio->idservicio)
            : $servicio->slug;

        $servicio->update([
            'nombre'                  => $request->nombre,
            'slug'                    => $slug,
            'descripcion_corta'       => $request->descripcion_corta,
            'descripcion_larga'       => $request->descripcion_larga,
            'icono'                   => $request->icono,
            'url_servicio'            => $request->url_servicio,
            'requiere_autenticacion'  => $request->boolean('requiere_autenticacion'),
            'idcategoria'             => $request->idcategoria,
            'orden'                   => $request->orden ?? 0,
            'activo'                  => $request->has('activo')
                ? $request->boolean('activo')
                : true,

            // Campos extendidos
            'correo_contacto'         => $request->correo_contacto,
            'texto_accion'            => $request->texto_accion,
            'orientacion'             => $request->orientacion,
            'casos_uso'               => $request->casos_uso,
            'consejo'                 => $request->consejo,
            'seccion_relacionada'     => $request->seccion_relacionada,
            'label_seccion'           => $request->label_seccion,
        ]);

        $etiquetaService->sincronizar(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio,
            $request->input('etiquetas', [])
        );

        $this->limpiarCachePublico();

        $servicio->load('categoria');

        $servicio->etiquetas = $etiquetaService->obtener(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio
        );

        return response()->json([
            'success' => true,
            'message' => 'Servicio tecnológico actualizado correctamente.',
            'data'    => $servicio,
        ]);
    }

    public function destroy(
        $id,
        EtiquetaContenidoService $etiquetaService
    ) {
        $servicio = Servicio::find($id);

        if (!$servicio) {
            return response()->json([
                'success' => false,
                'message' => 'Servicio tecnológico no encontrado.',
            ], 404);
        }

        $etiquetaService->eliminarRelaciones(
            EtiquetaEntidad::SERVICIOS,
            $servicio->idservicio
        );

        $servicio->delete();

        $this->limpiarCachePublico();

        return response()->json([
            'success' => true,
            'message' => 'Servicio tecnológico eliminado correctamente.',
        ]);
    }

    // ── Helpers privados ───────────────────────────────────────────────────────

    private function rules(?int $idIgnorar = null): array
    {
        return [
            // Campos originales
            'nombre' => [
                'required',
                'string',
                'max:150',
                $idIgnorar
                    ? Rule::unique('servicios', 'nombre')->ignore($idIgnorar, 'idservicio')
                    : 'unique:servicios,nombre',
            ],
            'descripcion_corta'      => ['required', 'string', 'max:200'],
            'descripcion_larga'      => ['nullable', 'string'],
            'icono'                  => ['nullable', 'string', 'max:100'],
            'url_servicio'           => ['nullable', 'url', 'max:255'],
            'requiere_autenticacion' => ['nullable', 'boolean'],
            'idcategoria'            => ['required', 'integer', 'exists:categorias,idcategoria'],
            'orden'                  => ['nullable', 'integer', 'min:0', 'max:255'],
            'activo'                 => ['nullable', 'boolean'],

            // Campos extendidos
            'correo_contacto'        => ['nullable', 'email', 'max:150'],
            'texto_accion'           => ['nullable', 'string', 'max:100'],
            'orientacion'            => ['nullable', 'string'],
            'casos_uso'              => ['nullable', 'string'],
            'consejo'                => ['nullable', 'string'],
            'seccion_relacionada'    => ['nullable', 'string', 'max:80'],
            'label_seccion'          => ['nullable', 'string', 'max:100'],

            // Etiquetas
            'etiquetas'              => ['nullable', 'array'],
            'etiquetas.*'            => ['integer', 'exists:etiquetas,idetiqueta'],
        ];
    }

    private function messages(): array
    {
        return [
            'nombre.required'             => 'El nombre del servicio es obligatorio.',
            'nombre.unique'               => 'Ya existe un servicio con ese nombre.',
            'descripcion_corta.required'  => 'La descripción corta es obligatoria.',
            'url_servicio.url'            => 'La URL del servicio no tiene un formato válido.',
            'idcategoria.required'        => 'La categoría es obligatoria.',
            'idcategoria.exists'          => 'La categoría seleccionada no existe.',
            'correo_contacto.email'       => 'El correo de contacto no tiene un formato válido.',
            'etiquetas.array'             => 'Las etiquetas deben enviarse como una lista.',
            'etiquetas.*.exists'          => 'Una de las etiquetas seleccionadas no existe.',
        ];
    }

    private function generarSlugUnico(string $nombre, ?int $idServicioIgnorar = null): string
    {
        $slugBase = Str::slug($nombre);
        $slug = $slugBase;
        $contador = 1;

        while (
        Servicio::where('slug', $slug)
            ->when($idServicioIgnorar, function ($query) use ($idServicioIgnorar) {
                $query->where('idservicio', '!=', $idServicioIgnorar);
            })
            ->exists()
        ) {
            $slug = "{$slugBase}-{$contador}";
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
