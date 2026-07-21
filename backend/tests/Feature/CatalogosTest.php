<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Documento;
use App\Models\Estado;
use App\Models\Modulo;
use App\Models\Prioridad;
use App\Models\TipoDocumento;
use App\Models\TipoEntidad;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Los ~12 controladores de catálogo (Módulos, Categorías, Estados, Prioridades,
 * y los Tipos-* / Modalidades / Estados-operativos) comparten el mismo
 * contrato: CRUD simple + nombre único + slug autogenerado + bloqueo de
 * eliminación si hay contenido dependiente. En vez de 12 archivos casi
 * idénticos, este cubre el patrón con los 4 más representativos —
 * Módulos (sin FK propia), Categorías (con FK a Módulo), Estados (con FK a
 * TipoEntidad) y Prioridades (con una segunda columna única, "nivel")— más
 * TipoDocumento como muestra del patrón "tipo_*" (idéntico a TipoEvento,
 * TipoPublicacion, TipoSoporte, TipoTutorial, ModalidadEvento).
 */
class CatalogosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    // ── Módulos ──────────────────────────────────────────────────────────

    public function test_crea_un_modulo_y_genera_slug(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/modulos', ['nombre' => 'Reportes'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'reportes')
            ->assertJsonPath('data.activo', true);
    }

    public function test_no_permite_nombres_de_modulo_duplicados(): void
    {
        $this->actingAsRol('admin');

        Modulo::create(['nombre' => 'Reportes', 'slug' => 'reportes', 'activo' => true]);

        $this->postJson('/api/admin/modulos', ['nombre' => 'Reportes'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre');
    }

    public function test_no_permite_eliminar_un_modulo_con_categorias(): void
    {
        $this->actingAsRol('admin');

        $modulo = Modulo::create(['nombre' => 'Reportes', 'slug' => 'reportes', 'activo' => true]);
        Categoria::create(['nombre' => 'Financieros', 'slug' => 'financieros', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true]);

        $this->deleteJson("/api/admin/modulos/{$modulo->idmodulo}")->assertStatus(409);
    }

    // ── Categorías ───────────────────────────────────────────────────────

    public function test_crea_una_categoria_ligada_a_un_modulo(): void
    {
        $this->actingAsRol('editor');

        $modulo = Modulo::where('slug', 'noticias')->first();

        $this->postJson('/api/admin/categorias', [
            'nombre' => 'Avisos urgentes',
            'idmodulo' => $modulo->idmodulo,
        ])->assertCreated()->assertJsonPath('data.slug', 'avisos-urgentes');
    }

    public function test_categoria_exige_un_modulo_existente(): void
    {
        $this->actingAsRol('admin');

        $this->postJson('/api/admin/categorias', [
            'nombre' => 'Avisos urgentes',
            'idmodulo' => 999999,
        ])->assertStatus(422)->assertJsonValidationErrors('idmodulo');
    }

    public function test_no_permite_eliminar_una_categoria_con_documentos_asociados(): void
    {
        $usuario = $this->actingAsRol('admin');

        $modulo = Modulo::where('slug', 'documentos')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Documentos', 'slug' => 'documentos']);
        $estado = Estado::create(['nombre' => 'Publicado', 'slug' => 'publicado', 'idtipoentidad' => $tipoEntidad->idtipoentidad]);
        $tipoDocumento = TipoDocumento::create(['nombre' => 'Manual', 'slug' => 'manual', 'activo' => true]);
        $categoria = Categoria::create(['nombre' => 'Normativas', 'slug' => 'normativas', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true]);

        Documento::create([
            'titulo' => 'Manual de prueba', 'slug' => 'manual-de-prueba', 'version' => '1.0',
            'es_version_actual' => true, 'idcategoria' => $categoria->idcategoria,
            'idusuario_subidor' => $usuario->idusuario, 'idestado' => $estado->idestado,
            'idtipodocumento' => $tipoDocumento->idtipodocumento,
        ]);

        $this->deleteJson("/api/admin/categorias/{$categoria->idcategoria}")->assertStatus(409);
    }

    // ── Estados ──────────────────────────────────────────────────────────

    public function test_crea_un_estado_ligado_a_un_tipo_de_entidad(): void
    {
        $this->actingAsRol('admin');

        $tipoEntidad = TipoEntidad::create(['nombre' => 'Noticias', 'slug' => 'noticias-entidad']);

        $this->postJson('/api/admin/estados', [
            'nombre' => 'En revisión',
            'idtipoentidad' => $tipoEntidad->idtipoentidad,
        ])->assertCreated()->assertJsonPath('data.slug', 'en-revision');
    }

    // ── Prioridades ──────────────────────────────────────────────────────

    public function test_prioridad_exige_nombre_y_nivel_unicos(): void
    {
        $this->actingAsRol('admin');

        Prioridad::create(['nombre' => 'Urgente', 'nivel' => 4, 'dias_respuesta_max' => 0]);

        $this->postJson('/api/admin/prioridades', [
            'nombre' => 'Urgente', 'nivel' => 2, 'dias_respuesta_max' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('nombre');

        $this->postJson('/api/admin/prioridades', [
            'nombre' => 'Otra', 'nivel' => 4, 'dias_respuesta_max' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('nivel');
    }

    // ── Tipo-* (representado por TipoDocumento) ─────────────────────────

    public function test_crea_un_tipo_de_documento(): void
    {
        $this->actingAsRol('editor');

        $this->postJson('/api/admin/tipos-documento', ['nombre' => 'Directiva'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'directiva');
    }

    public function test_no_permite_eliminar_un_tipo_de_documento_en_uso(): void
    {
        $usuario = $this->actingAsRol('admin');

        $modulo = Modulo::where('slug', 'documentos')->first();
        $tipoEntidad = TipoEntidad::create(['nombre' => 'Documentos', 'slug' => 'documentos']);
        $estado = Estado::create(['nombre' => 'Publicado', 'slug' => 'publicado', 'idtipoentidad' => $tipoEntidad->idtipoentidad]);
        $categoria = Categoria::create(['nombre' => 'Normativas', 'slug' => 'normativas', 'idmodulo' => $modulo->idmodulo, 'orden' => 0, 'activo' => true]);
        $tipoDocumento = TipoDocumento::create(['nombre' => 'Manual', 'slug' => 'manual', 'activo' => true]);

        Documento::create([
            'titulo' => 'Manual de prueba', 'slug' => 'manual-de-prueba', 'version' => '1.0',
            'es_version_actual' => true, 'idcategoria' => $categoria->idcategoria,
            'idusuario_subidor' => $usuario->idusuario, 'idestado' => $estado->idestado,
            'idtipodocumento' => $tipoDocumento->idtipodocumento,
        ]);

        $this->deleteJson("/api/admin/tipos-documento/{$tipoDocumento->idtipodocumento}")->assertStatus(409);
    }

    // ── Permisos ─────────────────────────────────────────────────────────

    public function test_lector_ve_catalogos_pero_no_los_modifica(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/modulos')->assertOk();
        $this->getJson('/api/admin/categorias')->assertOk();
        $this->getJson('/api/admin/estados')->assertOk();
        $this->getJson('/api/admin/prioridades')->assertOk();
        $this->getJson('/api/admin/tipos-documento')->assertOk();

        $this->postJson('/api/admin/modulos', ['nombre' => 'x'])->assertStatus(403);
        $this->deleteJson('/api/admin/categorias/1')->assertStatus(403);
    }
}
