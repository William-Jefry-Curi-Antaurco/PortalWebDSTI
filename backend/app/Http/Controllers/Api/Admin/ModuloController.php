<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Modulo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ModuloController extends Controller
{
    public function index(): JsonResponse
    {
        $modulos = Modulo::withCount('categorias')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de módulos obtenido correctamente.',
            'data' => $modulos,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $modulo = Modulo::with('categorias')->find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'El módulo no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Módulo obtenido correctamente.',
            'data' => $modulo,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                'unique:modulos,nombre',
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

        while (Modulo::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $modulo = Modulo::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Módulo registrado correctamente.',
            'data' => $modulo,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $modulo = Modulo::find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'El módulo no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('modulos', 'nombre')->ignore($modulo->idmodulo, 'idmodulo'),
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

        if ($modulo->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            Modulo::where('slug', $slug)
                ->where('idmodulo', '!=', $modulo->idmodulo)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $modulo->slug = $slug;
        }

        $modulo->nombre = $validated['nombre'];
        $modulo->descripcion = $validated['descripcion'] ?? null;
        $modulo->activo = $validated['activo'] ?? $modulo->activo;
        $modulo->save();

        return response()->json([
            'success' => true,
            'message' => 'Módulo actualizado correctamente.',
            'data' => $modulo,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $modulo = Modulo::withCount('categorias')->find($id);

        if (!$modulo) {
            return response()->json([
                'success' => false,
                'message' => 'El módulo no existe.',
            ], 404);
        }

        if ($modulo->categorias_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el módulo porque tiene categorías asociadas.',
            ], 409);
        }

        $modulo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Módulo eliminado correctamente.',
        ]);
    }
}
