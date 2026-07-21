<?php

namespace Tests\Feature;

use App\Models\Archivo;
use App\Models\PortalConfiguracion;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConfiguracionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
        Storage::fake('public');
    }

    public function test_index_agrupa_la_configuracion_por_grupo(): void
    {
        $this->actingAsRol('admin');

        PortalConfiguracion::create([
            'clave' => 'hero_titulo', 'valor' => 'Bienvenido', 'tipo' => 'texto',
            'grupo' => 'textos', 'activo' => true,
        ]);
        PortalConfiguracion::create([
            'clave' => 'color_primario', 'valor' => '#003366', 'tipo' => 'color',
            'grupo' => 'apariencia', 'activo' => true,
        ]);

        $response = $this->getJson('/api/admin/configuracion');

        $response->assertOk();
        $this->assertArrayHasKey('textos', $response->json('data'));
        $this->assertArrayHasKey('apariencia', $response->json('data'));
    }

    public function test_actualiza_el_valor_de_una_clave_de_texto(): void
    {
        $this->actingAsRol('editor');

        PortalConfiguracion::create([
            'clave' => 'hero_titulo', 'valor' => 'Bienvenido', 'tipo' => 'texto',
            'grupo' => 'textos', 'activo' => true,
        ]);

        $this->putJson('/api/admin/configuracion', [
            'config' => ['hero_titulo' => 'Bienvenido a UNASAM'],
        ])->assertOk();

        $this->assertSame(
            'Bienvenido a UNASAM',
            PortalConfiguracion::where('clave', 'hero_titulo')->value('valor')
        );
    }

    public function test_no_permite_actualizar_claves_tipo_archivo_desde_el_endpoint_de_texto(): void
    {
        $this->actingAsRol('admin');

        PortalConfiguracion::create([
            'clave' => 'img_logo', 'valor' => null, 'tipo' => 'archivo',
            'grupo' => 'apariencia', 'activo' => true,
        ]);

        $this->putJson('/api/admin/configuracion', [
            'config' => ['img_logo' => 'esto-no-deberia-guardarse'],
        ])->assertStatus(422);

        $this->assertNull(PortalConfiguracion::where('clave', 'img_logo')->value('valor'));
    }

    public function test_sube_una_imagen_para_una_clave_tipo_archivo(): void
    {
        $this->actingAsRol('admin');

        PortalConfiguracion::create([
            'clave' => 'img_logo', 'valor' => null, 'tipo' => 'archivo',
            'grupo' => 'apariencia', 'activo' => true,
        ]);

        $response = $this->post('/api/admin/configuracion/archivo', [
            'clave' => 'img_logo',
            'archivo' => UploadedFile::fake()->image('logo.png'),
        ], ['Accept' => 'application/json']);

        $response->assertOk();

        $config = PortalConfiguracion::where('clave', 'img_logo')->first();
        $this->assertNotNull($config->idarchivo);
    }

    public function test_elimina_la_imagen_de_una_clave_y_borra_el_archivo_huerfano(): void
    {
        $this->actingAsRol('admin');

        $archivo = Archivo::create([
            'nombre_original' => 'logo.png', 'nombre_guardado' => 'logo-1.png',
            'ruta' => 'configuracion/logo-1.png', 'extension' => 'png',
            'mime_type' => 'image/png', 'peso_bytes' => 1000,
        ]);

        Storage::disk('public')->put($archivo->ruta, 'contenido-falso');

        PortalConfiguracion::create([
            'clave' => 'img_logo', 'valor' => null, 'idarchivo' => $archivo->idarchivo,
            'tipo' => 'archivo', 'grupo' => 'apariencia', 'activo' => true,
        ]);

        $this->deleteJson('/api/admin/configuracion/archivo/img_logo')->assertOk();

        $this->assertNull(PortalConfiguracion::where('clave', 'img_logo')->value('idarchivo'));
        Storage::disk('public')->assertMissing($archivo->ruta);
    }

    public function test_lector_no_puede_modificar_la_configuracion(): void
    {
        $this->actingAsRol('lector');

        PortalConfiguracion::create([
            'clave' => 'hero_titulo', 'valor' => 'Bienvenido', 'tipo' => 'texto',
            'grupo' => 'textos', 'activo' => true,
        ]);

        $this->getJson('/api/admin/configuracion')->assertOk();
        $this->putJson('/api/admin/configuracion', ['config' => ['hero_titulo' => 'x']])
            ->assertStatus(403);
    }
}
