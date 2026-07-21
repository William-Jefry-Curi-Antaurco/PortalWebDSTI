<?php

namespace Tests\Feature;

use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfoInstitucionalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_crea_un_bloque_de_informacion_institucional(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/info-institucional', [
            'clave' => 'Misión',
            'titulo' => 'Nuestra misión',
            'contenido' => 'Formar profesionales competentes.',
        ])->assertCreated()->assertJsonPath('data.clave', 'mision');
    }

    public function test_no_permite_claves_duplicadas_aunque_se_escriban_distinto(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/info-institucional', [
            'clave' => 'mision', 'titulo' => 'Misión', 'contenido' => 'Contenido.',
        ])->assertCreated();

        // "Misión" y "mision" generan la misma clave normalizada.
        $this->postJson('/api/admin/info-institucional', [
            'clave' => 'Misión', 'titulo' => 'Otra misión', 'contenido' => 'Otro contenido.',
        ])->assertStatus(422)->assertJsonValidationErrors('clave');
    }

    public function test_registra_al_usuario_que_edito_el_contenido(): void
    {
        $usuario = $this->actingAsRol('admin');

        $response = $this->postJson('/api/admin/info-institucional', [
            'clave' => 'vision', 'titulo' => 'Nuestra visión', 'contenido' => 'Contenido.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.idusuario_editor', $usuario->idusuario);
    }

    public function test_lector_no_puede_crear_info_institucional(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/info-institucional')->assertOk();
        $this->postJson('/api/admin/info-institucional', [])->assertStatus(403);
    }
}
