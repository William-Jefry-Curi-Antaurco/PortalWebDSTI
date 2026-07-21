<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Etiqueta;
use App\Models\Modulo;
use App\Models\Noticia;
use App\Models\TipoEntidad;
use App\Models\TipoPublicacion;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EtiquetaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    private function crearNoticia(): Noticia
    {
        $usuario = $this->actingAsRol('admin');
        $modulo = Modulo::where('slug', 'noticias')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Noticias', 'slug' => 'noticias']);

        return Noticia::create([
            'titulo' => 'Noticia de prueba', 'slug' => 'noticia-de-prueba',
            'resumen' => 'Resumen de prueba', 'contenido' => 'Contenido de prueba con más de veinte caracteres.',
            'idcategoria' => Categoria::create(['nombre' => 'General', 'slug' => 'general', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true])->idcategoria,
            'idusuario_autor' => $usuario->idusuario,
            'idestado' => Estado::create(['nombre' => 'Publicado', 'slug' => 'publicado', 'idtipoentidad' => $tipoEntidad->idtipoentidad])->idestado,
            'idtipopublicacion' => TipoPublicacion::create(['nombre' => 'Comunicado', 'slug' => 'comunicado', 'activo' => true])->idtipopublicacion,
            'fecha_publicacion' => now(),
        ]);
    }

    public function test_crea_una_etiqueta_y_genera_slug(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/etiquetas', ['nombre' => 'Seguridad informática', 'color' => '#ff0000'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'seguridad-informatica');
    }

    public function test_no_permite_nombres_de_etiqueta_duplicados(): void
    {
        $this->actingAsRol('admin');

        Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $this->postJson('/api/admin/etiquetas', ['nombre' => 'Correo'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre');
    }

    public function test_asigna_una_etiqueta_a_una_noticia_existente(): void
    {
        $noticia = $this->crearNoticia();
        $etiqueta = Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $response = $this->postJson('/api/admin/etiquetas/contenido/asignar', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('etiquetas_contenido', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ]);
    }

    public function test_no_permite_asignar_una_etiqueta_a_contenido_inexistente(): void
    {
        $this->actingAsRol('admin');

        $etiqueta = Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $this->postJson('/api/admin/etiquetas/contenido/asignar', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => 999999,
        ])->assertStatus(422);
    }

    public function test_no_permite_asignar_la_misma_etiqueta_dos_veces(): void
    {
        $noticia = $this->crearNoticia();
        $etiqueta = Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $payload = [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ];

        $this->postJson('/api/admin/etiquetas/contenido/asignar', $payload)->assertCreated();
        $this->postJson('/api/admin/etiquetas/contenido/asignar', $payload)->assertStatus(409);
    }

    public function test_lista_y_quita_etiquetas_de_un_contenido(): void
    {
        $noticia = $this->crearNoticia();
        $etiqueta = Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $this->postJson('/api/admin/etiquetas/contenido/asignar', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ])->assertCreated();

        $this->getJson('/api/admin/etiquetas/contenido/listar?' . http_build_query([
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ]))->assertOk()->assertJsonCount(1, 'data');

        $this->deleteJson('/api/admin/etiquetas/contenido/quitar', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ])->assertOk();

        $this->assertDatabaseMissing('etiquetas_contenido', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'identidad' => $noticia->idnoticia,
        ]);
    }

    public function test_no_permite_eliminar_una_etiqueta_con_contenido_asociado(): void
    {
        $noticia = $this->crearNoticia();
        $etiqueta = Etiqueta::create(['nombre' => 'Correo', 'slug' => 'correo', 'activo' => true]);

        $this->postJson('/api/admin/etiquetas/contenido/asignar', [
            'idetiqueta' => $etiqueta->idetiqueta,
            'entidad' => 'noticias',
            'identidad' => $noticia->idnoticia,
        ])->assertCreated();

        $this->deleteJson("/api/admin/etiquetas/{$etiqueta->idetiqueta}")->assertStatus(409);
    }

    public function test_lector_no_puede_crear_ni_asignar_etiquetas(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/etiquetas')->assertOk();
        $this->postJson('/api/admin/etiquetas', ['nombre' => 'x'])->assertStatus(403);
        $this->postJson('/api/admin/etiquetas/contenido/asignar', [])->assertStatus(403);
    }
}
