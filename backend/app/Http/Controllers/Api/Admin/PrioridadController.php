<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Prioridad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PrioridadController extends Controller
{
    public function index(): JsonResponse
    {
        $prioridades = Prioridad::withCount('solicitudesSoporte')
            ->orderBy('nivel')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Listado de prioridades obtenido correctamente.',
            'data' => $prioridades,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $prioridad = Prioridad::withCount('solicitudesSoporte')->find($id);

        if (!$prioridad) {
            return response()->json([
                'success' => false,
                'message' => 'La prioridad no existe.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Prioridad obtenida correctamente.',
            'data' => $prioridad,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                'unique:prioridades,nombre',
            ],
            'nivel' => [
                'required',
                'integer',
                'min:1',
                'max:5',
                'unique:prioridades,nivel',
            ],
            'dias_respuesta_max' => [
                'required',
                'integer',
                'min:0',
                'max:255',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $prioridad = Prioridad::create([
            'nombre' => $validated['nombre'],
            'nivel' => $validated['nivel'],
            'dias_respuesta_max' => $validated['dias_respuesta_max'],
            'descripcion' => $validated['descripcion'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prioridad registrada correctamente.',
            'data' => $prioridad,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $prioridad = Prioridad::find($id);

        if (!$prioridad) {
            return response()->json([
                'success' => false,
                'message' => 'La prioridad no existe.',
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:50',
                Rule::unique('prioridades', 'nombre')
                    ->ignore($prioridad->idprioridad, 'idprioridad'),
            ],
            'nivel' => [
                'required',
                'integer',
                'min:1',
                'max:5',
                Rule::unique('prioridades', 'nivel')
                    ->ignore($prioridad->idprioridad, 'idprioridad'),
            ],
            'dias_respuesta_max' => [
                'required',
                'integer',
                'min:0',
                'max:255',
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $prioridad->nombre = $validated['nombre'];
        $prioridad->nivel = $validated['nivel'];
        $prioridad->dias_respuesta_max = $validated['dias_respuesta_max'];
        $prioridad->descripcion = $validated['descripcion'] ?? null;
        $prioridad->save();

        return response()->json([
            'success' => true,
            'message' => 'Prioridad actualizada correctamente.',
            'data' => $prioridad->loadCount('solicitudesSoporte'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $prioridad = Prioridad::withCount('solicitudesSoporte')->find($id);

        if (!$prioridad) {
            return response()->json([
                'success' => false,
                'message' => 'La prioridad no existe.',
            ], 404);
        }

        if ($prioridad->solicitudes_soporte_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la prioridad porque tiene solicitudes de soporte asociadas.',
            ], 409);
        }

        $prioridad->delete();

        return response()->json([
            'success' => true,
            'message' => 'Prioridad eliminada correctamente.',
        ]);
    }
}
