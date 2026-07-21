<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TipoEventoController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposEvento = TipoEvento::withCount('eventos')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de evento obtenido correctamente.',
            'data' => $tiposEvento,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoEvento = TipoEvento::withCount('eventos')->find($id);

        if (!$tipoEvento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de evento no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de evento obtenido correctamente.',
            'data' => $tipoEvento,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_evento,nombre',
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

        while (TipoEvento::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $tipoEvento = TipoEvento::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de evento registrado correctamente.',
            'data' => $tipoEvento,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoEvento = TipoEvento::find($id);

        if (!$tipoEvento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de evento no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_evento', 'nombre')
                    ->ignore($tipoEvento->idtipoevento, 'idtipoevento'),
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

        if ($tipoEvento->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            TipoEvento::where('slug', $slug)
                ->where('idtipoevento', '!=', $tipoEvento->idtipoevento)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $tipoEvento->slug = $slug;
        }

        $tipoEvento->nombre = $validated['nombre'];
        $tipoEvento->descripcion = $validated['descripcion'] ?? null;
        $tipoEvento->activo = $validated['activo'] ?? $tipoEvento->activo;
        $tipoEvento->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de evento actualizado correctamente.',
            'data' => $tipoEvento->loadCount('eventos'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoEvento = TipoEvento::withCount('eventos')->find($id);

        if (!$tipoEvento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de evento no existe.',
            ], 404);
        }

        if ($tipoEvento->eventos_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de evento porque tiene eventos asociados.',
            ], 409);
        }

        $tipoEvento->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de evento eliminado correctamente.',
        ]);
    }
}
