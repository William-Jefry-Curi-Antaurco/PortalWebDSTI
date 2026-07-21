<?php

namespace Tests;

use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /**
     * Siembra roles/permisos/módulos reales (idempotente vía RefreshDatabase)
     * y crea un usuario con el rol indicado, autenticado con Sanctum para
     * el resto del test. Uso: $this->actingAsRol('editor');
     */
    protected function actingAsRol(string $rol, array $atributos = []): User
    {
        if (! \App\Models\Rol::where('nombre', $rol)->exists()) {
            $this->seed(RolesYPermisosSeeder::class);
        }

        $usuario = User::factory()->conRol($rol)->create($atributos);

        Sanctum::actingAs($usuario);

        return $usuario;
    }
}
