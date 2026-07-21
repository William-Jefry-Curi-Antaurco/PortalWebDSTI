<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\LogActividad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LogActividadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LogActividad::with('usuario')
            ->orderByDesc('created_at');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;

            $query->where(function ($q) use ($buscar) {
                $q->where('accion', 'like', "%{$buscar}%")
                    ->orWhere('entidad', 'like', "%{$buscar}%")
                    ->orWhere('ip_origen', 'like', "%{$buscar}%")
                    ->orWhere('user_agent', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('idusuario')) {
            $query->where('idusuario', $request->idusuario);
        }

        if ($request->filled('accion')) {
            $query->where('accion', $request->accion);
        }

        if ($request->filled('entidad')) {
            $query->where('entidad', $request->entidad);
        }

        if ($request->filled('identificador_entidad')) {
            $query->where('identificador_entidad', $request->identificador_entidad);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('created_at', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('created_at', '<=', $request->fecha_fin);
        }

        $logs = $query->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Listado de logs de actividad obtenido correctamente.',
            'data' => $logs,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $log = LogActividad::with('usuario')->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log de actividad no encontrado.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Log de actividad obtenido correctamente.',
            'data' => $log,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $log = LogActividad::find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log de actividad no encontrado.',
            ], 404);
        }

        $log->delete();

        return response()->json([
            'success' => true,
            'message' => 'Log de actividad eliminado correctamente.',
        ]);
    }

    public function limpiar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fecha_fin' => [
                'required',
                'date',
                'before_or_equal:today',
            ],
        ], [
            'fecha_fin.required' => 'Debe indicar la fecha límite para limpiar logs.',
            'fecha_fin.date' => 'La fecha límite no tiene un formato válido.',
            'fecha_fin.before_or_equal' => 'La fecha límite no puede ser futura.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cantidad = LogActividad::whereDate('created_at', '<=', $request->fecha_fin)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logs de actividad limpiados correctamente.',
            'data' => [
                'eliminados' => $cantidad,
            ],
        ]);
    }
}
