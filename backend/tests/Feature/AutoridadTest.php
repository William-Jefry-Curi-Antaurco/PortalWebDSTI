<?php

namespace Tests\Feature;

use App\Models\Autoridad;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AutoridadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
        Storage::fake('public');
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombre_completo' => 'Dra. María López Quispe',
            'cargo' => 'Rectora',
        ], $overrides);
    }

    public function test_crea_una_autoridad_sin_archivos(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/autoridades', $this->datosValidos())
            ->assertCreated()
            ->assertJsonPath('data.cargo', 'Rectora')
            ->assertJsonPath('data.activo', true);
    }

    public function test_crea_una_autoridad_con_foto_y_cv(): void
    {
        $this->actingAsRol('admin');

        $response = $this->post('/api/admin/autoridades', $this->datosValidos([
            'foto' => UploadedFile::fake()->image('foto.jpg'),
            'cv' => UploadedFile::fake()->create('cv.pdf', 200, 'application/pdf'),
        ]), ['Accept' => 'application/json']);

        $response->assertCreated();
        $this->assertNotNull($response->json('data.foto_url'));
        $this->assertNotNull($response->json('data.cv_url'));
    }

    public function test_la_fecha_de_fin_de_gestion_no_puede_ser_anterior_al_inicio(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/autoridades', $this->datosValidos([
            'fecha_inicio_gestion' => '2026-01-01',
            'fecha_fin_gestion' => '2025-01-01',
        ]))->assertStatus(422)->assertJsonValidationErrors('fecha_fin_gestion');
    }

    public function test_elimina_una_autoridad_y_su_foto_del_disco(): void
    {
        $this->actingAsRol('admin');

        $creada = $this->post('/api/admin/autoridades', $this->datosValidos([
            'foto' => UploadedFile::fake()->image('foto.jpg'),
        ]), ['Accept' => 'application/json'])->json('data');

        Storage::disk('public')->assertExists($creada['foto_url']);

        $this->deleteJson("/api/admin/autoridades/{$creada['idautoridad']}")->assertOk();

        Storage::disk('public')->assertMissing($creada['foto_url']);
        $this->assertDatabaseMissing('autoridades', ['idautoridad' => $creada['idautoridad']]);
    }

    public function test_lector_no_puede_crear_autoridades(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/autoridades')->assertOk();
        $this->postJson('/api/admin/autoridades', [])->assertStatus(403);
    }
}
