<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoPublicacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TipoPublicacionController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposPublicacion = TipoPublicacion::withCount('noticias')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de publicación obtenido correctamente.',
            'data' => $tiposPublicacion,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoPublicacion = TipoPublicacion::withCount('noticias')->find($id);

        if (!$tipoPublicacion) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de publicación no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de publicación obtenido correctamente.',
            'data' => $tipoPublicacion,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_publicacion,nombre',
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

        while (TipoPublicacion::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $tipoPublicacion = TipoPublicacion::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de publicación registrado correctamente.',
            'data' => $tipoPublicacion,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoPublicacion = TipoPublicacion::find($id);

        if (!$tipoPublicacion) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de publicación no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_publicacion', 'nombre')
                    ->ignore($tipoPublicacion->idtipopublicacion, 'idtipopublicacion'),
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

        if ($tipoPublicacion->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            TipoPublicacion::where('slug', $slug)
                ->where('idtipopublicacion', '!=', $tipoPublicacion->idtipopublicacion)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $tipoPublicacion->slug = $slug;
        }

        $tipoPublicacion->nombre = $validated['nombre'];
        $tipoPublicacion->descripcion = $validated['descripcion'] ?? null;
        $tipoPublicacion->activo = $validated['activo'] ?? $tipoPublicacion->activo;
        $tipoPublicacion->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de publicación actualizado correctamente.',
            'data' => $tipoPublicacion->loadCount('noticias'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoPublicacion = TipoPublicacion::withCount('noticias')->find($id);

        if (!$tipoPublicacion) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de publicación no existe.',
            ], 404);
        }

        if ($tipoPublicacion->noticias_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de publicación porque tiene noticias asociadas.',
            ], 409);
        }

        $tipoPublicacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de publicación eliminado correctamente.',
        ]);
    }
}
