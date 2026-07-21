<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSoporte;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TipoSoporteController extends Controller
{
    public function index(): JsonResponse
    {
        $tiposSoporte = TipoSoporte::withCount('solicitudesSoporte')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de tipos de soporte obtenido correctamente.',
            'data' => $tiposSoporte,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tipoSoporte = TipoSoporte::withCount('solicitudesSoporte')->find($id);

        if (!$tipoSoporte) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de soporte no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tipo de soporte obtenido correctamente.',
            'data' => $tipoSoporte,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                'unique:tipos_soporte,nombre',
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

        $tipoSoporte = TipoSoporte::create([
            'nombre' => $validated['nombre'],
            'descripcion' => $validated['descripcion'] ?? null,
            'activo' => $validated['activo'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tipo de soporte registrado correctamente.',
            'data' => $tipoSoporte,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipoSoporte = TipoSoporte::find($id);

        if (!$tipoSoporte) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de soporte no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('tipos_soporte', 'nombre')
                    ->ignore($tipoSoporte->idtiposoporte, 'idtiposoporte'),
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

        $tipoSoporte->nombre = $validated['nombre'];
        $tipoSoporte->descripcion = $validated['descripcion'] ?? null;
        $tipoSoporte->activo = $validated['activo'] ?? $tipoSoporte->activo;
        $tipoSoporte->save();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de soporte actualizado correctamente.',
            'data' => $tipoSoporte->loadCount('solicitudesSoporte'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipoSoporte = TipoSoporte::withCount('solicitudesSoporte')->find($id);

        if (!$tipoSoporte) {
            return response()->json([
                'success' => false,
                'message' => 'El tipo de soporte no existe.',
            ], 404);
        }

        if ($tipoSoporte->solicitudes_soporte_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el tipo de soporte porque tiene solicitudes asociadas.',
                'data' => [
                    'solicitudes_soporte' => $tipoSoporte->solicitudes_soporte_count,
                ],
            ], 409);
        }

        $tipoSoporte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tipo de soporte eliminado correctamente.',
        ]);
    }
}
