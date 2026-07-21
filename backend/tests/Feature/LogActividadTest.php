<?php

namespace Tests\Feature;

use App\Models\LogActividad;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogActividadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesYPermisosSeeder::class);
    }

    public function test_lista_y_filtra_logs_por_accion(): void
    {
        // La siembra de roles/permisos y la creación del propio usuario ya
        // disparan los triggers de auditoría, así que filtramos por una
        // combinación (entidad + identificador) exclusiva de este test en
        // vez de contar el total de filas.
        $usuario = $this->actingAsRol('admin');

        LogActividad::create([
            'idusuario' => $usuario->idusuario, 'accion' => 'crear', 'entidad' => 'noticias-test-unico',
            'identificador_entidad' => 555,
        ]);
        LogActividad::create([
            'idusuario' => $usuario->idusuario, 'accion' => 'eliminar', 'entidad' => 'noticias-test-unico',
            'identificador_entidad' => 555,
        ]);

        $response = $this->getJson('/api/admin/logs-actividad?accion=crear&entidad=noticias-test-unico');

        $response->assertOk();
        $this->assertCount(1, $response->json('data.data'));
        $this->assertSame('crear', $response->json('data.data.0.accion'));
    }

    public function test_elimina_un_log_individual(): void
    {
        $usuario = $this->actingAsRol('admin');

        $log = LogActividad::create([
            'idusuario' => $usuario->idusuario, 'accion' => 'crear', 'entidad' => 'noticias',
            'identificador_entidad' => 1, 'created_at' => now(),
        ]);

        $this->deleteJson("/api/admin/logs-actividad/{$log->idlog}")->assertOk();

        $this->assertDatabaseMissing('logs_actividad', ['idlog' => $log->idlog]);
    }

    public function test_limpia_los_logs_anteriores_a_una_fecha(): void
    {
        $usuario = $this->actingAsRol('admin');

        // created_at no es fillable (lo gestiona la BD), así que se fuerza
        // después de crear para simular un registro antiguo.
        $logAntiguo = LogActividad::create([
            'idusuario' => $usuario->idusuario, 'accion' => 'crear', 'entidad' => 'noticias-test-unico',
            'identificador_entidad' => 1,
        ]);
        $logAntiguo->forceFill(['created_at' => now()->subDays(10)])->save();

        LogActividad::create([
            'idusuario' => $usuario->idusuario, 'accion' => 'crear', 'entidad' => 'noticias-test-unico',
            'identificador_entidad' => 2,
        ]);

        $totalAntes = LogActividad::count();

        $response = $this->deleteJson('/api/admin/logs-actividad', [
            'fecha_fin' => now()->subDays(5)->toDateString(),
        ]);

        $response->assertOk()->assertJsonPath('data.eliminados', 1);
        $this->assertSame($totalAntes - 1, LogActividad::count());
        $this->assertDatabaseMissing('logs_actividad', ['idlog' => $logAntiguo->idlog]);
    }

    public function test_limpiar_rechaza_una_fecha_futura(): void
    {
        $this->actingAsRol('admin');

        $this->deleteJson('/api/admin/logs-actividad', [
            'fecha_fin' => now()->addDay()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors('fecha_fin');
    }

    public function test_lector_puede_ver_logs_pero_no_eliminarlos(): void
    {
        $this->actingAsRol('lector');

        $this->getJson('/api/admin/logs-actividad')->assertOk();
        $this->deleteJson('/api/admin/logs-actividad/1')->assertStatus(403);
    }
}
