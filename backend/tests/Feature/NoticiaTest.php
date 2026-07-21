<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Estado;
use App\Models\Modulo;
use App\Models\Noticia;
use App\Models\NoticiaImagen;
use App\Models\TipoEntidad;
use App\Models\TipoPublicacion;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Plantilla de tests CRUD para un módulo de contenido. Los demás módulos
 * (Documentos, Eventos, Tutoriales, Proyectos, Servicios...) siguen el mismo
 * patrón de controlador y se pueden probar copiando esta estructura.
 */
class NoticiaTest extends TestCase
{
    use RefreshDatabase;

    private int $idcategoria;
    private int $idestado;
    private int $idtipopublicacion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);

        $modulo = Modulo::where('slug', 'noticias')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Noticias', 'slug' => 'noticias']);

        $this->idcategoria = Categoria::create([
            'nombre' => 'Comunicados',
            'slug' => 'comunicados',
            'idmodulo' => $modulo->idmodulo,
            'orden' => 0,
            'activo' => true,
        ])->idcategoria;

        $this->idestado = Estado::create([
            'nombre' => 'Publicado',
            'slug' => 'publicado',
            'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->idestado;

        $this->idtipopublicacion = TipoPublicacion::create([
            'nombre' => 'Comunicado',
            'slug' => 'comunicado',
            'activo' => true,
        ])->idtipopublicacion;
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'titulo' => 'Mantenimiento programado del sistema académico',
            'resumen' => 'El sistema académico estará en mantenimiento este fin de semana.',
            'contenido' => 'Contenido detallado del comunicado con más de veinte caracteres.',
            'idcategoria' => $this->idcategoria,
            'idestado' => $this->idestado,
            'idtipopublicacion' => $this->idtipopublicacion,
            'fecha_publicacion' => now()->toDateTimeString(),
        ], $overrides);
    }

    public function test_lista_noticias(): void
    {
        $usuario = $this->actingAsRol('admin');

        Noticia::create($this->datosValidos() + [
            'slug' => 'noticia-existente',
            'idusuario_autor' => $usuario->idusuario,
        ]);

        $this->getJson('/api/admin/noticias')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_crea_una_noticia_y_genera_slug(): void
    {
        $this->actingAsRol('editor');

        $response = $this->postJson('/api/admin/noticias', $this->datosValidos());

        $response->assertCreated()
            ->assertJsonPath('data.slug', 'mantenimiento-programado-del-sistema-academico')
            ->assertJsonPath('data.visitas', 0)
            ->assertJsonPath('data.es_destacada', false);

        $this->assertDatabaseHas('noticias', [
            'titulo' => 'Mantenimiento programado del sistema académico',
        ]);
    }

    public function test_el_slug_no_se_duplica_entre_noticias(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/noticias', $this->datosValidos())->assertCreated();

        $segunda = $this->postJson('/api/admin/noticias', $this->datosValidos());

        $segunda->assertCreated()
            ->assertJsonPath('data.slug', 'mantenimiento-programado-del-sistema-academico-1');
    }

    public function test_valida_campos_obligatorios_y_relaciones_inexistentes(): void
    {
        $this->actingAsRol('admin');

        $response = $this->postJson('/api/admin/noticias', $this->datosValidos([
            'titulo' => 'Hi',
            'idcategoria' => 999999,
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['titulo', 'idcategoria']);
    }

    public function test_actualiza_una_noticia_existente(): void
    {
        $usuario = $this->actingAsRol('editor');

        $noticia = Noticia::create($this->datosValidos() + [
            'slug' => 'titulo-original',
            'idusuario_autor' => $usuario->idusuario,
        ]);

        $response = $this->putJson("/api/admin/noticias/{$noticia->idnoticia}", $this->datosValidos([
            'titulo' => 'Título corregido de la noticia',
        ]));

        $response->assertOk()
            ->assertJsonPath('data.titulo', 'Título corregido de la noticia')
            ->assertJsonPath('data.slug', 'titulo-corregido-de-la-noticia');
    }

    public function test_actualizar_noticia_inexistente_devuelve_404(): void
    {
        $this->actingAsRol('admin');

        $this->putJson('/api/admin/noticias/999999', $this->datosValidos())
            ->assertStatus(404);
    }

    public function test_elimina_una_noticia_sin_imagenes(): void
    {
        $usuario = $this->actingAsRol('admin');

        $noticia = Noticia::create($this->datosValidos() + [
            'slug' => 'noticia-a-eliminar',
            'idusuario_autor' => $usuario->idusuario,
        ]);

        $this->deleteJson("/api/admin/noticias/{$noticia->idnoticia}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('noticias', ['idnoticia' => $noticia->idnoticia]);
    }

    public function test_no_permite_eliminar_una_noticia_con_imagenes_asociadas(): void
    {
        $usuario = $this->actingAsRol('admin');

        $noticia = Noticia::create($this->datosValidos() + [
            'slug' => 'noticia-con-imagenes',
            'idusuario_autor' => $usuario->idusuario,
        ]);

        $archivo = \App\Models\Archivo::create([
            'nombre_original' => 'foto.jpg',
            'nombre_guardado' => 'foto-unica.jpg',
            'ruta' => 'noticias/foto-unica.jpg',
            'extension' => 'jpg',
            'mime_type' => 'image/jpeg',
            'peso_bytes' => 1024,
        ]);

        NoticiaImagen::create([
            'idnoticia' => $noticia->idnoticia,
            'idarchivo' => $archivo->idarchivo,
            'es_portada' => true,
            'orden' => 0,
        ]);

        $this->deleteJson("/api/admin/noticias/{$noticia->idnoticia}")
            ->assertStatus(409);

        $this->assertDatabaseHas('noticias', ['idnoticia' => $noticia->idnoticia]);
    }
}
