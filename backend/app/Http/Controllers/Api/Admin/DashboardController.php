<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $estadisticas = [
                'noticias' => DB::table('noticias')->count(),
                'servicios' => DB::table('servicios')->count(),
                'documentos' => DB::table('documentos')->count(),
                'soporte' => DB::table('solicitudes_soporte')->count(),
                'usuarios' => DB::table('usuarios')->count(),
                'eventos' => DB::table('eventos')->count(),
            ];

            $actividadReciente = DB::table('logs_actividad as log')
                ->leftJoin(
                    'usuarios as usuario',
                    'usuario.idusuario',
                    '=',
                    'log.idusuario'
                )
                ->select([
                    'log.idlog',
                    'log.accion',
                    'log.entidad',
                    'log.identificador_entidad',
                    'log.created_at',
                    'usuario.nombre_completo as usuario',
                ])
                ->orderByDesc('log.created_at')
                ->limit(8)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Dashboard obtenido correctamente.',
                'data' => [
                    'estadisticas' => $estadisticas,
                    'actividad_reciente' => $actividadReciente,
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener la información del dashboard.',
            ], 500);
        }
    }
}
