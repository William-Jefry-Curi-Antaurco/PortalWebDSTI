<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Etiqueta;
use App\Models\EtiquetaContenido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EtiquetaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Etiqueta::withCount('contenidos')
            ->orderBy('nombre');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', "%{$buscar}%")
                    ->orWhere('slug', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        $etiquetas = $query->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Listado de etiquetas obtenido correctamente.',
            'data' => $etiquetas,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:etiquetas,nombre',
            ],
            'color' => [
                'nullable',
                'string',
                'max:20',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ], [
            'nombre.required' => 'El nombre de la etiqueta es obligatorio.',
            'nombre.unique' => 'Ya existe una etiqueta con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 100 caracteres.',
            'color.max' => 'El color no debe superar los 20 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $etiqueta = Etiqueta::create([
            'nombre' => $request->nombre,
            'slug' => $this->generarSlugUnico($request->nombre),
            'color' => $request->color,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta registrada correctamente.',
            'data' => $etiqueta,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $etiqueta = Etiqueta::withCount('contenidos')->find($id);

        if (!$etiqueta) {
            return response()->json([
                'success' => false,
                'message' => 'Etiqueta no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta obtenida correctamente.',
            'data' => $etiqueta,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $etiqueta = Etiqueta::find($id);

        if (!$etiqueta) {
            return response()->json([
                'success' => false,
                'message' => 'Etiqueta no encontrada.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('etiquetas', 'nombre')->ignore($etiqueta->idetiqueta, 'idetiqueta'),
            ],
            'color' => [
                'nullable',
                'string',
                'max:20',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ], [
            'nombre.required' => 'El nombre de la etiqueta es obligatorio.',
            'nombre.unique' => 'Ya existe una etiqueta con ese nombre.',
            'nombre.max' => 'El nombre no debe superar los 100 caracteres.',
            'color.max' => 'El color no debe superar los 20 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $slug = $etiqueta->nombre !== $request->nombre
            ? $this->generarSlugUnico($request->nombre, $etiqueta->idetiqueta)
            : $etiqueta->slug;

        $etiqueta->update([
            'nombre' => $request->nombre,
            'slug' => $slug,
            'color' => $request->color,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta actualizada correctamente.',
            'data' => $etiqueta,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $etiqueta = Etiqueta::withCount('contenidos')->find($id);

        if (!$etiqueta) {
            return response()->json([
                'success' => false,
                'message' => 'Etiqueta no encontrada.',
            ], 404);
        }

        if ($etiqueta->contenidos_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la etiqueta porque tiene contenidos asociados.',
                'data' => [
                    'contenidos' => $etiqueta->contenidos_count,
                ],
            ], 409);
        }

        $etiqueta->delete();

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta eliminada correctamente.',
        ]);
    }

    public function asignarContenido(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idetiqueta' => [
                'required',
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'entidad' => [
                'required',
                'string',
                Rule::in([
                    'noticias',
                    'documentos',
                    'eventos',
                    'tutoriales',
                    'proyectos',
                ]),
            ],
            'identidad' => [
                'required',
                'integer',
                'min:1',
            ],
        ], [
            'idetiqueta.required' => 'La etiqueta es obligatoria.',
            'idetiqueta.exists' => 'La etiqueta seleccionada no existe.',
            'entidad.required' => 'La entidad es obligatoria.',
            'entidad.in' => 'La entidad no es válida.',
            'identidad.required' => 'El ID del contenido es obligatorio.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!$this->existeContenido($request->entidad, (int) $request->identidad)) {
            return response()->json([
                'success' => false,
                'message' => 'El contenido seleccionado no existe.',
                'errors' => [
                    'identidad' => ['El contenido seleccionado no existe para la entidad indicada.'],
                ],
            ], 422);
        }

        $existeAsignacion = EtiquetaContenido::where('idetiqueta', $request->idetiqueta)
            ->where('entidad', $request->entidad)
            ->where('identidad', $request->identidad)
            ->exists();

        if ($existeAsignacion) {
            return response()->json([
                'success' => false,
                'message' => 'La etiqueta ya está asignada a este contenido.',
            ], 409);
        }

        $asignacion = EtiquetaContenido::create([
            'idetiqueta' => $request->idetiqueta,
            'entidad' => $request->entidad,
            'identidad' => $request->identidad,
        ]);

        $asignacion->load('etiqueta');

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta asignada al contenido correctamente.',
            'data' => $asignacion,
        ], 201);
    }

    public function etiquetasPorContenido(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'entidad' => [
                'required',
                'string',
                Rule::in([
                    'noticias',
                    'documentos',
                    'eventos',
                    'tutoriales',
                    'proyectos',
                ]),
            ],
            'identidad' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $etiquetas = EtiquetaContenido::with('etiqueta')
            ->where('entidad', $request->entidad)
            ->where('identidad', $request->identidad)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Etiquetas del contenido obtenidas correctamente.',
            'data' => $etiquetas,
        ]);
    }

    public function quitarContenido(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'idetiqueta' => [
                'required',
                'integer',
                'exists:etiquetas,idetiqueta',
            ],
            'entidad' => [
                'required',
                'string',
            ],
            'identidad' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $eliminado = EtiquetaContenido::where('idetiqueta', $request->idetiqueta)
            ->where('entidad', $request->entidad)
            ->where('identidad', $request->identidad)
            ->delete();

        if ($eliminado === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación de etiqueta no encontrada.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Etiqueta retirada del contenido correctamente.',
        ]);
    }

    private function generarSlugUnico(string $nombre, ?int $idEtiquetaIgnorar = null): string
    {
        $slugBase = Str::slug($nombre);
        $slug = $slugBase;
        $contador = 1;

        while (
        Etiqueta::where('slug', $slug)
            ->when($idEtiquetaIgnorar, function ($query) use ($idEtiquetaIgnorar) {
                $query->where('idetiqueta', '!=', $idEtiquetaIgnorar);
            })
            ->exists()
        ) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        return $slug;
    }

    private function existeContenido(string $entidad, int $identidad): bool
    {
        return match ($entidad) {
            'noticias' => DB::table('noticias')->where('idnoticia', $identidad)->exists(),
            'documentos' => DB::table('documentos')->where('iddocumento', $identidad)->exists(),
            'eventos' => DB::table('eventos')->where('idevento', $identidad)->exists(),
            'tutoriales' => DB::table('tutoriales')->where('idtutorial', $identidad)->exists(),
            'proyectos' => DB::table('proyectos')->where('idproyecto', $identidad)->exists(),
            default => false,
        };
    }
}
