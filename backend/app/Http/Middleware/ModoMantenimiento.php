<?php

namespace App\Http\Middleware;

use App\Models\PortalConfiguracion;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ModoMantenimiento
{
    public function handle(Request $request, Closure $next): Response
    {
        // Rutas de auth y admin nunca se bloquean
        if ($request->is('api/auth/*') || $request->is('api/admin/*')) {
            return $next($request);
        }

        try {
            $activo = PortalConfiguracion::get('modo_mantenimiento', '0');

            if ($activo === '1') {
                return response()->json([
                    'mantenimiento' => true,
                    'message'       => 'El portal está en mantenimiento. Por favor intenta más tarde.',
                ], 503);
            }
        } catch (\Throwable $e) {
            // Si hay cualquier error leyendo la BD, deja pasar la petición
            // El portal no debe caerse por un fallo en la configuración
        }

        return $next($request);
    }
}
