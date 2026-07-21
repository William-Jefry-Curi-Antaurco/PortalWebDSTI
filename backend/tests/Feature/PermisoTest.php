<?php

namespace Tests\Feature;

use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\Rol;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermisoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_crea_un_permiso_nuevo(): void
    {
        $this->actingAsRol('admin');

        $idmodulo = Modulo::where('slug', 'noticias')->value('idmodulo');

        $this->postJson('/api/admin/permisos', [
            'nombre' => 'noticias.destacar',
            'descripcion' => 'Marcar una noticia como destacada',
            'idmodulo' => $idmodulo,
        ])->assertCreated()->assertJsonPath('data.nombre', 'noticias.destacar');
    }

    public function test_no_permite_nombres_de_permiso_duplicados(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/permisos', [
            'nombre' => 'noticias.ver',
            'descripcion' => 'Duplicado',
            'idmodulo' => Modulo::where('slug', 'noticias')->value('idmodulo'),
        ])->assertStatus(422)->assertJsonValidationErrors('nombre');
    }

    public function test_no_permite_eliminar_un_permiso_asignado_a_un_rol(): void
    {
        $this->actingAsRol('admin');

        $permiso = Permiso::where('nombre', 'noticias.ver')->first();

        $this->deleteJson("/api/admin/permisos/{$permiso->idpermiso}")
            ->assertStatus(409);
    }

    public function test_elimina_un_permiso_sin_roles_asociados(): void
    {
        $this->actingAsRol('admin');

        $permiso = Permiso::create([
            'nombre' => 'temporal.accion',
            'descripcion' => 'Permiso de prueba sin uso',
            'idmodulo' => Modulo::first()->idmodulo,
        ]);

        $this->deleteJson("/api/admin/permisos/{$permiso->idpermiso}")
            ->assertOk();

        $this->assertDatabaseMissing('permisos', ['idpermiso' => $permiso->idpermiso]);
    }

    public function test_lector_no_puede_crear_ni_eliminar_permisos(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/permisos')->assertOk();
        $this->postJson('/api/admin/permisos', [])->assertStatus(403);
    }
}
