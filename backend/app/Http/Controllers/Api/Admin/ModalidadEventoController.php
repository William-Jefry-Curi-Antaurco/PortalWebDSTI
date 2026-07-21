<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModalidadEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ModalidadEventoController extends Controller
{
    public function index(): JsonResponse
    {
        $modalidadesEvento = ModalidadEvento::withCount('eventos')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de modalidades de evento obtenido correctamente.',
            'data' => $modalidadesEvento,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $modalidadEvento = ModalidadEvento::withCount('eventos')->find($id);

        if (!$modalidadEvento) {
            return response()->json([
                'success' => false,
                'message' => 'La modalidad de evento no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Modalidad de evento obtenida correctamente.',
            'data' => $modalidadEvento,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:modalidades_evento,nombre',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ]);

        $slugBase = Str::slug($validated['nombre']);
        $slug = $slugBase;
        $contador = 1;

        while (ModalidadEvento::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $modalidadEvento = ModalidadEvento::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Modalidad de evento registrada correctamente.',
            'data' => $modalidadEvento,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $modalidadEvento = ModalidadEvento::find($id);

        if (!$modalidadEvento) {
            return response()->json([
                'success' => false,
                'message' => 'La modalidad de evento no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('modalidades_evento', 'nombre')
                    ->ignore($modalidadEvento->idmodalidad, 'idmodalidad'),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
            'activo' => [
                'nullable',
                'boolean',
            ],
        ]);

        if ($modalidadEvento->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            ModalidadEvento::where('slug', $slug)
                ->where('idmodalidad', '!=', $modalidadEvento->idmodalidad)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $modalidadEvento->slug = $slug;
        }

        $modalidadEvento->nombre = $validated['nombre'];
        $modalidadEvento->descripcion = $validated['descripcion'] ?? null;
        $modalidadEvento->activo = $validated['activo'] ?? $modalidadEvento->activo;
        $modalidadEvento->save();

        return response()->json([
            'success' => true,
            'message' => 'Modalidad de evento actualizada correctamente.',
            'data' => $modalidadEvento->loadCount('eventos'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $modalidadEvento = ModalidadEvento::withCount('eventos')->find($id);

        if (!$modalidadEvento) {
            return response()->json([
                'success' => false,
                'message' => 'La modalidad de evento no existe.',
            ], 404);
        }

        if ($modalidadEvento->eventos_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la modalidad porque tiene eventos asociados.',
            ], 409);
        }

        $modalidadEvento->delete();

        return response()->json([
            'success' => true,
            'message' => 'Modalidad de evento eliminada correctamente.',
        ]);
    }
}
