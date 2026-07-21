<?php

namespace Tests\Feature;

use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verifica que PermissionMiddleware realmente lea roles_permisos en vez de
 * solo el nombre del rol, y que la matriz admin/editor/lector coincida con
 * la diseñada: admin todo, editor todo menos seguridad, lector solo *.ver.
 */
class PermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_lector_puede_ver_pero_no_modificar_noticias(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/noticias')->assertOk();

        $this->postJson('/api/admin/noticias', [])->assertStatus(403);
        $this->putJson('/api/admin/noticias/1', [])->assertStatus(403);
        $this->deleteJson('/api/admin/noticias/1')->assertStatus(403);
    }

    public function test_editor_puede_crear_contenido_pero_no_gestionar_usuarios(): void
    {
        $this->actingAsRol('editor');

        // Sin datos válidos, pero el 422 (no 403) prueba que sí pasó el
        // filtro de permisos y llegó a la validación del controlador.
        $this->postJson('/api/admin/noticias', [])->assertStatus(422);

        $this->getJson('/api/admin/usuarios')->assertStatus(403);
        $this->postJson('/api/admin/usuarios', [])->assertStatus(403);
    }

    public function test_admin_tiene_acceso_total(): void
    {
        $this->actingAsRol('admin');

        $this->getJson('/api/admin/usuarios')->assertOk();
        $this->getJson('/api/admin/noticias')->assertOk();
        $this->getJson('/api/admin/roles')->assertOk();
    }

    public function test_dashboard_no_exige_permiso_especifico_solo_rol_valido(): void
    {
        foreach (['admin', 'editor', 'lector'] as $rol) {
            $this->actingAsRol($rol);

            $this->getJson('/api/admin/dashboard')->assertOk();
        }
    }

    public function test_rutas_admin_exigen_autenticacion(): void
    {
        $this->getJson('/api/admin/noticias')->assertStatus(401);
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    public function test_permisos_irregulares_de_soporte_se_respetan(): void
    {
        // El módulo soporte usa ver/responder/editar_estado/eliminar en vez
        // del patrón ver/crear/editar/eliminar del resto de módulos.
        $this->actingAsRol('lector');
        $this->getJson('/api/admin/solicitudes-soporte')->assertOk();
        $this->postJson('/api/admin/solicitudes-soporte/1', [])->assertStatus(403);

        $this->actingAsRol('editor');
        // editor sí tiene soporte.editar_estado (todo menos seguridad.*), así
        // que pasa el middleware y llega al controlador: 404 (no existe la
        // solicitud #1 en esta BD vacía) en vez de 403 prueba que el permiso
        // sí se concedió.
        $this->postJson('/api/admin/solicitudes-soporte/1', [])->assertStatus(404);
    }
}
