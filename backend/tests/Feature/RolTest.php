<?php

namespace Tests\Feature;

use App\Models\Permiso;
use App\Models\Rol;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_crea_un_rol_nuevo(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/roles', [
            'nombre' => 'auditor',
            'descripcion' => 'Solo auditoría, sin edición.',
        ])->assertCreated()->assertJsonPath('data.nombre', 'auditor');
    }

    public function test_no_permite_nombres_de_rol_duplicados(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/roles', ['nombre' => 'admin'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre');
    }

    public function test_sincronizar_permisos_reemplaza_la_lista_completa(): void
    {
        $this->actingAsRol('admin');

        $rol = Rol::create(['nombre' => 'temporal', 'descripcion' => 'Rol de prueba']);
        $permisos = Permiso::where('nombre', 'like', 'noticias.%')->pluck('idpermiso');

        $this->putJson("/api/admin/roles/{$rol->idrol}/permisos/sincronizar", [
            'permisos' => $permisos->toArray(),
        ])->assertOk();

        $this->assertSame($permisos->count(), $rol->permisos()->count());

        // Sincronizar con una lista menor reemplaza, no acumula.
        $unSoloPermiso = [$permisos->first()];

        $this->putJson("/api/admin/roles/{$rol->idrol}/permisos/sincronizar", [
            'permisos' => $unSoloPermiso,
        ])->assertOk();

        $this->assertSame(1, $rol->permisos()->count());
    }

    public function test_asignar_y_quitar_un_permiso_individual(): void
    {
        $this->actingAsRol('admin');

        $rol = Rol::create(['nombre' => 'temporal', 'descripcion' => 'Rol de prueba']);
        $permiso = Permiso::first();

        $this->postJson("/api/admin/roles/{$rol->idrol}/permisos", ['idpermiso' => $permiso->idpermiso])
            ->assertCreated();

        $this->assertSame(1, $rol->permisos()->count());

        // No se puede asignar dos veces el mismo permiso.
        $this->postJson("/api/admin/roles/{$rol->idrol}/permisos", ['idpermiso' => $permiso->idpermiso])
            ->assertStatus(409);

        $this->deleteJson("/api/admin/roles/{$rol->idrol}/permisos", ['idpermiso' => $permiso->idpermiso])
            ->assertOk();

        $this->assertSame(0, $rol->permisos()->count());
    }

    public function test_no_permite_eliminar_un_rol_con_usuarios_asociados(): void
    {
        $this->actingAsRol('admin');

        $rolLector = Rol::where('nombre', 'lector')->first();

        \App\Models\User::factory()->conRol('lector')->create();

        $this->deleteJson("/api/admin/roles/{$rolLector->idrol}")
            ->assertStatus(409);
    }

    public function test_no_permite_eliminar_un_rol_con_permisos_asignados(): void
    {
        $this->actingAsRol('admin');

        $rolLector = Rol::where('nombre', 'lector')->first();

        $this->deleteJson("/api/admin/roles/{$rolLector->idrol}")
            ->assertStatus(409);
    }

    public function test_editor_no_puede_gestionar_roles(): void
    {
        $this->actingAsRol('editor');

        $this->getJson('/api/admin/roles')->assertStatus(403);
        $this->postJson('/api/admin/roles', ['nombre' => 'x'])->assertStatus(403);
    }
}
