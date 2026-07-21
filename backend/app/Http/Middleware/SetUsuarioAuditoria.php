<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SetUsuarioAuditoria
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        DB::statement('SET @usuario_auditoria = ?', [
            $usuario ? $usuario->idusuario : null,
        ]);

        DB::statement('SET @ip_auditoria = ?', [
            $request->ip(),
        ]);

        DB::statement('SET @user_agent_auditoria = ?', [
            $request->userAgent(),
        ]);

        return $next($request);
    }
}
