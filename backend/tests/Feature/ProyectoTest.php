<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Modulo;
use App\Models\TipoEntidad;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProyectoTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestado;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);

        $modulo = Modulo::where('slug', 'proyectos')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Proyectos', 'slug' => 'proyectos']);

        $this->idcategoria = Categoria::create([
            'nombre' => 'Transformación digital', 'slug' => 'transformacion-digital',
            'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;

        $this->idestado = Estado::create([
            'nombre' => 'En curso', 'slug' => 'en-curso', 'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'titulo' => 'Modernización del sistema académico',
            'descripcion' => 'Proyecto de modernización tecnológica.',
            'fecha_inicio' => now()->toDateString(),
            'idcategoria' => $this->idcategoria,
            'idestado' => $this->idestado,
        ], $overrides);
    }

    public function test_crea_un_proyecto_con_fecha_de_inicio(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/proyectos', $this->datosValidos())
            ->assertCreated()
            ->assertJsonPath('data.porcentaje_avance', 0);
    }

    public function test_la_fecha_de_inicio_es_obligatoria(): void
    {
        // La columna fecha_inicio es NOT NULL en la BD; si la validación no
        // la exige, el intento de crear sin ella termina en un error 500 de
        // base de datos en vez de un 422 legible. Se corrigió la validación
        // de ProyectoController para que coincida con el esquema real.
        $this->actingAsRol('admin');

        $datos = $this->datosValidos();
        unset($datos['fecha_inicio']);

        $this->postJson('/api/admin/proyectos', $datos)
            ->assertStatus(422)
            ->assertJsonValidationErrors('fecha_inicio');
    }

    public function test_la_fecha_fin_no_puede_ser_anterior_a_la_fecha_inicio(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/proyectos', $this->datosValidos([
            'fecha_inicio' => now()->toDateString(),
            'fecha_fin' => now()->subDay()->toDateString(),
        ]))->assertStatus(422)->assertJsonValidationErrors('fecha_fin');
    }

    public function test_el_porcentaje_de_avance_debe_estar_entre_0_y_100(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/proyectos', $this->datosValidos(['porcentaje_avance' => 150]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('porcentaje_avance');
    }

    public function test_lector_no_puede_crear_proyectos(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/proyectos')->assertOk();
        $this->postJson('/api/admin/proyectos', [])->assertStatus(403);
    }
}
