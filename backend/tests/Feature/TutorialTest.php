<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Modulo;
use App\Models\TipoEntidad;
use App\Models\TipoTutorial;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TutorialTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestado;
    private int $idtipotutorial;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);

        $modulo = Modulo::where('slug', 'tutoriales')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Tutoriales', 'slug' => 'tutoriales']);

        $this->idcategoria = Categoria::create([
            'nombre' => 'Guías', 'slug' => 'guias', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;

        $this->idestado = Estado::create([
            'nombre' => 'Publicado', 'slug' => 'publicado', 'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;

        $this->idtipotutorial = TipoTutorial::create([
            'nombre' => 'Guía escrita', 'slug' => 'guia-escrita', 'activo' => true,
        ])->idtipotutorial;
    }

    private function datosBase(array $overrides = []): array
    {
        return array_merge([
            'titulo' => 'Cómo restablecer tu contraseña institucional',
            'descripcion' => 'Guía paso a paso.',
            'idcategoria' => $this->idcategoria,
            'idestado' => $this->idestado,
            'idtipotutorial' => $this->idtipotutorial,
        ], $overrides);
    }

    public function test_exige_al_menos_contenido_enlace_o_archivo(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/tutoriales', $this->datosBase())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['contenido_html']);
    }

    public function test_crea_un_tutorial_con_enlace_de_video(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/tutoriales', $this->datosBase([
            'enlace_video' => 'https://www.youtube.com/watch?v=abc123',
        ]))->assertCreated()->assertJsonPath('data.enlace_video', 'https://www.youtube.com/watch?v=abc123');
    }

    public function test_crea_un_tutorial_solo_con_contenido_html(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/tutoriales', $this->datosBase([
            'contenido_html' => '<p>Paso 1: entra al portal.</p>',
        ]))->assertCreated();
    }

    public function test_no_permite_titulos_duplicados(): void
    {
        $this->actingAsRol('admin');

        $datos = $this->datosBase(['contenido_html' => '<p>Contenido</p>']);

        $this->postJson('/api/admin/tutoriales', $datos)->assertCreated();
        $this->postJson('/api/admin/tutoriales', $datos)
            ->assertStatus(422)
            ->assertJsonValidationErrors('titulo');
    }

    public function test_lector_no_puede_crear_tutoriales(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/tutoriales')->assertOk();
        $this->postJson('/api/admin/tutoriales', [])->assertStatus(403);
    }
}
