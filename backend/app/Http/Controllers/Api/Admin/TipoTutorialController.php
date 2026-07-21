<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoTutorial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TipoTutorialController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposTutorial = TipoTutorial::withCount('tutoriales')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de tutorial obtenido correctamente.',
            'data' => $tiposTutorial,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoTutorial = TipoTutorial::withCount('tutoriales')->find($id);

        if (!$tipoTutorial) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de tutorial no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de tutorial obtenido correctamente.',
            'data' => $tipoTutorial,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_tutorial,nombre',
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

        while (TipoTutorial::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $tipoTutorial = TipoTutorial::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de tutorial registrado correctamente.',
            'data' => $tipoTutorial,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoTutorial = TipoTutorial::find($id);

        if (!$tipoTutorial) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de tutorial no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_tutorial', 'nombre')
                    ->ignore($tipoTutorial->idtipotutorial, 'idtipotutorial'),
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

        if ($tipoTutorial->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            TipoTutorial::where('slug', $slug)
                ->where('idtipotutorial', '!=', $tipoTutorial->idtipotutorial)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $tipoTutorial->slug = $slug;
        }

        $tipoTutorial->nombre = $validated['nombre'];
        $tipoTutorial->descripcion = $validated['descripcion'] ?? null;
        $tipoTutorial->activo = $validated['activo'] ?? $tipoTutorial->activo;
        $tipoTutorial->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de tutorial actualizado correctamente.',
            'data' => $tipoTutorial->loadCount('tutoriales'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoTutorial = TipoTutorial::withCount('tutoriales')->find($id);

        if (!$tipoTutorial) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de tutorial no existe.',
            ], 404);
        }

        if ($tipoTutorial->tutoriales_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de tutorial porque tiene tutoriales asociados.',
            ], 409);
        }

        $tipoTutorial->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de tutorial eliminado correctamente.',
        ]);
    }
}
