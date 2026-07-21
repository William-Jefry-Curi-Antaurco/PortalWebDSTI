<?php

namespace Tests\Feature;

use App\Models\Archivo;
use App\Models\Categoria;
use App\Models\EstadoOperativo;
use App\Models\Modulo;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EnlaceSistemaTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestadooperativo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
        Storage::fake('public');

        $modulo = Modulo::where('slug', 'sistemas')->first();

        $this->idcategoria = Categoria::create([
            'nombre' => 'Académico', 'slug' => 'academico',
            'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;

        $this->idestadooperativo = EstadoOperativo::create([
            'nombre' => 'Disponible', 'slug' => 'disponible', 'activo' => true,
        ])->idestadooperativo;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombre_sistema' => 'Sistema de Gestión Académica',
            'descripcion' => 'Plataforma para trámites académicos.',
            'url' => 'https://sga.unasam.edu.pe',
            'idcategoria' => $this->idcategoria,
            'idestadooperativo' => $this->idestadooperativo,
        ], $overrides);
    }

    public function test_crea_un_sistema_sin_manual_ni_documentacion(): void
    {
        $this->actingAsRol('editor');

        $response = $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos());

        $response->assertCreated()
            ->assertJsonPath('data.archivo_manual', null)
            ->assertJsonPath('data.archivo_documentacion', null)
            ->assertJsonPath('data.slug', 'sistema-de-gestion-academica');
    }

    public function test_crea_un_sistema_con_manual_y_documentacion(): void
    {
        $this->actingAsRol('admin');

        $response = $this->post('/api/admin/enlaces-sistemas', $this->datosValidos([
            'archivo_manual' => UploadedFile::fake()->create('manual.pdf', 200, 'application/pdf'),
            'archivo_documentacion' => UploadedFile::fake()->create('doc.pdf', 200, 'application/pdf'),
        ]), ['Accept' => 'application/json']);

        $response->assertCreated();
        $this->assertNotNull($response->json('data.archivo_manual'));
        $this->assertNotNull($response->json('data.archivo_documentacion'));

        $this->assertDatabaseCount('archivos', 2);
    }

    public function test_reemplazar_el_manual_borra_el_archivo_anterior_huerfano(): void
    {
        $this->actingAsRol('admin');

        $creado = $this->post('/api/admin/enlaces-sistemas', $this->datosValidos([
            'archivo_manual' => UploadedFile::fake()->create('manual-v1.pdf', 200, 'application/pdf'),
        ]), ['Accept' => 'application/json'])->json('data');

        $this->assertDatabaseCount('archivos', 1);
        $rutaAnterior = Archivo::first()->ruta;
        Storage::disk('public')->assertExists($rutaAnterior);

        $this->post("/api/admin/enlaces-sistemas/{$creado['idenlace']}", $this->datosValidos([
            'archivo_manual' => UploadedFile::fake()->create('manual-v2.pdf', 200, 'application/pdf'),
        ]), ['Accept' => 'application/json'])->assertOk();

        // El archivo viejo ya no le pertenece a nadie más: se borra de BD y disco.
        $this->assertDatabaseCount('archivos', 1);
        Storage::disk('public')->assertMissing($rutaAnterior);
    }

    public function test_el_slug_se_desambigua_cuando_dos_nombres_distintos_generan_la_misma_base(): void
    {
        $this->actingAsRol('admin');

        // Nombres distintos para MySQL (unique no los bloquea) que Str::slug()
        // reduce al mismo slug base al colapsar separadores.
        $primero = $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos([
            'nombre_sistema' => 'Sistema Académico',
        ]))->assertCreated()->json('data');

        $segundo = $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos([
            'nombre_sistema' => 'Sistema - Académico',
        ]))->assertCreated()->json('data');

        $this->assertSame('sistema-academico', $primero['slug']);
        $this->assertSame('sistema-academico-1', $segundo['slug']);
    }

    public function test_valida_que_el_nombre_no_se_repita(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos())->assertCreated();

        $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos())
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre_sistema');
    }

    public function test_lector_no_puede_crear_sistemas(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/enlaces-sistemas')->assertOk();
        $this->postJson('/api/admin/enlaces-sistemas', $this->datosValidos())->assertStatus(403);
    }
}
