<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        $usuario->loadMissing('rol');

        if (!$usuario->rol || !in_array($usuario->rol->nombre, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a este recurso.',
            ], 403);
        }

        return $next($request);
    }
}
