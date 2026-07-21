<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use stdClass;

class UsuarioRepository
{
    public function buscarPorEmail(string $email): ?stdClass
    {
        return DB::table('usuarios as u')
            ->join('roles as r', 'r.idrol', '=', 'u.idrol')
            ->select(
                'u.idusuario',
                'u.nombre_completo',
                'u.email',
                'u.password_hash',
                'u.idrol',
                'u.activo',
                'r.nombre as rol'
            )
            ->where('u.email', $email)
            ->first();
    }

    public function actualizarUltimoAcceso(int $idusuario): void
    {
        DB::table('usuarios')
            ->where('idusuario', $idusuario)
            ->update([
                'ultimo_acceso' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
    }
}
