<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoDocumento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TipoDocumentoController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposDocumento = TipoDocumento::withCount('documentos')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de documento obtenido correctamente.',
            'data' => $tiposDocumento,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoDocumento = TipoDocumento::withCount('documentos')->find($id);

        if (!$tipoDocumento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de documento no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de documento obtenido correctamente.',
            'data' => $tipoDocumento,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                'unique:tipos_documento,nombre',
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

        while (TipoDocumento::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $contador;
            $contador++;
        }

        $tipoDocumento = TipoDocumento::create([
            'nombre' => $validated['nombre'],
            'slug' => $slug,
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de documento registrado correctamente.',
            'data' => $tipoDocumento,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoDocumento = TipoDocumento::find($id);

        if (!$tipoDocumento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de documento no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                Rule::unique('tipos_documento', 'nombre')
                    ->ignore($tipoDocumento->idtipodocumento, 'idtipodocumento'),
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

        if ($tipoDocumento->nombre !== $validated['nombre']) {
            $slugBase = Str::slug($validated['nombre']);
            $slug = $slugBase;
            $contador = 1;

            while (
            TipoDocumento::where('slug', $slug)
                ->where('idtipodocumento', '!=', $tipoDocumento->idtipodocumento)
                ->exists()
            ) {
                $slug = $slugBase . '-' . $contador;
                $contador++;
            }

            $tipoDocumento->slug = $slug;
        }

        $tipoDocumento->nombre = $validated['nombre'];
        $tipoDocumento->descripcion = $validated['descripcion'] ?? null;
        $tipoDocumento->activo = $validated['activo'] ?? $tipoDocumento->activo;
        $tipoDocumento->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de documento actualizado correctamente.',
            'data' => $tipoDocumento->loadCount('documentos'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoDocumento = TipoDocumento::withCount('documentos')->find($id);

        if (!$tipoDocumento) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de documento no existe.',
            ], 404);
        }

        if ($tipoDocumento->documentos_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de documento porque tiene documentos asociados.',
            ], 409);
        }

        $tipoDocumento->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de documento eliminado correctamente.',
        ]);
    }
}
