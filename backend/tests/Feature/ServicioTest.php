<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Modulo;
use App\Models\Servicio;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServicioTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);

        $modulo = Modulo::where('slug', 'servicios')->first();

        $this->idcategoria = Categoria::create([
            'nombre' => 'Correo', 'slug' => 'correo', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Correo institucional',
            'descripcion_corta' => 'Cuenta de correo @unasam.edu.pe',
            'idcategoria' => $this->idcategoria,
        ], $overrides);
    }

    public function test_crea_un_servicio(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/servicios', $this->datosValidos())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'correo-institucional')
            ->assertJsonPath('data.activo', true);
    }

    public function test_no_permite_nombres_duplicados(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/servicios', $this->datosValidos())->assertCreated();

        $this->postJson('/api/admin/servicios', $this->datosValidos())
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre');
    }

    public function test_valida_el_correo_de_contacto(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/servicios', $this->datosValidos([
            'correo_contacto' => 'no-es-un-correo',
        ]))->assertStatus(422)->assertJsonValidationErrors('correo_contacto');
    }

    public function test_se_puede_eliminar_sin_restricciones(): void
    {
        $this->actingAsRol('admin');

        $servicio = Servicio::create($this->datosValidos() + [
            'slug' => 'correo-institucional', 'requiere_autenticacion' => false,
            'orden' => 0, 'activo' => true,
        ]);

        $this->deleteJson("/api/admin/servicios/{$servicio->idservicio}")->assertOk();
    }

    public function test_lector_no_puede_crear_servicios(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/servicios')->assertOk();
        $this->postJson('/api/admin/servicios', [])->assertStatus(403);
    }
}
