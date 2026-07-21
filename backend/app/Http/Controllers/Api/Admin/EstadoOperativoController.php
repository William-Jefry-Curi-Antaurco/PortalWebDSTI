<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EstadoOperativo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EstadoOperativoController extends Controller
{
    public function index(): JsonResponse
    {
        $estadosOperativos = EstadoOperativo::withCount('enlacesSistemas')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de estados operativos obtenido correctamente.',
            'data' => $estadosOperativos,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $estadoOperativo = EstadoOperativo::withCount('enlacesSistemas')->find($id);

        if (!$estadoOperativo) {
            return response()->json([
                'success' => false,
                'message' => 'El estado operativo no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Estado operativo obtenido correctamente.',
            'data' => $estadoOperativo,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:60',
                'unique:estados_operativos,nombre',
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

        while (EstadoOperativo::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $estadoOperativo = EstadoOperativo::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado operativo registrado correctamente.',
            'data' => $estadoOperativo,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $estadoOperativo = EstadoOperativo::find($id);

        if (!$estadoOperativo) {
            return response()->json([
                'success' => false,
                'message' => 'El estado operativo no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:60',
                Rule::unique('estados_operativos', 'nombre')
                    ->ignore($estadoOperativo->idestadooperativo, 'idestadooperativo'),
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

        if ($estadoOperativo->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            EstadoOperativo::where('slug', $slug)
                ->where('idestadooperativo', '!=', $estadoOperativo->idestadooperativo)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $estadoOperativo->slug = $slug;
        }

        $estadoOperativo->nombre = $validated['nombre'];
        $estadoOperativo->descripcion = $validated['descripcion'] ?? null;
        $estadoOperativo->activo = $validated['activo'] ?? $estadoOperativo->activo;
        $estadoOperativo->save();

        return response()->json([
            'success' => true,
            'message' => 'Estado operativo actualizado correctamente.',
            'data' => $estadoOperativo->loadCount('enlacesSistemas'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $estadoOperativo = EstadoOperativo::withCount('enlacesSistemas')->find($id);

        if (!$estadoOperativo) {
            return response()->json([
                'success' => false,
                'message' => 'El estado operativo no existe.',
            ], 404);
        }

        if ($estadoOperativo->enlaces_sistemas_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el estado operativo porque tiene sistemas asociados.',
            ], 409);
        }

        $estadoOperativo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Estado operativo eliminado correctamente.',
        ]);
    }
}
