<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfraestructuraTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_esquema_real_se_carga_en_la_bd_de_pruebas(): void
    {
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('usuarios'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('enlaces_sistemas'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasColumn('enlaces_sistemas', 'idarchivo_manual'));
    }

    public function test_el_seeder_de_roles_y_permisos_crea_la_matriz_real(): void
    {
        $usuario = $this->actingAsRol('lector');

        $this->assertSame('lector', $usuario->rol->nombre);
        $this->assertCount(11, $usuario->rol->permisos()->get());
        $this->assertTrue($usuario->rol->permisos->every(fn ($p) => str_ends_with($p->nombre, '.ver')));
    }
}
