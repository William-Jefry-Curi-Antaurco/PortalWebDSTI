<?php

namespace Tests\Feature;

use App\Models\Archivo;
use App\Models\Categoria;
use App\Models\Documento;
use App\Models\Estado;
use App\Models\Modulo;
use App\Models\TipoDocumento;
use App\Models\TipoEntidad;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentoTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestado;
    private int $idtipodocumento;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
        Storage::fake('public');

        $modulo = Modulo::where('slug', 'documentos')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Documentos', 'slug' => 'documentos']);

        $this->idcategoria = Categoria::create([
            'nombre' => 'Normativas', 'slug' => 'normativas',
            'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true,
        ])->idcategoria;

        $this->idestado = Estado::create([
            'nombre' => 'Publicado', 'slug' => 'publicado',
            'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;

        $this->idtipodocumento = TipoDocumento::create([
            'nombre' => 'Manual', 'slug' => 'manual', 'activo' => true,
        ])->idtipodocumento;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'titulo' => 'Manual de usuario del sistema académico',
            'descripcion' => 'Describe el uso del sistema académico paso a paso.',
            'idcategoria' => $this->idcategoria,
            'idestado' => $this->idestado,
            'idtipodocumento' => $this->idtipodocumento,
        ], $overrides);
    }

    public function test_crear_documento_exige_archivo(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/documentos', $this->datosValidos())
            ->assertStatus(422)
            ->assertJsonValidationErrors('archivo');
    }

    public function test_crea_un_documento_con_archivo_valido(): void
    {
        $this->actingAsRol('editor');

        $archivo = UploadedFile::fake()->create('manual.pdf', 500, 'application/pdf');

        $response = $this->post('/api/admin/documentos', $this->datosValidos([
            'archivo' => $archivo,
        ]), ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.version', '1.0')
            ->assertJsonPath('data.es_version_actual', true);

        $this->assertDatabaseHas('documentos', [
            'titulo' => 'Manual de usuario del sistema académico',
        ]);

        $idarchivo = Documento::first()->idarchivo;
        Storage::disk('public')->assertExists(Archivo::find($idarchivo)->ruta);
    }

    public function test_no_permite_titulos_duplicados(): void
    {
        $this->actingAsRol('admin');

        $archivo1 = UploadedFile::fake()->create('a.pdf', 100, 'application/pdf');
        $this->post('/api/admin/documentos', $this->datosValidos(['archivo' => $archivo1]), ['Accept' => 'application/json'])
            ->assertCreated();

        $archivo2 = UploadedFile::fake()->create('b.pdf', 100, 'application/pdf');
        $this->post('/api/admin/documentos', $this->datosValidos(['archivo' => $archivo2]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('titulo');
    }

    public function test_rechaza_un_archivo_con_extension_no_permitida(): void
    {
        $this->actingAsRol('admin');

        $archivo = UploadedFile::fake()->create('virus.exe', 100, 'application/octet-stream');

        $this->post('/api/admin/documentos', $this->datosValidos(['archivo' => $archivo]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('archivo');
    }

    public function test_actualiza_un_documento_sin_reemplazar_el_archivo(): void
    {
        $usuario = $this->actingAsRol('editor');

        $archivo = Archivo::create([
            'nombre_original' => 'manual.pdf', 'nombre_guardado' => 'manual-1.pdf',
            'ruta' => 'documentos/manual-1.pdf', 'extension' => 'pdf',
            'mime_type' => 'application/pdf', 'peso_bytes' => 1000,
        ]);

        $documento = Documento::create($this->datosValidos() + [
            'slug' => 'manual-original',
            'idarchivo' => $archivo->idarchivo,
            'idusuario_subidor' => $usuario->idusuario,
            'version' => '1.0',
            'es_version_actual' => true,
        ]);

        $response = $this->postJson("/api/admin/documentos/{$documento->iddocumento}", $this->datosValidos([
            'titulo' => 'Manual de usuario actualizado',
            'version' => '1.1',
        ]));

        $response->assertOk()
            ->assertJsonPath('data.titulo', 'Manual de usuario actualizado')
            ->assertJsonPath('data.version', '1.1')
            ->assertJsonPath('data.archivo.idarchivo', $archivo->idarchivo);
    }

    public function test_no_permite_eliminar_un_documento_con_versiones_hijas(): void
    {
        $usuario = $this->actingAsRol('admin');

        $archivo = Archivo::create([
            'nombre_original' => 'v1.pdf', 'nombre_guardado' => 'v1.pdf',
            'ruta' => 'documentos/v1.pdf', 'extension' => 'pdf',
            'mime_type' => 'application/pdf', 'peso_bytes' => 1000,
        ]);

        $padre = Documento::create($this->datosValidos() + [
            'slug' => 'documento-padre', 'idarchivo' => $archivo->idarchivo,
            'idusuario_subidor' => $usuario->idusuario, 'version' => '1.0', 'es_version_actual' => false,
        ]);

        Documento::create($this->datosValidos([
            'titulo' => 'Manual de usuario del sistema académico v2',
        ]) + [
            'slug' => 'documento-hijo', 'idarchivo' => $archivo->idarchivo,
            'idusuario_subidor' => $usuario->idusuario, 'iddocumento_padre' => $padre->iddocumento,
            'version' => '2.0', 'es_version_actual' => true,
        ]);

        $this->deleteJson("/api/admin/documentos/{$padre->iddocumento}")
            ->assertStatus(409);
    }

    public function test_lector_no_puede_crear_ni_eliminar_documentos(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/documentos')->assertOk();
        $this->postJson('/api/admin/documentos', [])->assertStatus(403);
        $this->deleteJson('/api/admin/documentos/1')->assertStatus(403);
    }
}
