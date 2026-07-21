<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoEntidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TipoEntidadController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposEntidad = TipoEntidad::withCount('estados')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de entidad obtenido correctamente.',
            'data' => $tiposEntidad,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoEntidad = TipoEntidad::withCount('estados')->find($id);

        if (!$tipoEntidad) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de entidad no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de entidad obtenido correctamente.',
            'data' => $tipoEntidad,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_entidad,nombre',
            ],
        ]);

        $slugBase = Str::slug($validated['nombre']);
        $slug = $slugBase;
        $contador = 1;

        while (TipoEntidad::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $tipoEntidad = TipoEntidad::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de entidad registrado correctamente.',
            'data' => $tipoEntidad,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoEntidad = TipoEntidad::find($id);

        if (!$tipoEntidad) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de entidad no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_entidad', 'nombre')->ignore($tipoEntidad->idtipoentidad, 'idtipoentidad'),
            ],
        ]);

        if ($tipoEntidad->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            TipoEntidad::where('slug', $slug)
                ->where('idtipoentidad', '!=', $tipoEntidad->idtipoentidad)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $tipoEntidad->slug = $slug;
        }

        $tipoEntidad->nombre = $validated['nombre'];
        $tipoEntidad->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de entidad actualizado correctamente.',
            'data' => $tipoEntidad->loadCount('estados'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoEntidad = TipoEntidad::withCount('estados')->find($id);

        if (!$tipoEntidad) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de entidad no existe.',
            ], 404);
        }

        if ($tipoEntidad->estados_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de entidad porque tiene estados asociados.',
            ], 409);
        }

        $tipoEntidad->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de entidad eliminado correctamente.',
        ]);
    }
}
