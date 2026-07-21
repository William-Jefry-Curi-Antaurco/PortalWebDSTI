<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Evento;
use App\Models\EventoInscripcion;
use App\Models\ModalidadEvento;
use App\Models\Modulo;
use App\Models\TipoEntidad;
use App\Models\TipoEvento;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventoTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestado;
    private int $idtipoevento;
    private int $idmodalidad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
        Storage::fake('public');

        $modulo = Modulo::where('slug', 'eventos')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Eventos', 'slug' => 'eventos']);

        $this->idcategoria = Categoria::create([
            'nombre' => 'Capacitaciones', 'slug' => 'capacitaciones',
            'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;

        $this->idestado = Estado::create([
            'nombre' => 'Publicado', 'slug' => 'publicado',
            'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;

        $this->idtipoevento = TipoEvento::create([
            'nombre' => 'Taller', 'slug' => 'taller', 'activo' => true,
        ])->idtipoevento;

        $this->idmodalidad = ModalidadEvento::create([
            'nombre' => 'Virtual', 'slug' => 'virtual', 'activo' => true,
        ])->idmodalidad;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'titulo' => 'Taller de seguridad informática',
            'descripcion' => 'Taller práctico sobre buenas prácticas de seguridad.',
            'fecha_inicio' => now()->addDays(5)->toDateTimeString(),
            'fecha_fin' => now()->addDays(5)->addHours(2)->toDateTimeString(),
            'idcategoria' => $this->idcategoria,
            'idestado' => $this->idestado,
            'idtipoevento' => $this->idtipoevento,
            'idmodalidad' => $this->idmodalidad,
        ], $overrides);
    }

    public function test_crea_un_evento_sin_archivo_adjunto(): void
    {
        $this->actingAsRol('editor');

        $response = $this->postJson('/api/admin/eventos', $this->datosValidos());

        $response->assertCreated()
            ->assertJsonPath('data.cupos_ocupados', 0);

        $this->assertDatabaseHas('eventos', ['titulo' => 'Taller de seguridad informática']);
    }

    public function test_la_fecha_fin_no_puede_ser_anterior_a_la_fecha_inicio(): void
    {
        $this->actingAsRol('admin');

        $response = $this->postJson('/api/admin/eventos', $this->datosValidos([
            'fecha_inicio' => now()->addDays(5)->toDateTimeString(),
            'fecha_fin' => now()->addDays(4)->toDateTimeString(),
        ]));

        $response->assertStatus(422)->assertJsonValidationErrors('fecha_fin');
    }

    public function test_no_permite_titulos_duplicados(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/eventos', $this->datosValidos())->assertCreated();

        $this->postJson('/api/admin/eventos', $this->datosValidos())
            ->assertStatus(422)
            ->assertJsonValidationErrors('titulo');
    }

    public function test_sube_un_archivo_adicional_a_un_evento_existente(): void
    {
        $usuario = $this->actingAsRol('editor');

        $evento = Evento::create($this->datosValidos() + [
            'slug' => 'taller-existente',
            'cupo_maximo' => 30,
            'cupos_ocupados' => 0,
            'idusuario_organizador' => $usuario->idusuario,
        ]);

        $imagen = UploadedFile::fake()->image('portada.jpg');

        $response = $this->post("/api/admin/eventos/{$evento->idevento}/archivos", [
            'titulo' => 'Portada del taller',
            'es_portada' => true,
            'archivo' => $imagen,
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.titulo', 'Portada del taller');

        $this->assertDatabaseCount('eventos_archivos', 1);
    }

    public function test_no_permite_eliminar_un_evento_con_inscripciones(): void
    {
        $usuario = $this->actingAsRol('admin');

        $evento = Evento::create($this->datosValidos() + [
            'slug' => 'taller-con-inscritos',
            'cupo_maximo' => 30,
            'cupos_ocupados' => 1,
            'idusuario_organizador' => $usuario->idusuario,
        ]);

        EventoInscripcion::create([
            'nombres' => 'Participante de prueba',
            'email' => 'participante@example.com',
            'idestado' => $this->idestado,
            'idevento' => $evento->idevento,
        ]);

        $this->deleteJson("/api/admin/eventos/{$evento->idevento}")
            ->assertStatus(409);
    }

    public function test_lector_puede_ver_pero_no_crear_eventos(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/eventos')->assertOk();
        $this->postJson('/api/admin/eventos', [])->assertStatus(403);
    }
}
